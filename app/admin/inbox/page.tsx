"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Send,
  Bot,
  Headset,
  Phone,
  MoreHorizontal,
  Loader2,
  Inbox as InboxIcon,
  Wallet,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { Avatar, Badge } from "@/components/ui";
import { Instagram } from "@/components/brand-icons";

interface ApiMessage {
  id: string;
  role: "USER" | "AI" | "OPERATOR";
  source: "CUSTOMER" | "AI" | "AUTOMATION" | "COMMENT" | "OPERATOR" | null;
  content: string;
  createdAt: string;
}
interface ApiRequest {
  id: string;
  category: "LEAD" | "INTERESTED" | "COMPLAINT" | "SUGGESTION";
  phone: string | null;
}
interface ApiConversation {
  id: string;
  contactId: string;
  contactName: string | null;
  contactHandle: string | null;
  status: "ANSWERED" | "WAITING" | "NO_REPLY";
  lastMessageAt: string;
  channel: { type: string; handle: string | null };
  _count: { messages: number };
  messages: ApiMessage[];
  requests: ApiRequest[];
}

interface InboxMeta {
  total: number;
  channels: { all: number; instagram: number; telegram: number };
  statuses: { all: number; answered: number; waiting: number; noReply: number };
}

type ChannelFilter = "all" | "instagram" | "telegram";
type StatusFilter = "all" | "answered" | "waiting" | "no_reply";

const channelLabels: Record<string, string> = {
  TELEGRAM_BOT: "Telegram-bot",
  TELEGRAM_PERSONAL: "Telegram",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
};

