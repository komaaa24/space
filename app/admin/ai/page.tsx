"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  HelpCircle,
  Zap,
  FlaskConical,
  Link2,
  Type,
  FileUp,
  FileText,
  Trash2,
  Plus,
  Pencil,
  Bot,
  Headset,
  Ban,
  Send,
  Sparkles,
  Loader2,
  X,
  Lock,
} from "lucide-react";
import { Badge, PageTitle, PrimaryButton, inputCls } from "@/components/ui";

const tabs = [
  { id: "knowledge", label: "Bilimlar bazasi", icon: BookOpen },
  { id: "faq", label: "Savol-javoblar", icon: HelpCircle },
  { id: "scenarios", label: "Stsenariylar", icon: Zap },
  { id: "test", label: "Sinov maydoni", icon: FlaskConical },
];

const typeMeta = {
  TEXT: { icon: Type, label: "Matn" },
  LINK: { icon: Link2, label: "Havola" },
  FILE: { icon: FileText, label: "Fayl" },
};

interface KnowledgeItemDb {
  id: string;
  type: "TEXT" | "LINK" | "FILE";
  title: string | null;
  content: string;
  createdAt: string;
}

interface FaqDb {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
}

interface ScenarioDb {
  id: string;
  name: string;
  keywords: string;
  action: "AUTO_REPLY" | "TO_OPERATOR" | "IGNORE";
  replyText: string | null;
  active: boolean;
  createdAt: string;
}

