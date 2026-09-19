import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptCredential } from "@/lib/credentials";

export async function GET() {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ channels: [] }, { status: 401 });
  }
  const channels = await prisma.channel.findMany({
    where: { clientId: session.clientId, type: "TELEGRAM_BOT" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      status: true,
      handle: true,
      externalAccountId: true,
      aiPaused: true,
      createdAt: true,
      clientId: true,
    },
  });
  return NextResponse.json({ channels });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Token kiritilmadi" }, { status: 400 });
  }

  // Token haqiqiyligini Telegram'ning o'zidan tekshiramiz
  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const data = await res.json();
  if (!data.ok) {
    return NextResponse.json(
      { error: "Token noto'g'ri yoki bot topilmadi" },
      { status: 400 },
    );
  }

  const handle = `@${data.result.username}`;
  const webhookSecret = randomBytes(32).toString("hex");

  const channel = await prisma.channel.create({
    data: {
      clientId: session.clientId,
      type: "TELEGRAM_BOT",
      status: "ONLINE",
      handle,
      credential: encryptCredential(token),
      externalAccountId: data.result.username ?? data.result.id?.toString(),
      webhookSecret: encryptCredential(webhookSecret),
    },
  });

  // Ochiq (production) domen ma'lum bo'lsa — webhook o'rnatamiz.
  // Lokalda (localhost) buni o'tkazib yuboramiz, chunki Telegram unga ulana olmaydi;
  // o'rniga scripts/telegram-worker.ts (polling) ishlatiladi.
  const publicUrl = process.env.APP_BASE_URL || process.env.RENDER_EXTERNAL_URL;
  if (publicUrl) {
    await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: `${publicUrl}/api/webhooks/telegram/${channel.id}`,
        secret_token: webhookSecret,
      }),
    });
  }

  return NextResponse.json({
    channel: {
      id: channel.id,
      type: channel.type,
      status: channel.status,
      handle: channel.handle,
      externalAccountId: channel.externalAccountId,
      aiPaused: channel.aiPaused,
      createdAt: channel.createdAt,
      clientId: channel.clientId,
    },
  });
}
