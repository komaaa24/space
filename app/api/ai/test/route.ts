import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReply, type ChatTurn } from "@/lib/ai";
import { canUseFeature, forbiddenByPlan } from "@/lib/access-control";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const history: ChatTurn[] = Array.isArray(body?.history) ? body.history : [];

  if (!message) {
    return NextResponse.json({ error: "Xabar bo'sh" }, { status: 400 });
  }
  if (session.clientId && !(await canUseFeature(session.clientId, "aiAgent"))) {
    return forbiddenByPlan("AI Agent faqat VIP tarifda ochiq");
  }

  try {
    const [client, knowledgeItems, faqs] = session.clientId
      ? await Promise.all([
          prisma.client.findUnique({ where: { id: session.clientId } }),
          prisma.knowledgeItem.findMany({ where: { clientId: session.clientId } }),
          prisma.faq.findMany({ where: { clientId: session.clientId } }),
        ])
      : [null, [], []];
    const reply = await generateReply(history, message, {
      agentName: client?.agentName,
      companyName: client?.company,
      tone: client?.agentTone,
      forbiddenPhrases: client?.forbiddenPhrases,
      extraInstructions: client?.extraInstructions,
      knowledgeItems,
      faqs,
    });
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("AI test error:", err);
    return NextResponse.json(
      { error: "AI javob bera olmadi. API kalitni tekshiring." },
      { status: 500 },
    );
  }
}
