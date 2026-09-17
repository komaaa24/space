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
  });
  return NextResponse.json({ channels });
}
