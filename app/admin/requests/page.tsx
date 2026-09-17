"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Briefcase,
  Star,
  ShieldAlert,
  Lightbulb,
  Phone,
  Loader2,
} from "lucide-react";
import { PageTitle } from "@/components/ui";

type RequestCategory = "LEAD" | "INTERESTED" | "COMPLAINT" | "SUGGESTION";
type RequestStatus = "NEW" | "IN_PROGRESS" | "DONE";

interface ApiRequest {
  id: string;
  category: RequestCategory;
  name: string;
  phone: string | null;
  text: string;
  status: RequestStatus;
  createdAt: string;
  conversation: { channel: { type: string } } | null;
}

const categoryMeta: Record<
  RequestCategory,
  { label: string; icon: typeof Briefcase; color: string }
> = {
  LEAD: { label: "Leadlar", icon: Briefcase, color: "#10b981" },
  INTERESTED: { label: "Qiziqish bildirganlar", icon: Star, color: "#3b82f6" },
  COMPLAINT: { label: "Shikoyatlar", icon: ShieldAlert, color: "#ef4444" },
  SUGGESTION: { label: "Takliflar", icon: Lightbulb, color: "#f59e0b" },
};

const channelLabels: Record<string, string> = {
  TELEGRAM_BOT: "Telegram-bot",
  TELEGRAM_PERSONAL: "Telegram",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<RequestCategory>("LEAD");
  const [query, setQuery] = useState("");

  async function load() {
    const res = await fetch("/api/requests");
    const data = await res.json();
    setRequests(data.requests ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 6000);
    return () => clearInterval(interval);
  }, []);

  async function updateStatus(id: string, status: RequestStatus) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  const counts = (c: RequestCategory) =>
    requests.filter((r) => r.category === c).length;
  const q = query.trim().toLowerCase();
  const list = requests.filter(
    (r) =>
      r.category === category &&
      (!q ||
        r.name.toLowerCase().includes(q) ||
        r.text.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q)),
  );

  return (
    <div className="space-y-5">
      <PageTitle
        title="Arizalar"
        subtitle="AI avtomatik saralagan murojaatlar: leadlar, shikoyatlar, takliflar"
      />

      {/* Category cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(categoryMeta) as RequestCategory[]).map((c) => {
          const meta = categoryMeta[c];
          const Icon = meta.icon;
          const active = category === c;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-2xl p-5 text-left transition-all border ${
                active
                  ? "electric-gradient text-white border-transparent shadow-[0_8px_24px_rgba(15,94,255,0.3)]"
                  : "bg-white border-line hover:border-electric-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    active ? "bg-white/15" : "bg-electric-50"
                  }`}
                >
                  <Icon
                    className={`w-4.5 h-4.5 ${active ? "text-white" : "text-electric-600"}`}
                  />
                </span>
                <span
                  className={`text-2xl font-extrabold ${active ? "" : "text-slate-900"}`}
                >
                  {counts(c)}
                </span>
              </div>
              <div
                className={`text-[13px] font-medium mt-3 ${
                  active ? "text-electric-100" : "text-slate-400"
                }`}
              >
                {meta.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters + list */}
      <div className="rounded-2xl bg-white border border-line">
        <div className="p-4 border-b border-line flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-[#f4f7ff] rounded-xl px-3.5 py-2.5 flex-1 min-w-52">
            <Search className="w-4 h-4 text-slate-300" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ism, kontakt, matn bo'yicha qidirish..."
              className="bg-transparent outline-none text-[13px] flex-1 placeholder:text-slate-300"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
          </div>
        ) : list.length === 0 ? (
          <div className="py-24 text-center">
            <div className="dot-grid w-24 h-24 mx-auto rounded-2xl mb-4 opacity-40" />
            <p className="text-sm text-slate-300">Bu kategoriyada arizalar yo'q</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {list.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-[#fafbff] transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold shrink-0"
                  style={{
                    background: `hsl(${(r.name.charCodeAt(0) * 37) % 360} 60% 50%)`,
                  }}
                >
                  {r.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{r.name}</span>
                    {r.conversation && (
                      <span className="text-[11px] text-slate-400">
                        {channelLabels[r.conversation.channel.type]} orqali
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-slate-500 mt-1">{r.text}</p>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                    {r.phone && (
                      <span className="flex items-center gap-1.5 font-semibold text-electric-600">
                        <Phone className="w-3 h-3" /> {r.phone}
                      </span>
                    )}
                    <span>{formatDate(r.createdAt)}</span>
                  </div>
                </div>
                <select
                  value={r.status}
                  onChange={(e) => updateStatus(r.id, e.target.value as RequestStatus)}
                  className="bg-white border border-line rounded-lg px-2.5 py-2 text-[13px] outline-none shrink-0"
                >
                  <option value="NEW">Yangi</option>
                  <option value="IN_PROGRESS">Jarayonda</option>
                  <option value="DONE">Yakunlangan</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
