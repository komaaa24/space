"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Briefcase,
  Star,
  ShieldAlert,
  Lightbulb,
  Phone,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { PageTitle } from "@/components/ui";

type RequestCategory = "LEAD" | "INTERESTED" | "COMPLAINT" | "SUGGESTION";
type RequestStatus = "NEW" | "IN_PROGRESS" | "DONE";
type StatusFilter = RequestStatus | "ALL";
type ChannelFilter = "ALL" | "INSTAGRAM" | "TELEGRAM_BOT" | "TELEGRAM_PERSONAL" | "YOUTUBE";
type DateRange = "7" | "30" | "ALL" | "CUSTOM";

interface RequestDetail {
  id: string;
  category: RequestCategory;
  name: string;
  phone: string | null;
  text: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  isDuplicate: boolean;
  conversation: {
    id: string;
    contactId: string;
    contactName: string | null;
    contactHandle: string | null;
    channel: { type: string; handle: string | null };
  } | null;
}

interface PersonGroup {
  id: string;
  conversationId: string | null;
  name: string;
  contactHandle: string | null;
  channel: { type: string; handle: string | null } | null;
  phones: string[];
  categories: RequestCategory[];
  status: RequestStatus;
  latestAt: string;
  requestCount: number;
  requests: RequestDetail[];
}

