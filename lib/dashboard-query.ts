import { Prisma } from '@/lib/generated/prisma';
import type { DashboardRange } from '@/lib/dashboard-range';

export interface DashboardMetrics {
  conversations: number;
  messages: number;
  incoming: number;
  automatic: number;
  operator: number;
  automaticPct: number | null;
  responseSeconds: number | null;
  responseSamples: number;
  daily: { date: string; count: number }[];
  channels: { type: string; count: number }[];
  popular: { text: string; count: number }[];
  recent: {
    id: string;
    name: string;
    channel: string;
    content: string;
    role: 'USER' | 'AI' | 'OPERATOR';
    createdAt: string;
  }[];
}

export function dashboardMetricsQuery(clientId: string, range: DashboardRange) {
  const channelFilter =
    range.channel === 'instagram'
      ? Prisma.sql`AND ch.type = 'INSTAGRAM'`
      : range.channel === 'telegram'
        ? Prisma.sql`AND ch.type IN ('TELEGRAM_BOT', 'TELEGRAM_PERSONAL')`
        : Prisma.empty;

  // PostgreSQL returns aggregates and six previews, never the full message history.
  return Prisma.sql`
    WITH scoped AS (
      SELECT m.id, m.role, m.content, m."createdAt", m."conversationId",
        COALESCE(NULLIF(c."contactName", ''), NULLIF(c."contactHandle", ''), 'Mijoz') AS name,
        ch.type::text AS channel_type,
        CASE WHEN ch.type IN ('TELEGRAM_BOT', 'TELEGRAM_PERSONAL') THEN 'TELEGRAM' ELSE ch.type::text END AS channel
      FROM "Message" m
      JOIN "Conversation" c ON c.id = m."conversationId"
      JOIN "Channel" ch ON ch.id = c."channelId"
      WHERE c."clientId" = ${clientId} AND ch."clientId" = ${clientId}
        AND m."createdAt" >= (${range.start.toISOString()}::timestamptz AT TIME ZONE 'UTC') AND m."createdAt" < (${range.end.toISOString()}::timestamptz AT TIME ZONE 'UTC')
        ${channelFilter}
    ), ordered AS (
      SELECT *, COALESCE(SUM(CASE WHEN role != 'USER' THEN 1 ELSE 0 END) OVER (
        PARTITION BY "conversationId" ORDER BY "createdAt", id
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ), 0) AS turn FROM scoped
    ), responses AS (
      SELECT MIN("createdAt") FILTER (WHERE role = 'USER') AS asked,
        MIN("createdAt") FILTER (WHERE role != 'USER') AS answered
      FROM ordered GROUP BY "conversationId", turn
    ), threads AS (
      SELECT "conversationId", BOOL_OR(role = 'USER') AS has_user,
        BOOL_OR(role = 'AI') AS has_ai, BOOL_OR(role = 'OPERATOR') AS has_operator,
        (ARRAY_AGG(role ORDER BY "createdAt" DESC, id DESC))[1] AS latest_role
      FROM scoped GROUP BY "conversationId"
    ), daily AS (
      SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tashkent', 'YYYY-MM-DD') AS date,
        COUNT(DISTINCT "conversationId")::int AS count
      FROM scoped GROUP BY 1 ORDER BY 1
    ), channels AS (
      SELECT channel AS type, COUNT(DISTINCT "conversationId")::int AS count FROM scoped GROUP BY channel
    ), popular AS (
      SELECT LOWER(REGEXP_REPLACE(BTRIM(content), '\\s+', ' ', 'g')) AS text, COUNT(*)::int AS count
      FROM scoped WHERE role = 'USER' AND LENGTH(BTRIM(content)) BETWEEN 4 AND 500
      GROUP BY 1 HAVING COUNT(*) > 1 ORDER BY COUNT(*) DESC, 1 LIMIT 6
    ), latest AS (
      SELECT DISTINCT ON ("conversationId") * FROM scoped ORDER BY "conversationId", "createdAt" DESC, id DESC
    ), recent AS (
      SELECT "conversationId" AS id, name, channel_type AS channel, LEFT(content, 240) AS content, role,
        TO_CHAR("createdAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt"
      FROM latest ORDER BY "createdAt" DESC, id DESC LIMIT 6
    )
    SELECT JSON_BUILD_OBJECT(
      'conversations', (SELECT COUNT(*) FROM threads),
      'messages', (SELECT COUNT(*) FROM scoped),
      'incoming', (SELECT COUNT(*) FROM scoped WHERE role = 'USER'),
      'automatic', (SELECT COUNT(*) FROM scoped WHERE role = 'AI'),
      'operator', (SELECT COUNT(*) FROM scoped WHERE role = 'OPERATOR'),
      'automaticPct', (SELECT ROUND(100.0 * COUNT(*) FILTER (
        WHERE has_user AND has_ai AND NOT has_operator AND latest_role = 'AI'
      ) / NULLIF(COUNT(*) FILTER (WHERE has_user), 0)) FROM threads),
      'responseSeconds', (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (answered - asked)))) FROM responses WHERE asked IS NOT NULL AND answered IS NOT NULL),
      'responseSamples', (SELECT COUNT(*) FROM responses WHERE asked IS NOT NULL AND answered IS NOT NULL),
      'daily', COALESCE((SELECT JSON_AGG(daily) FROM daily), '[]'::json),
      'channels', COALESCE((SELECT JSON_AGG(channels) FROM channels), '[]'::json),
      'popular', COALESCE((SELECT JSON_AGG(popular) FROM popular), '[]'::json),
      'recent', COALESCE((SELECT JSON_AGG(recent) FROM recent), '[]'::json)
    ) AS data
  `;
}
