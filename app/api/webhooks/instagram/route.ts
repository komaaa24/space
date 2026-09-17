import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleIncomingMessage } from "@/lib/inbound";
import { handleAutomationDmEvent, handleAutomationCommentEvent } from "@/lib/automations";
import {
  sendInstagramMessage,
  parseInstagramCredential,
  getInstagramUserProfile,
} from "@/lib/instagram";

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

export async function POST(req: Request) {
  const body: InstagramWebhookBody = await req.json().catch(() => null);
  if (!body || body.object !== "instagram") {
    return NextResponse.json({ ok: true });
  }

  for (const entry of body.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      if (!event.message?.text || event.message.is_echo) continue;

      try {
        const channel = await prisma.channel.findFirst({
          where: { type: "INSTAGRAM", credential: { contains: event.recipient.id } },
        });
        if (!channel?.credential) continue;

        const { accessToken } = parseInstagramCredential(channel.credential);

        const handledByAutomation = await handleAutomationDmEvent({
          channelId: channel.id,
          accessToken,
          contactId: event.sender.id,
          text: event.message.text,
          quickReplyPayload: event.message.quick_reply?.payload,
        });
        if (handledByAutomation) continue;

        const profile = await getInstagramUserProfile(accessToken, event.sender.id);

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
        // entry.id — akkauntning IG User ID'i (comment webhooklarida
        // recipient bo'lmagani uchun shu orqali kanalni aniqlaymiz)
        const channel = await prisma.channel.findFirst({
          where: { type: "INSTAGRAM", credential: { contains: entry.id } },
        });
        if (!channel?.credential) continue;

        const { accessToken } = parseInstagramCredential(channel.credential);

        await handleAutomationCommentEvent({
          channelId: channel.id,
          accessToken,
          contactId: from.id,
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
