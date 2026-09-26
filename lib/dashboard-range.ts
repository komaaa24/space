export const DASHBOARD_TIME_ZONE = 'Asia/Tashkent';
const DAY_MS = 86_400_000;
const OFFSET_MS = 5 * 60 * 60 * 1000;
export type DashboardChannel = 'all' | 'instagram' | 'telegram';
export interface DashboardRange {
  from: string;
  to: string;
  start: Date;
  end: Date;
  days: number;
  channel: DashboardChannel;
}

export function tashkentDate(now = new Date()) {
  return new Date(now.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Sanani to'g'ri kiriting");
  const date = new Date(`${value}T00:00:00+05:00`);
  if (!Number.isFinite(date.getTime()) || tashkentDate(date) !== value)
    throw new Error('Sana mavjud emas');
  return date;
}

export function parseDashboardRange(
  params: URLSearchParams,
  now = new Date(),
): DashboardRange {
  const channel = params.get('channel') ?? 'all';
  if (channel !== 'all' && channel !== 'instagram' && channel !== 'telegram')
    throw new Error("Kanal noto'g'ri");
  const period = params.get('period') ?? '7';
  const today = tashkentDate(now);
  let from: string;
  let to: string;
  if (period === 'custom') {
    from = params.get('from') ?? '';
    to = params.get('to') ?? '';
  } else {
    if (!['7', '14', '30'].includes(period)) throw new Error("Davr noto'g'ri");
    to = today;
    from = tashkentDate(
      new Date(parseDate(to).getTime() - (Number(period) - 1) * DAY_MS),
    );
  }
  const start = parseDate(from);
  const lastDay = parseDate(to);
  const days = Math.round((lastDay.getTime() - start.getTime()) / DAY_MS) + 1;
  if (days < 1 || days > 90)
    throw new Error("Davr 1 kundan 90 kungacha bo'lishi kerak");
  if (to > today) throw new Error("Kelajakdagi sanani tanlab bo'lmaydi");
  return {
    from,
    to,
    start,
    end: new Date(Math.min(lastDay.getTime() + DAY_MS, now.getTime())),
    days,
    channel,
  };
}

export function dashboardDates(range: DashboardRange) {
  return Array.from({ length: range.days }, (_, i) =>
    tashkentDate(new Date(range.start.getTime() + i * DAY_MS)),
  );
}
