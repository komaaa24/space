import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, forbiddenByPlan } from "@/lib/access-control";

export async function GET() {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }
  const items = await prisma.faq.findMany({
    where: { clientId: session.clientId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }
  if (!(await canUseFeature(session.clientId, "aiAgent"))) {
    return forbiddenByPlan("FAQ faqat VIP tarifda ochiq");
  }

  const body = await req.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  const answer = typeof body?.answer === "string" ? body.answer.trim() : "";

  if (!question || !answer) {
    return NextResponse.json({ error: "Savol va javob to'ldirilishi kerak" }, { status: 400 });
  }

  const item = await prisma.faq.create({
    data: { clientId: session.clientId, question, answer },
  });

  return NextResponse.json({ item });
}
