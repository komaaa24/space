import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ conversations: [] }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { clientId: session.clientId },
    orderBy: { lastMessageAt: "desc" },
    include: {
      channel: true,
      messages: { orderBy: { createdAt: "asc" } },
      requests: { orderBy: { createdAt: "desc" } },
    },
  });

  return NextResponse.json({ conversations });
}