const categoryLabels: Record<string, string> = {
  LEAD: "Lead",
  INTERESTED: "Qiziqish bildirgan",
  COMPLAINT: "Shikoyat",
  SUGGESTION: "Taklif",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

  if (diffDays === 0) return formatTime(iso);
  if (diffDays === 1) return "Kecha";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} k`;
  return date.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" });
}

function statusLabel(status: ApiConversation["status"]) {
  if (status === "WAITING") return "Kutmoqda";
  if (status === "NO_REPLY") return "Javobsiz";
  return "Javob berildi";
}

function isTelegramChannel(type: string) {
  return type === "TELEGRAM_BOT" || type === "TELEGRAM_PERSONAL";
}

export default function InboxPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [meta, setMeta] = useState<InboxMeta | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"ai" | "operator">("ai");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ApiMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [inboxError, setInboxError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDesc, setPayDesc] = useState("");
  const [payLinks, setPayLinks] = useState<{ provider: string; checkoutUrl: string }[]>([]);
  const [payCreating, setPayCreating] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const resetConversationDraft = useCallback(() => {
    setPayAmount("");
    setPayDesc("");
    setPayLinks([]);
    setPayError(null);
    setChatError(null);
    setSendError(null);
  }, []);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("channel", channelFilter);
    params.set("status", statusFilter);
    if (query.trim()) params.set("q", query.trim());

    try {
      const res = await fetch(`/api/inbox?${params.toString()}`, { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Inbox yuklanmadi");
      const list: ApiConversation[] = data.conversations ?? [];
      setConversations(list);
      setMeta(data.meta ?? null);
      setInboxError(null);
      const nextSelectedId =
        selectedId && list.some((conversation) => conversation.id === selectedId)
          ? selectedId
          : list[0]?.id ?? null;
      if (nextSelectedId !== selectedId) {
        resetConversationDraft();
        setSelectedId(nextSelectedId);
      }
    } catch (error) {
      setInboxError(error instanceof Error ? error.message : "Inbox yuklanmadi");
    } finally {
      setLoading(false);
    }
  }, [channelFilter, query, resetConversationDraft, router, selectedId, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      void load();
    }, query.trim() ? 250 : 0);
    const interval = setInterval(() => void load(), 4000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [load, query]);

  useEffect(() => {
    if (!selectedId) return;

    let disposed = false;
    async function refreshMessages(initial = false) {
      if (initial) {
        stickToBottomRef.current = true;
        setChatLoading(true);
        setChatMessages([]);
        setHasOlder(false);
      }
      try {
        const res = await fetch(`/api/inbox/${selectedId}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Xabarlar yuklanmadi");
        if (disposed) return;
        setChatMessages((current) => {
          if (initial) return data.messages ?? [];
          const merged = new Map(current.map((message) => [message.id, message]));
          for (const message of data.messages ?? []) merged.set(message.id, message);
          return [...merged.values()].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
              a.id.localeCompare(b.id),
          );
        });
        if (initial) setHasOlder(Boolean(data.hasMore));
        setChatError(null);
      } catch (error) {
        if (!disposed) {
          setChatError(error instanceof Error ? error.message : "Xabarlar yuklanmadi");
        }
      } finally {
        if (!disposed && initial) setChatLoading(false);
      }
    }

    void refreshMessages(true);
    const interval = setInterval(() => void refreshMessages(false), 4000);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [selectedId]);

  const latestMessageId = chatMessages.at(-1)?.id;

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container || !stickToBottomRef.current) return;
    const frame = requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [latestMessageId, selectedId]);

  async function loadOlderMessages() {
    if (!selectedId || !chatMessages[0] || chatLoading) return;
    const container = chatScrollRef.current;
    const previousHeight = container?.scrollHeight ?? 0;
    const previousTop = container?.scrollTop ?? 0;
    setChatLoading(true);
    try {
      const res = await fetch(
        `/api/inbox/${selectedId}?before=${encodeURIComponent(chatMessages[0].id)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Eski xabarlar yuklanmadi");
      setChatMessages((current) => {
        const merged = new Map(
          [...(data.messages ?? []), ...current].map((message: ApiMessage) => [
            message.id,
            message,
          ]),
        );
        return [...merged.values()].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
            a.id.localeCompare(b.id),
        );
      });
      setHasOlder(Boolean(data.hasMore));
      requestAnimationFrame(() => {
        if (!container) return;
        container.scrollTop = previousTop + container.scrollHeight - previousHeight;
      });
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Eski xabarlar yuklanmadi");
    } finally {
      setChatLoading(false);
    }
  }

  function selectConversation(id: string) {
    if (id === selectedId) return;
    resetConversationDraft();
    stickToBottomRef.current = true;
    setSelectedId(id);
  }

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const counts = meta ?? {
    total: conversations.length,
    channels: {
      all: conversations.length,
      instagram: conversations.filter((c) => c.channel.type === "INSTAGRAM").length,
      telegram: conversations.filter((c) => isTelegramChannel(c.channel.type)).length,
    },
    statuses: {
      all: conversations.length,
      answered: conversations.filter((c) => c.status === "ANSWERED").length,
      waiting: conversations.filter((c) => c.status === "WAITING").length,
      noReply: conversations.filter((c) => c.status === "NO_REPLY").length,
    },
  };

  async function sendOperatorMessage() {
    if (!selected || !input.trim() || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/inbox/${selected.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim() }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "Xabar yuborilmadi");
      setInput("");
      if (data.message) {
        setChatMessages((current) =>
          [...current.filter((message) => message.id !== data.message.id), data.message].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
              a.id.localeCompare(b.id),
          ),
        );
      }
      await load();
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Xabar yuborilmadi");
    } finally {
      setSending(false);
    }
  }

  async function createPaymentLink() {
    const amount = Number(payAmount);
    if (!selected || !amount || amount <= 0 || payCreating) return;
    setPayCreating(true);
    setPayError(null);
    setPayLinks([]);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          description: payDesc.trim() || undefined,
          conversationId: selected.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error ?? "Xatolik yuz berdi");
        return;
      }
      setPayLinks(data.payments ?? []);
    } catch {
      setPayError("Serverga ulanib bo'lmadi");
    } finally {
      setPayCreating(false);
    }
  }

  function copyLink(url: string, idx: number) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  }

  if (loading && !meta) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-190px)] text-slate-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
      </div>
    );
  }

  if (counts.total === 0 && conversations.length === 0 && !query.trim()) {
    return (
      <div className="rounded-2xl bg-white border border-line border-dashed flex flex-col items-center justify-center h-[calc(100vh-190px)] text-center px-6">
        <span className="w-14 h-14 rounded-2xl bg-[#f4f7ff] flex items-center justify-center mb-4">
          <InboxIcon className="w-6 h-6 text-slate-300" />
        </span>
        <div className="text-lg font-bold">Hali suhbatlar yo&apos;q</div>
        <p className="text-sm text-slate-400 mt-1.5 max-w-sm">
          Kanal ulanib, mijoz xabar yozishi bilan bu yerda ko&apos;rinadi.
        </p>
      </div>
    );
  }

  return (
    <>
      {inboxError && (
        <div role="alert" className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{inboxError}</span>
          <button onClick={load} className="font-semibold underline">Qayta urinish</button>
        </div>
      )}
    <div className="grid gap-4 lg:grid-cols-[minmax(300px,360px)_1fr] xl:grid-cols-[minmax(300px,360px)_1fr_280px] lg:h-[calc(100vh-190px)]">
      {/* List */}
      <div className="rounded-2xl bg-white border border-line flex min-h-[320px] flex-col overflow-hidden lg:min-h-0">
        <div className="border-b border-line p-3.5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-line bg-white px-3.5 py-2.5 shadow-sm">
              <Search className="w-4 h-4 text-slate-300" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ism yoki xabar bo'yicha qidirish..."
                className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-300"
              />
            </div>
            <button
              onClick={load}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-white text-slate-400 transition-colors hover:border-electric-200 hover:text-electric-600"
              aria-label="Yangilash"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto thin-scroll pb-0.5 text-xs">
            {(
              [
                ["all", "Barcha kanallar", null],
                ["instagram", "Instagram", "instagram"],
                ["telegram", "Telegram", "telegram"],
              ] as [ChannelFilter, string, ChannelFilter | null][]
            ).map(([value, label, icon]) => (
              <button
                key={value}
                onClick={() => setChannelFilter(value)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 font-extrabold transition-colors ${
                  channelFilter === value
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                    : "border-line bg-white text-slate-500 hover:border-electric-200"
                }`}
              >
                {icon === "instagram" && <Instagram className="w-3.5 h-3.5 text-pink-500" />}
                {icon === "telegram" && <Send className="w-3.5 h-3.5 text-sky-500" />}
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto thin-scroll pb-0.5 text-xs">
            {(
              [
                ["all", "Hammasi"],
                ["waiting", "Kutmoqda"],
                ["no_reply", "Javobsiz"],
                ["answered", "Javob berildi"],
              ] as [StatusFilter, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 font-bold transition-colors ${
                  statusFilter === value
                    ? "border-electric-100 bg-electric-50 text-electric-700"
                    : "border-line bg-white text-slate-500 hover:border-electric-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[42vh] flex-1 overflow-y-auto thin-scroll p-2 lg:max-h-none">
          {conversations.length === 0 ? (
            <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-line px-5 text-center">
              <InboxIcon className="w-7 h-7 text-slate-300" />
              <div className="mt-3 text-sm font-bold text-navy-900">Dialog topilmadi</div>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Filter yoki qidiruvni o&apos;zgartiring. Yangi xabar kelsa shu yerda ko&apos;rinadi.
              </p>
            </div>
          ) : (
          conversations.map((c) => {
            const last = c.messages[c.messages.length - 1];
            const name = c.contactName ?? "Noma'lum";
            return (
              <button
                key={c.id}
                onClick={() => selectConversation(c.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                  selectedId === c.id
                    ? "bg-electric-50 border border-electric-200"
                    : "border border-transparent hover:bg-[#f4f7ff]"
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar name={name} />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-md bg-white border border-line flex items-center justify-center">
                    {c.channel.type === "INSTAGRAM" ? (
                      <Instagram className="w-2.5 h-2.5 text-pink-500" />
                    ) : (
                      <Send className="w-2.5 h-2.5 text-sky-500" />
                    )}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-[13px] font-extrabold text-navy-900">
                      {name}
                    </div>
                    {c.status !== "ANSWERED" && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        c.status === "WAITING"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-rose-50 text-rose-500"
                      }`}>
                        {statusLabel(c.status)}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-400">
                    {last?.source === "AUTOMATION"
                      ? "Avtomatizatsiya: "
                      : last?.role === "AI"
                        ? "AI: "
                        : last?.role === "OPERATOR"
                          ? "Operator: "
                          : ""}
                    {last?.content ?? ""}
                  </div>
                  <div className="mt-1 text-[10px] font-medium text-slate-300">
                    {channelLabels[c.channel.type] ?? c.channel.type}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-300">
                    {formatDay(c.lastMessageAt)}
                  </div>
                </div>
              </button>
            );
          })
          )}
        </div>
      </div>

      {/* Chat */}
      {selected && (
        <div className="rounded-2xl bg-white border border-line flex h-[calc(100dvh-120px)] min-h-[520px] max-h-[760px] flex-col overflow-hidden lg:h-auto lg:min-h-0 lg:max-h-none">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 border-b border-line sm:px-5">
            <Avatar name={selected.contactName ?? "?"} />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[14px]">
                {selected.contactName ?? "Noma'lum"}
              </div>
              <div className="text-[11px] text-slate-400">
                {channelLabels[selected.channel.type]} ·{" "}
                {selected.contactHandle ?? selected.contactId}
              </div>
            </div>
            <div className="order-3 flex w-full items-center bg-[#f4f7ff] rounded-xl p-1 sm:order-none sm:w-auto">
              <button
                onClick={() => setMode("ai")}
                className={`flex flex-1 items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors sm:flex-none ${
                  mode === "ai" ? "bg-electric-500 text-white" : "text-slate-500"
                }`}
              >
                <Bot className="w-3.5 h-3.5" /> AI
              </button>
              <button
                onClick={() => setMode("operator")}
                className={`flex flex-1 items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors sm:flex-none ${
                  mode === "operator"
                    ? "bg-navy-900 text-white"
                    : "text-slate-500"
                }`}
              >
                <Headset className="w-3.5 h-3.5" /> Operator
              </button>
            </div>
            <button className="w-9 h-9 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-300">
              <MoreHorizontal className="w-4.5 h-4.5" />
            </button>
          </div>

          <div
            ref={chatScrollRef}
            data-testid="inbox-message-list"
            onScroll={(event) => {
              const target = event.currentTarget;
              stickToBottomRef.current =
                target.scrollHeight - target.scrollTop - target.clientHeight < 80;
            }}
            className="flex-1 overflow-y-auto thin-scroll px-4 py-4 space-y-3.5 bg-[#fafbff] sm:px-5 sm:py-5"
          >
            {hasOlder && (
              <div className="flex justify-center">
                <button
                  onClick={loadOlderMessages}
                  disabled={chatLoading}
                  className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-500 disabled:opacity-50"
                >
                  {chatLoading ? "Yuklanmoqda..." : "Oldingi xabarlar"}
                </button>
              </div>
            )}
            {chatLoading && chatMessages.length === 0 && (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Xabarlar yuklanmoqda...
              </div>
            )}
            {chatMessages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "USER" ? "" : "justify-end"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap sm:max-w-[70%] ${
                    m.role === "USER"
                      ? "bg-white border border-line rounded-bl-md"
                      : "electric-gradient text-white rounded-br-md"
                  }`}
                >
                  {m.role === "AI" && (
                    <div className="flex items-center gap-1 text-[10px] text-electric-100 font-semibold mb-1">
                      <Bot className="w-3 h-3" />{" "}
                      {m.source === "AUTOMATION" ? "Avtomatizatsiya" : "AI agent"}
                    </div>
                  )}
                  {m.role === "OPERATOR" && (
                    <div className="flex items-center gap-1 text-[10px] text-electric-100 font-semibold mb-1">
                      <Headset className="w-3 h-3" /> Operator
                    </div>
                  )}
                  {m.content}
                  <div
                    className={`text-[10px] mt-1 ${
                      m.role === "USER" ? "text-slate-300" : "text-electric-100"
                    }`}
                  >
                    {formatTime(m.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(chatError || sendError) && (
            <div role="alert" className="border-t border-red-100 bg-red-50 px-5 py-2 text-xs font-medium text-red-600">
              {chatError ?? sendError}
            </div>
          )}
          <div className="px-4 py-3.5 border-t border-line flex items-center gap-2.5 sm:px-5 sm:py-4 sm:gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendOperatorMessage()}
              placeholder={
                mode === "ai"
                  ? "AI avtomatik javob bermoqda — aralashish uchun Operator rejimiga o'ting"
                  : "Xabar yozing..."
              }
              disabled={mode === "ai" || sending}
              className="flex-1 bg-[#f4f7ff] rounded-xl px-4 py-3 text-sm outline-none placeholder:text-slate-300 disabled:opacity-70"
            />
            <button
              onClick={sendOperatorMessage}
              disabled={mode === "ai" || sending}
              className="w-10 h-10 rounded-xl electric-gradient flex items-center justify-center text-white shrink-0 disabled:opacity-60"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Context panel */}
      {selected && (
        <div className="hidden xl:flex flex-col gap-4">
          <div className="rounded-2xl bg-white border border-line p-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-3">
              Mijoz haqida
            </div>
            <div className="flex items-center gap-3">
              <Avatar name={selected.contactName ?? "?"} />
              <div>
                <div className="text-sm font-bold">
                  {selected.contactName ?? "Noma'lum"}
                </div>
                <div className="text-[11px] text-slate-400">
                  {selected.contactHandle ?? selected.contactId}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Kanal</span>
                <span className="font-semibold">
                  {channelLabels[selected.channel.type]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Holat</span>
                <Badge
                  color={selected.status === "ANSWERED" ? "green" : "yellow"}
                  dot
                >
                  {selected.status === "ANSWERED"
                    ? "Javob berildi"
                    : "Kutmoqda"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Xabarlar</span>
                <span className="font-semibold">
                  {selected._count.messages}
                </span>
              </div>
            </div>
            {selected.requests.length > 0 && (
              <div className="mt-4 space-y-2">
                {selected.requests.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl bg-electric-50 border border-electric-100 p-3"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-electric-700">
                      <Phone className="w-3 h-3" />
                      {categoryLabels[r.category]} sifatida saqlangan
                    </div>
                    {r.phone && (
                      <div className="text-[12px] text-electric-600 mt-1 font-medium">
                        {r.phone}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-line p-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> To&apos;lov havolasi
            </div>
            <div className="space-y-2">
              <input
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                type="number"
                placeholder="Summa (so'm)"
                className="w-full bg-[#f4f7ff] rounded-xl px-3.5 py-2.5 text-[13px] outline-none placeholder:text-slate-300"
              />
              <input
                value={payDesc}
                onChange={(e) => setPayDesc(e.target.value)}
                placeholder="Izoh (ixtiyoriy)"
                className="w-full bg-[#f4f7ff] rounded-xl px-3.5 py-2.5 text-[13px] outline-none placeholder:text-slate-300"
              />
              <button
                onClick={createPaymentLink}
                disabled={payCreating || !payAmount}
                className="w-full flex items-center justify-center gap-1.5 bg-electric-500 hover:bg-electric-600 text-white text-[13px] font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {payCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Havola yaratish"
                )}
              </button>
              {payError && (
                <p className="text-[11px] text-red-500 font-medium">{payError}</p>
              )}
              {payLinks.map((p, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-[#f4f7ff] px-3 py-2.5 flex items-center gap-2"
                >
                  <span className="text-[11px] font-bold text-slate-500 shrink-0">
                    {p.provider === "PAYME" ? "Payme" : "Click"}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate flex-1">
                    {p.checkoutUrl}
                  </span>
                  <button
                    onClick={() => copyLink(p.checkoutUrl, idx)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-electric-600 hover:bg-electric-50 shrink-0"
                  >
                    {copiedIdx === idx ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
