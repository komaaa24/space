import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ channels: [] }, { status: 401 });
  }
  const channels = await prisma.channel.findMany({
    where: { clientId: session.clientId },
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
