import { NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATEGORIES = ["LEAD", "INTERESTED", "COMPLAINT", "SUGGESTION"] as const;
const STATUSES = ["NEW", "IN_PROGRESS", "DONE"] as const;
const CHANNELS = ["INSTAGRAM", "TELEGRAM_BOT", "TELEGRAM_PERSONAL", "YOUTUBE"] as const;

type Category = (typeof CATEGORIES)[number];
type Status = (typeof STATUSES)[number];
type Channel = (typeof CHANNELS)[number];

function one(value: string | null) {
  return value?.trim() || null;
}

function parseDate(value: string | null, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

function buildConversationFilter(channel: Channel | null, query: string) {
  const filters: Prisma.ConversationWhereInput[] = [];
  if (channel) {
    filters.push({ channel: { is: { type: channel } } });
  }
  if (query) {
    filters.push({
      OR: [
        { contactName: { contains: query, mode: "insensitive" } },
        { contactHandle: { contains: query, mode: "insensitive" } },
        { contactId: { contains: query, mode: "insensitive" } },
      ],
    });
  }
  if (!filters.length) return undefined;
  return filters.length === 1 ? filters[0] : { AND: filters };
}

function scopedWhere(
  clientId: string,
  params: {
    category?: Category | null;
    status?: Status | null;
    channel?: Channel | null;
    query?: string;
    from?: Date | null;
    to?: Date | null;
  },
): Prisma.RequestWhereInput {
  const and: Prisma.RequestWhereInput[] = [
    { clientId },
    { isDuplicate: false },
  ];

  if (params.category) and.push({ category: params.category });
  if (params.status) and.push({ status: params.status });

  if (params.query) {
    and.push({
      OR: [
        { name: { contains: params.query, mode: "insensitive" } },
        { phone: { contains: params.query, mode: "insensitive" } },
        { text: { contains: params.query, mode: "insensitive" } },
        {
          conversation: {
            is: buildConversationFilter(null, params.query),
          },
        },
      ],
    });
  }

  const conversationFilter = buildConversationFilter(params.channel ?? null, "");
  if (conversationFilter) {
    and.push({ conversation: { is: conversationFilter } });
  }

  if (params.from || params.to) {
    and.push({
      createdAt: {
        ...(params.from ? { gte: params.from } : {}),
        ...(params.to ? { lt: params.to } : {}),
      },
    });
  }

  return { AND: and };
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 401 });
  }

  const url = new URL(req.url);
  const rawCategory = one(url.searchParams.get("category"));
  const rawStatus = one(url.searchParams.get("status"));
  const rawChannel = one(url.searchParams.get("channel"));
  const query = one(url.searchParams.get("q")) ?? "";
  const category = CATEGORIES.includes(rawCategory as Category)
    ? (rawCategory as Category)
    : null;
  const status = STATUSES.includes(rawStatus as Status) ? (rawStatus as Status) : null;
  const channel = CHANNELS.includes(rawChannel as Channel) ? (rawChannel as Channel) : null;
  const from = parseDate(url.searchParams.get("from"));
  const to = parseDate(url.searchParams.get("to"), true);
  const requestedPage = Number(url.searchParams.get("page") ?? "1");
  const requestedPageSize = Number(url.searchParams.get("pageSize") ?? "25");
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.min(50, Math.max(10, Math.trunc(requestedPageSize)))
    : 25;
  const fullWhere = scopedWhere(session.clientId, { category, status, channel, query, from, to });
  const summaryWhere = scopedWhere(session.clientId, { channel, from, to });

  const [requests, total, categoryCounts, statusCounts, phoneCount] = await Promise.all([
    prisma.request.findMany({
      where: fullWhere,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: Math.max(0, requestedPage - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        category: true,
        name: true,
        phone: true,
        text: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        conversation: {
          select: {
            id: true,
            contactId: true,
            contactName: true,
            contactHandle: true,
            channel: { select: { type: true, handle: true } },
          },
        },
      },
    }),
    prisma.request.count({ where: fullWhere }),
    Promise.all(
      CATEGORIES.map((item) =>
        prisma.request.count({ where: { ...summaryWhere, category: item } }),
      ),
    ),
    Promise.all(
      STATUSES.map((item) =>
        prisma.request.count({ where: { ...summaryWhere, status: item } }),
      ),
    ),
    prisma.request.count({
      where: { ...summaryWhere, phone: { not: null } },
    }),
  ]);

  const categoryOffset = 0;
  const statusOffset = 0;
  return NextResponse.json({
    requests,
    summary: {
      total: categoryCounts.reduce((sum, count) => sum + count, 0),
      leads: categoryCounts[categoryOffset],
      interested: categoryCounts[categoryOffset + 1],
      complaints: categoryCounts[categoryOffset + 2],
      suggestions: categoryCounts[categoryOffset + 3],
      withPhone: phoneCount,
      statuses: {
        new: statusCounts[statusOffset],
        inProgress: statusCounts[statusOffset + 1],
        done: statusCounts[statusOffset + 2],
      },
    },
    pagination: {
      page: Math.max(1, Math.trunc(requestedPage) || 1),
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
}
