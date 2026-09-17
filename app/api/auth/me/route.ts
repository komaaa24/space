import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientAccess } from "@/lib/access-control";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const client = session.clientId
    ? await prisma.client.findUnique({ where: { id: session.clientId } })
    : null;
  const access = session.clientId ? await getClientAccess(session.clientId) : null;

  return NextResponse.json({
    user: {
      email: session.email,
      role: session.role,
      company: client?.company ?? null,
      industry: client?.industry ?? null,
      address: client?.address ?? null,
      agentName: client?.agentName ?? null,
      agentTone: client?.agentTone ?? null,
      forbiddenPhrases: client?.forbiddenPhrases ?? null,
      extraInstructions: client?.extraInstructions ?? null,
      workHoursStart: client?.workHoursStart ?? null,
      workHoursEnd: client?.workHoursEnd ?? null,
      afterHoursMode: client?.afterHoursMode ?? null,
      plan: access?.plan ?? client?.plan ?? null,
      access,
    },
  });
}
