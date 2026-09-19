import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json(
      { conversations: [] },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      clientId: session.clientId,
      channel: { clientId: session.clientId },
    },
    orderBy: { lastMessageAt: "desc" },
    include: {
      channel: true,
      messages: { orderBy: { createdAt: "asc" } },
      requests: { orderBy: { createdAt: "desc" } },
    },
  });

  return NextResponse.json(
    { conversations },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
