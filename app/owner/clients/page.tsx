"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  KeyRound,
  X,
  Loader2,
  Copy,
  Check,
  Users,
  MessagesSquare,
  Bot,
  ClipboardList,
} from "lucide-react";
import { Badge, PageTitle, PrimaryButton, inputCls } from "@/components/ui";

interface ApiClient {
  id: string;
  company: string;
  plan: "FREE" | "PRO" | "VIP";
  status: "ACTIVE" | "TRIAL" | "EXPIRED" | "BLOCKED";
  createdAt: string;
  users: { id: string; email: string; role: "OWNER" | "CLIENT_ADMIN"; createdAt: string }[];
  channels: {
    id: string;
    type: "TELEGRAM_BOT" | "TELEGRAM_PERSONAL" | "INSTAGRAM" | "YOUTUBE";
    status: "ONLINE" | "PENDING" | "ERROR";
    handle: string | null;
  }[];
  stats: {
    conversations: number;
    conversationsThisMonth: number;
    messages: number;
    incomingMessages: number;
    outgoingMessages: number;
    lastMessageAt: string | null;
    requests: number;
    requestCategories: {
      leads: number;
      interested: number;
      complaints: number;
      suggestions: number;
    };
    channels: number;
    onlineChannels: number;
    knowledgeItems: number;
    faqs: number;
    catalogItems: number;
    automations: number;
    automationRuns: { total: number; delivered: number; linkClicked: number };
    payments: { total: number; paid: number; paidAmount: number; pending: number };
  };
}

const statusMeta: Record<
  ApiClient["status"],
  { label: string; color: "green" | "blue" | "yellow" | "red" }
> = {
  ACTIVE: { label: "Faol", color: "green" },
  TRIAL: { label: "Sinov", color: "blue" },
  EXPIRED: { label: "Muddati o'tgan", color: "yellow" },
  BLOCKED: { label: "Bloklangan", color: "red" },
};

