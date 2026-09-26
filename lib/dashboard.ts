import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/lib/generated/prisma';
import { dashboardDates, type DashboardRange } from '@/lib/dashboard-range';
import {
  dashboardMetricsQuery,
  type DashboardMetrics,
} from '@/lib/dashboard-query';

export async function getDashboard(clientId: string, range: DashboardRange) {
  const channelWhere: Prisma.ChannelWhereInput = {
    clientId,
    ...(range.channel === 'instagram'
      ? { type: 'INSTAGRAM' }
      : range.channel === 'telegram'
        ? { type: { in: ['TELEGRAM_BOT', 'TELEGRAM_PERSONAL'] } }
        : {}),
  };
  const requestWhere: Prisma.RequestWhereInput = {
    clientId,
    createdAt: { gte: range.start, lt: range.end },
    ...(range.channel !== 'all'
      ? { conversation: { clientId, channel: channelWhere } }
      : {}),
  };
  const categoryQuery = prisma.request.groupBy({
    by: ["category"], where: requestWhere, _count: { _all: true },
  });
  const statusQuery = prisma.request.groupBy({
    by: ["status"], where: requestWhere, _count: { _all: true },
  });
  const channelQuery = prisma.channel.groupBy({
    by: ["status", "aiPaused"], where: channelWhere, _count: { _all: true },
  });
  const [rows, categories, requestStatuses, withPhone, channels] = await prisma.$transaction([
    prisma.$queryRaw<{ data: DashboardMetrics }[]>(dashboardMetricsQuery(clientId, range)),
    categoryQuery,
    statusQuery,
    prisma.request.count({ where: { ...requestWhere, phone: { not: null }, NOT: { phone: "" } } }),
    channelQuery,
  ], { isolationLevel: "RepeatableRead" });
  const metrics = rows[0].data;
  const dailyMap = new Map(metrics.daily.map((day) => [day.date, day.count]));
  return {
    range: {
      from: range.from,
      to: range.to,
      days: range.days,
      channel: range.channel,
    },
    updatedAt: new Date().toISOString(),
    ...metrics,
    daily: dashboardDates(range).map((date) => ({
      date,
      count: dailyMap.get(date) ?? 0,
    })),
    requests: {
      total: categories.reduce((sum, row) => sum + row._count._all, 0),
      withPhone,
      categories: categories.map((row) => ({
        category: row.category,
        count: row._count._all,
      })),
      statuses: requestStatuses.map((row) => ({
        status: row.status,
        count: row._count._all,
      })),
    },
    connection: {
      total: channels.reduce((sum, row) => sum + row._count._all, 0),
      online: channels
        .filter((row) => row.status === 'ONLINE')
        .reduce((sum, row) => sum + row._count._all, 0),
      automated: channels
        .filter((row) => row.status === 'ONLINE' && !row.aiPaused)
        .reduce((sum, row) => sum + row._count._all, 0),
    },
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;
