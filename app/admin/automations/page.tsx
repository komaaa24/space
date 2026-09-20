"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  X,
  Loader2,
  Trash2,
  MessageCircle,
  Send,
  ChevronRight,
  ChevronLeft,
  Zap,
  Workflow,
} from "lucide-react";
import { Badge, PageTitle, PrimaryButton, inputCls } from "@/components/ui";

type AutomationKind = "LEAD_FLOW" | "AUTO_REPLY";

interface ChannelOption {
  id: string;
  type: string;
  handle: string | null;
}

interface AutomationDb {
  id: string;
  name: string;
  kind: AutomationKind;
  active: boolean;
  channel: { id: string; type: string; handle: string | null };
  triggerOnDm: boolean;
  triggerOnComment: boolean;
  matchAny: boolean;
  keywords: string | null;
  exactMatch: boolean;
  allPosts: boolean;
  mediaIds: string[] | null;
  checkSubscription: boolean;
  replyMessage: string | null;
  welcomeMessage: string | null;
  welcomeButtonLabel: string | null;
  notSubscribedMessage: string | null;
  notSubscribedButtonLabel: string | null;
  deliveredMessage: string | null;
  deliveredButtonLabel: string | null;
  deliveredLinkUrl: string | null;
  publicReplyEnabled: boolean;
  publicReplyVariants: string[] | null;
  reminderEnabled: boolean;
  reminderMinutes: number | null;
  reminderMessage: string | null;
  followUpEnabled: boolean;
  followUpMinutes: number | null;
  followUpMessage: string | null;
  _count: { runs: number };
}

interface MediaItem {
  id: string;
  caption?: string;
  thumbnailUrl?: string;
  permalink?: string;
}

interface Analytics {
  started: number;
  delivered: number;
  clicked: number;
}

interface AccessData {
  plan: "FREE" | "PRO" | "VIP";
  features: { instagramAutomation: boolean };
  usage: {
    automationUsedThisMonth: number;
    automationMonthlyLimit: number | null;
    automationRemaining: number | null;
  };
}

