import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { handleIncomingMessage } from "@/lib/inbound";
import { handleAutomationDmEvent, handleAutomationCommentEvent } from "@/lib/automations";
import {
  sendInstagramMessage,
  parseInstagramCredential,
  getInstagramUserProfile,
} from "@/lib/instagram";
import { timingSafeEqualText } from "@/lib/security";

// Meta webhook tasdiqlash (bir marta, obuna sozlanganda chaqiriladi)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "Tasdiqlanmadi" }, { status: 403 });
}

interface InstagramMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
    quick_reply?: { payload: string };
  };
}

interface InstagramCommentChange {
  field: string;
  value: {
    id: string; // comment id
    text: string;
    from: { id: string; username?: string };
    media: { id: string };
  };
}

interface InstagramWebhookBody {
  object: string;
  entry: {
    id: string;
    messaging?: InstagramMessagingEvent[];
    changes?: InstagramCommentChange[];
  }[];
}

function verifyInstagramSignature(req: Request, rawBody: string) {
  const signature = req.headers.get("x-hub-signature-256");
  if (!signature?.startsWith("sha256=")) return false;

  const secrets = [process.env.INSTAGRAM_APP_SECRET, process.env.META_APP_SECRET]
    .filter((secret): secret is string => Boolean(secret?.trim()));
  if (secrets.length === 0) return process.env.NODE_ENV !== "production";

  return secrets.some((appSecret) => {
    const expected = `sha256=${crypto
      .createHmac("sha256", appSecret)
      .update(rawBody)
      .digest("hex")}`;
    return timingSafeEqualText(signature, expected);
  });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  if (!verifyInstagramSignature(req, rawBody)) {
    console.warn("[instagram webhook] invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: InstagramWebhookBody | null = null;
  try {
    body = JSON.parse(rawBody || "null") as InstagramWebhookBody | null;
  } catch {
    return NextResponse.json({ ok: true });
  }
  if (!body || (body.object !== "instagram" && body.object !== "instagram_business_account")) {
    console.info("[instagram webhook] ignored object", { object: body?.object });
    return NextResponse.json({ ok: true });
  }

  for (const entry of body.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      if (!event.message?.text || event.message.is_echo) continue;

      try {
        console.info("[instagram webhook] DM qabul qilindi", {
          recipientId: event.recipient.id,
          senderId: event.sender.id,
        });
        const channel =
          (await prisma.channel.findFirst({
            where: { type: "INSTAGRAM", externalAccountId: event.recipient.id },
          })) ??
          (await prisma.channel.findFirst({
            where: { type: "INSTAGRAM", credential: { contains: event.recipient.id } },
          }));
        if (!channel?.credential) {
          console.warn("[instagram webhook] DM uchun kanal topilmadi", {
            recipientId: event.recipient.id,
          });
          continue;
        }

        const { accessToken } = parseInstagramCredential(channel.credential);
        const profile = await getInstagramUserProfile(accessToken, event.sender.id);

        const handledByAutomation = await handleAutomationDmEvent({
          channelId: channel.id,
          accessToken,
          contactId: event.sender.id,
          contactName: profile.name ?? "Instagram foydalanuvchi",
          contactUsername: profile.username,
          text: event.message.text,
          quickReplyPayload: event.message.quick_reply?.payload,
        });
        if (handledByAutomation) continue;

        await handleIncomingMessage({
          channelId: channel.id,
          clientId: channel.clientId,
          contactId: event.sender.id,
          text: event.message.text,
          fromName: profile.name ?? "Instagram foydalanuvchi",
          fromUsername: profile.username,
          sendReply: async (reply) => {
            await sendInstagramMessage(accessToken, event.sender.id, reply);
          },
        });
      } catch (err) {
        console.error("Instagram webhook xatosi:", err);
      }
    }

    for (const change of entry.changes ?? []) {
      if (change.field !== "comments") continue;
      const { id: commentId, text, from, media } = change.value;
      if (!text || !from?.id || !media?.id) continue;

      try {
        console.info("[instagram webhook] Komment qabul qilindi", {
          accountId: entry.id,
          commentId,
          senderId: from.id,
        });
        // entry.id — akkauntning IG User ID'i (comment webhooklarida
        // recipient bo'lmagani uchun shu orqali kanalni aniqlaymiz)
        const channel =
          (await prisma.channel.findFirst({
            where: { type: "INSTAGRAM", externalAccountId: entry.id },
          })) ??
          (await prisma.channel.findFirst({
            where: { type: "INSTAGRAM", credential: { contains: entry.id } },
          }));
        if (!channel?.credential) {
          console.warn("[instagram webhook] Komment uchun kanal topilmadi", {
            accountId: entry.id,
          });
          continue;
        }

        const { accessToken } = parseInstagramCredential(channel.credential);

        await handleAutomationCommentEvent({
          channelId: channel.id,
          accessToken,
          contactId: from.id,
          contactName: from.username ?? "Instagram foydalanuvchi",
          contactUsername: from.username,
          commentId,
          mediaId: media.id,
          text,
        });
      } catch (err) {
        console.error("Instagram komment webhook xatosi:", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
