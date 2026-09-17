import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, forbiddenByPlan } from "@/lib/access-control";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }
  if (!(await canUseFeature(session.clientId, "aiAgent"))) {
    return forbiddenByPlan("Bilimlar bazasi faqat VIP tarifda ochiq");
  }

  const { id } = await params;
  const item = await prisma.knowledgeItem.findUnique({ where: { id } });
  if (!item || item.clientId !== session.clientId) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  await prisma.knowledgeItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
