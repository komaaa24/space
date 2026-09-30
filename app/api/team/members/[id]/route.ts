import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageTeam } from "@/lib/team";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.clientId || !canManageTeam(session)) {
    return NextResponse.json({ error: "Jamoa boshqarish huquqi yo'q" }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.sub) {
    return NextResponse.json({ error: "O'zingizni o'chira olmaysiz" }, { status: 400 });
  }

  const member = await prisma.user.findFirst({
    where: {
      id,
      clientId: session.clientId,
      role: "CLIENT_ADMIN",
      teamRole: { not: null },
    },
    select: { id: true },
  });
  if (!member) {
    return NextResponse.json({ error: "Jamoa a'zosi topilmadi" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id: member.id } });
  return NextResponse.json({ ok: true });
}
