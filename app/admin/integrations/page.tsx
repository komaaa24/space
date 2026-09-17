"use client";

import { useEffect, useState } from "react";
import { Plus, Sparkles, Boxes, X, Loader2, Trash2, Wallet } from "lucide-react";
import { Badge, PageTitle, PrimaryButton, inputCls } from "@/components/ui";

const comingSoon = [
  { id: "amocrm", name: "amoCRM", desc: "Arizalar voronkaga tushadi, agent mijoz bosqichini ko'radi" },
  { id: "bitrix", name: "Bitrix24", desc: "Leadlar avtomatik CRM'ga uzatiladi" },
];

interface Integration {
  id: string;
  provider: "PAYME" | "CLICK";
  merchantId: string;
  serviceId: string | null;
  active: boolean;
}

const providerMeta = {
  PAYME: { label: "Payme", color: "#00c8ff", desc: "Mijozlaringiz o'z Payme hisobingizga to'g'ridan-to'g'ri to'lov qiladi" },
  CLICK: { label: "Click", color: "#0067ff", desc: "Mijozlaringiz o'z Click hisobingizga to'g'ridan-to'g'ri to'lov qiladi" },
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalProvider, setModalProvider] = useState<"PAYME" | "CLICK" | null>(null);
  const [merchantId, setMerchantId] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/payments/integrations");
    const data = await res.json();
    setIntegrations(data.integrations ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openModal(provider: "PAYME" | "CLICK") {
    setModalProvider(provider);
    setMerchantId("");
    setSecretKey("");
    setServiceId("");
    setError(null);
  }

  async function connect() {
    if (!modalProvider || !merchantId.trim() || !secretKey.trim()) return;
    if (modalProvider === "CLICK" && !serviceId.trim()) {
      setError("Service ID kerak");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: modalProvider,
          merchantId: merchantId.trim(),
          secretKey: secretKey.trim(),
          serviceId: modalProvider === "CLICK" ? serviceId.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Xatolik yuz berdi");
        return;
      }
      setModalProvider(null);
      await load();
    } catch {
      setError("Serverga ulanib bo'lmadi");
    } finally {
      setConnecting(false);
    }
  }

  async function disconnect(id: string, label: string) {
    if (!window.confirm(`${label} hisobini uzmoqchimisiz?`)) return;
    await fetch(`/api/payments/integrations/${id}`, { method: "DELETE" });
    await load();
  }

  const connectedByProvider = Object.fromEntries(
    integrations.map((i) => [i.provider, i]),
  ) as Partial<Record<"PAYME" | "CLICK", Integration>>;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Integratsiyalar"
        subtitle="CRM, to'lov tizimlari va tashqi xizmatlar"
      />

      <div className="rounded-2xl electric-gradient text-white p-6 flex items-center gap-5 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <span className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
          <Boxes className="w-6 h-6" />
        </span>
        <div className="flex-1 relative">
          <div className="font-bold text-lg">Istalgan tizimni AI ulaydi</div>
          <p className="text-[13px] text-electric-100 mt-0.5">
            Tizim havolasini joylashtiring — AI hujjatlarni o'rganib,
            ulanishni o'zi sozlaydi
          </p>
        </div>
        <button className="relative inline-flex items-center gap-1.5 bg-white text-electric-600 text-[13px] font-bold px-5 py-3 rounded-xl hover:bg-electric-50 transition-colors shrink-0">
          <Sparkles className="w-4 h-4" /> AI orqali ulash
        </button>
      </div>

      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-3">
          To'lov tizimlari — o'z hisobingizga to'g'ridan-to'g'ri to'lov
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {(["PAYME", "CLICK"] as const).map((provider) => {
            const meta = providerMeta[provider];
            const conn = connectedByProvider[provider];
            return (
              <div
                key={provider}
                className="rounded-2xl bg-white border border-line hover:border-electric-300 transition-colors p-5 flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${meta.color}15` }}
                  >
                    <Wallet className="w-5 h-5" style={{ color: meta.color }} />
                  </div>
                  {conn && (
                    <Badge color="green" dot>
                      Ulangan
                    </Badge>
                  )}
                </div>
                <div className="font-bold text-sm mt-3">{meta.label}</div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed flex-1">
                  {conn ? `Merchant ID: ${conn.merchantId}` : meta.desc}
                </p>
                {conn ? (
                  <button
                    onClick={() => disconnect(conn.id, meta.label)}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Uzish
                  </button>
                ) : (
                  <PrimaryButton
                    className="mt-4 w-full justify-center"
                    onClick={() => openModal(provider)}
                  >
                    <Plus className="w-3.5 h-3.5" /> Ulash
                  </PrimaryButton>
                )}
              </div>
            );
          })}

          {comingSoon.map((i) => (
            <div
              key={i.id}
              className="rounded-2xl bg-white border border-line p-5 opacity-50 cursor-not-allowed flex flex-col"
            >
              <div className="w-10 h-10 rounded-xl bg-[#f4f7ff] flex items-center justify-center text-electric-600 font-extrabold text-[11px] uppercase">
                {i.name.slice(0, 2)}
              </div>
              <div className="font-bold text-sm mt-3">{i.name}</div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed flex-1">
                {i.desc}
              </p>
              <Badge color="gray">Tez orada</Badge>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-sm text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
        </div>
      )}

      {modalProvider && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="rounded-2xl bg-white w-full max-w-md p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">
                {providerMeta[modalProvider].label}ni ulash
              </h3>
              <button
                onClick={() => setModalProvider(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              {modalProvider === "PAYME"
                ? "Payme Business kabinetingizdagi Kassa ID va Kassa key'ni kiriting"
                : "Click Merchant kabinetingizdagi Merchant ID, Service ID va Secret key'ni kiriting"}
            </p>
            <input
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              placeholder="Merchant ID"
              className={inputCls}
            />
            {modalProvider === "CLICK" && (
              <input
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                placeholder="Service ID"
                className={inputCls}
              />
            )}
            <input
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Secret key"
              type="password"
              className={inputCls}
            />
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            <PrimaryButton onClick={connect} className="w-full justify-center">
              {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ulash"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