interface RequestSummary {
  total: number;
  leads: number;
  interested: number;
  complaints: number;
  suggestions: number;
  withPhone: number;
  statuses: { new: number; inProgress: number; done: number };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const categoryMeta: Record<
  RequestCategory,
  { label: string; icon: typeof Briefcase; active: string; iconBg: string }
> = {
  LEAD: {
    label: "Leadlar",
    icon: Briefcase,
    active: "from-electric-500 to-blue-600",
    iconBg: "bg-emerald-50 text-emerald-600",
  },
  INTERESTED: {
    label: "Qiziqish bildirganlar",
    icon: Star,
    active: "from-electric-500 to-blue-600",
    iconBg: "bg-blue-50 text-blue-600",
  },
  COMPLAINT: {
    label: "Shikoyatlar",
    icon: ShieldAlert,
    active: "from-electric-500 to-blue-600",
    iconBg: "bg-rose-50 text-rose-600",
  },
  SUGGESTION: {
    label: "Takliflar",
    icon: Lightbulb,
    active: "from-electric-500 to-blue-600",
    iconBg: "bg-amber-50 text-amber-600",
  },
};

const channelLabels: Record<string, string> = {
  TELEGRAM_BOT: "Telegram-bot",
  TELEGRAM_PERSONAL: "Telegram",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
};

const statusLabels: Record<RequestStatus, string> = {
  NEW: "Yangi",
  IN_PROGRESS: "Jarayonda",
  DONE: "Yakunlangan",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function getRangeDates(range: DateRange) {
  if (range === "ALL" || range === "CUSTOM") return { from: "", to: "" };
  const from = new Date();
  from.setDate(from.getDate() - (range === "7" ? 6 : 29));
  return { from: toDateInputValue(from), to: toDateInputValue(new Date()) };
}

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

export default function RequestsPage() {
  const router = useRouter();
  const [people, setPeople] = useState<PersonGroup[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [summary, setSummary] = useState<RequestSummary | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [category, setCategory] = useState<RequestCategory | null>("LEAD");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [channel, setChannel] = useState<ChannelFilter>("ALL");
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [from, setFrom] = useState(() => getRangeDates("30").from);
  const [to, setTo] = useState(() => getRangeDates("30").to);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "25",
    });
    if (category) params.set("category", category);
    if (status !== "ALL") params.set("status", status);
    if (channel !== "ALL") params.set("channel", channel);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (query.trim()) params.set("q", query.trim());

    try {
      setRefreshing(true);
      const response = await fetch("/api/requests?" + params.toString(), {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok) throw new Error(data.error || "Arizalar yuklanmadi");
      setPeople(data.people ?? []);
      setSummary(data.summary ?? null);
      setPagination(data.pagination ?? null);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Arizalar yuklanmadi");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, channel, from, page, query, router, status, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), query.trim() ? 250 : 0);
    const interval = window.setInterval(() => void load(), 10000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [load, query]);

  function selectCategory(value: RequestCategory | null) {
    setCategory(value);
    setPage(1);
  }

  function selectDateRange(value: DateRange) {
    setDateRange(value);
    setPage(1);
    if (value !== "CUSTOM") {
      const dates = getRangeDates(value);
      setFrom(dates.from);
      setTo(dates.to);
    }
  }

  function handleFromChange(value: string) {
    setDateRange("CUSTOM");
    setFrom(value);
    setPage(1);
  }

  function handleToChange(value: string) {
    setDateRange("CUSTOM");
    setTo(value);
    setPage(1);
  }

  async function updateStatus(id: string, nextStatus: RequestStatus) {
    const request = people.flatMap((person) => person.requests).find((item) => item.id === id);
    if (!request || request.status === nextStatus) return;

    setUpdatingId(id);
    try {
      const response = await fetch("/api/requests/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Holat saqlanmadi");
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Holat saqlanmadi");
    } finally {
      setUpdatingId(null);
    }
  }

  const cards = useMemo(
    () => [
      { category: "LEAD" as const, count: summary?.leads ?? 0 },
      { category: "INTERESTED" as const, count: summary?.interested ?? 0 },
      { category: "COMPLAINT" as const, count: summary?.complaints ?? 0 },
      { category: "SUGGESTION" as const, count: summary?.suggestions ?? 0 },
    ],
    [summary],
  );

  return (
    <div className="space-y-5">
      <PageTitle
        title="Arizalar"
        subtitle="AI saralagan leadlar, qiziqishlar, shikoyatlar va takliflarni bir joyda boshqaring"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ category: cardCategory, count }) => {
          const meta = categoryMeta[cardCategory];
          const Icon = meta.icon;
          const active = category === cardCategory;
          return (
            <button
              key={cardCategory}
              type="button"
              onClick={() => selectCategory(cardCategory)}
              className={
                "rounded-2xl border p-4 text-left transition-all sm:p-5 " +
                (active
                  ? "border-transparent bg-gradient-to-br " + meta.active + " text-white shadow-[0_8px_24px_rgba(15,94,255,0.18)]"
                  : "border-line bg-white hover:border-electric-200")
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className={"flex h-9 w-9 items-center justify-center rounded-xl " + (active ? "bg-white/15 text-white" : meta.iconBg)}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className={"text-2xl font-extrabold " + (active ? "text-white" : "text-slate-900")}>
                  {count}
                </span>
              </div>
              <div className={"mt-3 text-xs font-semibold sm:text-[13px] " + (active ? "text-white/80" : "text-slate-400")}>
                {meta.label}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => selectCategory(null)}
          className={"rounded-full border px-3.5 py-2 text-xs font-bold transition " + (category === null ? "border-electric-200 bg-electric-50 text-electric-700" : "border-line bg-white text-slate-500 hover:border-electric-200")}
        >
          Barcha arizalar <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5">{summary?.total ?? 0}</span>
        </button>
        {(["ALL", "NEW", "IN_PROGRESS", "DONE"] as StatusFilter[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setStatus(value);
              setPage(1);
            }}
            className={"rounded-full border px-3.5 py-2 text-xs font-bold transition " + (status === value ? "border-electric-200 bg-electric-50 text-electric-700" : "border-line bg-white text-slate-500 hover:border-electric-200")}
          >
            {value === "ALL" ? "Barcha holatlar" : statusLabels[value]}
            {value !== "ALL" && (
              <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5">
                {value === "NEW" ? summary?.statuses.new ?? 0 : value === "IN_PROGRESS" ? summary?.statuses.inProgress ?? 0 : summary?.statuses.done ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-white">
        <div className="flex flex-col gap-3 border-b border-line p-4 xl:flex-row xl:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-[#f4f7ff] px-3.5 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-slate-300" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Ism, telefon yoki matn bo'yicha qidirish..."
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-300"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={channel}
              onChange={(event) => {
                setChannel(event.target.value as ChannelFilter);
                setPage(1);
              }}
              className="rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 outline-none"
            >
              <option value="ALL">Barcha kanallar</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="TELEGRAM_BOT">Telegram-bot</option>
              <option value="TELEGRAM_PERSONAL">Telegram</option>
            </select>
            <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1">
              {(["7", "30", "ALL"] as DateRange[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => selectDateRange(value)}
                  className={"rounded-lg px-2.5 py-1.5 text-xs font-bold " + (dateRange === value ? "bg-electric-50 text-electric-700" : "text-slate-500")}
                >
                  {value === "ALL" ? "Barchasi" : value + " kun"}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-2.5 py-2 text-xs text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" />
              <input type="date" value={from} onChange={(event) => handleFromChange(event.target.value)} className="w-[108px] bg-transparent outline-none" />
              <span>—</span>
              <input type="date" value={to} onChange={(event) => handleToChange(event.target.value)} className="w-[108px] bg-transparent outline-none" />
            </label>
            <button
              type="button"
              onClick={() => void load()}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-slate-400 transition hover:border-electric-200 hover:text-electric-600"
              aria-label="Arizalarni yangilash"
            >
              <RefreshCw className={"h-4 w-4 " + (refreshing ? "animate-spin" : "")} />
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-center justify-between border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} className="font-bold">Yopish</button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 text-xs text-slate-400 sm:px-5">
          <span>{pagination?.total ?? 0} ta kontakt topildi</span>
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-electric-500" /> {summary?.withPhone ?? 0} ta telefonli
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Arizalar yuklanmoqda...
          </div>
        ) : people.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
              <MessageCircle className="h-6 w-6 text-slate-300" />
            </div>
            <p className="mt-4 text-sm font-bold text-slate-700">Ariza topilmadi</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
              Filterlarni o&apos;zgartiring yoki yangi mijoz xabari kelishini kuting.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {people.map((person) => {
              const primaryCategory = person.categories[0] ?? "LEAD";
              const primaryMeta = categoryMeta[primaryCategory];
              const channelName = channelLabels[person.channel?.type ?? ""] ?? "Kanal";
              const statusClass =
                person.status === "DONE"
                  ? "bg-emerald-50 text-emerald-700"
                  : person.status === "IN_PROGRESS"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-blue-50 text-blue-700";

              return (
                <div key={person.id} className="transition hover:bg-[#fafbff]">
                  <button
                    type="button"
                    onClick={() => setExpandedId((value) => (value === person.id ? null : person.id))}
                    className="flex w-full flex-col gap-3 px-4 py-4 text-left sm:flex-row sm:items-start sm:px-5"
                    aria-expanded={expandedId === person.id}
                  >
                    <div
                      className={
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white " +
                        (primaryMeta.iconBg.includes("rose")
                          ? "bg-rose-500"
                          : primaryMeta.iconBg.includes("amber")
                            ? "bg-amber-500"
                            : primaryMeta.iconBg.includes("blue")
                              ? "bg-blue-500"
                              : "bg-emerald-500")
                      }
                    >
                      {initials(person.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-bold text-navy-900">{person.name}</span>
                        <span className="text-[11px] text-slate-400">{channelName} orqali</span>
                        {person.categories.map((item) => (
                          <span
                            key={item}
                            className={
                              "rounded-full px-2 py-0.5 text-[10px] font-bold " +
                              (item === "LEAD"
                                ? "bg-emerald-50 text-emerald-700"
                                : item === "COMPLAINT"
                                  ? "bg-rose-50 text-rose-600"
                                  : item === "SUGGESTION"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-blue-50 text-blue-700")
                            }
                          >
                            {categoryMeta[item].label}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-slate-500">
                        {person.requests[0]?.text}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        {person.phones[0] && (
                          <span className="flex items-center gap-1.5 font-bold text-electric-600">
                            <Phone className="h-3 w-3" /> {person.phones[0]}
                          </span>
                        )}
                        {person.contactHandle && <span>{person.contactHandle}</span>}
                        <span>{person.requestCount} ta yozuv</span>
                        <span>{formatDate(person.latestAt)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-3 sm:pt-1">
                      <span className={"rounded-full px-2.5 py-1 text-[11px] font-bold " + statusClass}>
                        {statusLabels[person.status]}
                      </span>
                      <ChevronDown
                        className={"h-4 w-4 text-slate-400 transition-transform " + (expandedId === person.id ? "rotate-180" : "")}
                      />
                    </div>
                  </button>

                  {expandedId === person.id && (
                    <div className="border-t border-line bg-slate-50/70 px-4 py-4 sm:px-5">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                            Barcha lead yozuvlari
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Shu kontaktga tegishli {person.requestCount} ta yozuv ko&apos;rsatilmoqda.
                          </p>
                        </div>
                        {person.phones.length > 1 && (
                          <span className="text-xs text-slate-400">{person.phones.length} ta telefon</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {person.requests.map((request) => {
                          const detailMeta = categoryMeta[request.category];
                          return (
                            <div
                              key={request.id}
                              className="flex flex-col gap-3 rounded-xl border border-line bg-white px-3.5 py-3 sm:flex-row sm:items-start sm:justify-between"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={
                                      "rounded-full px-2 py-0.5 text-[10px] font-bold " +
                                      (request.category === "LEAD"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : request.category === "COMPLAINT"
                                          ? "bg-rose-50 text-rose-600"
                                          : request.category === "SUGGESTION"
                                            ? "bg-amber-50 text-amber-700"
                                            : "bg-blue-50 text-blue-700")
                                    }
                                  >
                                    {detailMeta.label}
                                  </span>
                                  <span className="text-[11px] text-slate-400">{formatDate(request.createdAt)}</span>
                                  {request.isDuplicate && (
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                      Tarix
                                    </span>
                                  )}
                                </div>
                                <p className="mt-2 text-[13px] leading-5 text-slate-600">{request.text}</p>
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                                  {request.phone && (
                                    <a href={"tel:" + request.phone} className="flex items-center gap-1 font-bold text-electric-600 hover:underline">
                                      <Phone className="h-3 w-3" /> {request.phone}
                                    </a>
                                  )}
                                  <span>{statusLabels[request.status]}</span>
                                </div>
                              </div>
                              <select
                                value={request.status}
                                disabled={request.isDuplicate || updatingId === request.id}
                                onChange={(event) => void updateStatus(request.id, event.target.value as RequestStatus)}
                                className="rounded-lg border border-line bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 outline-none disabled:opacity-50"
                                aria-label={person.name + " yozuvi holati"}
                              >
                                <option value="NEW">Yangi</option>
                                <option value="IN_PROGRESS">Jarayonda</option>
                                <option value="DONE">Yakunlangan</option>
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 sm:px-5">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-xs font-bold text-slate-500 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Oldingi
            </button>
            <span className="text-xs font-semibold text-slate-400">{pagination.page} / {pagination.totalPages}</span>
            <button
              type="button"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-xs font-bold text-slate-500 disabled:opacity-40"
            >
              Keyingi <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
