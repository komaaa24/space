import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.clientId) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, clientId: session.clientId, channel: { clientId: session.clientId } },
    select: { id: true },
  });
  if (!conversation) return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  const search = new URL(request.url).searchParams;
  const before = search.get("before");
  const after = search.get("after");
  if (before && after) return NextResponse.json({ error: "Sahifa noto'g'ri" }, { status: 400 });
  let boundary: Prisma.MessageWhereInput = {};
  if (before || after) {
    const cursor = await prisma.message.findFirst({ where: { id: (before || after)!, conversationId: id }, select: { id: true, createdAt: true } });
    if (!cursor) return NextResponse.json({ error: "Xabar topilmadi" }, { status: 404 });
    boundary = before
      ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] }
      : { OR: [{ createdAt: { gt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { gt: cursor.id } }] };
  }
  const order = after ? "asc" : "desc";
  const rows = await prisma.message.findMany({
    where: { conversationId: id, ...boundary },
    orderBy: [{ createdAt: order }, { id: order }], take: 101,
    select: { id: true, role: true, source: true, content: true, createdAt: true },
  });
  const hasMore = rows.length > 100;
  const messages = rows.slice(0, 100);
  if (!after) messages.reverse();
  return NextResponse.json({ messages, hasMore }, { headers: { "Cache-Control": "private, no-store" } });
}
