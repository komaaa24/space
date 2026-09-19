"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  Sparkles,
  LayoutGrid,
  Inbox,
  ClipboardList,
  BarChart3,
  ShoppingBag,
  Brain,
  Radio,
  Plug,
  Settings,
  Bot,
  Lock,
} from "lucide-react";
import { SessionMenu } from "@/components/session-menu";
import { LogoMark } from "@/components/logo";
import { SupportLink } from "@/components/support-link";

type FeatureKey = "instagramAutomation" | "aiAgent" | "catalog" | "autoReply";

const tabs: {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  feature?: FeatureKey;
}[] = [
  { href: "/admin", label: "Boshqaruv", icon: LayoutGrid },
  { href: "/admin/inbox", label: "Inbox", icon: Inbox },
  { href: "/admin/automations", label: "Avtomatizatsiya", icon: Bot },
  { href: "/admin/requests", label: "Arizalar", icon: ClipboardList },
  { href: "/admin/analytics", label: "Analitika", icon: BarChart3 },
  { href: "/admin/catalog", label: "Katalog", icon: ShoppingBag, feature: "catalog" },
  { href: "/admin/ai", label: "AI Studio", icon: Brain, feature: "aiAgent" },
  { href: "/admin/channels", label: "Kanallar", icon: Radio },
  { href: "/admin/integrations", label: "Integratsiyalar", icon: Plug },
  { href: "/admin/settings", label: "Sozlamalar", icon: Settings },
];

const planLabels: Record<string, string> = {
  FREE: "FREE",
  PRO: "PRO",
  VIP: "VIP",
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [company, setCompany] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [features, setFeatures] = useState<Record<FeatureKey, boolean> | null>(null);
  const [waitingCount, setWaitingCount] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setCompany(data?.user?.company ?? null);
        setPlan(data?.user?.plan ?? null);
        setFeatures(data?.user?.access?.features ?? null);
      })
      .catch(() => {});

    fetch("/api/inbox")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const count = (data?.conversations ?? []).filter(
          (c: { status: string }) => c.status === "WAITING",
        ).length;
        setWaitingCount(count);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-line">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2.5 shrink-0">
            <LogoMark className="w-11 h-11" />
            <span className="font-extrabold text-[17px] tracking-tight">
              chatspace
            </span>
          </Link>
          <span className="text-line text-xl font-thin hidden sm:block">/</span>
          {company && (
            <span className="text-sm font-medium text-slate-500 hidden sm:block">
              {company}
            </span>
          )}
          {plan && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-electric-50 text-electric-600 px-2 py-1 rounded-md hidden sm:block">
              {planLabels[plan] ?? plan}
            </span>
          )}

          <div className="flex-1" />

          <div className="hidden lg:flex items-center gap-2 bg-[#f4f7ff] border border-line rounded-xl px-3.5 py-2 w-72">
            <Search className="w-4 h-4 text-slate-300" />
            <input
              placeholder="Qidirish..."
              className="bg-transparent outline-none text-[13px] flex-1 placeholder:text-slate-300"
            />
            <kbd className="text-[10px] text-slate-300 border border-line rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          </div>

          <button className="hidden md:inline-flex items-center gap-1.5 text-[13px] font-semibold text-electric-600 bg-electric-50 hover:bg-electric-100 px-3.5 py-2 rounded-xl transition-colors">
            <Sparkles className="w-3.5 h-3.5" /> Agentni sinash
          </button>

          <SupportLink className="hidden xl:inline-flex" />

          <button className="relative w-9 h-9 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-electric-500" />
          </button>

          <SessionMenu avatarClassName="electric-gradient text-white" />
        </div>

        {/* Tab nav */}
        <div className="max-w-[1400px] mx-auto px-6 flex items-center gap-1 overflow-x-auto thin-scroll">
          {tabs.map((t) => {
            const active =
              t.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(t.href);
            const locked = t.feature ? features?.[t.feature] === false : false;
            const className = `relative flex items-center gap-1.5 px-3.5 py-3 text-[13px] font-medium whitespace-nowrap transition-colors ${
              active
                ? "text-electric-600"
                : locked
                  ? "text-slate-300 hover:text-slate-500"
                  : "text-slate-500 hover:text-slate-800"
            }`;
            const content = (
              <>
                <t.icon className="w-4 h-4" />
                {t.label}
                {locked && <Lock className="w-3 h-3" />}
                {t.href === "/admin/inbox" && waitingCount > 0 && (
                  <span className="w-4.5 h-4.5 rounded-full bg-electric-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {waitingCount}
                  </span>
                )}
                {active && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-electric-500" />
                )}
              </>
            );
            return (
              <Link
                key={t.href}
                href={t.href}
                className={className}
                title={locked ? "VIP tarifda ishlaydi, preview ko'rinadi" : undefined}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-7">{children}</main>
    </div>
  );
}
