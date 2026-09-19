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
  users: {
    id: string;
    email: string;
    role: "OWNER" | "CLIENT_ADMIN";
    createdAt: string;
    lastLoginAt: string | null;
    lastLoginIp: string | null;
    loginCount: number;
  }[];
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
    aiMessagesThisMonth: number;
    messageMonthlyLimit: number | null;
    messageRemaining: number | null;
    messagePackagePrice: number;
    messagePackageCurrency: string;
    messagePackageNote: string;
    activeSubscription: { cycle: "MONTHLY" | "YEARLY"; endsAt: string } | null;
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

type BillingCycle = "MONTHLY" | "YEARLY";

type PackageDraft = {
  messageMonthlyLimit: string;
  messagePackagePrice: string;
  messagePackageCurrency: string;
  messagePackageNote: string;
};

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

const channelLabels: Record<ApiClient["channels"][number]["type"], string> = {
  TELEGRAM_BOT: "TG bot",
  TELEGRAM_PERSONAL: "Telegram",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
};

const messagePackagePresets = [
  { label: "0-500 chat", limit: 500, price: 50, currency: "USD" },
  { label: "500-1 500 chat", limit: 1500, price: 75, currency: "USD" },
  { label: "1 500-2 000 chat", limit: 2000, price: 100, currency: "USD" },
  { label: "2 500-5 000 chat", limit: 5000, price: 150, currency: "USD" },
  { label: "5 000-10 000 chat", limit: 10000, price: 250, currency: "USD" },
  { label: "10 000+ custom", limit: null, price: 0, currency: "USD" },
];

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
  if (!iso) return "-";
  return new Date(iso).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SummaryCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-line p-4">
      <div className="w-9 h-9 rounded-xl bg-electric-50 text-electric-600 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-2xl font-extrabold mt-3">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

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

  const [resetResult, setResetResult] = useState<{ email: string; password: string } | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [planDrafts, setPlanDrafts] = useState<Record<string, ApiClient["plan"]>>({});
  const [cycleDrafts, setCycleDrafts] = useState<Record<string, BillingCycle>>({});
  const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null);
  const [packageDrafts, setPackageDrafts] = useState<Record<string, PackageDraft>>({});
  const [updatingPackageId, setUpdatingPackageId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
      acc.logins += client.users.reduce((sum, user) => sum + user.loginCount, 0);
      acc.messages += client.stats.messages;
      acc.aiMessages += client.stats.aiMessagesThisMonth;
      acc.requests += client.stats.requests;
      acc.onlineChannels += client.stats.onlineChannels;
      return acc;
    },
    { users: 0, logins: 0, messages: 0, aiMessages: 0, requests: 0, onlineChannels: 0 },
  );

  function resetForm() {
    setCompany("");
    setEmail("");
    setPassword("");
    setPlan("FREE");
    setError(null);
  }

  function getPackageDraft(client: ApiClient): PackageDraft {
    return (
      packageDrafts[client.id] ?? {
        messageMonthlyLimit: client.stats.messageMonthlyLimit?.toString() ?? "",
        messagePackagePrice: client.stats.messagePackagePrice.toString(),
        messagePackageCurrency: client.stats.messagePackageCurrency || "USD",
        messagePackageNote: client.stats.messagePackageNote,
      }
    );
  }

  function patchPackageDraft(clientId: string, patch: Partial<PackageDraft>) {
    const client = clients.find((item) => item.id === clientId);
    if (!client) return;
    setPackageDrafts((drafts) => ({
      ...drafts,
      [clientId]: { ...getPackageDraft(client), ...patch },
    }));
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
      const res = await fetch(`/api/owner/clients/${id}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setResetResult(data);
    } finally {
      setResettingId(null);
    }
  }

  async function updateClientPlan(clientId: string) {
    const nextPlan = planDrafts[clientId] ?? clients.find((c) => c.id === clientId)?.plan;
    const cycle = cycleDrafts[clientId] ?? "MONTHLY";
    if (!nextPlan || updatingPlanId) return;

    setUpdatingPlanId(clientId);
    setActionError(null);
    try {
      const res = await fetch(`/api/owner/clients/${clientId}/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: nextPlan, cycle }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setActionError(data?.error ?? "Tarifni o'zgartirib bo'lmadi");
        return;
      }
      await load();
    } catch {
      setActionError("Serverga ulanib bo'lmadi");
    } finally {
      setUpdatingPlanId(null);
    }
  }

  async function updateMessagePackage(client: ApiClient) {
    const draft = getPackageDraft(client);
    setUpdatingPackageId(client.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/owner/clients/${client.id}/message-package`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setActionError(data?.error ?? "Xabar paketini saqlab bo'lmadi");
        return;
      }
      await load();
    } catch {
      setActionError("Serverga ulanib bo'lmadi");
    } finally {
      setUpdatingPackageId(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle
        title="Mijozlar"
        subtitle="Kabinetlar, tariflar, email loginlar va foydalanish statistikasi"
        action={
          <PrimaryButton onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Yangi kabinet
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
        <SummaryCard icon={<Users className="w-4.5 h-4.5" />} value={totals.users} label="Email foydalanuvchilar" />
        <SummaryCard icon={<KeyRound className="w-4.5 h-4.5" />} value={totals.logins} label="Jami loginlar" />
        <SummaryCard icon={<MessagesSquare className="w-4.5 h-4.5" />} value={totals.messages} label="Jami xabarlar" />
        <SummaryCard icon={<Bot className="w-4.5 h-4.5" />} value={totals.aiMessages} label="Bu oy AI javoblar" />
        <SummaryCard icon={<ClipboardList className="w-4.5 h-4.5" />} value={totals.requests} label="CRM arizalar" />
        <SummaryCard icon={<Check className="w-4.5 h-4.5" />} value={totals.onlineChannels} label="Online kanallar" />
      </div>

      <div className="rounded-2xl bg-white border border-line">
        <div className="p-4 border-b border-line">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 bg-[#f4f7ff] rounded-xl px-3.5 py-2.5 max-w-md">
              <Search className="w-4 h-4 text-slate-300" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Kompaniya, email yoki kanal bo'yicha qidirish..."
                className="bg-transparent outline-none text-[13px] flex-1 placeholder:text-slate-300"
              />
            </div>
            {actionError && <div className="text-xs font-semibold text-red-500">{actionError}</div>}
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
          <div className="py-16 text-center text-sm text-slate-300">Hech narsa topilmadi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1500px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-300 border-b border-line">
                  <th className="px-5 py-3 font-semibold">Kompaniya</th>
                  <th className="px-5 py-3 font-semibold">Email foydalanuvchilar</th>
                  <th className="px-5 py-3 font-semibold">Tarif</th>
                  <th className="px-5 py-3 font-semibold">AI xabar paketi</th>
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
                {filteredClients.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    planDraft={planDrafts[client.id] ?? client.plan}
                    cycleDraft={cycleDrafts[client.id] ?? "MONTHLY"}
                    packageDraft={getPackageDraft(client)}
                    updatingPlan={updatingPlanId === client.id}
                    updatingPackage={updatingPackageId === client.id}
                    resettingPassword={resettingId === client.id}
                    onPlanChange={(value) =>
                      setPlanDrafts((drafts) => ({ ...drafts, [client.id]: value }))
                    }
                    onCycleChange={(value) =>
                      setCycleDrafts((drafts) => ({ ...drafts, [client.id]: value }))
                    }
                    onPackagePatch={(patch) => patchPackageDraft(client.id, patch)}
                    onSavePlan={() => updateClientPlan(client.id)}
                    onSavePackage={() => updateMessagePackage(client)}
                    onResetPassword={() => resetPassword(client.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Kompaniya nomi" className={inputCls} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Login (email)" type="email" className={inputCls} />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parol" type="text" className={inputCls} />
            <select value={plan} onChange={(e) => setPlan(e.target.value as typeof plan)} className={inputCls}>
              <option value="FREE">Tarif: FREE</option>
              <option value="PRO">Tarif: PRO</option>
              <option value="VIP">Tarif: VIP</option>
            </select>
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            <PrimaryButton onClick={createClient} className="w-full justify-center">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kabinet yaratish"}
            </PrimaryButton>
          </div>
        </div>
      )}

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
              Bu parol faqat bir marta ko&apos;rsatiladi — mijozga hoziroq yuboring.
            </p>
            <div className="rounded-xl bg-[#f4f7ff] p-4 space-y-1">
              <div className="text-[11px] text-slate-400">Login</div>
              <div className="text-sm font-bold">{resetResult.email}</div>
              <div className="text-[11px] text-slate-400 mt-2">Parol</div>
              <div className="text-sm font-bold font-mono">{resetResult.password}</div>
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

function ClientRow({
  client,
  planDraft,
  cycleDraft,
  packageDraft,
  updatingPlan,
  updatingPackage,
  resettingPassword,
  onPlanChange,
  onCycleChange,
  onPackagePatch,
  onSavePlan,
  onSavePackage,
  onResetPassword,
}: {
  client: ApiClient;
  planDraft: ApiClient["plan"];
  cycleDraft: BillingCycle;
  packageDraft: PackageDraft;
  updatingPlan: boolean;
  updatingPackage: boolean;
  resettingPassword: boolean;
  onPlanChange: (value: ApiClient["plan"]) => void;
  onCycleChange: (value: BillingCycle) => void;
  onPackagePatch: (patch: Partial<PackageDraft>) => void;
  onSavePlan: () => void;
  onSavePackage: () => void;
  onResetPassword: () => void;
}) {
  return (
    <tr className="hover:bg-[#fafbff] align-top">
      <td className="px-5 py-4">
        <div className="font-bold">{client.company}</div>
        <div className="text-[11px] text-slate-400 mt-1">{formatDate(client.createdAt)}</div>
      </td>
      <td className="px-5 py-4">
        <div className="space-y-1.5">
          {client.users.length === 0 ? (
            <span className="text-slate-400">-</span>
          ) : (
            client.users.map((user) => (
              <div key={user.id}>
                <div className="font-semibold text-slate-700">{user.email}</div>
                <div className="text-[11px] text-slate-400">
                  {user.role === "CLIENT_ADMIN" ? "Mijoz admin" : "Owner"} · {formatDate(user.createdAt)}
                </div>
                <div className="text-[11px] text-slate-400">
                  Oxirgi kirish: {formatDateTime(user.lastLoginAt)}
                </div>
                <div className="text-[11px] text-slate-400">
                  Login: {user.loginCount} marta · IP: {user.lastLoginIp ?? "-"}
                </div>
              </div>
            ))
          )}
        </div>
      </td>
      <td className="px-5 py-4">
        <PlanControl
          client={client}
          planDraft={planDraft}
          cycleDraft={cycleDraft}
          updating={updatingPlan}
          onPlanChange={onPlanChange}
          onCycleChange={onCycleChange}
          onSave={onSavePlan}
        />
      </td>
      <td className="px-5 py-4">
        <PackageControl
          client={client}
          draft={packageDraft}
          updating={updatingPackage}
          onPatch={onPackagePatch}
          onSave={onSavePackage}
        />
      </td>
      <td className="px-5 py-4">
        <Badge color={statusMeta[client.status].color} dot>
          {statusMeta[client.status].label}
        </Badge>
      </td>
      <td className="px-5 py-4">
        <div className="font-semibold">
          {client.stats.onlineChannels}/{client.stats.channels} online
        </div>
        <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
          {client.channels.length === 0 ? (
            <div>Kanal yo&apos;q</div>
          ) : (
            client.channels.map((channel) => (
              <div key={channel.id}>
                {channelLabels[channel.type]} {channel.handle ?? ""} · {channel.status}
              </div>
            ))
          )}
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="font-semibold">{client.stats.messages}</div>
        <div className="text-[11px] text-slate-400 mt-1">
          Kiruvchi {client.stats.incomingMessages} · Chiquvchi {client.stats.outgoingMessages}
        </div>
        <div className="text-[11px] text-slate-400">
          Oyda {client.stats.conversationsThisMonth} dialog
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="font-semibold">{client.stats.requests}</div>
        <div className="text-[11px] text-slate-400 mt-1">
          Lead {client.stats.requestCategories.leads} · Qiziqqan {client.stats.requestCategories.interested}
        </div>
        <div className="text-[11px] text-slate-400">
          Shikoyat {client.stats.requestCategories.complaints} · Taklif {client.stats.requestCategories.suggestions}
        </div>
      </td>
      <td className="px-5 py-4 text-slate-500">
        <div>{client.stats.catalogItems} mahsulot</div>
        <div>{client.stats.knowledgeItems} bilim</div>
        <div>{client.stats.faqs} FAQ</div>
      </td>
      <td className="px-5 py-4">
        <div className="font-semibold">{client.stats.automations}</div>
        <div className="text-[11px] text-slate-400 mt-1">
          Run {client.stats.automationRuns.total} · Yetkazildi {client.stats.automationRuns.delivered}
        </div>
        <div className="text-[11px] text-slate-400">
          Link bosildi {client.stats.automationRuns.linkClicked}
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="font-semibold">{formatMoney(client.stats.payments.paidAmount)} so&apos;m</div>
        <div className="text-[11px] text-slate-400 mt-1">
          Paid {client.stats.payments.paid} · Pending {client.stats.payments.pending}
        </div>
      </td>
      <td className="px-5 py-4 text-slate-500">{formatDateTime(client.stats.lastMessageAt)}</td>
      <td className="px-5 py-4">
        <button
          onClick={onResetPassword}
          disabled={resettingPassword}
          className="flex items-center gap-1.5 text-xs font-semibold text-electric-600 bg-electric-50 rounded-lg px-3 py-2 hover:bg-electric-100 transition-colors disabled:opacity-60"
        >
          {resettingPassword ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <KeyRound className="w-3.5 h-3.5" />
          )}
          Parol berish
        </button>
      </td>
    </tr>
  );
}

function PlanControl({
  client,
  planDraft,
  cycleDraft,
  updating,
  onPlanChange,
  onCycleChange,
  onSave,
}: {
  client: ApiClient;
  planDraft: ApiClient["plan"];
  cycleDraft: BillingCycle;
  updating: boolean;
  onPlanChange: (value: ApiClient["plan"]) => void;
  onCycleChange: (value: BillingCycle) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-2 min-w-48">
      <div className="flex items-center gap-2">
        <Badge color="blue">{planLabels[client.plan]}</Badge>
        <span className="text-[11px] text-slate-400">joriy</span>
      </div>
      <div className="text-[11px] text-slate-400">
        {client.stats.activeSubscription
          ? `${client.stats.activeSubscription.cycle === "YEARLY" ? "Yillik" : "Oylik"} · ${formatDate(client.stats.activeSubscription.endsAt)} gacha`
          : "Aktiv subscription yo'q"}
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <select
          value={planDraft}
          onChange={(e) => onPlanChange(e.target.value as ApiClient["plan"])}
          className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none transition-colors focus:border-electric-300"
        >
          <option value="FREE">FREE</option>
          <option value="PRO">PRO</option>
          <option value="VIP">VIP</option>
        </select>
        <select
          value={cycleDraft}
          onChange={(e) => onCycleChange(e.target.value as BillingCycle)}
          className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none transition-colors focus:border-electric-300"
        >
          <option value="MONTHLY">Oylik</option>
          <option value="YEARLY">Yillik</option>
        </select>
      </div>
      <button
        onClick={onSave}
        disabled={updating}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-electric-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-electric-600 disabled:opacity-60"
      >
        {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Tarifni saqlash
      </button>
    </div>
  );
}

function PackageControl({
  client,
  draft,
  updating,
  onPatch,
  onSave,
}: {
  client: ApiClient;
  draft: PackageDraft;
  updating: boolean;
  onPatch: (patch: Partial<PackageDraft>) => void;
  onSave: () => void;
}) {
  return (
    <div className="min-w-72 space-y-2">
      <div className="rounded-xl border border-line bg-[#fafbff] px-3 py-2">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-slate-600">Bu oy AI javob</span>
          <span className="font-extrabold text-navy-900">
            {client.stats.aiMessagesThisMonth}
            {client.stats.messageMonthlyLimit !== null
              ? ` / ${client.stats.messageMonthlyLimit}`
              : " / cheksiz"}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          Qoldi: {client.stats.messageRemaining === null ? "cheksiz" : client.stats.messageRemaining}
          {client.stats.messagePackagePrice > 0 &&
            ` · ${formatMoney(client.stats.messagePackagePrice)} ${client.stats.messagePackageCurrency}`}
        </div>
      </div>
      <select
        value=""
        onChange={(e) => {
          const preset = messagePackagePresets[Number(e.target.value)];
          if (!preset) return;
          onPatch({
            messageMonthlyLimit: preset.limit === null ? "" : preset.limit.toString(),
            messagePackagePrice: preset.price.toString(),
            messagePackageCurrency: preset.currency,
            messagePackageNote: preset.label,
          });
        }}
        className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none transition-colors focus:border-electric-300"
      >
        <option value="">Paket preset tanlash</option>
        {messagePackagePresets.map((preset, index) => (
          <option key={preset.label} value={index}>
            {preset.label} · {preset.price ? `$${preset.price}` : "custom"}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-[1fr_1fr_76px] gap-2">
        <input
          value={draft.messageMonthlyLimit}
          onChange={(e) => onPatch({ messageMonthlyLimit: e.target.value.replace(/\D/g, "") })}
          placeholder="Limit"
          inputMode="numeric"
          className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none transition-colors focus:border-electric-300"
        />
        <input
          value={draft.messagePackagePrice}
          onChange={(e) => onPatch({ messagePackagePrice: e.target.value.replace(/\D/g, "") })}
          placeholder="Narx"
          inputMode="numeric"
          className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none transition-colors focus:border-electric-300"
        />
        <input
          value={draft.messagePackageCurrency}
          onChange={(e) => onPatch({ messagePackageCurrency: e.target.value.toUpperCase() })}
          placeholder="USD"
          className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none transition-colors focus:border-electric-300"
        />
      </div>
      <input
        value={draft.messagePackageNote}
        onChange={(e) => onPatch({ messagePackageNote: e.target.value })}
        placeholder="Izoh: 0-500 chat, maxsus kelishuv..."
        className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs outline-none transition-colors focus:border-electric-300"
      />
      <button
        onClick={onSave}
        disabled={updating}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-electric-200 bg-electric-50 px-3 py-2 text-xs font-bold text-electric-700 transition-colors hover:bg-electric-100 disabled:opacity-60"
      >
        {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Xabar paketini saqlash
      </button>
    </div>
  );
}
