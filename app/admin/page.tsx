import Link from "next/link";
import {
  MessagesSquare,
  Mail,
  CheckCircle2,
  Timer,
  ArrowUpRight,
  Bot,
  Send,
  Briefcase,
  Star,
  ShieldAlert,
  Lightbulb,
} from "lucide-react";
import { Card, CardHeader, StatCard, Avatar, Badge } from "@/components/ui";
import { Instagram } from "@/components/brand-icons";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const dayLabels = ["Ya", "Du", "Se", "Cho", "Pa", "Ju", "Sha"]; // JS getDay(): 0=Yakshanba

const categoryMeta = {
  LEAD: { label: "Lead", icon: Briefcase, color: "#10b981" },
  INTERESTED: { label: "Qiziqish bildirgan", icon: Star, color: "#3b82f6" },
  COMPLAINT: { label: "Shikoyat", icon: ShieldAlert, color: "#ef4444" },
  SUGGESTION: { label: "Taklif", icon: Lightbulb, color: "#f59e0b" },
} as const;

export default async function AdminDashboard() {
  const session = await getSession();
  const clientId = session?.clientId ?? null;

  const client = clientId
    ? await prisma.client.findUnique({ where: { id: clientId } })
    : null;
  const companyFirstWord = client?.company?.split(" ")[0] ?? "";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalConversations,
    totalMessages,
    conversationsWithOperator,
    todayAiReplies,
    newLeads,
    knowledgeCount,
    faqCount,
    channelCount,
    requestCounts,
    recentConversations,
    recentMessagesForChart,
    allMessagesForResponseTime,
  ] = clientId
    ? await Promise.all([
        prisma.conversation.count({ where: { clientId } }),
        prisma.message.count({ where: { conversation: { clientId } } }),
        prisma.conversation.count({
          where: { clientId, messages: { some: { role: "OPERATOR" } } },
        }),
        prisma.message.count({
          where: {
            conversation: { clientId },
            role: "AI",
            createdAt: { gte: startOfToday },
          },
        }),
        prisma.request.count({
          where: { clientId, category: "LEAD", status: "NEW" },
        }),
        prisma.knowledgeItem.count({ where: { clientId } }),
        prisma.faq.count({ where: { clientId } }),
        prisma.channel.count({ where: { clientId } }),
        prisma.request.groupBy({
          by: ["category"],
          where: { clientId },
          _count: true,
        }),
        prisma.conversation.findMany({
          where: { clientId },
          orderBy: { lastMessageAt: "desc" },
          take: 4,
          include: {
            channel: true,
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        }),
        prisma.message.findMany({
          where: { conversation: { clientId }, createdAt: { gte: sevenDaysAgo } },
          select: { createdAt: true },
        }),
        prisma.message.findMany({
          where: { conversation: { clientId } },
          orderBy: { createdAt: "asc" },
          select: { role: true, createdAt: true, conversationId: true },
        }),
      ])
    : [0, 0, 0, 0, 0, 0, 0, 0, [], [], [], []];

  const weeklyDialogs = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - (6 - i));
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const count = recentMessagesForChart.filter(
      (m) => m.createdAt >= dayStart && m.createdAt < dayEnd,
    ).length;
    return { day: dayLabels[dayStart.getDay()], count };
  });
  const maxCount = Math.max(1, ...weeklyDialogs.map((d) => d.count));

  let totalGapMs = 0;
  let gapCount = 0;
  const lastUserByConv = new Map<string, Date>();
  for (const m of allMessagesForResponseTime) {
    if (m.role === "USER") {
      lastUserByConv.set(m.conversationId, m.createdAt);
    } else if (m.role === "AI") {
      const userTime = lastUserByConv.get(m.conversationId);
      if (userTime) {
        totalGapMs += m.createdAt.getTime() - userTime.getTime();
        gapCount++;
        lastUserByConv.delete(m.conversationId);
      }
    }
  }
  const avgResponseSeconds = gapCount > 0 ? Math.round(totalGapMs / gapCount / 1000) : null;
  const resolvedPct =
    totalConversations > 0
      ? Math.round(((totalConversations - conversationsWithOperator) / totalConversations) * 100)
      : null;

  const requestCountByCategory: Record<string, number> = {};
  for (const r of requestCounts) {
    requestCountByCategory[r.category] = r._count;
  }
  const maxRequestCount = Math.max(1, ...Object.values(requestCountByCategory));

  return (
    <div className="space-y-6">
      {/* Greeting row */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">
            Xayrli kun{companyFirstWord ? `, ${companyFirstWord}` : ""} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Agent bugun{" "}
            <span className="font-semibold text-electric-600">
              {todayAiReplies} ta xabarga
            </span>{" "}
            javob berdi va{" "}
            <span className="font-semibold text-electric-600">{newLeads} ta yangi lead</span>{" "}
            yig'di
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Agent onlayn
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          hero
          icon={<MessagesSquare className="w-4.5 h-4.5" />}
          value={String(totalConversations)}
          label="Jami dialoglar"
        />
        <StatCard
          icon={<Mail className="w-4.5 h-4.5" />}
          value={String(totalMessages)}
          label="Xabarlar"
        />
        <StatCard
          icon={<CheckCircle2 className="w-4.5 h-4.5" />}
          value={resolvedPct !== null ? `${resolvedPct}%` : "—"}
          label="AI mustaqil hal qildi"
        />
        <StatCard
          icon={<Timer className="w-4.5 h-4.5" />}
          value={avgResponseSeconds !== null ? `${avgResponseSeconds} s` : "—"}
          label="O'rtacha javob vaqti"
        />
      </div>

      <div className="grid xl:grid-cols-5 gap-5">
        {/* Weekly bars */}
        <Card className="xl:col-span-3">
          <CardHeader
            title="Haftalik faollik"
            subtitle="Kunlar bo'yicha xabarlar"
            action={
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-electric-500" /> Bugun
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-electric-100" /> Oldingi kunlar
                </span>
              </div>
            }
          />
          <div className="px-6 pb-6 pt-3 flex items-end justify-between gap-3 h-52">
            {weeklyDialogs.map((d, i) => (
              <div
                key={`${d.day}-${i}`}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
              >
                <span className="text-[11px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.count}
                </span>
                <div
                  className={`w-full max-w-12 rounded-t-lg transition-colors ${
                    i === weeklyDialogs.length - 1
                      ? "electric-gradient"
                      : "bg-electric-100 group-hover:bg-electric-200"
                  }`}
                  style={{ height: `${(d.count / maxCount) * 100}%` }}
                />
                <span className="text-[11px] text-slate-400">{d.day}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Live feed */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="Jonli lenta"
            subtitle="So'nggi murojaatlar"
            action={
              <Link
                href="/admin/inbox"
                className="text-xs font-semibold text-electric-600 hover:text-electric-700 flex items-center gap-0.5"
              >
                Inbox <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          {recentConversations.length === 0 ? (
            <div className="px-6 pb-6 text-sm text-slate-400 text-center py-6">
              Hali murojaat yo'q — kanal ulanib, mijoz yozganda shu yerda ko'rinadi.
            </div>
          ) : (
            <div className="px-3 pb-3">
              {recentConversations.map((c) => (
                <Link
                  key={c.id}
                  href="/admin/inbox"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f4f7ff] transition-colors"
                >
                  <div className="relative">
                    <Avatar name={c.contactName ?? "?"} />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-md bg-white flex items-center justify-center border border-line">
                      {c.channel.type === "INSTAGRAM" ? (
                        <Instagram className="w-2.5 h-2.5 text-pink-500" />
                      ) : (
                        <Send className="w-2.5 h-2.5 text-sky-500" />
                      )}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold">{c.contactName ?? "Mijoz"}</div>
                    <div className="text-xs text-slate-400 truncate">
                      {c.messages[0]?.content ?? ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {c.status === "ANSWERED" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 mt-0.5">
                        <Bot className="w-3 h-3" /> AI
                      </span>
                    ) : (
                      <span className="inline-block w-2 h-2 rounded-full bg-electric-500 mt-1" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid xl:grid-cols-3 gap-5">
        {/* Request categories */}
        <Card>
          <CardHeader title="Arizalar taqsimoti" subtitle="Kategoriya bo'yicha" />
          <div className="px-6 pb-6 space-y-3.5">
            {Object.values(requestCountByCategory).every((v) => !v) &&
            Object.keys(requestCountByCategory).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                Hali ariza yo'q
              </p>
            ) : (
              (Object.keys(categoryMeta) as (keyof typeof categoryMeta)[]).map((key) => {
                const meta = categoryMeta[key];
                const count = requestCountByCategory[key] ?? 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-[12.5px] font-medium w-32 shrink-0 text-slate-600">
                      {meta.label}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full electric-gradient"
                        style={{ width: `${(count / maxRequestCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold w-6 text-right">{count}</span>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Popular questions (client's own FAQ) */}
        <Card>
          <CardHeader title="Savol-javoblar" subtitle="AI shu FAQ'dan javob beradi" />
          <div className="px-6 pb-6 space-y-2.5">
            {faqCount === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                Hali FAQ qo'shilmagan —{" "}
                <Link href="/admin/ai" className="text-electric-600 font-semibold">
                  AI Studio
                </Link>
                da qo'shing
              </p>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">
                {faqCount} ta savol-javob bazada —{" "}
                <Link href="/admin/ai" className="text-electric-600 font-semibold">
                  AI Studio
                </Link>
                da ko'ring
              </p>
            )}
          </div>
        </Card>

        {/* Agent status card */}
        <div className="rounded-2xl bg-navy-900 text-white p-6 relative overflow-hidden">
          <div className="absolute inset-0 dot-grid opacity-10" />
          <div className="relative">
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-xl electric-gradient flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </span>
              <div>
                <div className="font-bold">
                  {client?.agentName || "AI agent"} — AI agent
                </div>
                <div className="text-[11px] text-slate-400">
                  Bilimlar bazasi: {knowledgeCount} material · FAQ: {faqCount} ta
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-lg font-extrabold">{channelCount}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Ulangan kanal
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-lg font-extrabold">24/7</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Ish rejimi
                </div>
              </div>
            </div>
            <Link
              href="/admin/ai"
              className="mt-4 flex items-center justify-center gap-1.5 bg-electric-500 hover:bg-electric-600 text-[13px] font-semibold py-2.5 rounded-xl transition-colors"
            >
              AI Studio'ni ochish <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
