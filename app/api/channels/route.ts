import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ channels: [] }, { status: 401 });
  }
  const channels = await prisma.channel.findMany({
    where: { clientId: session.clientId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      status: true,
      handle: true,
      externalAccountId: true,
      aiPaused: true,
      commentsPaused: true,
      createdAt: true,
      clientId: true,
    },
  });
  const automations = await prisma.automation.groupBy({
    by: ["channelId", "active", "triggerOnComment", "triggerOnDm"],
    where: { clientId: session.clientId },
    _count: { _all: true },
  });

  const channelsWithAutomation = channels.map((channel) => {
    const rows = automations.filter((row) => row.channelId === channel.id);
    return {
      ...channel,
      automation: {
        dmTotal: rows
          .filter((row) => row.triggerOnDm)
          .reduce((sum, row) => sum + row._count._all, 0),
        dmActive: rows
          .filter((row) => row.triggerOnDm && row.active)
          .reduce((sum, row) => sum + row._count._all, 0),
        commentTotal: rows
          .filter((row) => row.triggerOnComment)
          .reduce((sum, row) => sum + row._count._all, 0),
        commentActive: rows
          .filter((row) => row.triggerOnComment && row.active)
          .reduce((sum, row) => sum + row._count._all, 0),
      },
    };
  });

  return NextResponse.json({ channels: channelsWithAutomation });
}
