import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ requests: [] }, { status: 401 });
  }

  const requests = await prisma.request.findMany({
    where: { clientId: session.clientId },
    orderBy: { createdAt: "desc" },
    include: { conversation: { include: { channel: true } } },
  });

  return NextResponse.json({ requests });
}
