"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Bot,
  Clock,
  MessageSquare,
  Bell,
  Users,
  CreditCard,
  UserCircle,
  Check,
  X,
  Plus,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  Badge,
  PageTitle,
  PrimaryButton,
  inputCls,
} from "@/components/ui";
import { SUPPORT_HANDLE, SupportLink } from "@/components/support-link";

const sections = [
  { id: "company", label: "Kompaniya", icon: Building2 },
  { id: "agent", label: "AI-agent", icon: Bot },
  { id: "hours", label: "Ish soatlari", icon: Clock },
  { id: "comments", label: "Kommentlar", icon: MessageSquare },
  { id: "notifications", label: "Bildirishnomalar", icon: Bell },
  { id: "team", label: "Jamoa", icon: Users },
  { id: "billing", label: "Tarif va to'lov", icon: CreditCard },
  { id: "account", label: "Akkaunt", icon: UserCircle },
];

type BillingCycle = "monthly" | "yearly";

const billingPlans = [
  {
    id: "free",
    name: "FREE",
    monthly: 0,
    yearlyMonthly: 0,
    badge: "",
    features: [
      { label: "Instagram Automation: 200 dialog/oy", included: true },
      { label: "Avtojavob ochiq", included: true },
      { label: "AI Agent yopiq", included: false },
      { label: "Katalog yopiq", included: false },
    ],
  },
  {
    id: "pro",
    name: "PRO",
    monthly: 75000,
    yearlyMonthly: 50000,
    badge: "Ommabop",
    features: [
      { label: "Instagram Automation cheksiz", included: true },
      { label: "Avtojavob ochiq", included: true },
      { label: "AI Agent yopiq", included: false },
      { label: "Katalog yopiq", included: false },
    ],
  },
  {
    id: "vip",
    name: "VIP",
    monthly: 300000,
    yearlyMonthly: 225000,
    badge: "",
    features: [
      { label: "Instagram Automation cheksiz", included: true },
      { label: "Avtojavob ochiq", included: true },
      { label: "AI Agent ochiq", included: true },
      { label: "Katalog ochiq", included: true },
    ],
  },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("uz-UZ").format(value);
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={`w-11 h-6 rounded-full relative inline-block ${on ? "bg-electric-500" : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </span>
  );
}

const SectionCard = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl bg-white border border-line p-6 space-y-4">
    <div>
      <h3 className="font-bold">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

function AccountTab({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function changePassword() {
    if (!currentPassword || !newPassword || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Xatolik yuz berdi");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SectionCard title="Akkaunt" subtitle={email}>
        <p className="text-xs text-slate-400">
          Login (email) o&apos;zgartirish uchun {SUPPORT_HANDLE} ga yozing.
        </p>
        <SupportLink
          variant="card"
          label="Chatspace support"
          description="Email, tarif, to'lov yoki ulanish bo'yicha yordam beramiz"
        />
      </SectionCard>
      <SectionCard title="Parol">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Joriy parol">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Yangi parol">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        <div className="flex items-center gap-3">
          <PrimaryButton onClick={changePassword} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Parolni yangilash"}
          </PrimaryButton>
          {success && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Yangilandi
            </span>
          )}
        </div>
      </SectionCard>
    </>
  );
}

export default function SettingsPage() {
  const [active, setActive] = useState("agent");

  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [address, setAddress] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentTone, setAgentTone] = useState("");
  const [forbiddenPhrases, setForbiddenPhrases] = useState("");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [workHoursStart, setWorkHoursStart] = useState("09:00");
  const [workHoursEnd, setWorkHoursEnd] = useState("21:00");
  const [afterHoursMode, setAfterHoursMode] = useState("ALWAYS");
  const [plan, setPlan] = useState("");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [loaded, setLoaded] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingAgent, setSavingAgent] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [savedField, setSavedField] = useState<"company" | "agent" | "hours" | null>(null);

  const yearlySummary = useMemo(() => {
    return Math.max(
      ...billingPlans.map((item) => (item.monthly - item.yearlyMonthly) * 12),
    );
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setEmail(data.user?.email ?? "");
        setCompany(data.user?.company ?? "");
        setIndustry(data.user?.industry ?? "");
        setAddress(data.user?.address ?? "");
        setAgentName(data.user?.agentName ?? "");
        setAgentTone(data.user?.agentTone ?? "Do'stona va samimiy");
        setForbiddenPhrases(data.user?.forbiddenPhrases ?? "");
        setExtraInstructions(data.user?.extraInstructions ?? "");
        setWorkHoursStart(data.user?.workHoursStart ?? "09:00");
        setWorkHoursEnd(data.user?.workHoursEnd ?? "21:00");
        setAfterHoursMode(data.user?.afterHoursMode ?? "ALWAYS");
        setPlan(data.user?.plan ?? "FREE");
        setLoaded(true);
      });
  }, []);

  async function saveField(field: "company" | "agent" | "hours") {
    const setSaving =
      field === "company" ? setSavingCompany : field === "agent" ? setSavingAgent : setSavingHours;
    setSaving(true);
    setSavedField(null);
    try {
      await fetch("/api/client", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          field === "company"
            ? { company, industry, address }
            : field === "agent"
              ? { agentName, agentTone, forbiddenPhrases, extraInstructions }
              : { workHoursStart, workHoursEnd, afterHoursMode },
        ),
      });
      setSavedField(field);
      setTimeout(() => setSavedField(null), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Sozlamalar" subtitle="Profil, agent va avtomatlashtirish" />

      {/* Horizontal section tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-2.5 rounded-xl transition-colors ${
              active === s.id
                ? "bg-electric-500 text-white shadow-[0_4px_14px_rgba(15,94,255,0.25)]"
                : "bg-white border border-line text-slate-500 hover:border-electric-200"
            }`}
          >
            <s.icon className="w-4 h-4" /> {s.label}
          </button>
        ))}
      </div>

      <div className={`${active === "billing" ? "max-w-6xl" : "max-w-3xl"} space-y-5`}>
        {active === "company" && (
          <SectionCard title="Kompaniya ma'lumotlari">
            <Field label="Kompaniya nomi">
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={!loaded}
                className={inputCls}
              />
            </Field>
            <Field label="Faoliyat sohasi">
              <input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                disabled={!loaded}
                placeholder="Masalan: Kiyim-kechak savdosi"
                className={inputCls}
              />
            </Field>
            <Field label="Manzil">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!loaded}
                placeholder="Shahar, tuman, ko'cha"
                className={inputCls}
              />
            </Field>
            <div className="flex items-center gap-3">
              <PrimaryButton onClick={() => saveField("company")} disabled={savingCompany}>
                {savingCompany ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}
              </PrimaryButton>
              {savedField === "company" && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saqlandi
                </span>
              )}
            </div>
          </SectionCard>
        )}

        {active === "agent" && (
          <>
            <SectionCard title="AI-agent xarakteri">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Agent ismi">
                  <input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    disabled={!loaded}
                    placeholder="Misol: Jarvis"
                    className={inputCls}
                  />
                </Field>
                <Field label="Muloqot ohangi">
                  <select
                    value={agentTone}
                    onChange={(e) => setAgentTone(e.target.value)}
                    disabled={!loaded}
                    className={inputCls}
                  >
                    <option>Do&apos;stona va samimiy</option>
                    <option>Rasmiy</option>
                    <option>Qisqa va aniq</option>
                  </select>
                </Field>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Taqiqlangan iboralar">
                  <textarea
                    rows={4}
                    className={`${inputCls} resize-y`}
                    value={forbiddenPhrases}
                    onChange={(e) => setForbiddenPhrases(e.target.value)}
                    disabled={!loaded}
                  />
                </Field>
                <Field label="Qo'shimcha ko'rsatmalar">
                  <textarea
                    rows={4}
                    className={`${inputCls} resize-y`}
                    placeholder="Biznesingiz haqida AI bilishi kerak bo'lgan qo'shimcha ma'lumot..."
                    value={extraInstructions}
                    onChange={(e) => setExtraInstructions(e.target.value)}
                    disabled={!loaded}
                  />
                </Field>
              </div>
              <div className="flex items-center gap-3">
                <PrimaryButton onClick={() => saveField("agent")} disabled={savingAgent}>
                  {savingAgent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Agentni saqlash
                    </>
                  )}
                </PrimaryButton>
                {savedField === "agent" && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saqlandi
                  </span>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Agent nimani o&apos;rgandi"
              subtitle="Haqiqiy dialoglardan olingan xulosalar — avtomatik qo&apos;llanadi"
            >
              <div className="rounded-xl bg-[#f4f7ff] border border-line p-4">
                <div className="text-sm font-bold flex items-center gap-2">
                  <Bot className="w-4 h-4 text-electric-600" />
                  Qiziqqan mijozlarni tezroq demoga o&apos;tkazish
                </div>
                <p className="text-[13px] text-slate-500 mt-1.5">
                  Demo so&apos;ragan mijozlar allaqachon xarid bosqichida — mahsulotni
                  qayta tushuntirish o&apos;rniga bitta aniq keyingi qadam taklif
                  qilinadi.
                </p>
              </div>
            </SectionCard>
          </>
        )}

        {active === "hours" && (
          <SectionCard
            title="Ish soatlari"
            subtitle="Ish vaqtidan tashqarida agent qanday ishlaydi"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Boshlanishi">
                <input
                  type="time"
                  value={workHoursStart}
                  onChange={(e) => setWorkHoursStart(e.target.value)}
                  disabled={!loaded}
                  className={inputCls}
                />
              </Field>
              <Field label="Tugashi">
                <input
                  type="time"
                  value={workHoursEnd}
                  onChange={(e) => setWorkHoursEnd(e.target.value)}
                  disabled={!loaded}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Ish vaqtidan tashqarida">
              <select
                value={afterHoursMode}
                onChange={(e) => setAfterHoursMode(e.target.value)}
                disabled={!loaded}
                className={inputCls}
              >
                <option value="ALWAYS">AI baribir javob beradi (24/7)</option>
                <option value="AUTO_REPLY">Faqat avtojavob</option>
                <option value="SILENT">Javob bermasin</option>
              </select>
            </Field>
            <div className="flex items-center gap-3">
              <PrimaryButton onClick={() => saveField("hours")} disabled={savingHours}>
                {savingHours ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}
              </PrimaryButton>
              {savedField === "hours" && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saqlandi
                </span>
              )}
            </div>
          </SectionCard>
        )}

        {active === "comments" && (
          <SectionCard
            title="Kommentlarga javob"
            subtitle="Tez orada — Instagram kommentlar API'si keyingi bosqichda ulanadi"
          >
            {[
              { t: "Post kommentlariga avtomatik javob", on: true },
              { t: "Kommentdan DM'ga o'tkazish (comment-to-DM)", on: true },
              { t: "Negativ kommentlarni operatorga uzatish", on: false },
            ].map((row) => (
              <div
                key={row.t}
                className="flex items-center justify-between border border-line rounded-xl px-4 py-3.5 opacity-50"
              >
                <span className="text-sm font-medium">{row.t}</span>
                <Toggle on={row.on} />
              </div>
            ))}
          </SectionCard>
        )}

        {active === "notifications" && (
          <SectionCard
            title="Bildirishnomalar"
            subtitle="Tez orada — bildirishnoma yuborish tizimi keyingi bosqichda ulanadi"
          >
            {[
              { t: "Yangi lead kelganda Telegram'ga xabar", on: true },
              { t: "Shikoyat kelganda darhol xabar", on: true },
              { t: "Kunlik hisobot (har kuni 21:00)", on: false },
            ].map((row) => (
              <div
                key={row.t}
                className="flex items-center justify-between border border-line rounded-xl px-4 py-3.5 opacity-50"
              >
                <span className="text-sm font-medium">{row.t}</span>
                <Toggle on={row.on} />
              </div>
            ))}
          </SectionCard>
        )}

        {active === "team" && (
          <SectionCard title="Jamoa" subtitle="Panelga kirish huquqiga ega a'zolar">
            <div className="flex items-center gap-3 border border-line rounded-xl px-4 py-3.5">
              <div className="w-10 h-10 rounded-xl electric-gradient text-white text-sm font-bold flex items-center justify-center">
                {email ? email.slice(0, 2).toUpperCase() : "…"}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">{email || "Yuklanmoqda..."}</div>
                <div className="text-xs text-slate-400">Asosiy akkaunt</div>
              </div>
              <Badge color="blue" dot>
                Egasi
              </Badge>
            </div>
            <PrimaryButton disabled className="opacity-50 cursor-not-allowed">
              <Plus className="w-4 h-4" /> A&apos;zo qo&apos;shish (tez orada)
            </PrimaryButton>
          </SectionCard>
        )}

        {active === "billing" && (
          <>
            <div className="rounded-2xl electric-gradient text-white p-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[13px] text-electric-100">Joriy tarif</div>
                <div className="text-2xl font-extrabold mt-1">
                  {billingPlans.find((t) => t.id === plan.toLowerCase())?.name ?? plan}
                </div>
                <div className="text-[13px] text-electric-100 mt-1">
                  To&apos;lov hozircha Chatspace operatori bilan bevosita kelishiladi
                </div>
              </div>
              <div className="w-full md:w-auto">
                <div className="inline-flex w-full rounded-2xl border border-white/20 bg-white/10 p-1 md:w-auto">
                  {(["monthly", "yearly"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBillingCycle(value)}
                      className={`min-w-28 flex-1 rounded-xl px-5 py-3 text-sm font-extrabold transition-all duration-300 md:flex-none ${
                        billingCycle === value
                          ? "bg-white text-electric-700 shadow-[0_12px_30px_rgba(11,18,38,0.18)]"
                          : "text-electric-50 hover:bg-white/10"
                      }`}
                    >
                      {value === "monthly" ? "Oylik" : "Yillik"}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-electric-50">
                  <Sparkles className="h-4 w-4" />
                  Yillikda {formatMoney(yearlySummary)} so&apos;mgacha tejaysiz
                </div>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-3 items-stretch">
              {billingPlans.map((t) => {
                const isCurrent = t.id === plan.toLowerCase();
                const isYearly = billingCycle === "yearly";
                const highlighted = t.id === "pro";
                const monthlyPrice = t.monthly;
                const yearlyTotal = t.yearlyMonthly * 12;
                const displayPrice = isYearly ? yearlyTotal : monthlyPrice;
                const monthlyTotal = t.monthly * 12;
                const savings = monthlyTotal - yearlyTotal;
                const discount =
                  t.monthly > 0 ? Math.round((1 - t.yearlyMonthly / t.monthly) * 100) : 0;

                return (
                  <div
                    key={t.id}
                    className={`group relative overflow-hidden rounded-[26px] p-6 transition-all duration-500 ${
                      highlighted
                        ? "bg-navy-900 text-white shadow-[0_24px_70px_rgba(11,18,38,0.18)]"
                        : "bg-white border border-line"
                    } ${isCurrent ? "ring-2 ring-electric-200" : ""}`}
                  >
                    {highlighted && <div className="absolute inset-0 dot-grid opacity-10" />}
                    <div className="relative flex h-full flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-extrabold text-lg">{t.name}</h3>
                        <div className="flex items-center gap-2">
                          {t.badge && (
                            <span className="rounded-full bg-electric-500 px-3 py-1 text-[11px] font-extrabold text-white">
                              {t.badge}
                            </span>
                          )}
                          {isCurrent && <Badge color="blue">Joriy</Badge>}
                        </div>
                      </div>

                      <div className="mt-5 min-h-[108px]">
                        <div className="flex items-baseline gap-1 transition-all duration-500">
                          <span className="text-[32px] font-extrabold tracking-tight tabular-nums">
                            {formatMoney(displayPrice)}
                          </span>
                          <span className="text-sm text-slate-400">
                            {isYearly ? "so'm/yil" : "so'm/oy"}
                          </span>
                        </div>
                        <div
                          className={`mt-2 text-sm transition-all duration-500 ${
                            isYearly
                              ? "translate-y-0 opacity-100"
                              : "translate-y-1 opacity-60"
                          } ${highlighted ? "text-cyan-100" : "text-slate-500"}`}
                        >
                          {isYearly
                            ? `Oyiga ${formatMoney(t.yearlyMonthly)} so'mdan`
                            : t.monthly === 0
                              ? "Boshlash uchun bepul"
                              : `Yillik tanlasangiz ${formatMoney(savings)} so'm tejaysiz`}
                        </div>
                        {savings > 0 && (
                          <div
                            className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-extrabold transition-all duration-500 ${
                              isYearly ? "opacity-100" : "opacity-60"
                            } ${
                              highlighted
                                ? "bg-white/10 text-cyan-100"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            -{discount}% • {formatMoney(savings)} so&apos;m tejaladi
                          </div>
                        )}
                      </div>

                      <ul className="mt-6 space-y-3">
                        {t.features.map((feature) => (
                          <li
                            key={feature.label}
                            className={`flex items-start gap-2.5 text-sm leading-6 ${
                              feature.included
                                ? ""
                                : highlighted
                                  ? "text-slate-400"
                                  : "text-slate-500"
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                                feature.included
                                  ? highlighted
                                    ? "bg-electric-500/30"
                                    : "bg-electric-50"
                                  : highlighted
                                    ? "bg-white/10"
                                    : "bg-slate-100"
                              }`}
                            >
                              {feature.included ? (
                                <Check
                                  className={`h-3 w-3 ${
                                    highlighted ? "text-cyan-300" : "text-electric-600"
                                  }`}
                                />
                              ) : (
                                <X className="h-3 w-3 text-slate-400" />
                              )}
                            </span>
                            {feature.label}
                          </li>
                        ))}
                      </ul>

                      <div
                        className={`mt-6 rounded-2xl border p-4 text-sm transition-all duration-500 ${
                          highlighted
                            ? "border-white/10 bg-white/5 text-cyan-50"
                            : "border-line bg-[#fafbff] text-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span>{isYearly ? "Yillik to'lov" : "Oylik to'lov"}</span>
                          <strong className="whitespace-nowrap text-base text-inherit">
                            {formatMoney(displayPrice)} so&apos;m
                          </strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isCurrent}
                        className={`mt-6 rounded-2xl py-3.5 text-sm font-bold transition-all duration-300 ${
                          isCurrent
                            ? "cursor-default border border-line bg-slate-50 text-slate-400"
                            : highlighted
                              ? "bg-electric-500 text-white shadow-[0_14px_30px_rgba(15,94,255,0.32)] hover:bg-electric-600"
                              : "border border-line hover:border-electric-300 hover:bg-electric-50"
                        }`}
                      >
                        {isCurrent ? "Joriy tarif" : "Tanlash"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {active === "account" && <AccountTab email={email} />}
      </div>
    </div>
  );
}
