import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Client } from 'pg';
import { dashboardDates, parseDashboardRange } from '../lib/dashboard-range';
import {
  dashboardMetricsQuery,
  type DashboardMetrics,
} from '../lib/dashboard-query';
import { getPgAdapterConfig } from '../lib/database-url';

const now = new Date('2026-09-26T08:00:00Z');

test('Tashkent day boundaries and leap dates are validated', () => {
  const range = parseDashboardRange(new URLSearchParams('period=7'), now);
  assert.equal(range.start.toISOString(), '2026-09-19T19:00:00.000Z');
  assert.equal(range.end.toISOString(), now.toISOString());
  assert.equal(dashboardDates(range).length, 7);
  assert.equal(
    parseDashboardRange(new URLSearchParams(), new Date('2026-09-25T19:00:00Z'))
      .to,
    '2026-09-26',
  );
  for (const query of [
    'period=custom&from=2026-02-30&to=2026-03-01',
    'period=custom&from=2026-09-26&to=2026-09-20',
    'period=custom&from=2026-01-01&to=2026-09-26',
    'period=custom&from=2026-09-26&to=2026-09-27',
    'period=365',
    'channel=invalid',
    'period=custom',
  ])
    assert.throws(() => parseDashboardRange(new URLSearchParams(query), now));
  assert.equal(
    parseDashboardRange(
      new URLSearchParams('period=custom&from=2024-02-29&to=2024-03-01'),
      now,
    ).days,
    2,
  );
});

test('SQL metrics isolate tenants, group channels, and measure first unanswered message', async (t) => {
  const connectionString = process.env.DATABASE_URL;
  if (
    !connectionString ||
    !['localhost', '127.0.0.1'].includes(new URL(connectionString).hostname)
  ) {
    t.skip(
      'Requires a local PostgreSQL DATABASE_URL; only temporary fixture tables are used',
    );
    return;
  }
  const client = new Client(getPgAdapterConfig());
  await client.connect();
  try {
    await client.query('BEGIN');
    // Temporary tables shadow application tables on this connection only.
    await client.query(`
      CREATE TEMP TABLE "Channel" (id text, type text, "clientId" text) ON COMMIT DROP;
      CREATE TEMP TABLE "Conversation" (id text, "clientId" text, "channelId" text, "contactName" text, "contactHandle" text) ON COMMIT DROP;
      CREATE TEMP TABLE "Message" (id text, role text, content text, "createdAt" timestamp, "conversationId" text) ON COMMIT DROP;
      INSERT INTO "Channel" VALUES ('ig','INSTAGRAM','tenant'),('bot','TELEGRAM_BOT','tenant'),('personal','TELEGRAM_PERSONAL','tenant'),('other','INSTAGRAM','foreign');
      INSERT INTO "Conversation" (id,"clientId","channelId") VALUES
        ('a','tenant','ig'),('b','tenant','ig'),('c','tenant','bot'),('d','tenant','personal'),
        ('e','foreign','other'),('f','tenant','other'),('g','tenant','ig');
      INSERT INTO "Message" VALUES
        ('01','USER','Narxi qancha?','2026-09-20 10:00:00','a'),
        ('02','USER','  NARXI   qancha?  ','2026-09-20 10:00:10','a'),
        ('03','AI','Javob','2026-09-20 10:00:30','a'),
        ('04','AI','Davomi','2026-09-20 10:00:35','a'),
        ('05','USER','Javobsiz savol','2026-09-20 19:00:00','b'),
        ('06','USER','Boshqa savol','2026-09-21 10:00:00','c'),
        ('07','OPERATOR','Operator javobi','2026-09-21 10:01:30','c'),
        ('08','USER','Yangi savol','2026-09-21 10:02:00','d'),
        ('09','AI','Shaxsiy javob','2026-09-21 10:02:30','d'),
        ('10','USER','Tashqi mijoz','2026-09-21 10:03:00','e'),
        ('11','USER','Begona kanal','2026-09-21 10:03:00','f'),
        ('12','AI','Kiruvchi xabarsiz','2026-09-21 10:03:00','g'),
        ('13','USER','Chegaradan oldin','2026-09-19 18:59:59','a'),
        ('14','USER','Chegaradan keyin','2026-09-26 08:00:00','a');
    `);
    async function metrics(query = '') {
      const sql = dashboardMetricsQuery(
        'tenant',
        parseDashboardRange(new URLSearchParams(query), now),
      );
      const result = await client.query<{ data: DashboardMetrics }>(
        sql.text,
        sql.values,
      );
      return result.rows[0].data;
    }
    const all = await metrics();
    assert.equal(all.conversations, 5);
    assert.equal(all.messages, 10);
    assert.equal(all.automaticPct, 50);
    assert.equal(all.responseSamples, 3);
    assert.equal(all.responseSeconds, 50);
    assert.equal(all.daily.find((d) => d.date === '2026-09-20')?.count, 1);
    assert.equal(all.daily.find((d) => d.date === '2026-09-21')?.count, 4);
    assert.deepEqual(all.popular, [{ text: 'narxi qancha?', count: 2 }]);
    assert.equal(all.channels.find((c) => c.type === 'TELEGRAM')?.count, 2);
    assert.equal(all.recent[0].id, 'g');
    assert.ok(all.recent[0].createdAt.endsWith('Z'));
    const instagram = await metrics('channel=instagram');
    assert.equal(instagram.conversations, 3);
    assert.equal(instagram.responseSeconds, 30);
    assert.equal(instagram.automaticPct, 50);
    const telegram = await metrics('channel=telegram');
    assert.equal(telegram.conversations, 2);
    assert.equal(telegram.responseSeconds, 60);
    const empty = await metrics('period=custom&from=2026-09-24&to=2026-09-25');
    assert.equal(empty.conversations, 0);
    assert.equal(empty.automaticPct, null);
    assert.equal(empty.responseSeconds, null);
    assert.deepEqual(empty.recent, []);
    await client.query(
      `INSERT INTO "Message" VALUES ('15','USER','Yana javobsiz','2026-09-22 10:00:00','a')`,
    );
    assert.equal((await metrics()).automaticPct, 25);
  } finally {
    await client.query('ROLLBACK');
    await client.end();
  }
});
