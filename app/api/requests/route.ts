import { NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhoneForSearch } from "@/lib/phone";

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
    const normalizedPhoneQuery = normalizePhoneForSearch(params.query);
    and.push({
      OR: [
        { name: { contains: params.query, mode: "insensitive" } },
        { phone: { contains: params.query, mode: "insensitive" } },
        ...(normalizedPhoneQuery.length >= 7
          ? [{ phoneSearch: { equals: normalizedPhoneQuery } }]
          : []),
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
  const pageNumber = Math.max(1, Math.trunc(requestedPage) || 1);
  const fullWhere = scopedWhere(session.clientId, { category, status, channel, query, from, to });
  const summaryWhere = scopedWhere(session.clientId, { channel, from, to });

  const [matchingRequests, categoryCounts, statusCounts, phoneCount] = await Promise.all([
    prisma.request.findMany({
      where: fullWhere,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true, conversationId: true },
    }),
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

  const groupKeys: string[] = [];
  const seenGroupKeys = new Set<string>();
  for (const request of matchingRequests) {
    const key = request.conversationId ?? "request:" + request.id;
    if (!seenGroupKeys.has(key)) {
      seenGroupKeys.add(key);
      groupKeys.push(key);
    }
  }

  const pageGroupKeys = groupKeys.slice(
    (pageNumber - 1) * pageSize,
    pageNumber * pageSize,
  );
  const conversationIds = pageGroupKeys.filter((key) => !key.startsWith("request:"));
  const standaloneRequestIds = pageGroupKeys
    .filter((key) => key.startsWith("request:"))
    .map((key) => key.slice("request:".length));

  const details = pageGroupKeys.length
    ? await prisma.request.findMany({
        where: {
          clientId: session.clientId,
          OR: [
            ...(conversationIds.length ? [{ conversationId: { in: conversationIds } }] : []),
            ...(standaloneRequestIds.length ? [{ id: { in: standaloneRequestIds } }] : []),
          ],
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          conversationId: true,
          isDuplicate: true,
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
      })
    : [];

  type RequestDetail = (typeof details)[number];
  type PersonGroup = {
    id: string;
    conversationId: string | null;
    name: string;
    contactHandle: string | null;
    channel: { type: string; handle: string | null } | null;
    phones: string[];
    categories: Category[];
    status: Status;
    latestAt: Date;
    requestCount: number;
    requests: RequestDetail[];
  };

  const people = new Map<string, PersonGroup>();
  const statusRank: Record<Status, number> = { DONE: 0, NEW: 1, IN_PROGRESS: 2 };

  for (const request of details) {
    const key = request.conversationId ?? "request:" + request.id;
    const existing = people.get(key);
    if (existing) {
      existing.requests.push(request);
      if (request.phone && !existing.phones.includes(request.phone)) {
        existing.phones.push(request.phone);
      }
      if (!existing.categories.includes(request.category)) {
        existing.categories.push(request.category);
      }
      if (statusRank[request.status] > statusRank[existing.status]) {
        existing.status = request.status;
      }
      continue;
    }

    people.set(key, {
      id: key,
      conversationId: request.conversationId,
      name: request.conversation?.contactName || request.name || "Noma'lum",
      contactHandle: request.conversation?.contactHandle ?? null,
      channel: request.conversation?.channel ?? null,
      phones: request.phone ? [request.phone] : [],
      categories: [request.category],
      status: request.status,
      latestAt: request.createdAt,
      requestCount: 1,
      requests: [request],
    });
  }

  for (const person of people.values()) {
    person.requestCount = person.requests.length;
  }

  const categoryOffset = 0;
  const statusOffset = 0;
  return NextResponse.json({
    people: pageGroupKeys.map((key) => people.get(key)).filter(Boolean),
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
      page: pageNumber,
      pageSize,
      total: groupKeys.length,
      totalPages: Math.max(1, Math.ceil(groupKeys.length / pageSize)),
    },
  });
}
