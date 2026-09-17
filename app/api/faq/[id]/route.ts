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
  if (!(await canUseFeature(session.clientId, "aiAgent"))) {
    return forbiddenByPlan("FAQ faqat VIP tarifda ochiq");
  }

  const { id } = await params;
  const item = await prisma.faq.findUnique({ where: { id } });
  if (!item || item.clientId !== session.clientId) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const data: { question?: string; answer?: string } = {};
  if (typeof body?.question === "string" && body.question.trim()) {
    data.question = body.question.trim();
  }
  if (typeof body?.answer === "string" && body.answer.trim()) {
    data.answer = body.answer.trim();
  }

  const updated = await prisma.faq.update({ where: { id }, data });
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
  if (!(await canUseFeature(session.clientId, "aiAgent"))) {
    return forbiddenByPlan("FAQ faqat VIP tarifda ochiq");
  }

  const { id } = await params;
  const item = await prisma.faq.findUnique({ where: { id } });
  if (!item || item.clientId !== session.clientId) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }

  await prisma.faq.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
