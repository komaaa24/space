"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Send, Bot, Plus, X, Loader2, User, Trash2, ShieldCheck } from "lucide-react";
import { Badge, PageTitle, PrimaryButton, inputCls } from "@/components/ui";
import { Instagram, Youtube } from "@/components/brand-icons";
import { SupportLink } from "@/components/support-link";

interface DbChannel {
  id: string;
  type: string;
  status: string;
  handle: string | null;
  aiPaused: boolean;
  createdAt: string;
}

const comingSoonCards = [
  {
    icon: Youtube,
    color: "#FF0000",
    title: "YouTube",
    desc: "Video kommentlariga avtomatik javob",
  },
];

type IconComponent = (props: { className?: string; style?: CSSProperties }) => ReactNode;

const channelMeta: Record<string, { label: string; color: string; Icon: IconComponent }> = {
  TELEGRAM_BOT: { label: "Telegram-bot", color: "#229ED9", Icon: Bot },
  TELEGRAM_PERSONAL: { label: "Telegram (shaxsiy)", color: "#0f5eff", Icon: User },
  INSTAGRAM: { label: "Instagram", color: "#E1306C", Icon: Instagram },
};

export default function ChannelsPage() {
  const [channels, setChannels] = useState<DbChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [token, setToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrLoginId, setQrLoginId] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<
    "loading" | "pending" | "password_required" | "success" | "error"
  >("loading");
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrPasswordHint, setQrPasswordHint] = useState<string | undefined>();
  const [qrPassword, setQrPassword] = useState("");
  const [qrSubmitting, setQrSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [igError, setIgError] = useState<string | null>(null);
  const [showInstagramNotice, setShowInstagramNotice] = useState(false);

  async function loadChannels() {
    setLoading(true);
    const res = await fetch("/api/channels");
    const data = await res.json();
    setChannels(data.channels ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadChannels();
    const params = new URLSearchParams(window.location.search);
    const err = params.get("ig_error");
    if (err) {
      setIgError(err);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function connect() {
    if (!token.trim()) return;
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/channels/telegram-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Xatolik yuz berdi");
        return;
      }
      setShowModal(false);
      setToken("");
      await loadChannels();
    } catch {
      setError("Serverga ulanib bo'lmadi");
    } finally {
      setConnecting(false);
    }
  }

  async function togglePause(c: DbChannel) {
    await fetch(`/api/channels/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiPaused: !c.aiPaused }),
    });
    await loadChannels();
  }

  async function disconnectChannel(id: string, label: string) {
    if (!window.confirm(`${label} kanalini uzmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`)) {
      return;
    }
    setDisconnectingId(id);
    try {
      await fetch(`/api/channels/${id}`, { method: "DELETE" });
      await loadChannels();
    } finally {
      setDisconnectingId(null);
    }
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function openQrModal() {
    setShowQrModal(true);
    setQrStatus("loading");
    setQrError(null);
    setQrImage(null);
    setQrPasswordHint(undefined);
    setQrPassword("");

    try {
      const res = await fetch("/api/channels/telegram-personal/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setQrStatus("error");
        setQrError(data.error ?? "Xatolik yuz berdi");
        return;
      }
      setQrLoginId(data.loginId);
      setQrImage(data.qrDataUrl ?? null);
      setQrStatus(data.status);

      pollRef.current = setInterval(async () => {
        const sres = await fetch(`/api/channels/telegram-personal/status?loginId=${data.loginId}`);
        const sdata = await sres.json();
        if (!sres.ok) return;
        setQrImage(sdata.qrDataUrl ?? null);
        setQrStatus(sdata.status);
        setQrPasswordHint(sdata.passwordHint);
        if (sdata.status === "error") {
          setQrError(sdata.error ?? "Xatolik yuz berdi");
          stopPolling();
        } else if (sdata.status === "success") {
          stopPolling();
          await loadChannels();
          setTimeout(() => closeQrModal(), 1200);
        }
      }, 2000);
    } catch {
      setQrStatus("error");
      setQrError("Serverga ulanib bo'lmadi");
    }
  }

  function closeQrModal() {
    stopPolling();
    if (qrLoginId && qrStatus !== "success") {
      fetch("/api/channels/telegram-personal/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId: qrLoginId }),
      }).catch(() => {});
    }
    setShowQrModal(false);
    setQrLoginId(null);
  }

  async function submitQrPassword() {
    if (!qrLoginId || !qrPassword.trim()) return;
    setQrSubmitting(true);
    try {
      await fetch("/api/channels/telegram-personal/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId: qrLoginId, password: qrPassword }),
      });
      setQrPasswordHint(undefined);
      setQrStatus("pending");
    } finally {
      setQrSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Kanallar"
        subtitle="Ijtimoiy tarmoqlarni ulang — agent barchasida bir vaqtda ishlaydi"
      />

      {igError && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-3.5 flex items-center justify-between gap-3">
          <p className="text-sm text-red-600 font-medium">{igError}</p>
          <button
            onClick={() => setIgError(null)}
            className="text-red-400 hover:text-red-600 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Connected */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-3">
          Ulangan — {channels.length}
        </div>
        {loading ? (
          <div className="text-sm text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
          </div>
        ) : channels.length === 0 ? (
          <div className="rounded-2xl bg-white border border-line border-dashed p-6 text-center text-sm text-slate-400">
            Hali hech qanday kanal ulanmagan
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {channels.map((c) => {
              const meta = channelMeta[c.type] ?? {
                label: c.type,
                color: "#94a3b8",
                Icon: Bot,
              };
              return (
              <div
                key={c.id}
                className="rounded-2xl bg-white border border-line p-5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: `${meta.color}12` }}
                  >
                    <meta.Icon className="w-5.5 h-5.5" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[15px]">{meta.label}</div>
                    <div className="text-xs text-slate-400">{c.handle}</div>
                  </div>
                  <Badge color="green" dot>
                    Onlayn
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-xl bg-[#f4f7ff] px-3 py-2.5">
                    <div className="text-[10px] text-slate-400">Holat</div>
                    <div className="text-[13px] font-bold mt-0.5 text-emerald-600">
                      OK
                    </div>
                  </div>
                  <button
                    onClick={() => togglePause(c)}
                    className={`rounded-xl px-3 py-2.5 text-left transition-colors ${
                      c.aiPaused
                        ? "bg-amber-50 ring-1 ring-amber-200"
                        : "bg-electric-50 ring-1 ring-electric-200"
                    }`}
                  >
                    <div className="text-[10px] text-slate-400">AI javoblar</div>
                    <div
                      className={`text-[13px] font-bold mt-0.5 ${
                        c.aiPaused ? "text-amber-600" : "text-electric-600"
                      }`}
                    >
                      {c.aiPaused ? "Pauzada" : "Yoqilgan"}
                    </div>
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => togglePause(c)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-line py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {c.aiPaused ? "Davom ettirish" : "Pauza"}
                  </button>
                  <button
                    onClick={() => disconnectChannel(c.id, meta.label)}
                    disabled={disconnectingId === c.id}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-line py-2 text-xs font-semibold text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50"
                  >
                    {disconnectingId === c.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Uzish
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Connect new */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-3">
          Yangi kanal ulash
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <button
            onClick={() => setShowModal(true)}
            className="rounded-2xl bg-white border border-line hover:border-electric-300 hover:shadow-[0_8px_24px_rgba(15,94,255,0.08)] transition-all p-5 text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#0f5eff12]">
                <Bot className="w-5.5 h-5.5" style={{ color: "#0f5eff" }} />
              </div>
              <span className="w-7 h-7 rounded-lg bg-[#f4f7ff] group-hover:bg-electric-500 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                <Plus className="w-4 h-4" />
              </span>
            </div>
            <div className="font-bold text-sm mt-4">Telegram-bot</div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">
              @BotFather orqali chat-bot
            </div>
          </button>

          <button
            onClick={openQrModal}
            className="rounded-2xl bg-white border border-line hover:border-electric-300 hover:shadow-[0_8px_24px_rgba(15,94,255,0.08)] transition-all p-5 text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#229ED912]">
                <Send className="w-5.5 h-5.5" style={{ color: "#229ED9" }} />
              </div>
              <span className="w-7 h-7 rounded-lg bg-[#f4f7ff] group-hover:bg-electric-500 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                <Plus className="w-4 h-4" />
              </span>
            </div>
            <div className="font-bold text-sm mt-4">Telegram (shaxsiy)</div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">
              QR kod orqali shaxsiy akkaunt ulash
            </div>
          </button>

          <button
            type="button"
            onClick={() => setShowInstagramNotice(true)}
            className="rounded-2xl bg-white border border-line hover:border-electric-300 hover:shadow-[0_8px_24px_rgba(15,94,255,0.08)] transition-all p-5 text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#E1306C12]">
                <Instagram className="w-5.5 h-5.5" style={{ color: "#E1306C" }} />
              </div>
              <span className="w-7 h-7 rounded-lg bg-[#f4f7ff] group-hover:bg-electric-500 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                <Plus className="w-4 h-4" />
              </span>
            </div>
            <div className="font-bold text-sm mt-4">Instagram</div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">
              Meta orqali biznes-akkaunt: DM'lar
            </div>
          </button>

          {comingSoonCards.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl bg-white border border-line p-5 opacity-50 cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${c.color}12` }}
                >
                  <c.icon className="w-5.5 h-5.5" style={{ color: c.color }} />
                </div>
                <Badge color="gray">Tez orada</Badge>
              </div>
              <div className="font-bold text-sm mt-4">{c.title}</div>
              <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                {c.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="rounded-2xl bg-white w-full max-w-md p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">Telegram-botni ulash</h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              @BotFather'dan olingan token'ni kiriting
            </p>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="123456789:AA..."
              className={inputCls}
            />
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            <PrimaryButton
              onClick={connect}
              className="w-full justify-center"
            >
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Ulash"
              )}
            </PrimaryButton>
          </div>
        </div>
      )}

      {showInstagramNotice && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-[0_28px_80px_rgba(11,18,38,0.24)]">
            <div className="relative bg-gradient-to-br from-[#fff4f8] via-white to-[#eef5ff] p-6 sm:p-7">
              <button
                onClick={() => setShowInstagramNotice(false)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-slate-400 shadow-sm transition-colors hover:text-slate-700"
                aria-label="Yopish"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-start gap-4 pr-10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Instagram className="h-6 w-6" style={{ color: "#E1306C" }} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-electric-600 shadow-sm">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Manual ulash
                  </div>
                  <h3 className="mt-3 text-xl font-extrabold tracking-tight text-navy-900">
                    Instagram ulash support orqali amalga oshiriladi
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Meta tasdiqlash jarayoni yakunlanmagani uchun Instagramni hozircha
                    avtomatik ulash vaqtincha cheklangan. Akkauntingizni xavfsiz va
                    to'g'ri ulash uchun support jamoamizga yozing.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6 sm:p-7">
              <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                {[
                  ["1", "Supportga yozing"],
                  ["2", "Instagram username yuboring"],
                  ["3", "Ulashni birga yakunlaymiz"],
                ].map(([step, label]) => (
                  <div key={step} className="rounded-2xl border border-line bg-[#fafbff] p-3">
                    <div className="text-lg font-extrabold text-electric-500">{step}</div>
                    <div className="mt-1 text-xs font-bold leading-5 text-slate-600">{label}</div>
                  </div>
                ))}
              </div>

              <SupportLink
                variant="card"
                label="Instagram ulashda yordam kerak"
                description="Telegram supportga yozing, jamoamiz akkauntingizni ulash bo'yicha yo'l-yo'riq beradi."
              />

              <button
                onClick={() => setShowInstagramNotice(false)}
                className="w-full rounded-2xl border border-line py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Tushunarli
              </button>
            </div>
          </div>
        </div>
      )}

      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="rounded-2xl bg-white w-full max-w-sm p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">Telegram shaxsiy akkaunt</h3>
              <button
                onClick={closeQrModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {qrStatus === "loading" && (
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <Loader2 className="w-6 h-6 animate-spin text-electric-500" />
                <p className="text-xs text-slate-400">QR kod tayyorlanmoqda...</p>
              </div>
            )}

            {qrStatus === "pending" && qrImage && (
              <>
                <p className="text-xs text-slate-400">
                  Telegram ilovasi → Sozlamalar → Bog'langan qurilmalar →
                  Qurilma ulash orqali skanerlang
                </p>
                <div className="flex justify-center py-2">
                  <img src={qrImage} alt="QR kod" className="w-56 h-56 rounded-xl border border-line" />
                </div>
                <div className="flex items-center gap-2 justify-center text-xs text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Skanerlanishi kutilmoqda...
                </div>
              </>
            )}

            {qrStatus === "password_required" && (
              <>
                <p className="text-xs text-slate-400">
                  Ikki bosqichli tasdiqlash (2FA) paroli kerak
                  {qrPasswordHint ? ` — eslatma: ${qrPasswordHint}` : ""}
                </p>
                <input
                  type="password"
                  value={qrPassword}
                  onChange={(e) => setQrPassword(e.target.value)}
                  placeholder="Parol"
                  className={inputCls}
                />
                <PrimaryButton onClick={submitQrPassword} className="w-full justify-center">
                  {qrSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tasdiqlash"}
                </PrimaryButton>
              </>
            )}

            {qrStatus === "success" && (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-emerald-600">
                <Badge color="green" dot>Ulandi</Badge>
                <p className="text-xs text-slate-400">Akkaunt muvaffaqiyatli ulandi</p>
              </div>
            )}

            {qrStatus === "error" && (
              <div className="space-y-3">
                <p className="text-xs text-red-500 font-medium">{qrError}</p>
                <PrimaryButton onClick={openQrModal} className="w-full justify-center">
                  Qayta urinish
                </PrimaryButton>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
