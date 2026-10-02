
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { clientId: session.clientId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({
      where: { clientId: session.clientId, readAt: null },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (body?.all === true) {
    await prisma.notification.updateMany({
      where: { clientId: session.clientId, readAt: null },
      data: { readAt: new Date() },
    });
  } else if (typeof body?.id === "string") {
    await prisma.notification.updateMany({
      where: { id: body.id, clientId: session.clientId, readAt: null },
      data: { readAt: new Date() },
    });
  } else {
    return NextResponse.json({ error: "Notification id kerak" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
