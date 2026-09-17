"use client";

import { useEffect, useState } from "react";
import { MessagesSquare, Mail, ClipboardList, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardHeader, PageTitle, StatCard } from "@/components/ui";

const channelLabels: Record<string, string> = {
  TELEGRAM_BOT: "Telegram-bot",
  TELEGRAM_PERSONAL: "Telegram",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
};
const channelColors = ["#0f5eff", "#00c2ff", "#0a2463", "#8b5cf6"];

function LineChart({ data }: { data: number[] }) {
  const w = 640;
  const h = 200;
  const pad = 8;
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => [
    pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1),
    h - pad - (v / max) * (h - pad * 2),
  ]);
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`)
    .join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f5eff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0f5eff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0038b8" />
          <stop offset="100%" stopColor="#00c2ff" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#area)" />
      <path d={line} fill="none" stroke="url(#stroke)" strokeWidth="3" strokeLinecap="round" />
      <circle
        cx={pts[pts.length - 1][0]}
        cy={pts[pts.length - 1][1]}
        r="5"
        fill="white"
        stroke="#0f5eff"
        strokeWidth="3"
      />
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
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="11"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold leading-none">{centerTop}</span>
        <span className="text-[10px] text-slate-400 mt-1">{centerBottom}</span>
      </div>
    </div>
  );
}

interface AnalyticsData {
  stats: { dialogs: number; messages: number; requests: number; leadConversionPct: number };
  volumeSeries: number[];
  weekdayBreakdown: { day: string; count: number }[];
  channelBreakdown: { type: string; count: number }[];
  inOutBreakdown: { incoming: number; outgoing: number };
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"7" | "30">("7");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?period=${period}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [period]);

  const maxWeek = Math.max(1, ...(data?.weekdayBreakdown.map((d) => d.count) ?? [1]));

  return (
    <div className="space-y-5">
      <PageTitle
        title="Analitika"
        subtitle="Kanal va agent samaradorligi"
        action={
          <div className="inline-flex items-center bg-white border border-line rounded-xl p-1">
            <button
              onClick={() => setPeriod("7")}
              className={`text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors ${
                period === "7" ? "bg-electric-500 text-white" : "text-slate-400"
              }`}
            >
              7 kun
            </button>
            <button
              onClick={() => setPeriod("30")}
              className={`text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors ${
                period === "30" ? "bg-electric-500 text-white" : "text-slate-400"
              }`}
            >
              30 kun
            </button>
          </div>
        }
      />

      {loading || !data ? (
        <div className="text-sm text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              hero
              icon={<MessagesSquare className="w-4.5 h-4.5" />}
              value={String(data.stats.dialogs)}
              label="Dialoglar"
            />
            <StatCard
              icon={<Mail className="w-4.5 h-4.5" />}
              value={String(data.stats.messages)}
              label="Xabarlar"
            />
            <StatCard
              icon={<ClipboardList className="w-4.5 h-4.5" />}
              value={String(data.stats.requests)}
              label="Arizalar"
            />
            <StatCard
              icon={<TrendingUp className="w-4.5 h-4.5" />}
              value={`${data.stats.leadConversionPct}%`}
              label="Lead konversiyasi"
            />
          </div>

          <div className="grid xl:grid-cols-3 gap-5">
            <Card className="xl:col-span-2">
              <CardHeader title="Xabarlar hajmi" subtitle={`So'nggi ${period} kun`} />
              <div className="px-6 pb-6">
                <LineChart data={data.volumeSeries} />
              </div>
            </Card>

            <Card>
              <CardHeader title="Kanallar" subtitle="Dialoglar ulushi" />
              <div className="px-6 pb-6 flex items-center gap-5">
                {data.channelBreakdown.length === 0 ? (
                  <p className="text-sm text-slate-400">Hali kanal ulanmagan</p>
                ) : (
                  <>
                    <Donut
                      segments={data.channelBreakdown.map((c, i) => ({
                        value: c.count,
                        color: channelColors[i % channelColors.length],
                      }))}
                      centerTop={String(
                        data.channelBreakdown.reduce((s, c) => s + c.count, 0),
                      )}
                      centerBottom="dialog"
                    />
                    <div className="space-y-3 text-[13px]">
                      {data.channelBreakdown.map((c, i) => (
                        <div key={c.type} className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: channelColors[i % channelColors.length] }}
                          />
                          {channelLabels[c.type] ?? c.type}{" "}
                          <span className="font-bold ml-1">{c.count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>

          <div className="grid xl:grid-cols-3 gap-5">
            <Card className="xl:col-span-2">
              <CardHeader
                title="Hafta kunlari bo'yicha faollik"
                subtitle="Xabarlar yig'indisi, so'nggi 7 kun"
              />
              <div className="px-6 pb-6 pt-2 flex items-end justify-between gap-3 h-44">
                {data.weekdayBreakdown.map((d) => (
                  <div
                    key={d.day}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                  >
                    <div
                      className="w-full max-w-11 rounded-t-lg bg-electric-100 hover:bg-electric-300 transition-colors"
                      style={{ height: `${(d.count / maxWeek) * 100}%` }}
                    />
                    <span className="text-[11px] text-slate-400">{d.day}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Kiruvchi / chiquvchi" subtitle="Xabarlar ulushi" />
              <div className="px-6 pb-6 flex items-center gap-5">
                <Donut
                  segments={[
                    { value: data.inOutBreakdown.incoming, color: "#0a2463" },
                    { value: data.inOutBreakdown.outgoing, color: "#0f5eff" },
                  ]}
                  centerTop={String(data.inOutBreakdown.incoming + data.inOutBreakdown.outgoing)}
                  centerBottom="xabar"
                />
                <div className="space-y-3 text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-electric-900" />
                    Kiruvchi <span className="font-bold ml-1">{data.inOutBreakdown.incoming}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-electric-500" />
                    Chiquvchi (AI){" "}
                    <span className="font-bold ml-1">{data.inOutBreakdown.outgoing}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
