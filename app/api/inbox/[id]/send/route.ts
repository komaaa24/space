import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptCredential } from "@/lib/credentials";

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

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { channel: true },
  });
  if (
    !conversation ||
    conversation.clientId !== session.clientId ||
    conversation.channel.clientId !== session.clientId
  ) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  if (conversation.channel.type === "TELEGRAM_BOT" && conversation.channel.credential) {
    const token = decryptCredential(conversation.channel.credential);
    await fetch(
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
  }

  const message = await prisma.message.create({
    data: { conversationId: conversation.id, role: "OPERATOR", content: text },
  });
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json({ message });
}
