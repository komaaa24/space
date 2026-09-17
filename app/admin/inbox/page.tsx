"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Avatar, Badge } from "@/components/ui";
import { Instagram } from "@/components/brand-icons";

interface ApiMessage {
  id: string;
  role: "USER" | "AI" | "OPERATOR";
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
  messages: ApiMessage[];
  requests: ApiRequest[];
}

type Filter = "all" | "waiting" | "no_reply";

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

export default function InboxPage() {
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [mode, setMode] = useState<"ai" | "operator">("ai");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState("");
  const [payDesc, setPayDesc] = useState("");
  const [payLinks, setPayLinks] = useState<{ provider: string; checkoutUrl: string }[]>([]);
  const [payCreating, setPayCreating] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/inbox");
    const data = await res.json();
    const list: ApiConversation[] = data.conversations ?? [];
    setConversations(list);
    setLoading(false);
    setSelectedId((cur) => cur ?? list[0]?.id ?? null);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPayAmount("");
    setPayDesc("");
    setPayLinks([]);
    setPayError(null);
  }, [selectedId]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const filtered = conversations.filter((c) =>
    filter === "all"
      ? true
      : filter === "waiting"
        ? c.status === "WAITING"
        : c.status === "NO_REPLY",
  );
  const waiting = conversations.filter((c) => c.status === "WAITING").length;
  const noReply = conversations.filter((c) => c.status === "NO_REPLY").length;

  async function sendOperatorMessage() {
    if (!selected || !input.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`/api/inbox/${selected.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.trim() }),
      });
      setInput("");
      await load();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-190px)] text-slate-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-line border-dashed flex flex-col items-center justify-center h-[calc(100vh-190px)] text-center px-6">
        <span className="w-14 h-14 rounded-2xl bg-[#f4f7ff] flex items-center justify-center mb-4">
          <InboxIcon className="w-6 h-6 text-slate-300" />
        </span>
        <div className="text-lg font-bold">Hali suhbatlar yo'q</div>
        <p className="text-sm text-slate-400 mt-1.5 max-w-sm">
          Kanal ulanib, mijoz xabar yozishi bilan bu yerda ko'rinadi.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(300px,360px)_1fr] xl:grid-cols-[minmax(300px,360px)_1fr_280px] gap-5 h-[calc(100vh-190px)]">
      {/* List */}
      <div className="rounded-2xl bg-white border border-line flex flex-col overflow-hidden">
        <div className="p-4 space-y-3 border-b border-line">
          <div className="flex items-center gap-2 bg-[#f4f7ff] rounded-xl px-3.5 py-2.5">
            <Search className="w-4 h-4 text-slate-300" />
            <input
              placeholder="Qidirish..."
              className="bg-transparent outline-none text-[13px] flex-1 placeholder:text-slate-300"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {(
              [
                ["all", `Barchasi ${conversations.length}`],
                ["waiting", `Kutmoqda ${waiting}`],
                ["no_reply", `Javobsiz ${noReply}`],
              ] as [Filter, string][]
            ).map(([f, label]) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? "bg-electric-500 text-white"
                    : "bg-[#f4f7ff] text-slate-500 hover:bg-electric-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto thin-scroll p-2">
          {filtered.map((c) => {
            const last = c.messages[c.messages.length - 1];
            const name = c.contactName ?? "Noma'lum";
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
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
                  <div className="text-[13px] font-semibold truncate">
                    {name}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {last?.content ?? ""}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-300">
                    {formatTime(c.lastMessageAt)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat */}
      {selected && (
        <div className="rounded-2xl bg-white border border-line flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-line">
            <Avatar name={selected.contactName ?? "?"} />
            <div className="flex-1">
              <div className="font-bold text-[14px]">
                {selected.contactName ?? "Noma'lum"}
              </div>
              <div className="text-[11px] text-slate-400">
                {channelLabels[selected.channel.type]} ·{" "}
                {selected.contactHandle ?? selected.contactId}
              </div>
            </div>
            <div className="flex items-center bg-[#f4f7ff] rounded-xl p-1">
              <button
                onClick={() => setMode("ai")}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  mode === "ai" ? "bg-electric-500 text-white" : "text-slate-500"
                }`}
              >
                <Bot className="w-3.5 h-3.5" /> AI
              </button>
              <button
                onClick={() => setMode("operator")}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
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

          <div className="flex-1 overflow-y-auto thin-scroll px-5 py-5 space-y-3.5 bg-[#fafbff]">
            {selected.messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "USER" ? "" : "justify-end"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    m.role === "USER"
                      ? "bg-white border border-line rounded-bl-md"
                      : "electric-gradient text-white rounded-br-md"
                  }`}
                >
                  {m.role === "AI" && (
                    <div className="flex items-center gap-1 text-[10px] text-electric-100 font-semibold mb-1">
                      <Bot className="w-3 h-3" /> AI agent
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

          <div className="px-5 py-4 border-t border-line flex items-center gap-3">
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
                  {selected.messages.length}
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
              <Wallet className="w-3.5 h-3.5" /> To'lov havolasi
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
  );
}
