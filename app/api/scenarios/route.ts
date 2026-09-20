import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, forbiddenByPlan } from "@/lib/access-control";

export async function GET() {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }
  const items = await prisma.scenario.findMany({
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
    return forbiddenByPlan("AI Studio faqat VIP tarifda ochiq");
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const keywords = typeof body?.keywords === "string" ? body.keywords.trim() : "";
  const action = ["AUTO_REPLY", "TO_OPERATOR", "IGNORE"].includes(body?.action)
    ? body.action
    : "AUTO_REPLY";
  const replyText = typeof body?.replyText === "string" ? body.replyText.trim() : "";

  if (!name || !keywords) {
    return NextResponse.json({ error: "Nomi va kalit so'zlar to'ldirilishi kerak" }, { status: 400 });
  }

  const item = await prisma.scenario.create({
    data: {
      clientId: session.clientId,
      name,
      keywords,
      action,
      replyText: replyText || null,
    },
  });

  return NextResponse.json({ item });
}
