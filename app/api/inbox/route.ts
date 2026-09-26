import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CHANNEL_FILTERS = ["all", "instagram", "telegram"] as const;
const STATUS_FILTERS = ["all", "answered", "waiting", "no_reply"] as const;

type ChannelFilter = (typeof CHANNEL_FILTERS)[number];
type StatusFilter = (typeof STATUS_FILTERS)[number];

function readFilter<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
) {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function channelTypeWhere(channel: ChannelFilter) {
  if (channel === "instagram") return ["INSTAGRAM"] as const;
  if (channel === "telegram") return ["TELEGRAM_BOT", "TELEGRAM_PERSONAL"] as const;
  return undefined;
}

function statusWhere(status: StatusFilter) {
  if (status === "answered") return "ANSWERED";
  if (status === "waiting") return "WAITING";
  if (status === "no_reply") return "NO_REPLY";
  return undefined;
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.clientId) {
    return NextResponse.json(
      { conversations: [], meta: null },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const url = new URL(req.url);
  const channel = readFilter(url.searchParams.get("channel"), CHANNEL_FILTERS, "all");
  const status = readFilter(url.searchParams.get("status"), STATUS_FILTERS, "all");
  const q = (url.searchParams.get("q") ?? "").trim();
  const selectedChannelTypes = channelTypeWhere(channel);
  const selectedStatus = statusWhere(status);

  const baseWhere: Prisma.ConversationWhereInput = {
    clientId: session.clientId,
    channel: { clientId: session.clientId },
  };

  const channelScopedWhere: Prisma.ConversationWhereInput = {
    ...baseWhere,
    ...(selectedChannelTypes
      ? { channel: { clientId: session.clientId, type: { in: [...selectedChannelTypes] } } }
      : {}),
  };

  const filteredWhere: Prisma.ConversationWhereInput = {
    ...channelScopedWhere,
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(q
      ? {
          OR: [
            { contactName: { contains: q, mode: "insensitive" } },
            { contactHandle: { contains: q, mode: "insensitive" } },
            { contactId: { contains: q, mode: "insensitive" } },
            { messages: { some: { content: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const conversations = await prisma.conversation.findMany({
    where: filteredWhere,
    orderBy: { lastMessageAt: "desc" },
    include: {
      channel: { select: { type: true, handle: true } },
      _count: { select: { messages: true } },
      messages: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1, select: { id: true, role: true, source: true, content: true, createdAt: true } },
      requests: { orderBy: { createdAt: "desc" } },
    },
  });

  const [
    total,
    instagram,
    telegramBot,
    telegramPersonal,
    answered,
    waiting,
    noReply,
  ] = await Promise.all([
    prisma.conversation.count({ where: baseWhere }),
    prisma.conversation.count({
      where: { ...baseWhere, channel: { clientId: session.clientId, type: "INSTAGRAM" } },
    }),
    prisma.conversation.count({
      where: { ...baseWhere, channel: { clientId: session.clientId, type: "TELEGRAM_BOT" } },
    }),
    prisma.conversation.count({
      where: { ...baseWhere, channel: { clientId: session.clientId, type: "TELEGRAM_PERSONAL" } },
    }),
    prisma.conversation.count({ where: { ...channelScopedWhere, status: "ANSWERED" } }),
    prisma.conversation.count({ where: { ...channelScopedWhere, status: "WAITING" } }),
    prisma.conversation.count({ where: { ...channelScopedWhere, status: "NO_REPLY" } }),
  ]);

  return NextResponse.json(
    {
      conversations,
      meta: {
        total,
        channels: {
          all: total,
          instagram,
          telegram: telegramBot + telegramPersonal,
        },
        statuses: {
          all: answered + waiting + noReply,
          answered,
          waiting,
          noReply,
        },
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
