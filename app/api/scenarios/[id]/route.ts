import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, forbiddenByPlan } from "@/lib/access-control";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }
  if (!(await canUseFeature(session.clientId, "autoReply"))) {
    return forbiddenByPlan("Avtojavob faqat VIP tarifda ochiq");
  }

  const { id } = await params;
  const item = await prisma.scenario.findUnique({ where: { id } });
  if (!item || item.clientId !== session.clientId) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const data: { active?: boolean } = {};
  if (typeof body?.active === "boolean") data.active = body.active;

  const updated = await prisma.scenario.update({ where: { id }, data });
  return NextResponse.json({ item: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }
  if (!(await canUseFeature(session.clientId, "autoReply"))) {
    return forbiddenByPlan("Avtojavob faqat VIP tarifda ochiq");
  }

  const { id } = await params;
  const item = await prisma.scenario.findUnique({ where: { id } });
  if (!item || item.clientId !== session.clientId) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  await prisma.scenario.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
