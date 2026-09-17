import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { disconnectPersonalChannel } from "@/lib/telegram-personal";
import { unsubscribeFromMessaging, parseInstagramCredential } from "@/lib/instagram";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const { id } = await params;
  const channel = await prisma.channel.findUnique({ where: { id } });
  if (!channel || channel.clientId !== session.clientId) {
    return NextResponse.json({ error: "Kanal topilmadi" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.aiPaused !== "boolean") {
    return NextResponse.json({ error: "Ma'lumot yo'q" }, { status: 400 });
  }

  const updated = await prisma.channel.update({
    where: { id },
    data: { aiPaused: body.aiPaused },
  });

  return NextResponse.json({ channel: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const { id } = await params;
  const channel = await prisma.channel.findUnique({ where: { id } });
  if (!channel || channel.clientId !== session.clientId) {
    return NextResponse.json({ error: "Kanal topilmadi" }, { status: 404 });
  }

  if (channel.type === "TELEGRAM_PERSONAL") {
    await disconnectPersonalChannel(channel.id, channel.credential ?? undefined).catch(
      (err) => console.error("Shaxsiy akkauntdan chiqishda xatolik:", err),
    );
  } else if (channel.type === "TELEGRAM_BOT" && channel.credential) {
    await fetch(`https://api.telegram.org/bot${channel.credential}/deleteWebhook`).catch(
      () => {},
    );
  } else if (channel.type === "INSTAGRAM" && channel.credential) {
    const { accessToken } = parseInstagramCredential(channel.credential);
    await unsubscribeFromMessaging(accessToken);
  }

  await prisma.channel.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
