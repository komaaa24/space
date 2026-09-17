"use client";

import { useEffect, useState } from "react";
import { Phone, Globe, UserPlus, Loader2 } from "lucide-react";
import { Badge, PageTitle } from "@/components/ui";

const sourceMeta = {
  LANDING: { label: "Landing", icon: Globe, color: "#0f5eff" },
  REFERRAL: { label: "Tavsiya", icon: UserPlus, color: "#8b5cf6" },
} as const;

const statusMeta = {
  NEW: { label: "Yangi", color: "blue" as const },
  CONTACTED: { label: "Aloqa qilindi", color: "yellow" as const },
  DEMO: { label: "Demo belgilandi", color: "navy" as const },
  WON: { label: "Mijozga aylandi", color: "green" as const },
  LOST: { label: "Yo'qotildi", color: "red" as const },
} as const;

type LeadStatus = keyof typeof statusMeta;
type LeadSource = keyof typeof sourceMeta;

interface Lead {
  id: string;
  name: string;
  phone: string;
  note: string | null;
  source: LeadSource;
  status: LeadStatus;
  createdAt: string;
}

export default function OwnerLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/leads");
    const data = await res.json();
    setLeads(data.leads ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  async function updateStatus(id: string, status: LeadStatus) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  return (
    <div className="space-y-5">
      <PageTitle
        title="Leadlar"
        subtitle="Landing sahifadan ariza qoldirgan potensial mijozlar"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.entries(sourceMeta) as [LeadSource, (typeof sourceMeta)[LeadSource]][]).map(
          ([key, s]) => {
            const count = leads.filter((l) => l.source === key).length;
            return (
              <div
                key={key}
                className="rounded-2xl bg-white border border-line p-4 flex items-center gap-3"
              >
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${s.color}12` }}
                >
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </span>
                <div>
                  <div className="text-lg font-extrabold leading-none">{count}</div>
                  <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                </div>
              </div>
            );
          },
        )}
      </div>

      {loading ? (
        <div className="text-sm text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-2xl bg-white border border-line border-dashed p-6 text-center text-sm text-slate-400">
          Hali hech qanday lead yo'q — landing sahifadagi forma orqali kelganda shu yerda ko'rinadi.
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-line divide-y divide-line">
          {leads.map((l) => {
            const s = sourceMeta[l.source] ?? sourceMeta.LANDING;
            return (
              <div
                key={l.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-[#fafbff] transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{
                    background: `hsl(${(l.name.charCodeAt(0) * 41) % 360} 60% 50%)`,
                  }}
                >
                  {l.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{l.name}</span>
                    <span
                      className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg"
                      style={{ background: `${s.color}12`, color: s.color }}
                    >
                      <s.icon className="w-3 h-3" /> {s.label}
                    </span>
                    <Badge color={statusMeta[l.status].color} dot>
                      {statusMeta[l.status].label}
                    </Badge>
                  </div>
                  {l.note && <p className="text-[13px] text-slate-500 mt-1">{l.note}</p>}
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-semibold text-electric-600">
                      <Phone className="w-3 h-3" /> {l.phone}
                    </span>
                    <span>{new Date(l.createdAt).toLocaleString("uz-UZ")}</span>
                  </div>
                </div>
                <select
                  value={l.status}
                  onChange={(e) => updateStatus(l.id, e.target.value as LeadStatus)}
                  className="bg-white border border-line rounded-lg px-2.5 py-2 text-[13px] outline-none shrink-0"
                >
                  <option value="NEW">Yangi</option>
                  <option value="CONTACTED">Aloqa qilindi</option>
                  <option value="DEMO">Demo belgilandi</option>
                  <option value="WON">Mijozga aylandi</option>
                  <option value="LOST">Yo'qotildi</option>
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
