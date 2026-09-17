import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const dayLabels = ["Ya", "Du", "Se", "Cho", "Pa", "Ju", "Sha"];

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const period = new URL(req.url).searchParams.get("period") === "30" ? 30 : 7;
  const clientId = session.clientId;

  const since = new Date();
  since.setDate(since.getDate() - (period - 1));
  since.setHours(0, 0, 0, 0);

  const [conversations, messages, requests, channels] = await Promise.all([
    prisma.conversation.count({ where: { clientId, createdAt: { gte: since } } }),
    prisma.message.findMany({
      where: { conversation: { clientId }, createdAt: { gte: since } },
      select: { role: true, createdAt: true },
    }),
    prisma.request.count({ where: { clientId, createdAt: { gte: since } } }),
    prisma.conversation.findMany({
      where: { clientId },
      select: { channel: { select: { type: true } } },
    }),
  ]);

  const leadCount = await prisma.request.count({
    where: { clientId, category: "LEAD", createdAt: { gte: since } },
  });

  // Kunlik xabar hajmi (chiziqli grafik uchun)
  const volumeSeries = Array.from({ length: period }, (_, i) => {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - (period - 1 - i));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    return messages.filter((m) => m.createdAt >= dayStart && m.createdAt < dayEnd).length;
  });

  // Hafta kunlari bo'yicha (so'nggi 7 kun, hafta kuni bo'yicha guruhlangan)
  const weekdayMap = new Map<string, number>();
  for (const label of dayLabels) weekdayMap.set(label, 0);
  const last7 = new Date();
  last7.setDate(last7.getDate() - 6);
  last7.setHours(0, 0, 0, 0);
  for (const m of messages) {
    if (m.createdAt >= last7) {
      const label = dayLabels[m.createdAt.getDay()];
      weekdayMap.set(label, (weekdayMap.get(label) ?? 0) + 1);
    }
  }
  const mondayFirst = ["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"];
  const weekdayBreakdown = mondayFirst.map((day) => ({ day, count: weekdayMap.get(day) ?? 0 }));

  const channelCounts = new Map<string, number>();
  for (const c of channels) {
    const type = c.channel.type;
    channelCounts.set(type, (channelCounts.get(type) ?? 0) + 1);
  }
  const channelBreakdown = Array.from(channelCounts.entries()).map(([type, count]) => ({
    type,
    count,
  }));

  const incoming = messages.filter((m) => m.role === "USER").length;
  const outgoing = messages.filter((m) => m.role === "AI" || m.role === "OPERATOR").length;

  return NextResponse.json({
    period,
    stats: {
      dialogs: conversations,
      messages: messages.length,
      requests,
      leadConversionPct:
        conversations > 0 ? Math.round((leadCount / conversations) * 100) : 0,
    },
    volumeSeries,
    weekdayBreakdown,
    channelBreakdown,
    inOutBreakdown: { incoming, outgoing },
  });
}
