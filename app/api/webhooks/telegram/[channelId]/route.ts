import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleIncomingMessage } from "@/lib/inbound";

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

  const token = channel.credential;

  try {
    await handleIncomingMessage({
      channelId: channel.id,
      clientId: channel.clientId,
      contactId: String(msg.chat.id),
      text: msg.text,
      fromName: msg.from?.first_name ?? "Mijoz",
      fromUsername: msg.from?.username,
      sendReply: async (reply) => {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: msg.chat.id, text: reply }),
        });
      },
    });
  } catch (err) {
    console.error("Telegram webhook xatosi:", err);
  }

  return NextResponse.json({ ok: true });
}
