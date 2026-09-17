import Link from "next/link";
import {
  Building2,
  Users,
  MessagesSquare,
  ArrowUpRight,
} from "lucide-react";
import { Badge, Card, CardHeader, PageTitle, StatCard } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const clientStatusMeta = {
  ACTIVE: { label: "Faol", color: "green" as const },
  TRIAL: { label: "Sinov", color: "blue" as const },
  EXPIRED: { label: "Muddati o'tgan", color: "yellow" as const },
  BLOCKED: { label: "Bloklangan", color: "red" as const },
};

const planLabels = { FREE: "FREE", PRO: "PRO", VIP: "VIP" };

export default async function OwnerDashboard() {
  const recentLeads = await prisma.platformLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newLeads7d = await prisma.platformLead.count({
    where: { createdAt: { gte: sevenDaysAgo } },
  });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalClients, activeClients, trialClients, dialogs30d, clients, dialogsThisMonthByClient] =
    await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { status: "ACTIVE" } }),
      prisma.client.count({ where: { status: "TRIAL" } }),
      prisma.conversation.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.client.findMany({
        orderBy: { createdAt: "desc" },
        include: { channels: { select: { id: true } } },
      }),
      prisma.conversation.groupBy({
        by: ["clientId"],
        where: { createdAt: { gte: startOfMonth } },
        _count: true,
      }),
    ]);
  const dialogsByClientId = new Map(
    dialogsThisMonthByClient.map((d) => [d.clientId, d._count]),
  );

  return (
    <div className="space-y-6">
      <PageTitle
        title="Boshqaruv markazi"
        subtitle="Platforma bo'yicha umumiy ko'rsatkichlar"
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          hero
          icon={<Building2 className="w-4.5 h-4.5" />}
          value={String(totalClients)}
          label={`Mijozlar — ${activeClients} faol, ${trialClients} sinovda`}
        />
        <StatCard
          icon={<Users className="w-4.5 h-4.5" />}
          value={String(newLeads7d)}
          label="Yangi leadlar (7 kun)"
        />
        <StatCard
          icon={<MessagesSquare className="w-4.5 h-4.5" />}
          value={String(dialogs30d)}
          label="Mijozlar dialoglari (30 kun)"
        />
      </div>

      <div className="grid xl:grid-cols-5 gap-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Oylik daromad" subtitle="To'lovlar hozircha qo'lda kuzatiladi" />
          <div className="px-6 pb-10 pt-3 text-sm text-slate-400">
            To'lov avtomatik hisoblanishi hali sozlanmagan — mijozlar bilan
            to'lov to'g'ridan-to'g'ri kelishiladi.
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Yangi leadlar"
            action={
              <Link
                href="/owner/leads"
                className="text-xs font-semibold text-electric-600 flex items-center gap-0.5"
              >
                Barchasi <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <div className="px-3 pb-3">
            {recentLeads.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-400">
                Hali lead yo'q — landing sahifadagi forma orqali kelganda shu yerda ko'rinadi.
              </p>
            ) : (
              recentLeads.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f4f7ff]"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{
                      background: `hsl(${(l.name.charCodeAt(0) * 41) % 360} 60% 50%)`,
                    }}
                  >
                    {l.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold truncate">{l.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {l.phone}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-300 shrink-0">
                    {new Date(l.createdAt).toLocaleDateString("uz-UZ")}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Mijozlar"
          subtitle="Holati va tariflar nazorati"
          action={
            <Link
              href="/owner/clients"
              className="text-xs font-semibold text-electric-600 flex items-center gap-0.5"
            >
              Boshqarish <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        <div className="px-6 pb-6 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-300">
                <th className="pb-3 font-semibold">Kompaniya</th>
                <th className="pb-3 font-semibold">Tarif</th>
                <th className="pb-3 font-semibold">Holat</th>
                <th className="pb-3 font-semibold">Kanallar</th>
                <th className="pb-3 font-semibold">Dialoglar/oy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-300">
                    Hali mijozlar yo'q
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3.5 font-bold">{c.company}</td>
                    <td className="py-3.5">
                      <Badge color="blue">{planLabels[c.plan]}</Badge>
                    </td>
                    <td className="py-3.5">
                      <Badge color={clientStatusMeta[c.status].color} dot>
                        {clientStatusMeta[c.status].label}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-slate-500">{c.channels.length}</td>
                    <td className="py-3.5 text-slate-500">
                      {dialogsByClientId.get(c.id) ?? 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