const planLabels: Record<ApiClient["plan"], string> = {
  FREE: "FREE",
  PRO: "PRO",
  VIP: "VIP",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("uz-UZ").format(amount);
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const channelLabels: Record<ApiClient["channels"][number]["type"], string> = {
  TELEGRAM_BOT: "TG bot",
  TELEGRAM_PERSONAL: "Telegram",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
};

export default function OwnerClientsPage() {
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState("");

  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState<"FREE" | "PRO" | "VIP">("FREE");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resetResult, setResetResult] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    const res = await fetch("/api/owner/clients");
    const data = await res.json();
    setClients(data.clients ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let ignore = false;
    fetch("/api/owner/clients")
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        setClients(data.clients ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const filteredClients = clients.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.company.toLowerCase().includes(q) ||
      c.users.some((user) => user.email.toLowerCase().includes(q)) ||
      c.channels.some((channel) => (channel.handle ?? "").toLowerCase().includes(q))
    );
  });

  const totals = clients.reduce(
    (acc, client) => {
      acc.users += client.users.length;
      acc.messages += client.stats.messages;
      acc.requests += client.stats.requests;
      acc.automations += client.stats.automations;
      acc.onlineChannels += client.stats.onlineChannels;
      return acc;
    },
    { users: 0, messages: 0, requests: 0, automations: 0, onlineChannels: 0 },
  );

  function resetForm() {
    setCompany("");
    setEmail("");
    setPassword("");
    setPlan("FREE");
    setError(null);
  }

  async function createClient() {
    if (!company.trim() || !email.trim() || !password.trim()) {
      setError("Barcha maydonlarni to'ldiring");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/owner/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, email, password, plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Xatolik yuz berdi");
        return;
      }
      setShowModal(false);
      resetForm();
      await load();
    } catch {
      setError("Serverga ulanib bo'lmadi");
    } finally {
      setCreating(false);
    }
  }

  async function resetPassword(id: string) {
    setResettingId(id);
    setCopied(false);
    try {
      const res = await fetch(`/api/owner/clients/${id}/reset-password`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) setResetResult(data);
    } finally {
      setResettingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle
        title="Mijozlar"
        subtitle="Kabinetlar, email loginlar va foydalanish statistikasi"
        action={
          <PrimaryButton onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Yangi kabinet
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="rounded-2xl bg-white border border-line p-4">
          <div className="w-9 h-9 rounded-xl bg-electric-50 text-electric-600 flex items-center justify-center">
            <Users className="w-4.5 h-4.5" />
          </div>
          <div className="text-2xl font-extrabold mt-3">{totals.users}</div>
          <div className="text-xs text-slate-400">Email foydalanuvchilar</div>
        </div>
        <div className="rounded-2xl bg-white border border-line p-4">
          <div className="w-9 h-9 rounded-xl bg-electric-50 text-electric-600 flex items-center justify-center">
            <MessagesSquare className="w-4.5 h-4.5" />
          </div>
          <div className="text-2xl font-extrabold mt-3">{totals.messages}</div>
          <div className="text-xs text-slate-400">Jami xabarlar</div>
        </div>
        <div className="rounded-2xl bg-white border border-line p-4">
          <div className="w-9 h-9 rounded-xl bg-electric-50 text-electric-600 flex items-center justify-center">
            <ClipboardList className="w-4.5 h-4.5" />
          </div>
          <div className="text-2xl font-extrabold mt-3">{totals.requests}</div>
          <div className="text-xs text-slate-400">CRM arizalar</div>
        </div>
        <div className="rounded-2xl bg-white border border-line p-4">
          <div className="w-9 h-9 rounded-xl bg-electric-50 text-electric-600 flex items-center justify-center">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div className="text-2xl font-extrabold mt-3">{totals.automations}</div>
          <div className="text-xs text-slate-400">Avtomatizatsiyalar</div>
        </div>
        <div className="rounded-2xl bg-white border border-line p-4">
          <div className="w-9 h-9 rounded-xl bg-electric-50 text-electric-600 flex items-center justify-center">
            <Check className="w-4.5 h-4.5" />
          </div>
          <div className="text-2xl font-extrabold mt-3">{totals.onlineChannels}</div>
          <div className="text-xs text-slate-400">Online kanallar</div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-line">
        <div className="p-4 border-b border-line">
          <div className="flex items-center gap-2 bg-[#f4f7ff] rounded-xl px-3.5 py-2.5 max-w-md">
            <Search className="w-4 h-4 text-slate-300" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Kompaniya, email yoki kanal bo'yicha qidirish..."
              className="bg-transparent outline-none text-[13px] flex-1 placeholder:text-slate-300"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
          </div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-300">
            Hali mijozlar yo&apos;q — Yangi kabinet tugmasini bosing
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-300">
            Hech narsa topilmadi
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1180px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-300 border-b border-line">
                  <th className="px-5 py-3 font-semibold">Kompaniya</th>
                  <th className="px-5 py-3 font-semibold">Email foydalanuvchilar</th>
                  <th className="px-5 py-3 font-semibold">Tarif</th>
                  <th className="px-5 py-3 font-semibold">Holat</th>
                  <th className="px-5 py-3 font-semibold">Kanallar</th>
                  <th className="px-5 py-3 font-semibold">Xabarlar</th>
                  <th className="px-5 py-3 font-semibold">Arizalar</th>
                  <th className="px-5 py-3 font-semibold">AI bazasi</th>
                  <th className="px-5 py-3 font-semibold">Avtomatizatsiya</th>
                  <th className="px-5 py-3 font-semibold">To&apos;lovlar</th>
                  <th className="px-5 py-3 font-semibold">Oxirgi faollik</th>
                  <th className="px-5 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredClients.map((c) => (
                  <tr key={c.id} className="hover:bg-[#fafbff] align-top">
                    <td className="px-5 py-4">
                      <div className="font-bold">{c.company}</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {formatDate(c.createdAt)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1.5">
                        {c.users.length === 0 ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          c.users.map((user) => (
                            <div key={user.id}>
                              <div className="font-semibold text-slate-700">
                                {user.email}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {user.role === "CLIENT_ADMIN" ? "Mijoz admin" : "Owner"} ·{" "}
                                {formatDate(user.createdAt)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge color="blue">{planLabels[c.plan]}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge color={statusMeta[c.status].color} dot>
                        {statusMeta[c.status].label}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold">
                        {c.stats.onlineChannels}/{c.stats.channels} online
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
                        {c.channels.length === 0 ? (
                          <div>Kanal yo&apos;q</div>
                        ) : (
                          c.channels.map((channel) => (
                            <div key={channel.id}>
                              {channelLabels[channel.type]} {channel.handle ?? ""} ·{" "}
                              {channel.status}
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold">{c.stats.messages}</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Kiruvchi {c.stats.incomingMessages} · Chiquvchi{" "}
                        {c.stats.outgoingMessages}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Oyda {c.stats.conversationsThisMonth} dialog
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold">{c.stats.requests}</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Lead {c.stats.requestCategories.leads} · Qiziqqan{" "}
                        {c.stats.requestCategories.interested}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Shikoyat {c.stats.requestCategories.complaints} · Taklif{" "}
                        {c.stats.requestCategories.suggestions}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      <div>{c.stats.catalogItems} mahsulot</div>
                      <div>{c.stats.knowledgeItems} bilim</div>
                      <div>{c.stats.faqs} FAQ</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold">{c.stats.automations}</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Run {c.stats.automationRuns.total} · Yetkazildi{" "}
                        {c.stats.automationRuns.delivered}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Link bosildi {c.stats.automationRuns.linkClicked}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold">
                        {formatMoney(c.stats.payments.paidAmount)} so&apos;m
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Paid {c.stats.payments.paid} · Pending {c.stats.payments.pending}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {formatDateTime(c.stats.lastMessageAt)}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => resetPassword(c.id)}
                        disabled={resettingId === c.id}
                        className="flex items-center gap-1.5 text-xs font-semibold text-electric-600 bg-electric-50 rounded-lg px-3 py-2 hover:bg-electric-100 transition-colors disabled:opacity-60"
                      >
                        {resettingId === c.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <KeyRound className="w-3.5 h-3.5" />
                        )}
                        Parol berish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="rounded-2xl bg-white w-full max-w-md p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">Yangi mijoz kabineti</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Kompaniya nomi"
              className={inputCls}
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Login (email)"
              type="email"
              className={inputCls}
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parol"
              type="text"
              className={inputCls}
            />
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as typeof plan)}
              className={inputCls}
            >
              <option value="FREE">Tarif: FREE</option>
              <option value="PRO">Tarif: PRO</option>
              <option value="VIP">Tarif: VIP</option>
            </select>
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            <PrimaryButton
              onClick={createClient}
              className="w-full justify-center"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Kabinet yaratish"
              )}
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* Reset password result modal */}
      {resetResult && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="rounded-2xl bg-white w-full max-w-md p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">Yangi parol yaratildi</h3>
              <button
                onClick={() => setResetResult(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Bu parol faqat bir marta ko&apos;rsatiladi — mijozga hoziroq
              yuboring.
            </p>
            <div className="rounded-xl bg-[#f4f7ff] p-4 space-y-1">
              <div className="text-[11px] text-slate-400">Login</div>
              <div className="text-sm font-bold">{resetResult.email}</div>
              <div className="text-[11px] text-slate-400 mt-2">Parol</div>
              <div className="text-sm font-bold font-mono">
                {resetResult.password}
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `Login: ${resetResult.email}\nParol: ${resetResult.password}`,
                );
                setCopied(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 border border-line text-slate-600 text-[13px] font-semibold py-2.5 rounded-xl hover:border-electric-300 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" /> Nusxalandi
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Nusxalash
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
