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
  const invitation = await prisma.teamInvitation.findFirst({
    where: { id, clientId: session.clientId, acceptedAt: null },
    select: { id: true },
  });
  if (!invitation) {
    return NextResponse.json({ error: "Taklif topilmadi" }, { status: 404 });
  }

  await prisma.teamInvitation.delete({ where: { id: invitation.id } });
  return NextResponse.json({ ok: true });
}
