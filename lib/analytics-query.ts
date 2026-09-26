import { Prisma } from '@/lib/generated/prisma';
import { prisma } from '@/lib/prisma';
import { dashboardDates, type DashboardRange } from '@/lib/dashboard-range';

export interface AnalyticsMetrics {
  stats: {
    dialogs: number;
    messages: number;
    requests: number;
    comments: number;
    leadConversionPct: number;
    unanswered: number;
    aiResolvedPct: number;
    operatorHandoffs: number;
    responseSeconds: number | null;
  };
  volumeSeries: number[];
  weekdayBreakdown: { day: string; count: number }[];
  channelBreakdown: { type: string; count: number; pct: number }[];
  inOutBreakdown: {
    incoming: number;
    outgoing: number;
    incomingPct: number;
    outgoingPct: number;
  };
  funnel: { label: string; value: number; pct: number }[];
  leadCategories: { category: string; count: number; pct: number }[];
  channelQuality: {
    type: string;
    conversations: number;
    requests: number;
    leads: number;
    phones: number;
    conversionPct: number;
  }[];
  answerGaps: { reason: string; count: number; hint: string }[];
  popularQuestions: { text: string; count: number }[];
}

interface AnalyticsRow {
  data: AnalyticsMetrics;
}

function analyticsQuery(clientId: string, range: DashboardRange) {
  const channelFilter =
    range.channel === 'instagram'
      ? Prisma.sql`AND ch.type = 'INSTAGRAM'`
      : range.channel === 'telegram'
        ? Prisma.sql`AND ch.type IN ('TELEGRAM_BOT', 'TELEGRAM_PERSONAL')`
        : Prisma.empty;
  const requestChannelFilter =
    range.channel === 'instagram'
      ? Prisma.sql`AND ch.type = 'INSTAGRAM'`
      : range.channel === 'telegram'
        ? Prisma.sql`AND ch.type IN ('TELEGRAM_BOT', 'TELEGRAM_PERSONAL')`
        : Prisma.empty;

  return Prisma.sql`
    WITH scoped AS (
      SELECT m.id, m.role, COALESCE(m.source::text, CASE WHEN m.role = 'USER' THEN 'CUSTOMER' ELSE m.role::text END) AS source,
        m.content, m."createdAt", m."conversationId", c.status::text AS conversation_status,
        CASE WHEN ch.type IN ('TELEGRAM_BOT', 'TELEGRAM_PERSONAL') THEN 'TELEGRAM' ELSE ch.type::text END AS channel
      FROM "Message" m
      JOIN "Conversation" c ON c.id = m."conversationId"
      JOIN "Channel" ch ON ch.id = c."channelId"
      WHERE c."clientId" = ${clientId} AND ch."clientId" = ${clientId}
        AND m."createdAt" >= (${range.start.toISOString()}::timestamptz AT TIME ZONE 'UTC')
        AND m."createdAt" < (${range.end.toISOString()}::timestamptz AT TIME ZONE 'UTC')
        ${channelFilter}
    ), threads AS (
      SELECT "conversationId",
        (ARRAY_AGG(role ORDER BY "createdAt" DESC, id DESC))[1] AS latest_role,
        (ARRAY_AGG(conversation_status ORDER BY "createdAt" DESC, id DESC))[1] AS latest_status,
        BOOL_OR(role = 'USER') AS has_user,
        BOOL_OR(role = 'AI') AS has_ai,
        BOOL_OR(role = 'OPERATOR') AS has_operator,
        BOOL_OR(source = 'AUTOMATION') AS has_automation,
        COUNT(*) FILTER (WHERE role = 'USER')::int AS incoming_count,
        COUNT(*) FILTER (WHERE role != 'USER')::int AS outgoing_count
      FROM scoped GROUP BY "conversationId"
    ), daily AS (
      SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tashkent', 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS count
      FROM scoped GROUP BY 1 ORDER BY 1
    ), weekday AS (
      SELECT EXTRACT(ISODOW FROM ("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tashkent'))::int AS day,
        COUNT(*)::int AS count
      FROM scoped GROUP BY 1
    ), channels AS (
      SELECT channel AS type, COUNT(DISTINCT "conversationId")::int AS count
      FROM scoped GROUP BY channel ORDER BY count DESC, type
    ), requests_scoped AS (
      SELECT r.id, r.category::text AS category, r.phone, r."conversationId",
        CASE WHEN ch.type IN ('TELEGRAM_BOT', 'TELEGRAM_PERSONAL') THEN 'TELEGRAM' ELSE ch.type::text END AS channel
      FROM "Request" r
      LEFT JOIN "Conversation" c ON c.id = r."conversationId"
      LEFT JOIN "Channel" ch ON ch.id = c."channelId"
      WHERE r."clientId" = ${clientId}
        AND r."createdAt" >= (${range.start.toISOString()}::timestamptz AT TIME ZONE 'UTC')
        AND r."createdAt" < (${range.end.toISOString()}::timestamptz AT TIME ZONE 'UTC')
        ${requestChannelFilter}
    ), request_categories AS (
      SELECT category, COUNT(*)::int AS count FROM requests_scoped GROUP BY category ORDER BY count DESC, category
    ), channel_quality AS (
      SELECT c.type,
        c.count AS conversations,
        COUNT(r.id)::int AS requests,
        COUNT(r.id) FILTER (WHERE r.category = 'LEAD')::int AS leads,
        COUNT(r.id) FILTER (WHERE r.phone IS NOT NULL AND BTRIM(r.phone) != '')::int AS phones
      FROM channels c
      LEFT JOIN requests_scoped r ON r.channel = c.type
      GROUP BY c.type, c.count
      ORDER BY c.count DESC, c.type
    ), first_responses AS (
      SELECT incoming.id,
        MIN(answer."createdAt") AS answered_at,
        incoming."createdAt" AS asked_at
      FROM scoped incoming
      LEFT JOIN scoped answer ON answer."conversationId" = incoming."conversationId"
        AND answer.role != 'USER'
        AND (answer."createdAt", answer.id) > (incoming."createdAt", incoming.id)
      WHERE incoming.role = 'USER'
      GROUP BY incoming.id, incoming."createdAt"
    ), popular AS (
      SELECT LOWER(REGEXP_REPLACE(BTRIM(content), '\\s+', ' ', 'g')) AS text, COUNT(*)::int AS count
      FROM scoped
      WHERE role = 'USER' AND LENGTH(BTRIM(content)) BETWEEN 4 AND 500
      GROUP BY 1 HAVING COUNT(*) > 1 ORDER BY COUNT(*) DESC, 1 LIMIT 8
    ), totals AS (
      SELECT
        (SELECT COUNT(*) FROM threads)::int AS dialogs,
        (SELECT COUNT(*) FROM scoped)::int AS messages,
        (SELECT COUNT(*) FROM requests_scoped)::int AS requests,
        (SELECT COUNT(*) FROM scoped WHERE source = 'COMMENT')::int AS comments,
        (SELECT COUNT(*) FROM requests_scoped WHERE category = 'LEAD')::int AS leads,
        (SELECT COUNT(*) FROM requests_scoped WHERE category = 'INTERESTED')::int AS interested,
        (SELECT COUNT(*) FROM requests_scoped WHERE phone IS NOT NULL AND BTRIM(phone) != '')::int AS phones,
        (SELECT COUNT(*) FROM threads WHERE latest_role = 'USER' OR latest_status IN ('WAITING', 'NO_REPLY'))::int AS unanswered,
        (SELECT COUNT(*) FROM threads WHERE has_user AND has_ai AND NOT has_operator AND latest_role != 'USER')::int AS ai_resolved,
        (SELECT COUNT(*) FROM threads WHERE has_operator)::int AS operator_handoffs,
        (SELECT COUNT(*) FROM scoped WHERE role = 'USER')::int AS incoming,
        (SELECT COUNT(*) FROM scoped WHERE role != 'USER')::int AS outgoing,
        (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (answered_at - asked_at))))::int FROM first_responses WHERE answered_at IS NOT NULL) AS response_seconds
    )
    SELECT JSON_BUILD_OBJECT(
      'stats', JSON_BUILD_OBJECT(
        'dialogs', totals.dialogs,
        'messages', totals.messages,
        'requests', totals.requests,
        'comments', totals.comments,
        'leadConversionPct', COALESCE(ROUND(100.0 * totals.leads / NULLIF(totals.dialogs, 0))::int, 0),
        'unanswered', totals.unanswered,
        'aiResolvedPct', COALESCE(ROUND(100.0 * totals.ai_resolved / NULLIF(totals.dialogs, 0))::int, 0),
        'operatorHandoffs', totals.operator_handoffs,
        'responseSeconds', totals.response_seconds
      ),
      'volumeSeries', COALESCE((SELECT JSON_AGG(COALESCE(d.count, 0) ORDER BY dates.date) FROM UNNEST(${dashboardDates(range)}::text[]) AS dates(date) LEFT JOIN daily d ON d.date = dates.date), '[]'::json),
      'weekdayBreakdown', COALESCE((SELECT JSON_AGG(JSON_BUILD_OBJECT('day', label, 'count', COALESCE(w.count, 0)) ORDER BY ord) FROM (VALUES (1,'Du',1),(2,'Se',2),(3,'Ch',3),(4,'Pa',4),(5,'Ju',5),(6,'Sh',6),(7,'Ya',7)) AS days(day,label,ord) LEFT JOIN weekday w ON w.day = days.day), '[]'::json),
      'channelBreakdown', COALESCE((SELECT JSON_AGG(JSON_BUILD_OBJECT('type', type, 'count', count, 'pct', COALESCE(ROUND(100.0 * count / NULLIF(totals.dialogs, 0))::int, 0)) ORDER BY count DESC, type) FROM channels), '[]'::json),
      'inOutBreakdown', JSON_BUILD_OBJECT(
        'incoming', totals.incoming,
        'outgoing', totals.outgoing,
        'incomingPct', COALESCE(ROUND(100.0 * totals.incoming / NULLIF(totals.messages, 0))::int, 0),
        'outgoingPct', COALESCE(ROUND(100.0 * totals.outgoing / NULLIF(totals.messages, 0))::int, 0)
      ),
      'funnel', JSON_BUILD_ARRAY(
        JSON_BUILD_OBJECT('label', 'Suhbatlar', 'value', totals.dialogs, 'pct', CASE WHEN totals.dialogs > 0 THEN 100 ELSE 0 END),
        JSON_BUILD_OBJECT('label', 'Qiziqqanlar', 'value', totals.interested + totals.leads, 'pct', COALESCE(ROUND(100.0 * (totals.interested + totals.leads) / NULLIF(totals.dialogs, 0))::int, 0)),
        JSON_BUILD_OBJECT('label', 'Telefon qoldirgan', 'value', totals.phones, 'pct', COALESCE(ROUND(100.0 * totals.phones / NULLIF(totals.dialogs, 0))::int, 0)),
        JSON_BUILD_OBJECT('label', 'Arizalar', 'value', totals.leads, 'pct', COALESCE(ROUND(100.0 * totals.leads / NULLIF(totals.dialogs, 0))::int, 0))
      ),
      'leadCategories', COALESCE((SELECT JSON_AGG(JSON_BUILD_OBJECT('category', category, 'count', count, 'pct', COALESCE(ROUND(100.0 * count / NULLIF(totals.requests, 0))::int, 0)) ORDER BY count DESC, category) FROM request_categories), '[]'::json),
      'channelQuality', COALESCE((SELECT JSON_AGG(JSON_BUILD_OBJECT('type', type, 'conversations', conversations, 'requests', requests, 'leads', leads, 'phones', phones, 'conversionPct', COALESCE(ROUND(100.0 * leads / NULLIF(conversations, 0))::int, 0)) ORDER BY conversations DESC, type) FROM channel_quality), '[]'::json),
      'answerGaps', JSON_BUILD_ARRAY(
        JSON_BUILD_OBJECT('reason', 'Javobsiz kutmoqda', 'count', totals.unanswered, 'hint', 'Mijoz oxirgi xabar yozgan, javob kerak'),
        JSON_BUILD_OBJECT('reason', 'Operatorga o''tgan', 'count', totals.operator_handoffs, 'hint', 'AI o''rniga inson aralashgan suhbatlar'),
        JSON_BUILD_OBJECT('reason', 'AI javobi yo''q', 'count', (SELECT COUNT(*) FROM threads WHERE has_user AND outgoing_count = 0), 'hint', 'Kanal, limit yoki bilimlar bazasini tekshiring'),
        JSON_BUILD_OBJECT('reason', 'Avtomatizatsiyasiz', 'count', (SELECT COUNT(*) FROM threads WHERE has_user AND NOT has_automation), 'hint', 'Trigger yoki avtojavob qoidalarini kuchaytirish mumkin')
      ),
      'popularQuestions', COALESCE((SELECT JSON_AGG(popular ORDER BY count DESC, text) FROM popular), '[]'::json)
    ) AS data
    FROM totals;
  `;
}

export async function getAnalytics(clientId: string, range: DashboardRange) {
  const rows = await prisma.$queryRaw<AnalyticsRow[]>(analyticsQuery(clientId, range));
  return {
    range: {
      from: range.from,
      to: range.to,
      days: range.days,
      channel: range.channel,
    },
    updatedAt: new Date().toISOString(),
    ...rows[0].data,
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalytics>>;
