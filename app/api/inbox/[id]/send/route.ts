import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptCredential } from "@/lib/credentials";
import { parseInstagramCredential, sendInstagramMessage } from "@/lib/instagram";
import { sendPersonalMessage } from "@/lib/telegram-personal";
import { recordInboxMessage } from "@/lib/inbox-messages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Xabar bo'sh" }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: "Xabar 4000 belgidan oshmasligi kerak" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      clientId: session.clientId,
      channel: { clientId: session.clientId },
    },
    include: { channel: true },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  try {
    if (conversation.channel.type === "TELEGRAM_BOT" && conversation.channel.credential) {
    const token = decryptCredential(conversation.channel.credential);
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: Number(conversation.contactId),
          text,
        }),
      },
    );
    const telegramData = await telegramRes.json().catch(() => null);
    if (!telegramRes.ok || telegramData?.ok === false) {
      return NextResponse.json(
        { error: telegramData?.description ?? "Telegramga xabar yuborilmadi" },
        { status: 502 },
      );
    }
    } else if (
      conversation.channel.type === "TELEGRAM_PERSONAL" &&
      conversation.channel.credential
    ) {
      await sendPersonalMessage(conversation.channel.id, conversation.contactId, text);
    } else if (
      conversation.channel.type === "INSTAGRAM" &&
      conversation.channel.credential
    ) {
      const { accessToken } = parseInstagramCredential(conversation.channel.credential);
      await sendInstagramMessage(accessToken, conversation.contactId, text);
    } else {
      return NextResponse.json(
        { error: "Kanal ulanmagan yoki operator xabari qo'llanmaydi" },
        { status: 400 },
      );
    }

    const recorded = await recordInboxMessage(
      {
        channelId: conversation.channel.id,
        clientId: session.clientId,
        contactId: conversation.contactId,
        name: conversation.contactName ?? undefined,
        username: conversation.contactHandle?.replace(/^@/, ""),
      },
      { role: "OPERATOR", source: "OPERATOR", content: text },
    );
    return NextResponse.json({ message: recorded.message });
  } catch (error) {
    console.error("[inbox] Operator xabarini yuborishda xatolik", {
      conversationId: conversation.id,
      channelType: conversation.channel.type,
      error: error instanceof Error ? error.message : "Noma'lum xatolik",
    });
    return NextResponse.json(
      { error: "Xabar yuborilmadi. Kanal ulanishini tekshiring." },
      { status: 502 },
    );
  }
}
