'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  Clock3,
  Inbox,
  Loader2,
  MessageSquare,
  Radio,
  RefreshCw,
  Send,
  Zap,
} from 'lucide-react';
import { Instagram } from '@/components/brand-icons';
import { Avatar } from '@/components/ui';
import {
  DASHBOARD_TIME_ZONE,
  tashkentDate,
  type DashboardChannel,
} from '@/lib/dashboard-range';
import type { DashboardData } from '@/lib/dashboard';
import styles from './dashboard.module.css';

const number = new Intl.NumberFormat('uz-UZ');
const categoryLabels: Record<string, string> = {
  LEAD: 'Xaridga tayyor',
  INTERESTED: 'Qiziqish bildirgan',
  COMPLAINT: 'Shikoyatlar',
  SUGGESTION: 'Takliflar',
};
const categoryColors: Record<string, string> = {
  LEAD: 'bg-emerald-500',
  INTERESTED: 'bg-electric-500',
  COMPLAINT: 'bg-rose-500',
  SUGGESTION: 'bg-amber-500',
};

function shortDate(date: string) {
  return new Date(`${date}T00:00:00+05:00`).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    timeZone: DASHBOARD_TIME_ZONE,
  });
}

function duration(seconds: number | null) {
  if (seconds === null) return '--';
  if (seconds < 60) return `${seconds} soniya`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} daq`;
  return `${(seconds / 3600).toFixed(1)} soat`;
}

function SectionHeading({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-semibold text-electric-600"
        >
          Barchasi <ArrowUpRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center gap-3 px-4 py-8 text-center text-sm text-slate-500">
      <Inbox className="size-6 text-slate-300" />
      {children}
    </div>
  );
}

export function Dashboard() {
  const router = useRouter();
  const [filter, setFilter] = useState({
    period: '7',
    channel: 'all' as DashboardChannel,
    from: '',
    to: '',
  });
  const [dateOpen, setDateOpen] = useState(false);
  const [dateError, setDateError] = useState('');
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    version: number;
    data: DashboardData;
  } | null>(null);
  const [failure, setFailure] = useState<{
    key: string;
    version: number;
    message: string;
  } | null>(null);
  const query = new URLSearchParams(filter).toString();
  const data = result?.key === query ? result.data : null;
  const error =
    failure?.key === query && failure.version === version
      ? failure.message
      : null;
  const busy = !error && (!data || result?.version !== version);

  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController;
    async function load() {
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      try {
        const response = await fetch(`/api/dashboard?${query}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (response.status === 401) {
          router.replace('/login');
          return;
        }
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error || "Statistikani yuklab bo'lmadi");
        if (!disposed) {
          setResult({ key: query, version, data: body });
          setFailure(null);
        }
      } catch (cause) {
        if (!disposed)
          setFailure({
            key: query,
            version,
            message:
              cause instanceof Error && cause.name !== 'AbortError'
                ? cause.message
                : "Ulanish vaqti tugadi. Qayta urinib ko'ring.",
          });
      } finally {
        clearTimeout(timeout);
        if (!disposed) timer = setTimeout(refresh, 30_000);
      }
    }
    function refresh() {
      if (document.visibilityState === 'visible') void load();
      else timer = setTimeout(refresh, 30_000);
    }
    void load();
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller?.abort();
    };
  }, [query, version, router]);

  const chartMax = Math.max(1, ...(data?.daily.map((day) => day.count) ?? []));
  const categoryMax = Math.max(
    1,
    ...(data?.requests.categories.map((row) => row.count) ?? []),
  );
  const popularMax = Math.max(
    1,
    ...(data?.popular.map((row) => row.count) ?? []),
  );
  const stats = data
    ? [
        {
          label: 'Faol suhbatlar',
          value: number.format(data.conversations),
          icon: MessageSquare,
          color: 'bg-electric-50 text-electric-600',
          detail: 'Tanlangan davrda xabar almashilgan suhbatlar',
        },
        {
          label: 'Jami xabarlar',
          value: number.format(data.messages),
          icon: Bot,
          color: 'bg-violet-50 text-violet-600',
          detail: `${number.format(data.incoming)} kiruvchi, ${number.format(data.automatic)} avtomatik, ${number.format(data.operator)} operator javobi`,
        },
        {
          label: 'Avtomatik javoblangan',
          value: data.automaticPct === null ? '--' : `${data.automaticPct}%`,
          icon: CheckCheck,
          color: 'bg-emerald-50 text-emerald-600',
          detail:
            "Davrda mijoz yozgan suhbatlar ichida operator qatnashmagan va oxirgi javobi avtomatik bo'lganlar ulushi",
        },
        {
          label: "O'rtacha javob vaqti",
          value: duration(data.responseSeconds),
          icon: Clock3,
          color: 'bg-amber-50 text-amber-600',
          detail: `${data.responseSamples} ta javob: davrdagi birinchi javobsiz xabardan birinchi AI yoki operator javobigacha`,
        },
      ]
    : [];

  return (
    <div className="space-y-6" style={{ letterSpacing: 0 }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold">Boshqaruv paneli</h1>
          <p className="mt-1 text-sm text-slate-500">
            Suhbatlar, javoblar va mijoz murojaatlari
          </p>
        </div>
        <div
          role="group"
          aria-label="Kanal"
          className="inline-flex max-w-full gap-1 rounded-lg border border-line bg-white p-1"
        >
          {(
            [
              ['all', 'Barchasi'],
              ['instagram', 'Instagram'],
              ['telegram', 'Telegram'],
            ] as const
          ).map(([channel, label]) => (
            <button
              key={channel}
              aria-pressed={filter.channel === channel}
              onClick={() => setFilter({ ...filter, channel })}
              className={`flex min-h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium ${filter.channel === channel ? 'bg-electric-50 text-electric-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {channel === 'instagram' && (
                <Instagram className="size-3.5 text-pink-500" />
              )}
              {channel === 'telegram' && (
                <Send className="size-3.5 text-sky-500" />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Davr"
            className="inline-flex rounded-lg border border-line bg-white p-1"
          >
            {['7', '14', '30'].map((period) => (
              <button
                key={period}
                aria-pressed={filter.period === period}
                onClick={() => {
                  setFilter({ ...filter, period });
                  setDateOpen(false);
                }}
                className={`min-h-9 rounded-md px-3 text-xs font-medium ${filter.period === period ? 'bg-electric-50 text-electric-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {period} kun
              </button>
            ))}
          </div>
          <button
            aria-expanded={dateOpen}
            onClick={() => setDateOpen(!dateOpen)}
            className={`flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-xs font-medium ${filter.period === 'custom' ? 'bg-electric-50 text-electric-600' : 'bg-white text-slate-600'}`}
          >
            <CalendarDays className="size-4" />
            Davr
          </button>
        </div>
        <div
          className="flex items-center gap-2 text-xs text-slate-500"
          aria-live="polite"
        >
          <span
            className={`size-1.5 shrink-0 rounded-full ${error ? 'bg-amber-500' : data ? 'bg-emerald-500' : 'bg-slate-300'}`}
          />
          <span>
            {error
              ? 'Yangilashda xatolik'
              : data
                ? `${new Date(data.updatedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', timeZone: DASHBOARD_TIME_ZONE })} da yangilandi`
                : 'Yuklanmoqda'}
          </span>
          <button
            aria-label="Statistikani yangilash"
            title="Statistikani yangilash"
            disabled={busy}
            onClick={() => setVersion((value) => value + 1)}
            className="flex size-10 items-center justify-center rounded-lg border border-line bg-white hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${busy ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {dateOpen && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            const from = String(values.get('from'));
            const to = String(values.get('to'));
            const days = (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1;
            if (
              !Number.isFinite(days) ||
              days < 1 ||
              days > 90 ||
              to > tashkentDate()
            ) {
              setDateError("1 kundan 90 kungacha bo'lgan davrni tanlang");
              return;
            }
            setDateError('');
            setFilter({ ...filter, period: 'custom', from, to });
            setDateOpen(false);
          }}
          className="flex flex-wrap items-end gap-3 border-y border-line bg-white p-4"
        >
          <label className="min-w-0 text-xs text-slate-500">
            Boshlanish
            <input
              required
              name="from"
              type="date"
              max={tashkentDate()}
              defaultValue={filter.from || data?.range.from}
              className="mt-1 block min-h-10 max-w-full rounded-md border border-line px-2 text-sm text-slate-700"
            />
          </label>
          <label className="min-w-0 text-xs text-slate-500">
            Tugash
            <input
              required
              name="to"
              type="date"
              max={tashkentDate()}
              defaultValue={filter.to || tashkentDate()}
              className="mt-1 block min-h-10 max-w-full rounded-md border border-line px-2 text-sm text-slate-700"
            />
          </label>
          <button className="min-h-10 rounded-md bg-electric-500 px-4 text-sm font-medium text-white">
            Qo&apos;llash
          </button>
          {dateError && (
            <p role="alert" className="w-full text-xs text-red-600">
              {dateError}
            </p>
          )}
        </form>
      )}
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          <span>{error}</span>
          <button
            onClick={() => setVersion((value) => value + 1)}
            className="font-semibold underline"
          >
            Qayta urinish
          </button>
        </div>
      )}

      {!data && !error && (
        <div
          role="status"
          aria-label="Statistika yuklanmoqda"
          className="space-y-5"
        >
          <div className={`${styles.statsGrid} gap-3`}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-lg border border-line bg-white"
              />
            ))}
          </div>
          <div className="flex min-h-72 items-center justify-center border-y border-line bg-white">
            <Loader2 className="size-6 animate-spin text-electric-500" />
          </div>
        </div>
      )}

      {data && (
        <>
          <p className="text-xs text-slate-500">
            {shortDate(data.range.from)} - {shortDate(data.range.to)}{' '}
            <span className="ml-2 text-slate-400">Toshkent vaqti</span>
          </p>
          <div className={`${styles.statsGrid} gap-3`}>
            {stats.map((stat) => (
              <div
                key={stat.label}
                title={stat.detail}
                className="min-w-0 rounded-lg border border-line bg-white p-4 sm:p-5"
              >
                <span
                  className={`flex size-9 items-center justify-center rounded-lg ${stat.color}`}
                >
                  <stat.icon className="size-4" />
                </span>
                <p className="mt-4 break-words text-2xl font-bold leading-tight sm:text-[28px]">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="grid border-y border-line bg-white lg:grid-cols-5">
            <section className="min-w-0 p-4 sm:p-6 lg:col-span-3 lg:border-r lg:border-line">
              <SectionHeading
                title="Kunlik suhbatlar"
                subtitle="Har kuni xabar almashilgan suhbatlar"
              />
              {data.conversations === 0 ? (
                <Empty>Bu davrda suhbatlar yo&apos;q</Empty>
              ) : (
                <div className="flex h-52 items-end gap-1 sm:gap-2">
                  {data.daily.map((day, index) => (
                    <div
                      key={day.date}
                      className="group flex h-full min-w-0 flex-1 flex-col justify-end text-center"
                    >
                      <div className="relative flex min-h-0 flex-1 items-end justify-center">
                        <div
                          tabIndex={0}
                          aria-label={`${shortDate(day.date)}: ${day.count} ta suhbat`}
                          title={`${shortDate(day.date)}: ${day.count} ta suhbat`}
                          className={`w-full max-w-10 rounded-t-md outline-offset-2 ${index === data.daily.length - 1 ? 'bg-electric-500' : 'bg-electric-100 hover:bg-electric-300 focus:bg-electric-300'}`}
                          style={{
                            height: day.count
                              ? `${Math.max(2, (day.count / chartMax) * 90)}%`
                              : '2px',
                          }}
                        />
                      </div>
                      <span className="mt-3 h-4 text-[10px] text-slate-500">
                        {index %
                          Math.max(1, Math.ceil(data.daily.length / 7)) ===
                        0
                          ? shortDate(day.date)
                          : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="min-w-0 border-t border-line p-4 sm:p-6 lg:col-span-2 lg:border-t-0">
              <SectionHeading
                title="Kanallar bo'yicha"
                subtitle="Tanlangan davrdagi suhbatlar"
              />
              <div className="space-y-6">
                {[
                  {
                    type: 'TELEGRAM',
                    label: 'Telegram',
                    color: 'bg-sky-500',
                    icon: Send,
                  },
                  {
                    type: 'INSTAGRAM',
                    label: 'Instagram',
                    color: 'bg-pink-500',
                    icon: Instagram,
                  },
                  ...(data.channels.some((row) => row.type === 'YOUTUBE')
                    ? [
                        {
                          type: 'YOUTUBE',
                          label: 'YouTube',
                          color: 'bg-red-500',
                          icon: Radio,
                        },
                      ]
                    : []),
                ].map((channel) => {
                  const count =
                    data.channels.find((row) => row.type === channel.type)
                      ?.count ?? 0;
                  const pct = data.conversations
                    ? Math.round((count / data.conversations) * 100)
                    : 0;
                  return (
                    <div key={channel.type}>
                      <div className="mb-2 flex items-center gap-2 text-sm">
                        <channel.icon className="size-4 text-slate-500" />
                        <span className="flex-1 font-medium">
                          {channel.label}
                        </span>
                        <span className="font-semibold">
                          {number.format(count)}
                        </span>
                        <span className="w-10 text-right text-xs text-slate-500">
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${channel.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link
                href="/admin/channels"
                className="mt-7 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-xs text-slate-500"
              >
                <span
                  className={`size-1.5 rounded-full ${data.connection.online ? 'bg-emerald-500' : 'bg-slate-300'}`}
                />
                Hozir {data.connection.online}/{data.connection.total} kanal
                onlayn
                <ChevronRight className="ml-auto size-4" />
              </Link>
            </section>
          </div>

          <div className="grid border-y border-line bg-white lg:grid-cols-5">
            <section className="min-w-0 p-4 sm:p-6 lg:col-span-3 lg:border-r lg:border-line">
              <SectionHeading
                title="So'nggi suhbatlar"
                subtitle="Tanlangan davrdagi oxirgi xabarlar"
                href="/admin/inbox"
              />
              {data.recent.length === 0 ? (
                <Empty>Hali murojaat yo&apos;q</Empty>
              ) : (
                <div className="divide-y divide-line">
                  {data.recent.map((conversation) => (
                    <Link
                      key={conversation.id}
                      href="/admin/inbox"
                      className="flex min-w-0 items-center gap-3 py-3 hover:bg-slate-50"
                    >
                      <Avatar name={conversation.name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">
                            {conversation.name}
                          </span>
                          {conversation.channel === 'INSTAGRAM' ? (
                            <Instagram className="size-3.5 shrink-0 text-pink-500" />
                          ) : (
                            <Send className="size-3.5 shrink-0 text-sky-500" />
                          )}
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {conversation.role === 'AI'
                            ? 'Avto: '
                            : conversation.role === 'OPERATOR'
                              ? 'Operator: '
                              : ''}
                          {conversation.content}
                        </p>
                      </div>
                      <time
                        dateTime={conversation.createdAt}
                        className="shrink-0 text-[10px] text-slate-400"
                      >
                        {new Date(conversation.createdAt).toLocaleDateString(
                          'uz-UZ',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            timeZone: DASHBOARD_TIME_ZONE,
                          },
                        )}
                      </time>
                    </Link>
                  ))}
                </div>
              )}
            </section>
            <div className="min-w-0 border-t border-line lg:col-span-2 lg:border-t-0">
              <section className="p-4 sm:p-6">
                <SectionHeading title="Tezkor amallar" />
                {[
                  {
                    href: '/admin/channels',
                    label: 'Kanal ulash',
                    icon: Radio,
                  },
                  { href: '/admin/ai', label: "Agentni o'rgatish", icon: Bot },
                  {
                    href: '/admin/automations',
                    label: 'Avtomatizatsiyalar',
                    icon: Zap,
                  },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex min-h-12 items-center gap-3 border-b border-line text-sm last:border-0 hover:text-electric-600"
                  >
                    <action.icon className="size-4 text-slate-400" />
                    <span className="flex-1 font-medium">{action.label}</span>
                    <ChevronRight className="size-4 text-slate-400" />
                  </Link>
                ))}
              </section>
              <section className="border-t border-line p-4 sm:p-6">
                <SectionHeading
                  title="Arizalar holati"
                  subtitle={`${number.format(data.requests.total)} ta ariza`}
                  href="/admin/requests"
                />
                <dl className="space-y-3 text-xs">
                  {[
                    ['NEW', 'Yangi'],
                    ['IN_PROGRESS', 'Jarayonda'],
                    ['DONE', 'Yakunlangan'],
                  ].map(([status, label]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between"
                    >
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="font-semibold">
                        {number.format(
                          data.requests.statuses.find(
                            (row) => row.status === status,
                          )?.count ?? 0,
                        )}
                      </dd>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-line pt-3">
                    <dt className="text-slate-500">Telefon raqami mavjud</dt>
                    <dd className="font-semibold">
                      {number.format(data.requests.withPhone)}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>

          <section className="border-y border-line bg-white p-4 sm:p-6">
            <SectionHeading
              title="Murojaatlar tahlili"
              subtitle="Arizalar toifasi bo'yicha"
              href="/admin/requests"
            />
            {data.requests.total === 0 ? (
              <Empty>Bu davrda arizalar yo&apos;q</Empty>
            ) : (
              <div className="space-y-4">
                {Object.entries(categoryLabels).map(([category, label]) => {
                  const count =
                    data.requests.categories.find(
                      (row) => row.category === category,
                    )?.count ?? 0;
                  return (
                    <div
                      key={category}
                      className={`${styles.categoryRow} items-center gap-x-3 gap-y-2`}
                    >
                      <span className="text-xs font-medium sm:text-sm">
                        {label}
                      </span>
                      <div className="col-span-2 row-start-2 h-2 overflow-hidden rounded-full bg-slate-100 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                        <div
                          className={`h-full rounded-full ${categoryColors[category]}`}
                          style={{ width: `${(count / categoryMax) * 100}%` }}
                        />
                      </div>
                      <span className="col-start-2 row-start-1 text-right text-xs font-semibold sm:col-start-3">
                        {number.format(count)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="border-y border-line bg-white p-4 sm:p-6">
            <SectionHeading
              title="Takroriy murojaatlar"
              subtitle="Eng ko'p takrorlangan mijoz xabarlari"
            />
            {data.popular.length === 0 ? (
              <Empty>Bu davrda takroriy murojaatlar yo&apos;q</Empty>
            ) : (
              <ol className="grid gap-x-8 sm:grid-cols-2">
                {data.popular.map((item, index) => (
                  <li
                    key={item.text}
                    className="flex min-w-0 items-start gap-3 border-b border-line py-3"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-electric-50 text-xs font-semibold text-electric-600">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        title={item.text}
                        className="line-clamp-2 break-words text-xs leading-5"
                      >
                        {item.text}
                      </p>
                      <div className="mt-2 h-1 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{
                            width: `${(item.count / popularMax) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-slate-500">
                      {number.format(item.count)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}
