"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle,
  Clock,
  ClipboardList,
  Headset,
  Loader2,
  Mail,
  MessagesSquare,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardHeader, PageTitle, StatCard } from "@/components/ui";

const channelLabels: Record<string, string> = {
  TELEGRAM: "Telegram",
  TELEGRAM_BOT: "Telegram-bot",
  TELEGRAM_PERSONAL: "Telegram",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
};
const categoryLabels: Record<string, string> = {
  LEAD: "Lead / ariza",
  INTERESTED: "Qiziqqan",
  COMPLAINT: "Shikoyat",
  SUGGESTION: "Taklif",
};
const channelColors = ["#0f5eff", "#e1306c", "#00b894", "#8b5cf6"];

type Period = "7" | "14" | "30";
type Channel = "all" | "instagram" | "telegram";

interface AnalyticsData {
  range: { days: number; channel: Channel };
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
  inOutBreakdown: { incoming: number; outgoing: number; incomingPct: number; outgoingPct: number };
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

function formatResponseTime(seconds: number | null) {
  if (seconds === null) return "Yo'q";
  if (seconds < 60) return `${seconds} soniya`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} daq`;
  return `${Math.round(minutes / 60)} soat`;
}

function LineChart({ data }: { data: number[] }) {
  const w = 640;
  const h = 210;
  const pad = 10;
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => [
    pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1),
    h - pad - (v / max) * (h - pad * 2),
  ]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${line} L${pts[pts.length - 1]?.[0] ?? pad},${h} L${pts[0]?.[0] ?? pad},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Xabarlar hajmi grafigi">
      <defs>
        <linearGradient id="analytics-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f5eff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0f5eff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="analytics-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0038b8" />
          <stop offset="100%" stopColor="#00c2ff" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((ratio) => (
        <line key={ratio} x1="10" x2="630" y1={h * ratio} y2={h * ratio} stroke="#e8edf7" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#analytics-area)" />
      <path d={line} fill="none" stroke="url(#analytics-stroke)" strokeWidth="3" strokeLinecap="round" />
      {pts.length > 0 && (
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="5" fill="white" stroke="#0f5eff" strokeWidth="3" />
      )}
    </svg>
  );
}

function Donut({
  segments,
  centerTop,
  centerBottom,
}: {
  segments: { value: number; color: string }[];
  centerTop: string;
  centerBottom: string;
}) {
  const total = segments.reduce((sum, item) => sum + item.value, 0) || 1;
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#edf2f7" strokeWidth="11" />
        {segments.map((segment, index) => {
          const len = (segment.value / total) * c;
          const offset = segments
            .slice(0, index)
            .reduce((sum, item) => sum + (item.value / total) * c, 0);
          return (
            <circle
              key={index}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={segment.color}
              strokeWidth="11"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-extrabold leading-none">{centerTop}</span>
        <span className="mt-1 text-[10px] text-slate-400">{centerBottom}</span>
      </div>
    </div>
  );
}

function ProgressRows({ rows }: { rows: { label: string; value: number; meta?: string }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (rows.length === 0) {
    return <p className="px-6 pb-6 text-sm text-slate-400">Hali ma&apos;lumot yo&apos;q</p>;
  }
  return (
    <div className="space-y-3 px-6 pb-6">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[minmax(110px,190px)_1fr_auto] items-center gap-3 text-[13px]">
          <div className="min-w-0 truncate font-semibold text-navy-900">{row.label}</div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-200 to-emerald-500" style={{ width: `${Math.max(3, (row.value / max) * 100)}%` }} />
          </div>
          <div className="text-right text-xs font-bold text-slate-500">{row.meta ?? row.value}</div>
        </div>
      ))}
    </div>
  );
}

function FunnelCard({ items }: { items: AnalyticsData["funnel"] }) {
  const base = Math.max(1, items[0]?.value ?? 1);
  return (
    <Card>
      <CardHeader title="Konversiya yo'li" subtitle="Suhbatdan arizagacha" />
      <div className="space-y-4 px-6 pb-6">
        {items.map((item, index) => (
          <div key={item.label} className="rounded-xl border border-line bg-[#fafbff] p-3.5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-navy-900">{index + 1}. {item.label}</div>
              <div className="text-sm font-extrabold text-navy-900">{item.value}</div>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-electric-500" style={{ width: `${Math.max(2, (item.value / base) * 100)}%` }} />
            </div>
            <div className="mt-1.5 text-[11px] font-medium text-slate-400">{item.pct}% umumiy suhbatlardan</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function InsightCard({ icon, title, value, description }: { icon: ReactNode; title: string; value: string; description: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-electric-50 text-electric-600">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-slate-400">{title}</div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight text-navy-900">{value}</div>
          <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("7");
  const [channel, setChannel] = useState<Channel>("all");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      fetch(`/api/analytics?period=${period}&channel=${channel}`, {
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async (res) => {
          const payload = await res.json();
          if (!res.ok) throw new Error(payload.error ?? "Analitika yuklanmadi");
          setData(payload);
        })
        .catch((err) => {
          if (err.name !== "AbortError") setError(err instanceof Error ? err.message : "Analitika yuklanmadi");
        })
        .finally(() => setLoading(false));
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [period, channel]);

  const maxWeek = useMemo(
    () => Math.max(1, ...(data?.weekdayBreakdown.map((item) => item.count) ?? [1])),
    [data],
  );

  return (
    <div className="space-y-5">
      <PageTitle
        title="Analitika"
        subtitle="Suhbatlar sifati, AI samarasi va lead oqimi"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="inline-flex items-center rounded-xl border border-line bg-white p-1">
              {(["7", "14", "30"] as Period[]).map((value) => (
                <button
                  key={value}
                  onClick={() => setPeriod(value)}
                  className={`rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors ${
                    period === value ? "bg-electric-500 text-white" : "text-slate-400 hover:text-navy-900"
                  }`}
                >
                  {value} kun
                </button>
              ))}
            </div>
            <div className="inline-flex items-center rounded-xl border border-line bg-white p-1">
              {(
                [
                  ["all", "Barchasi"],
                  ["instagram", "Instagram"],
                  ["telegram", "Telegram"],
                ] as [Channel, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setChannel(value)}
                  className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                    channel === value ? "bg-emerald-50 text-emerald-700" : "text-slate-400 hover:text-navy-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda...
        </div>
      ) : error ? (
        <Card className="p-5 text-sm font-medium text-red-600">{error}</Card>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
            <StatCard hero icon={<MessagesSquare className="h-4 w-4" />} value={String(data.stats.dialogs)} label="Suhbatlar" />
            <StatCard icon={<Mail className="h-4 w-4" />} value={String(data.stats.messages)} label="Xabarlar" />
            <StatCard icon={<ClipboardList className="h-4 w-4" />} value={String(data.stats.requests)} label="Arizalar" />
            <StatCard icon={<AlertTriangle className="h-4 w-4" />} value={String(data.stats.unanswered)} label="Javobsiz" />
            <StatCard icon={<Bot className="h-4 w-4" />} value={`${data.stats.aiResolvedPct}%`} label="AI hal qildi" />
            <StatCard icon={<Clock className="h-4 w-4" />} value={formatResponseTime(data.stats.responseSeconds)} label="O'rtacha javob" />
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            <InsightCard icon={<TrendingUp className="h-4 w-4" />} title="Lead konversiyasi" value={`${data.stats.leadConversionPct}%`} description="Suhbatlardan haqiqiy leadga aylangan ulush." />
            <InsightCard icon={<Headset className="h-4 w-4" />} title="Operatorga o'tgan" value={String(data.stats.operatorHandoffs)} description="AI yetmay, inson aralashgan suhbatlar." />
            <InsightCard icon={<Users className="h-4 w-4" />} title="Instagram izohlari" value={String(data.stats.comments)} description="Kommentariyadan kelgan murojaatlar soni." />
            <InsightCard icon={<CheckCircle className="h-4 w-4" />} title="Chiquvchi xabar" value={`${data.inOutBreakdown.outgoingPct}%`} description="AI va operator tomonidan yuborilgan javoblar ulushi." />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="Xabarlar hajmi" subtitle={`So'nggi ${data.range.days} kun`} />
              <div className="px-6 pb-6">
                <LineChart data={data.volumeSeries} />
              </div>
            </Card>
            <FunnelCard items={data.funnel} />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card>
              <CardHeader title="Kanallar" subtitle="Suhbatlar ulushi" />
              <div className="flex items-center gap-5 px-6 pb-6">
                {data.channelBreakdown.length === 0 ? (
                  <p className="text-sm text-slate-400">Hali kanal bo&apos;yicha ma&apos;lumot yo&apos;q</p>
                ) : (
                  <>
                    <Donut
                      segments={data.channelBreakdown.map((item, index) => ({ value: item.count, color: channelColors[index % channelColors.length] }))}
                      centerTop={String(data.stats.dialogs)}
                      centerBottom="suhbat"
                    />
                    <div className="min-w-0 flex-1 space-y-3 text-[13px]">
                      {data.channelBreakdown.map((item, index) => (
                        <div key={item.type} className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: channelColors[index % channelColors.length] }} />
                            <span className="truncate font-semibold">{channelLabels[item.type] ?? item.type}</span>
                          </div>
                          <span className="font-bold text-slate-500">{item.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader title="Kanal sifati" subtitle="Qaysi kanal leadga yaxshiroq olib keladi" />
              <div className="overflow-x-auto px-6 pb-6">
                <table className="w-full min-w-[620px] text-left text-[13px]">
                  <thead className="text-xs text-slate-400">
                    <tr className="border-b border-line">
                      <th className="py-2 font-semibold">Kanal</th>
                      <th className="py-2 font-semibold">Suhbat</th>
                      <th className="py-2 font-semibold">Qiziqish</th>
                      <th className="py-2 font-semibold">Telefon</th>
                      <th className="py-2 font-semibold">Lead</th>
                      <th className="py-2 text-right font-semibold">Konversiya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.channelQuality.length === 0 ? (
                      <tr><td colSpan={6} className="py-5 text-center text-slate-400">Ma&apos;lumot yo&apos;q</td></tr>
                    ) : data.channelQuality.map((item) => (
                      <tr key={item.type} className="border-b border-line last:border-0">
                        <td className="py-3 font-bold text-navy-900">{channelLabels[item.type] ?? item.type}</td>
                        <td className="py-3 text-slate-500">{item.conversations}</td>
                        <td className="py-3 text-slate-500">{item.requests}</td>
                        <td className="py-3 text-slate-500">{item.phones}</td>
                        <td className="py-3 text-slate-500">{item.leads}</td>
                        <td className="py-3 text-right font-extrabold text-emerald-600">{item.conversionPct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="Hafta kunlari bo'yicha faollik" subtitle="Xabarlar yig'indisi" />
              <div className="flex h-44 items-end justify-between gap-3 px-6 pb-6 pt-2">
                {data.weekdayBreakdown.map((item) => (
                  <div key={item.day} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <div
                      className="w-full max-w-11 rounded-t-lg bg-emerald-100 transition-colors hover:bg-emerald-300"
                      style={{ height: `${Math.max(5, (item.count / maxWeek) * 100)}%` }}
                      title={`${item.day}: ${item.count}`}
                    />
                    <span className="text-[11px] text-slate-400">{item.day}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Kiruvchi va chiquvchi" subtitle="Xabarlar balansi" />
              <div className="flex items-center gap-5 px-6 pb-6">
                <Donut
                  segments={[
                    { value: data.inOutBreakdown.incoming, color: "#7657f5" },
                    { value: data.inOutBreakdown.outgoing, color: "#00b894" },
                  ]}
                  centerTop={`${data.inOutBreakdown.outgoingPct}%`}
                  centerBottom="javob"
                />
                <div className="space-y-3 text-[13px]">
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#7657f5]" /> Kiruvchi <span className="ml-1 font-bold">{data.inOutBreakdown.incomingPct}%</span></div>
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#00b894]" /> Chiquvchi <span className="ml-1 font-bold">{data.inOutBreakdown.outgoingPct}%</span></div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader title="AI yaxshilash nuqtalari" subtitle="E&apos;tibor berish kerak bo&apos;lgan joylar" />
              <div className="space-y-3 px-6 pb-6">
                {data.answerGaps.map((item) => (
                  <div key={item.reason} className="rounded-xl border border-line bg-[#fafbff] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-bold text-navy-900">{item.reason}</div>
                      <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-extrabold text-slate-500">{item.count}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{item.hint}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Lead turlari" subtitle="AI ajratgan murojaatlar" />
              <ProgressRows
                rows={data.leadCategories.map((item) => ({
                  label: categoryLabels[item.category] ?? item.category,
                  value: item.count,
                  meta: `${item.count} · ${item.pct}%`,
                }))}
              />
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Ommabop savollar"
              subtitle="Mijozlar eng ko&apos;p qayta so&apos;ragan matnlar"
              action={<Search className="h-4 w-4 text-slate-300" />}
            />
            <ProgressRows
              rows={data.popularQuestions.map((item, index) => ({
                label: `${String(index + 1).padStart(2, "0")}  ${item.text}`,
                value: item.count,
                meta: String(item.count),
              }))}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
}
