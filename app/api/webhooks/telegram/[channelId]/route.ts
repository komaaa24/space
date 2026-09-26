import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleIncomingMessage } from "@/lib/inbound";
import { decryptCredential } from "@/lib/credentials";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const { channelId } = await params;
  const update = await req.json().catch(() => null);
  const msg = update?.message;

  if (!msg?.text) {
    return NextResponse.json({ ok: true });
  }

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel || channel.type !== "TELEGRAM_BOT" || !channel.credential) {
    return NextResponse.json({ ok: true });
  }

  const expectedSecret = decryptCredential(channel.webhookSecret);
  if (expectedSecret) {
    const actualSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (actualSecret !== expectedSecret) {
      return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 401 });
  }

  const token = decryptCredential(channel.credential);

  try {
    await handleIncomingMessage({
      channelId: channel.id,
      clientId: channel.clientId,
      contactId: String(msg.chat.id),
      text: msg.text,
      fromName: msg.from?.first_name ?? "Mijoz",
      fromUsername: msg.from?.username,
      externalMessageId: `telegram:${update.update_id ?? msg.message_id}`,
      sendReply: async (reply) => {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: msg.chat.id, text: reply }),
        });
        const body = await response.json().catch(() => null);
        if (!response.ok || body?.ok === false) {
          throw new Error(body?.description ?? "Telegramga xabar yuborilmadi");
        }
      },
    });
  } catch (err) {
    console.error("Telegram webhook xatosi:", err);
  }

  return NextResponse.json({ ok: true });
}
