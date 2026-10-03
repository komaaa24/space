"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Send, Bot, Plus, X, Loader2, User, Trash2, MessageSquare, Workflow } from "lucide-react";
import { Badge, PageTitle, PrimaryButton, inputCls } from "@/components/ui";
import { Instagram, Youtube } from "@/components/brand-icons";

interface DbChannel {
  id: string;
  type: string;
  status: string;
  handle: string | null;
  aiPaused: boolean;
  automationPaused: boolean;
  commentsPaused: boolean;
  createdAt: string;
  automation?: {
    dmTotal: number;
    dmActive: number;
    commentTotal: number;
    commentActive: number;
  };
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

function ToggleSwitch({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <span
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-emerald-500" : "bg-slate-200"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </span>
  );
}

function ChannelSetting({
  icon,
  title,
  description,
  checked,
  disabled,
  badge,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 border-t border-line py-4 text-left transition-colors first:border-t-0 disabled:cursor-not-allowed"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="block text-[13px] font-extrabold text-navy-900">{title}</span>
          {badge && (
            <span className="rounded-full bg-electric-50 px-2 py-0.5 text-[10px] font-extrabold text-electric-600">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-slate-400">{description}</span>
      </span>
      <ToggleSwitch checked={checked} disabled={disabled} />
    </button>
  );
}

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
  const [connectingInstagram, setConnectingInstagram] = useState(false);
  const [updatingChannelId, setUpdatingChannelId] = useState<string | null>(null);
  const [aiAllowed, setAiAllowed] = useState(false);

  async function loadChannels() {
    setLoading(true);
    try {
      const [channelsRes, meRes] = await Promise.all([
        fetch("/api/channels", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
      ]);
      const channelsData = await channelsRes.json();
      const meData = meRes.ok ? await meRes.json() : null;
      setChannels(channelsData.channels ?? []);
      setAiAllowed(Boolean(meData?.user?.access?.features?.aiAgent));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadChannels();
      const params = new URLSearchParams(window.location.search);
      const err = params.get("ig_error");
      if (err) {
        setIgError(err);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function connectInstagram() {
    setConnectingInstagram(true);
    window.location.assign("/api/channels/instagram/start");
  }

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

  async function updateChannelSettings(
    c: DbChannel,
    patch: Partial<Pick<DbChannel, "aiPaused" | "automationPaused" | "commentsPaused">>,
  ) {
    setUpdatingChannelId(c.id);
    try {
      const res = await fetch(`/api/channels/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setIgError(data?.error ?? "Kanal sozlamasi saqlanmadi");
        return;
      }
      await loadChannels();
    } finally {
      setUpdatingChannelId(null);
    }
  }

  async function toggleAi(c: DbChannel) {
    await updateChannelSettings(c, { aiPaused: !c.aiPaused });
  }

  async function toggleAutomation(c: DbChannel) {
    await updateChannelSettings(c, { automationPaused: !c.automationPaused });
  }

  async function toggleComments(c: DbChannel) {
    await updateChannelSettings(c, { commentsPaused: !c.commentsPaused });
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
          <div className="grid gap-4 lg:grid-cols-2">
            {channels.map((c) => {
              const meta = channelMeta[c.type] ?? {
                label: c.type,
                color: "#94a3b8",
                Icon: Bot,
              };
              const aiFeatureLocked = !aiAllowed;
              const aiEnabled = aiAllowed && !c.aiPaused;
              const automationEnabled = !c.automationPaused;
              const commentsEnabled = c.type === "INSTAGRAM" && !c.commentsPaused;
              const updating = updatingChannelId === c.id;
              return (
                <div key={c.id} className="rounded-2xl bg-white border border-line p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                      style={{ background: `${meta.color}12` }}
                    >
                      <meta.Icon className="h-6 w-6" style={{ color: meta.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-[17px] font-extrabold text-navy-900">{meta.label}</div>
                        <Badge color="green" dot>Onlayn</Badge>
                        <Badge color={aiEnabled ? "green" : "gray"}>
                          {aiFeatureLocked ? "AI VIP" : aiEnabled ? "AI yoniq" : "AI pauzada"}
                        </Badge>
                        <Badge color={automationEnabled ? "green" : "gray"}>
                          {automationEnabled ? "Avtojavob yoniq" : "Avtojavob pauzada"}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">{c.handle ?? "Kanal ulangan"}</div>
                    </div>
                    <button
                      onClick={() => disconnectChannel(c.id, meta.label)}
                      disabled={disconnectingId === c.id}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line text-slate-300 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      aria-label="Kanalni uzish"
                    >
                      {disconnectingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="mt-5 rounded-2xl border border-line px-4">
                    <ChannelSetting
                      icon={<Bot className="h-4.5 w-4.5" />}
                      title="AI javoblari"
                      description={
                        aiFeatureLocked
                          ? "AI javoblari VIP tarifida ochiladi. FREE va PRO tariflarida avtomatizatsiya javoblari ishlaydi."
                          : "Agent bu kanaldagi oddiy xabarlarga bilim bazasi va katalog asosida javob beradi."
                      }
                      checked={aiEnabled}
                      disabled={updating || aiFeatureLocked}
                      badge={aiFeatureLocked ? "VIP" : undefined}
                      onClick={() => {
                        if (!aiFeatureLocked) void toggleAi(c);
                      }}
                    />
                    <ChannelSetting
                      icon={<Workflow className="h-4.5 w-4.5" />}
                      title="Avtomatizatsiya javoblari"
                      description={
                        (c.automation?.dmTotal ?? 0) > 0
                          ? `${c.automation?.dmActive ?? 0}/${c.automation?.dmTotal ?? 0} ta DM qoidasi faol.`
                          : "Automation bo‘limidagi kalit so‘zli avtojavob qoidalari shu yerda boshqariladi."
                      }
                      checked={automationEnabled}
                      disabled={updating}
                      onClick={() => toggleAutomation(c)}
                    />
                    {c.type === "INSTAGRAM" && (
                      <ChannelSetting
                        icon={<MessageSquare className="h-4.5 w-4.5" />}
                        title="Instagram izoh triggerlari"
                        description={
                          (c.automation?.commentTotal ?? 0) > 0
                            ? `${c.automation?.commentActive ?? 0}/${c.automation?.commentTotal ?? 0} ta izoh avtomatizatsiyasi faol.`
                            : "Izohlardan DM yoki public reply yuborish uchun avtomatizatsiya yarating."
                        }
                        checked={commentsEnabled}
                        disabled={updating || !automationEnabled}
                        onClick={() => toggleComments(c)}
                      />
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-[#f4f7ff] px-3 py-2.5">
                      <div className="text-[10px] text-slate-400">AI</div>
                      <div className={`mt-0.5 text-[13px] font-bold ${aiEnabled ? "text-emerald-600" : "text-slate-400"}`}>
                        {aiFeatureLocked ? "VIP kerak" : aiEnabled ? "Yoniq" : "Pauza"}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[#f4f7ff] px-3 py-2.5">
                      <div className="text-[10px] text-slate-400">Avtojavob</div>
                      <div className="mt-0.5 text-[13px] font-bold text-navy-900">
                        {c.automation?.dmActive ?? 0}/{c.automation?.dmTotal ?? 0}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[#f4f7ff] px-3 py-2.5">
                      <div className="text-[10px] text-slate-400">Izoh qoidalar</div>
                      <div className="mt-0.5 text-[13px] font-bold text-navy-900">
                        {c.type === "INSTAGRAM" ? `${c.automation?.commentActive ?? 0}/${c.automation?.commentTotal ?? 0}` : "Yo'q"}
                      </div>
                    </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
            onClick={connectInstagram}
            disabled={connectingInstagram}
            className="rounded-2xl bg-white border border-line hover:border-electric-300 hover:shadow-[0_8px_24px_rgba(15,94,255,0.08)] transition-all p-5 text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#E1306C12]">
                <Instagram className="w-5.5 h-5.5" style={{ color: "#E1306C" }} />
              </div>
              <span className="w-7 h-7 rounded-lg bg-[#f4f7ff] group-hover:bg-electric-500 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                {connectingInstagram ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </span>
            </div>
            <div className="font-bold text-sm mt-4">Instagram</div>
            <div className="text-xs text-slate-400 mt-1 leading-relaxed">
              Meta orqali biznes-akkaunt: DM va izohlar
            </div>
          </button>

          {comingSoonCards.map((c) => (
            <div key={c.title} className="rounded-2xl bg-white border border-line p-5 opacity-50 cursor-not-allowed">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${c.color}12` }}>
                  <c.icon className="w-5.5 h-5.5" style={{ color: c.color }} />
                </div>
                <Badge color="gray">Tez orada</Badge>
              </div>
              <div className="font-bold text-sm mt-4">{c.title}</div>
              <div className="text-xs text-slate-400 mt-1 leading-relaxed">{c.desc}</div>
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
              @BotFather&apos;dan olingan token&apos;ni kiriting
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
                  Telegram ilovasi → Sozlamalar → Bog&apos;langan qurilmalar →
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