const emptyForm = {
  name: "",
  channelId: "",
  replyMessage: "",
  triggerOnDm: true,
  triggerOnComment: false,
  matchAny: true,
  keywords: "",
  exactMatch: false,
  allPosts: true,
  selectedMediaIds: [] as string[],
  checkSubscription: true,
  welcomeMessage: "",
  welcomeButtonLabel: "Olish",
  notSubscribedMessage: "",
  notSubscribedButtonLabel: "✅ Tayyor",
  deliveredMessage: "",
  deliveredButtonLabel: "Havolani ko'rish",
  deliveredLinkUrl: "",
  publicReplyEnabled: false,
  publicReplyVariants: [""] as string[],
  reminderEnabled: false,
  reminderMinutes: 10,
  reminderMessage: "",
  followUpEnabled: false,
  followUpMinutes: 60,
  followUpMessage: "",
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<AutomationDb[]>([]);
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsById, setAnalyticsById] = useState<Record<string, Analytics>>({});
  const [access, setAccess] = useState<AccessData | null>(null);

  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showSimpleForm, setShowSimpleForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [autoRes, chRes] = await Promise.all([fetch("/api/automations"), fetch("/api/channels")]);
    const autoData = await autoRes.json();
    const chData = await chRes.json();
    const list: AutomationDb[] = autoData.automations ?? [];
    setAutomations(list);
    setAccess(autoData.access ?? null);
    setChannels((chData.channels ?? []).filter((c: ChannelOption) => c.type === "INSTAGRAM"));
    setLoading(false);

    list.forEach((a) => {
      fetch(`/api/automations/${a.id}/analytics`)
        .then((r) => r.json())
        .then((d) => setAnalyticsById((prev) => ({ ...prev, [a.id]: d })))
        .catch(() => {});
    });
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!showWizard || !form.triggerOnComment || form.allPosts || !form.channelId) return;
    setMediaLoading(true);
    fetch(`/api/instagram/media?channelId=${form.channelId}`)
      .then((r) => r.json())
      .then((d) => setMedia(d.media ?? []))
      .finally(() => setMediaLoading(false));
  }, [showWizard, form.triggerOnComment, form.allPosts, form.channelId]);

  function openCreate() {
    setEditingId(null);
    setError(null);
    setShowTemplatePicker(true);
  }

  function chooseTemplate(selectedKind: AutomationKind) {
    setShowTemplatePicker(false);
    setForm({ ...emptyForm, channelId: channels[0]?.id ?? "" });
    setStep(1);
    setError(null);
    if (selectedKind === "AUTO_REPLY") {
      setShowSimpleForm(true);
    } else {
      setShowWizard(true);
    }
  }

  function openEdit(a: AutomationDb) {
    setEditingId(a.id);
    setForm({
      name: a.name,
      channelId: a.channel.id,
      replyMessage: a.replyMessage ?? "",
      triggerOnDm: a.triggerOnDm,
      triggerOnComment: a.triggerOnComment,
      matchAny: a.matchAny,
      keywords: a.keywords ?? "",
      exactMatch: a.exactMatch,
      allPosts: a.allPosts,
      selectedMediaIds: a.mediaIds ?? [],
      checkSubscription: a.checkSubscription,
      welcomeMessage: a.welcomeMessage ?? "",
      welcomeButtonLabel: a.welcomeButtonLabel ?? "Olish",
      notSubscribedMessage: a.notSubscribedMessage ?? "",
      notSubscribedButtonLabel: a.notSubscribedButtonLabel ?? "✅ Tayyor",
      deliveredMessage: a.deliveredMessage ?? "",
      deliveredButtonLabel: a.deliveredButtonLabel ?? "Havolani ko'rish",
      deliveredLinkUrl: a.deliveredLinkUrl ?? "",
      publicReplyEnabled: a.publicReplyEnabled,
      publicReplyVariants: a.publicReplyVariants?.length ? a.publicReplyVariants : [""],
      reminderEnabled: a.reminderEnabled,
      reminderMinutes: a.reminderMinutes ?? 10,
      reminderMessage: a.reminderMessage ?? "",
      followUpEnabled: a.followUpEnabled,
      followUpMinutes: a.followUpMinutes ?? 60,
      followUpMessage: a.followUpMessage ?? "",
    });
    setStep(1);
    setError(null);
    if (a.kind === "AUTO_REPLY") {
      setShowSimpleForm(true);
    } else {
      setShowWizard(true);
    }
  }

  async function save() {
    if (!form.name.trim() || !form.channelId) {
      setError("Nomi va kanal tanlanishi kerak");
      setStep(1);
      return;
    }
    if (!form.triggerOnDm && !form.triggerOnComment) {
      setError("Kamida bitta trigger turi (DM yoki Komment) tanlanishi kerak");
      setStep(1);
      return;
    }
    if (!form.welcomeMessage.trim() || !form.notSubscribedMessage.trim() || !form.deliveredMessage.trim() || !form.deliveredLinkUrl.trim()) {
      setError("2-qadamdagi barcha xabar va havola maydonlari to'ldirilishi kerak");
      setStep(2);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        kind: "LEAD_FLOW",
        mediaIds: form.selectedMediaIds,
        publicReplyVariants: form.publicReplyVariants.filter((v) => v.trim()),
      };
      const res = await fetch(editingId ? `/api/automations/${editingId}` : "/api/automations", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Xatolik yuz berdi");
        return;
      }
      setShowWizard(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function saveSimple() {
    if (!form.name.trim() || !form.channelId) {
      setError("Nomi va kanal tanlanishi kerak");
      return;
    }
    if (!form.matchAny && !form.keywords.trim()) {
      setError("Kalit so'zlarni kiriting");
      return;
    }
    if (!form.replyMessage.trim()) {
      setError("Javob matni kiritilishi kerak");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        channelId: form.channelId,
        kind: "AUTO_REPLY",
        matchAny: form.matchAny,
        keywords: form.keywords,
        exactMatch: form.exactMatch,
        replyMessage: form.replyMessage,
      };
      const res = await fetch(editingId ? `/api/automations/${editingId}` : "/api/automations", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Xatolik yuz berdi");
        return;
      }
      setShowSimpleForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(a: AutomationDb) {
    await fetch(`/api/automations/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !a.active }),
    });
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/automations/${id}`, { method: "DELETE" });
    await load();
  }

  function toggleMedia(id: string) {
    setForm((f) => ({
      ...f,
      selectedMediaIds: f.selectedMediaIds.includes(id)
        ? f.selectedMediaIds.filter((m) => m !== id)
        : [...f.selectedMediaIds, id],
    }));
  }

  return (
    <div className="space-y-5">
      <PageTitle
        title="Avtomatizatsiya"
        subtitle="DM yoki kommentga qattiq oqim bilan avtomatik javob — AI'dan mustaqil ishlaydi"
        action={
          <PrimaryButton onClick={openCreate} disabled={channels.length === 0}>
            <Plus className="w-4 h-4" /> Yangi avtomatizatsiya
          </PrimaryButton>
        }
      />

      {access?.usage.automationMonthlyLimit !== null && access && (
        <div className="rounded-2xl bg-white border border-line p-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold">FREE automation limiti</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Bu oy {access.usage.automationUsedThisMonth}/{access.usage.automationMonthlyLimit} odam ishlatilgan
            </div>
          </div>
          <Badge color={access.usage.automationRemaining === 0 ? "red" : "blue"}>
            {access.usage.automationRemaining} qoldi
          </Badge>
        </div>
      )}

      {channels.length === 0 && !loading && (
        <div className="rounded-2xl bg-white border border-line border-dashed p-6 text-sm text-slate-400">
          Avtomatizatsiya yaratish uchun avval Kanallar bo'limidan Instagram akkauntini ulang.
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Yuklanmoqda...
        </div>
      ) : automations.length === 0 ? (
        channels.length > 0 && (
          <div className="rounded-2xl bg-white border border-line border-dashed p-10 text-center text-sm text-slate-400">
            Hali avtomatizatsiya yo'q — "Yangi avtomatizatsiya" tugmasi bilan boshlang
          </div>
        )
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {automations.map((a) => {
            const stats = analyticsById[a.id];
            return (
              <div
                key={a.id}
                className="rounded-2xl bg-white border border-line hover:border-electric-300 transition-all p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.triggerOnDm && (
                      <Badge color="blue">
                        <Send className="w-3 h-3 mr-1 inline" /> DM
                      </Badge>
                    )}
                    {a.triggerOnComment && (
                      <Badge color="blue">
                        <MessageCircle className="w-3 h-3 mr-1 inline" /> Komment
                      </Badge>
                    )}
                  </div>
                  <button onClick={() => toggleActive(a)}>
                    <Badge color={a.active ? "green" : "gray"} dot>
                      {a.active ? "Yoqilgan" : "O'chirilgan"}
                    </Badge>
                  </button>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-electric-500 mt-3">
                  {a.kind === "AUTO_REPLY" ? "Avtojavob" : "Kalit so'z bilan chat bot"}
                </div>
                <div className="font-bold text-[14.5px] mt-0.5 leading-snug">{a.name}</div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {a.channel.handle ?? "..."}
                </div>

                {stats && (
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div>
                      <div className="font-bold text-sm">{stats.started}</div>
                      <div className="text-[10px] text-slate-400">Boshladi</div>
                    </div>
                    <div>
                      <div className="font-bold text-sm">{stats.delivered}</div>
                      <div className="text-[10px] text-slate-400">Yetkazildi</div>
                    </div>
                    <div>
                      <div className="font-bold text-sm">{stats.clicked}</div>
                      <div className="text-[10px] text-slate-400">Havola olindi</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
                  <button
                    onClick={() => openEdit(a)}
                    className="text-xs font-semibold text-electric-600"
                  >
                    Tahrirlash
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showTemplatePicker && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="rounded-2xl bg-white w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">Avtomatizatsiya turini tanlang</h3>
              <button
                onClick={() => setShowTemplatePicker(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => chooseTemplate("LEAD_FLOW")}
              className="w-full flex items-start gap-3.5 rounded-2xl border border-line hover:border-electric-300 hover:shadow-[0_8px_24px_rgba(15,94,255,0.08)] transition-all p-4 text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-electric-50 flex items-center justify-center shrink-0">
                <Workflow className="w-5.5 h-5.5 text-electric-600" />
              </div>
              <div>
                <div className="font-bold text-sm">Kalit so'z bilan chat bot</div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  To'liq oqim: obunani tekshiradi, agar obuna bo'lmasa qayta so'raydi, keyin
                  material/havolani yetkazadi, bosilmasa eslatma yuboradi. DM va/yoki kommentga
                  ishlaydi.
                </p>
              </div>
            </button>

            <button
              onClick={() => chooseTemplate("AUTO_REPLY")}
              className="w-full flex items-start gap-3.5 rounded-2xl border border-line hover:border-electric-300 hover:shadow-[0_8px_24px_rgba(15,94,255,0.08)] transition-all p-4 text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-electric-50 flex items-center justify-center shrink-0">
                <Zap className="w-5.5 h-5.5 text-electric-600" />
              </div>
              <div>
                <div className="font-bold text-sm">Avtojavob</div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Sodda: DM'ga kalit so'z yoki istalgan xabar yozilsa, bitta oddiy avtomatik javob
                  yuboriladi. Obuna tekshirilmaydi, tugma yo'q.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {showSimpleForm && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="rounded-2xl bg-white w-full max-w-md p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">
                {editingId ? "Avtojavobni tahrirlash" : "Yangi avtojavob"}
              </h3>
              <button
                onClick={() => setShowSimpleForm(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nomi (masalan: Narx so'rovlariga javob)"
              className={inputCls}
            />
            <select
              value={form.channelId}
              onChange={(e) => setForm((f) => ({ ...f, channelId: e.target.value }))}
              className={inputCls}
            >
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.handle ?? c.id}
                </option>
              ))}
            </select>

            <div className="flex gap-4 text-[13px]">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={form.matchAny}
                  onChange={() => setForm((f) => ({ ...f, matchAny: true }))}
                />
                Istalgan xabar
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={!form.matchAny}
                  onChange={() => setForm((f) => ({ ...f, matchAny: false }))}
                />
                Kalit so'zli
              </label>
            </div>
            {!form.matchAny && (
              <>
                <input
                  value={form.keywords}
                  onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                  placeholder="Masalan: narxi, hoxlayman, havola"
                  className={inputCls}
                />
                <label className="flex items-center gap-1.5 text-[12px] text-slate-500">
                  <input
                    type="checkbox"
                    checked={form.exactMatch}
                    onChange={(e) => setForm((f) => ({ ...f, exactMatch: e.target.checked }))}
                  />
                  Aniq mos kelishi
                </label>
              </>
            )}

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Avtomatik javob matni
              </div>
              <textarea
                value={form.replyMessage}
                onChange={(e) => setForm((f) => ({ ...f, replyMessage: e.target.value }))}
                rows={3}
                className={inputCls}
              />
            </div>

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            <PrimaryButton onClick={saveSimple} disabled={saving} className="w-full justify-center">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingId ? (
                "Saqlash"
              ) : (
                "Yaratish"
              )}
            </PrimaryButton>
          </div>
        </div>
      )}

      {showWizard && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="rounded-2xl bg-white w-full max-w-lg p-6 space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold">
                  {editingId ? "Avtomatizatsiyani tahrirlash" : "Yangi avtomatizatsiya"}
                </h3>
                <div className="text-[11px] text-slate-400 mt-0.5">Qadam {step} / 3</div>
              </div>
              <button
                onClick={() => setShowWizard(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {step === 1 && (
              <div className="space-y-3.5">
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Avtomatizatsiya nomi (masalan: Lid-magnit)"
                  className={inputCls}
                />
                <select
                  value={form.channelId}
                  onChange={(e) => setForm((f) => ({ ...f, channelId: e.target.value }))}
                  className={inputCls}
                >
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.handle ?? c.id}
                    </option>
                  ))}
                </select>

                <label className="flex items-center justify-between rounded-xl bg-[#f4f7ff] px-3.5 py-2.5 text-[13px] font-semibold">
                  Obunani tekshirish
                  <input
                    type="checkbox"
                    checked={form.checkSubscription}
                    onChange={(e) => setForm((f) => ({ ...f, checkSubscription: e.target.checked }))}
                  />
                </label>

                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Trigger turi
                </div>
                <label className="flex items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={form.triggerOnDm}
                    onChange={(e) => setForm((f) => ({ ...f, triggerOnDm: e.target.checked }))}
                  />
                  Sообщение в Direct (DM)
                </label>
                <label className="flex items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={form.triggerOnComment}
                    onChange={(e) => setForm((f) => ({ ...f, triggerOnComment: e.target.checked }))}
                  />
                  Komment (post/Reels)
                </label>

                <div className="flex gap-4 text-[13px]">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={form.matchAny}
                      onChange={() => setForm((f) => ({ ...f, matchAny: true }))}
                    />
                    Istalgan xabar
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={!form.matchAny}
                      onChange={() => setForm((f) => ({ ...f, matchAny: false }))}
                    />
                    Kalit so'zli
                  </label>
                </div>
                {!form.matchAny && (
                  <>
                    <input
                      value={form.keywords}
                      onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                      placeholder="Masalan: narxi, hoxlayman, havola"
                      className={inputCls}
                    />
                    <label className="flex items-center gap-1.5 text-[12px] text-slate-500">
                      <input
                        type="checkbox"
                        checked={form.exactMatch}
                        onChange={(e) => setForm((f) => ({ ...f, exactMatch: e.target.checked }))}
                      />
                      Aniq mos kelishi
                    </label>
                  </>
                )}

                {form.triggerOnComment && (
                  <>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mt-2">
                      Komment doirasi
                    </div>
                    <div className="flex gap-4 text-[13px]">
                      <label className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          checked={form.allPosts}
                          onChange={() => setForm((f) => ({ ...f, allPosts: true }))}
                        />
                        Barcha postlar
                      </label>
                      <label className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          checked={!form.allPosts}
                          onChange={() => setForm((f) => ({ ...f, allPosts: false }))}
                        />
                        Tanlangan postlar
                      </label>
                    </div>
                    {!form.allPosts && (
                      <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto">
                        {mediaLoading ? (
                          <div className="col-span-4 text-xs text-slate-400 py-4 text-center">
                            <Loader2 className="w-4 h-4 animate-spin inline" />
                          </div>
                        ) : (
                          media.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => toggleMedia(m.id)}
                              className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                                form.selectedMediaIds.includes(m.id)
                                  ? "border-electric-500"
                                  : "border-transparent"
                              }`}
                            >
                              {m.thumbnailUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={m.thumbnailUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-100" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Salomlashish xabari
                  </div>
                  <textarea
                    value={form.welcomeMessage}
                    onChange={(e) => setForm((f) => ({ ...f, welcomeMessage: e.target.value }))}
                    rows={3}
                    className={inputCls}
                  />
                  <input
                    value={form.welcomeButtonLabel}
                    onChange={(e) => setForm((f) => ({ ...f, welcomeButtonLabel: e.target.value }))}
                    placeholder="Tugma matni (masalan: Olish)"
                    className={`${inputCls} mt-1.5`}
                  />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Agar obuna bo'lmasa
                  </div>
                  <textarea
                    value={form.notSubscribedMessage}
                    onChange={(e) => setForm((f) => ({ ...f, notSubscribedMessage: e.target.value }))}
                    rows={2}
                    className={inputCls}
                  />
                  <input
                    value={form.notSubscribedButtonLabel}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notSubscribedButtonLabel: e.target.value }))
                    }
                    placeholder="Tugma matni (masalan: ✅ Tayyor)"
                    className={`${inputCls} mt-1.5`}
                  />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Obunadan/tekshiruvdan keyin
                  </div>
                  <textarea
                    value={form.deliveredMessage}
                    onChange={(e) => setForm((f) => ({ ...f, deliveredMessage: e.target.value }))}
                    rows={2}
                    className={inputCls}
                  />
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <input
                      value={form.deliveredButtonLabel}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, deliveredButtonLabel: e.target.value }))
                      }
                      placeholder="Havola nomi"
                      className={inputCls}
                    />
                    <input
                      value={form.deliveredLinkUrl}
                      onChange={(e) => setForm((f) => ({ ...f, deliveredLinkUrl: e.target.value }))}
                      placeholder="https://..."
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                {form.triggerOnComment && (
                  <div className="border-b border-line pb-4">
                    <label className="flex items-center justify-between text-[13px] font-semibold">
                      Ochiq (public) avtojavob kommentga
                      <input
                        type="checkbox"
                        checked={form.publicReplyEnabled}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, publicReplyEnabled: e.target.checked }))
                        }
                      />
                    </label>
                    {form.publicReplyEnabled && (
                      <div className="space-y-1.5 mt-2">
                        {form.publicReplyVariants.map((v, i) => (
                          <input
                            key={i}
                            value={v}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                publicReplyVariants: f.publicReplyVariants.map((x, idx) =>
                                  idx === i ? e.target.value : x,
                                ),
                              }))
                            }
                            placeholder="Masalan: Barcha ma'lumot Directda ✅"
                            className={`${inputCls} text-[13px] py-2`}
                          />
                        ))}
                        <button
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              publicReplyVariants: [...f.publicReplyVariants, ""],
                            }))
                          }
                          className="text-[11px] font-semibold text-electric-600"
                        >
                          + variant qo'shish
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-b border-line pb-4">
                  <label className="flex items-center justify-between text-[13px] font-semibold">
                    Havolani bosmasa eslatma
                    <input
                      type="checkbox"
                      checked={form.reminderEnabled}
                      onChange={(e) => setForm((f) => ({ ...f, reminderEnabled: e.target.checked }))}
                    />
                  </label>
                  {form.reminderEnabled && (
                    <div className="space-y-1.5 mt-2">
                      <input
                        type="number"
                        value={form.reminderMinutes}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, reminderMinutes: Number(e.target.value) }))
                        }
                        placeholder="Necha daqiqadan keyin"
                        className={`${inputCls} text-[13px] py-2`}
                      />
                      <textarea
                        value={form.reminderMessage}
                        onChange={(e) => setForm((f) => ({ ...f, reminderMessage: e.target.value }))}
                        rows={2}
                        placeholder="Eslatma matni"
                        className={`${inputCls} text-[13px]`}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center justify-between text-[13px] font-semibold">
                    Havolani bosgandan keyin qo'shimcha xabar
                    <input
                      type="checkbox"
                      checked={form.followUpEnabled}
                      onChange={(e) => setForm((f) => ({ ...f, followUpEnabled: e.target.checked }))}
                    />
                  </label>
                  {form.followUpEnabled && (
                    <div className="space-y-1.5 mt-2">
                      <input
                        type="number"
                        value={form.followUpMinutes}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, followUpMinutes: Number(e.target.value) }))
                        }
                        placeholder="Necha daqiqadan keyin"
                        className={`${inputCls} text-[13px] py-2`}
                      />
                      <textarea
                        value={form.followUpMessage}
                        onChange={(e) => setForm((f) => ({ ...f, followUpMessage: e.target.value }))}
                        rows={2}
                        placeholder="Xabar matni"
                        className={`${inputCls} text-[13px]`}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            <div className="flex items-center justify-between pt-2">
              {step > 1 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-1 text-[13px] font-semibold text-slate-500"
                >
                  <ChevronLeft className="w-4 h-4" /> Orqaga
                </button>
              ) : (
                <span />
              )}
              {step < 3 ? (
                <PrimaryButton onClick={() => setStep((s) => s + 1)}>
                  Keyingisi <ChevronRight className="w-4 h-4" />
                </PrimaryButton>
              ) : (
                <PrimaryButton onClick={save} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingId ? (
                    "Saqlash"
                  ) : (
                    "Yaratish"
                  )}
                </PrimaryButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
