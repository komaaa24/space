import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUseFeature, forbiddenByPlan } from "@/lib/access-control";

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const data: {
    company?: string;
    industry?: string;
    address?: string;
    agentName?: string;
    agentTone?: string;
    forbiddenPhrases?: string;
    extraInstructions?: string;
    workHoursStart?: string;
    workHoursEnd?: string;
    afterHoursMode?: "ALWAYS" | "AUTO_REPLY" | "SILENT";
  } = {};

  if (typeof body?.company === "string" && body.company.trim()) {
    data.company = body.company.trim();
  }
  if (typeof body?.industry === "string") {
    data.industry = body.industry.trim();
  }
  if (typeof body?.address === "string") {
    data.address = body.address.trim();
  }
  if (typeof body?.agentName === "string" && body.agentName.trim()) {
    if (!(await canUseFeature(session.clientId, "aiAgent"))) {
      return forbiddenByPlan("AI Agent sozlamalari faqat VIP tarifda ochiq");
    }
    data.agentName = body.agentName.trim();
  }
  if (typeof body?.agentTone === "string" && body.agentTone.trim()) {
    if (!(await canUseFeature(session.clientId, "aiAgent"))) {
      return forbiddenByPlan("AI Agent sozlamalari faqat VIP tarifda ochiq");
    }
    data.agentTone = body.agentTone.trim();
  }
  if (typeof body?.forbiddenPhrases === "string") {
    if (!(await canUseFeature(session.clientId, "aiAgent"))) {
      return forbiddenByPlan("AI Agent sozlamalari faqat VIP tarifda ochiq");
    }
    data.forbiddenPhrases = body.forbiddenPhrases.trim();
  }
  if (typeof body?.extraInstructions === "string") {
    if (!(await canUseFeature(session.clientId, "aiAgent"))) {
      return forbiddenByPlan("AI Agent sozlamalari faqat VIP tarifda ochiq");
    }
    data.extraInstructions = body.extraInstructions.trim();
  }
  if (typeof body?.workHoursStart === "string" && /^\d{2}:\d{2}$/.test(body.workHoursStart)) {
    data.workHoursStart = body.workHoursStart;
  }
  if (typeof body?.workHoursEnd === "string" && /^\d{2}:\d{2}$/.test(body.workHoursEnd)) {
    data.workHoursEnd = body.workHoursEnd;
  }
  if (["ALWAYS", "AUTO_REPLY", "SILENT"].includes(body?.afterHoursMode)) {
    data.afterHoursMode = body.afterHoursMode;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Ma'lumot yo'q" }, { status: 400 });
  }

  const client = await prisma.client.update({
    where: { id: session.clientId },
    data,
  });

  return NextResponse.json({ client });
}
