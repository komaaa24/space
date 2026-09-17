import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, forbiddenByPlan } from "@/lib/access-control";

export async function GET() {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }
  const items = await prisma.knowledgeItem.findMany({
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
    return forbiddenByPlan("Bilimlar bazasi faqat VIP tarifda ochiq");
  }

  const body = await req.json().catch(() => null);
  const type = body?.type === "LINK" || body?.type === "FILE" ? body.type : "TEXT";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!content) {
    return NextResponse.json({ error: "Mazmun bo'sh bo'lishi mumkin emas" }, { status: 400 });
  }

  const item = await prisma.knowledgeItem.create({
    data: { clientId: session.clientId, type, title: title || null, content },
  });

  return NextResponse.json({ item });
}
