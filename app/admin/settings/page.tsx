"use client";

import { useEffect, useState } from "react";
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
  Plus,
  Loader2,
} from "lucide-react";
import {
  Badge,
  PageTitle,
  PrimaryButton,
  inputCls,
} from "@/components/ui";
import { tariffs } from "@/lib/mock-data";

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
          Login (email) o'zgartirish uchun Chatspace jamoasiga murojaat qiling.
        </p>
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
  const [loaded, setLoaded] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingAgent, setSavingAgent] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [savedField, setSavedField] = useState<"company" | "agent" | "hours" | null>(null);

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

      <div className="max-w-3xl space-y-5">
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
                    <option>Do'stona va samimiy</option>
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
              title="Agent nimani o'rgandi"
              subtitle="Haqiqiy dialoglardan olingan xulosalar — avtomatik qo'llanadi"
            >
              <div className="rounded-xl bg-[#f4f7ff] border border-line p-4">
                <div className="text-sm font-bold flex items-center gap-2">
                  <Bot className="w-4 h-4 text-electric-600" />
                  Qiziqqan mijozlarni tezroq demoga o'tkazish
                </div>
                <p className="text-[13px] text-slate-500 mt-1.5">
                  Demo so'ragan mijozlar allaqachon xarid bosqichida — mahsulotni
                  qayta tushuntirish o'rniga bitta aniq keyingi qadam taklif
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
              <Plus className="w-4 h-4" /> A'zo qo'shish (tez orada)
            </PrimaryButton>
          </SectionCard>
        )}

        {active === "billing" && (
          <>
            <div className="rounded-2xl electric-gradient text-white p-6 flex items-center justify-between">
              <div>
                <div className="text-[13px] text-electric-100">Joriy tarif</div>
                <div className="text-2xl font-extrabold mt-1">
                  {tariffs.find((t) => t.id === plan.toLowerCase())?.name ?? plan}
                </div>
                <div className="text-[13px] text-electric-100 mt-1">
                  To'lov hozircha Chatspace operatori bilan bevosita kelishiladi
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 items-start">
              {tariffs.map((t) => {
                const isCurrent = t.id === plan.toLowerCase();
                return (
                <div
                  key={t.id}
                  className={`rounded-2xl bg-white border p-5 ${
                    isCurrent ? "border-electric-400 ring-2 ring-electric-100" : "border-line"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm">{t.name}</h3>
                    {isCurrent && <Badge color="blue">Joriy</Badge>}
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-xl font-extrabold">{t.price}</span>
                    <span className="text-[11px] text-slate-400">
                      so'm/{t.period}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs">
                        <Check className="w-3.5 h-3.5 text-electric-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
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