interface TestMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AiStudioPage() {
  const [tab, setTab] = useState("knowledge");
  const [agentName, setAgentName] = useState("AI agent");
  const [agentTone, setAgentTone] = useState("Do'stona ohang");
  const [aiAllowed, setAiAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.agentName) setAgentName(data.user.agentName);
        if (data.user?.agentTone) setAgentTone(data.user.agentTone);
        setAiAllowed(Boolean(data.user?.access?.features?.aiAgent));
      });
  }, []);

  // ---- Knowledge ----
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItemDb[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(true);
  const [kMode, setKMode] = useState<"TEXT" | "LINK" | "FILE">("TEXT");
  const [kTitle, setKTitle] = useState("");
  const [kText, setKText] = useState("");
  const [kLink, setKLink] = useState("");
  const [kFileNote, setKFileNote] = useState("");
  const [kSaving, setKSaving] = useState(false);

  async function loadKnowledge() {
    setKnowledgeLoading(true);
    const res = await fetch("/api/knowledge");
    const data = await res.json();
    setKnowledgeList(data.items ?? []);
    setKnowledgeLoading(false);
  }

  useEffect(() => {
    loadKnowledge();
  }, []);

  async function addKnowledge() {
    const content =
      kMode === "TEXT" ? kText.trim() : kMode === "LINK" ? kLink.trim() : kFileNote.trim();
    if (!content) return;
    setKSaving(true);
    try {
      await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: kMode, title: kTitle.trim(), content }),
      });
      setKTitle("");
      setKText("");
      setKLink("");
      setKFileNote("");
      await loadKnowledge();
    } finally {
      setKSaving(false);
    }
  }

  async function deleteKnowledge(id: string) {
    await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    await loadKnowledge();
  }

  // ---- FAQ ----
  const [faqList, setFaqList] = useState<FaqDb[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqSaving, setFaqSaving] = useState(false);

  async function loadFaqs() {
    setFaqLoading(true);
    const res = await fetch("/api/faq");
    const data = await res.json();
    setFaqList(data.items ?? []);
    setFaqLoading(false);
  }

  useEffect(() => {
    loadFaqs();
  }, []);

  function openNewFaq() {
    setEditingFaqId(null);
    setFaqQuestion("");
    setFaqAnswer("");
    setShowFaqModal(true);
  }

  function openEditFaq(f: FaqDb) {
    setEditingFaqId(f.id);
    setFaqQuestion(f.question);
    setFaqAnswer(f.answer);
    setShowFaqModal(true);
  }

  async function saveFaq() {
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;
    setFaqSaving(true);
    try {
      if (editingFaqId) {
        await fetch(`/api/faq/${editingFaqId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: faqQuestion.trim(), answer: faqAnswer.trim() }),
        });
      } else {
        await fetch("/api/faq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: faqQuestion.trim(), answer: faqAnswer.trim() }),
        });
      }
      setShowFaqModal(false);
      await loadFaqs();
    } finally {
      setFaqSaving(false);
    }
  }

  async function deleteFaq(id: string) {
    await fetch(`/api/faq/${id}`, { method: "DELETE" });
    await loadFaqs();
  }

  // ---- Scenarios ----
  const [scenarioList, setScenarioList] = useState<ScenarioDb[]>([]);
  const [scenarioLoading, setScenarioLoading] = useState(true);
  const [sName, setSName] = useState("");
  const [sKeywords, setSKeywords] = useState("");
  const [sAction, setSAction] = useState<"AUTO_REPLY" | "TO_OPERATOR" | "IGNORE">("AUTO_REPLY");
  const [sReplyText, setSReplyText] = useState("");
  const [sSaving, setSSaving] = useState(false);

  async function loadScenarios() {
    setScenarioLoading(true);
    const res = await fetch("/api/scenarios");
    const data = await res.json();
    setScenarioList(data.items ?? []);
    setScenarioLoading(false);
  }

  useEffect(() => {
    loadScenarios();
  }, []);

  async function addScenario() {
    if (!sName.trim() || !sKeywords.trim()) return;
    setSSaving(true);
    try {
      await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sName.trim(),
          keywords: sKeywords.trim(),
          action: sAction,
          replyText: sReplyText.trim(),
        }),
      });
      setSName("");
      setSKeywords("");
      setSReplyText("");
      setSAction("AUTO_REPLY");
      await loadScenarios();
    } finally {
      setSSaving(false);
    }
  }

  async function deleteScenario(id: string) {
    await fetch(`/api/scenarios/${id}`, { method: "DELETE" });
    await loadScenarios();
  }

  // ---- Test playground ----
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [testInput, setTestInput] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [testMessages, testLoading]);

  async function sendTestMessage() {
    const text = testInput.trim();
    if (!text || testLoading) return;
    setTestError(null);
    const history = testMessages;
    const next = [...history, { role: "user" as const, content: text }];
    setTestMessages(next);
    setTestInput("");
    setTestLoading(true);
    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestError(data.error ?? "Xatolik yuz berdi");
        return;
      }
      setTestMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setTestError("Serverga ulanib bo'lmadi");
    } finally {
      setTestLoading(false);
    }
  }

  const aiLocked = aiAllowed === false;

  return (
    <div className="space-y-5">
      <PageTitle
        title="AI Studio"
        subtitle="Agentning miyasi: bilimlar, javoblar, qoidalar va sinov — bir joyda"
      />

      <div className="relative">
        {aiLocked && (
          <div className="absolute inset-0 z-20 rounded-3xl bg-white/45 backdrop-blur-[1px]">
            <div className="sticky top-28 mx-auto mt-8 w-full max-w-md rounded-2xl border border-electric-100 bg-white/95 p-5 text-center shadow-[0_20px_60px_rgba(15,94,255,0.16)]">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-electric-50 text-electric-600">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="mt-3 font-extrabold">AI Studio VIP tarifda ochiq</h2>
              <p className="mt-1 text-sm text-slate-500">
                Bilimlar bazasi, FAQ, stsenariylar va sinov maydonini ko&apos;rishingiz mumkin,
                lekin sozlash uchun VIP tarif kerak.
              </p>
              <Link
                href="/#pricing"
                className="mt-4 inline-flex rounded-xl bg-electric-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(15,94,255,0.28)]"
              >
                Tariflarni ko&apos;rish
              </Link>
            </div>
          </div>
        )}

        <div className={aiLocked ? "pointer-events-none select-none opacity-45" : undefined}>

      {/* Agent summary strip */}
      <div className="rounded-2xl bg-navy-900 text-white p-5 flex items-center gap-5 flex-wrap relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-10" />
        <div className="relative flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl electric-gradient flex items-center justify-center">
            <Bot className="w-5.5 h-5.5" />
          </span>
          <div>
            <div className="font-bold">{agentName} — sizning AI agentingiz</div>
            <div className="text-xs text-slate-400">
              {agentTone} · O'zbek va rus tillarida
            </div>
          </div>
        </div>
        <div className="relative flex-1" />
        <div className="relative flex items-center gap-6 text-center">
          <div>
            <div className="text-lg font-extrabold">{knowledgeList.length}</div>
            <div className="text-[10px] text-slate-400">Material</div>
          </div>
          <div>
            <div className="text-lg font-extrabold">{faqList.length}</div>
            <div className="text-[10px] text-slate-400">FAQ</div>
          </div>
          <div>
            <div className="text-lg font-extrabold">{scenarioList.length}</div>
            <div className="text-[10px] text-slate-400">Stsenariy</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-colors ${
              tab === t.id
                ? "bg-electric-500 text-white shadow-[0_4px_14px_rgba(15,94,255,0.25)]"
                : "bg-white border border-line text-slate-500 hover:border-electric-200"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ---- Knowledge ---- */}
      {tab === "knowledge" && (
        <div className="grid xl:grid-cols-5 gap-5">
          <div className="xl:col-span-2 rounded-2xl bg-white border border-line p-5 space-y-3 h-fit">
            <h3 className="font-bold text-sm">Yangi material</h3>
            <div className="flex items-center gap-1.5">
              {(
                [
                  ["TEXT", Type, "Matn"],
                  ["LINK", Link2, "Havola"],
                  ["FILE", FileUp, "Fayl"],
                ] as const
              ).map(([m, Icon, label]) => (
                <button
                  key={m}
                  onClick={() => setKMode(m)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
                    kMode === m
                      ? "bg-electric-50 text-electric-600 ring-1 ring-electric-200"
                      : "bg-[#f4f7ff] text-slate-500"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
            <input
              value={kTitle}
              onChange={(e) => setKTitle(e.target.value)}
              placeholder="Nomi (ixtiyoriy)"
              className={inputCls}
            />
            {kMode === "TEXT" && (
              <textarea
                value={kText}
                onChange={(e) => setKText(e.target.value)}
                placeholder="Korxonangiz haqida ma'lumot, narxlar, shartlar..."
                rows={5}
                className={`${inputCls} resize-y`}
              />
            )}
            {kMode === "LINK" && (
              <input
                value={kLink}
                onChange={(e) => setKLink(e.target.value)}
                placeholder="https://saytingiz.uz/sahifa"
                className={inputCls}
              />
            )}
            {kMode === "FILE" && (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400">
                  Hozircha fayl yuklash mavjud emas — fayl mazmunini yoki havolasini matn
                  sifatida kiriting.
                </p>
                <textarea
                  value={kFileNote}
                  onChange={(e) => setKFileNote(e.target.value)}
                  placeholder="Masalan: narxlar ro'yxati havolasi yoki asosiy narxlar matni"
                  rows={4}
                  className={`${inputCls} resize-y`}
                />
              </div>
            )}
            <PrimaryButton onClick={addKnowledge} disabled={kSaving} className="w-full justify-center">
              {kSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Bazaga qo'shish</>}
            </PrimaryButton>
          </div>

          <div className="xl:col-span-3 rounded-2xl bg-white border border-line divide-y divide-line">
            {knowledgeLoading ? (
              <div className="p-5 text-sm text-slate-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
              </div>
            ) : knowledgeList.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                Hali hech qanday material qo'shilmagan
              </div>
            ) : (
              knowledgeList.map((k) => {
                const t = typeMeta[k.type];
                return (
                  <div key={k.id} className="flex items-center gap-4 px-5 py-4">
                    <span className="w-10 h-10 rounded-xl bg-electric-50 flex items-center justify-center shrink-0">
                      <t.icon className="w-4.5 h-4.5 text-electric-600" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{k.title || t.label}</span>
                        <Badge color="blue">{t.label}</Badge>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{k.content}</p>
                    </div>
                    <button
                      onClick={() => deleteKnowledge(k.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ---- FAQ ---- */}
      {tab === "faq" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <PrimaryButton onClick={openNewFaq}>
              <Plus className="w-4 h-4" /> Yangi savol-javob
            </PrimaryButton>
          </div>
          {faqLoading ? (
            <div className="text-sm text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
            </div>
          ) : faqList.length === 0 ? (
            <div className="rounded-2xl bg-white border border-line border-dashed p-8 text-center text-sm text-slate-400">
              Hali hech qanday savol-javob qo'shilmagan
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4">
              {faqList.map((f) => (
                <div key={f.id} className="rounded-2xl bg-white border border-line p-5 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-bold text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-electric-50 text-electric-600 text-[11px] font-extrabold flex items-center justify-center shrink-0">
                        S
                      </span>
                      {f.question}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditFaq(f)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteFaq(f.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[13px] text-slate-500 mt-3 leading-relaxed flex gap-2">
                    <span className="w-6 h-6 rounded-lg bg-navy-900 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">
                      J
                    </span>
                    {f.answer}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- Scenarios ---- */}
      {tab === "scenarios" && (
        <div className="grid xl:grid-cols-5 gap-5">
          <div className="xl:col-span-2 rounded-2xl bg-white border border-line p-5 space-y-3 h-fit">
            <h3 className="font-bold text-sm">Yangi qoida</h3>
            <p className="text-xs text-slate-400">
              AI'dan oldin ishlaydi: kalit so'z kelganda avtojavob berish yoki
              operatorga uzatish
            </p>
            <input
              value={sName}
              onChange={(e) => setSName(e.target.value)}
              placeholder="Qoida nomi"
              className={inputCls}
            />
            <input
              value={sKeywords}
              onChange={(e) => setSKeywords(e.target.value)}
              placeholder="Kalit so'zlar: qaytarish, refund, narx..."
              className={inputCls}
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  ["AUTO_REPLY", Zap, "Avtojavob"],
                  ["TO_OPERATOR", Headset, "Operatorga"],
                  ["IGNORE", Ban, "E'tiborsiz"],
                ] as const
              ).map(([value, Icon, label]) => (
                <button
                  key={value}
                  onClick={() => setSAction(value)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
                    sAction === value
                      ? "bg-electric-50 text-electric-600 ring-1 ring-electric-200"
                      : "bg-[#f4f7ff] text-slate-500"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
            {sAction === "AUTO_REPLY" && (
              <textarea
                value={sReplyText}
                onChange={(e) => setSReplyText(e.target.value)}
                placeholder="Avtojavob matni..."
                rows={3}
                className={`${inputCls} resize-y`}
              />
            )}
            <PrimaryButton onClick={addScenario} disabled={sSaving} className="w-full justify-center">
              {sSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Qoida yaratish</>}
            </PrimaryButton>
          </div>

          <div className="xl:col-span-3 space-y-3">
            {scenarioLoading ? (
              <div className="text-sm text-slate-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
              </div>
            ) : scenarioList.length === 0 ? (
              <div className="rounded-2xl bg-white border border-line border-dashed p-8 text-center text-sm text-slate-400">
                Hali hech qanday qoida qo'shilmagan
              </div>
            ) : (
              scenarioList.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl bg-white border border-line p-5 flex items-center gap-4 group"
                >
                  <span className="w-10 h-10 rounded-xl bg-electric-50 flex items-center justify-center shrink-0">
                    {s.action === "AUTO_REPLY" ? (
                      <Zap className="w-4.5 h-4.5 text-electric-600" />
                    ) : (
                      <Headset className="w-4.5 h-4.5 text-electric-600" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold">{s.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate">
                      Kalit so'zlar: {s.keywords}
                    </div>
                  </div>
                  <Badge color={s.action === "AUTO_REPLY" ? "blue" : "navy"}>
                    {s.action === "AUTO_REPLY" ? "Avtojavob" : s.action === "TO_OPERATOR" ? "Operatorga" : "E'tiborsiz"}
                  </Badge>
                  <Badge color={s.active ? "green" : "gray"} dot>
                    {s.active ? "Faol" : "O'chiq"}
                  </Badge>
                  <button
                    onClick={() => deleteScenario(s.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---- Test playground ---- */}
      {tab === "test" && (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl bg-white border border-line overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl electric-gradient flex items-center justify-center">
                <FlaskConical className="w-4.5 h-4.5 text-white" />
              </span>
              <div>
                <div className="font-bold text-sm">Sinov maydoni</div>
                <div className="text-[11px] text-slate-400">
                  Kanalga ulamasdan agent javoblarini tekshiring
                </div>
              </div>
              <span className="ml-auto">
                <Badge color="blue" dot>
                  Sinov rejimi
                </Badge>
              </span>
            </div>
            <div
              ref={scrollRef}
              className="p-5 space-y-3 bg-[#fafbff] min-h-72 max-h-96 overflow-y-auto thin-scroll"
            >
              {testMessages.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-8">
                  Mijoz sifatida savol yozing — {agentName} javob beradi
                </p>
              )}
              {testMessages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex">
                    <div className="bg-white border border-line rounded-2xl rounded-bl-md px-4 py-2.5 text-sm max-w-[75%]">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-end">
                    <div className="electric-gradient text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm max-w-[75%] whitespace-pre-wrap">
                      <div className="flex items-center gap-1 text-[10px] text-electric-100 font-semibold mb-1">
                        <Sparkles className="w-3 h-3" /> {agentName}
                      </div>
                      {m.content}
                    </div>
                  </div>
                ),
              )}
              {testLoading && (
                <div className="flex justify-end">
                  <div className="electric-gradient text-white rounded-2xl rounded-br-md px-4 py-2.5 text-sm flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Yozmoqda...
                  </div>
                </div>
              )}
            </div>
            {testError && (
              <div className="px-5 py-2 text-xs text-red-500 border-t border-line">
                {testError}
              </div>
            )}
            <div className="px-5 py-4 border-t border-line flex items-center gap-3">
              <input
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendTestMessage()}
                placeholder="Mijoz sifatida savol yozing..."
                className="flex-1 bg-[#f4f7ff] rounded-xl px-4 py-3 text-sm outline-none placeholder:text-slate-300"
              />
              <button
                onClick={sendTestMessage}
                disabled={testLoading}
                className="w-10 h-10 rounded-xl electric-gradient flex items-center justify-center text-white shrink-0 disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">
            Javoblar Claude Haiku 4.5 + bilimlar bazasi va FAQ'ga asoslanadi
          </p>
        </div>
      )}

        </div>
      </div>

      {showFaqModal && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="rounded-2xl bg-white w-full max-w-md p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">
                {editingFaqId ? "Savol-javobni tahrirlash" : "Yangi savol-javob"}
              </h3>
              <button
                onClick={() => setShowFaqModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={faqQuestion}
              onChange={(e) => setFaqQuestion(e.target.value)}
              placeholder="Savol"
              rows={2}
              className={`${inputCls} resize-y`}
            />
            <textarea
              value={faqAnswer}
              onChange={(e) => setFaqAnswer(e.target.value)}
              placeholder="Javob"
              rows={4}
              className={`${inputCls} resize-y`}
            />
            <PrimaryButton onClick={saveFaq} disabled={faqSaving} className="w-full justify-center">
              {faqSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
