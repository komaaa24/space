import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRecentMedia, parseInstagramCredential } from "@/lib/instagram";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const channelId = new URL(req.url).searchParams.get("channelId");
  if (!channelId) {
    return NextResponse.json({ error: "channelId kerak" }, { status: 400 });
  }

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel || channel.clientId !== session.clientId || channel.type !== "INSTAGRAM") {
    return NextResponse.json({ error: "Kanal topilmadi" }, { status: 404 });
  }
  if (!channel.credential) {
    return NextResponse.json({ error: "Kanal ulanmagan" }, { status: 400 });
  }

  try {
    const { accessToken } = parseInstagramCredential(channel.credential);
    const media = await getRecentMedia(accessToken);
    return NextResponse.json({ media });
  } catch (err) {
    console.error("Instagram media ro'yxatida xatolik:", err);
    return NextResponse.json({ error: "Postlarni olishda xatolik" }, { status: 500 });
  }
}
