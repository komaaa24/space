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

  const [notifications, setNotifications] = useState<{
    id: string;
    type: "LEAD" | "COMPLAINT" | "SYSTEM";
    title: string;
    body: string;
    href: string | null;
    readAt: string | null;
    createdAt: string;
  }[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);

  async function loadNotifications() {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setNotifications(data.notifications ?? []);
    setUnreadNotificationCount(data.unreadCount ?? 0);
  }

  async function markNotification(id?: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : { all: true }),
    });
    await loadNotifications();
  }


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


  useEffect(() => {
    void loadNotifications();
    const timer = window.setInterval(() => void loadNotifications(), 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-line backdrop-blur-lg sm:static sm:bg-white sm:backdrop-blur-none">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-2.5 sm:gap-4">
          <Link href="/admin" className="flex items-center gap-2.5 shrink-0">
            <LogoMark className="w-10 h-10 sm:w-11 sm:h-11" />
            <span className="font-extrabold text-[16px] sm:text-[17px] tracking-tight">
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

          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setNotificationOpen((open) => !open)}
              aria-label="Bildirishnomalarni ochish"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -right-0.5 -top-1 min-w-4 rounded-full bg-electric-500 px-1 text-[9px] font-bold leading-4 text-white">
                  {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 top-11 z-50 w-[340px] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_20px_50px_rgba(15,23,42,0.16)]">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">Bildirishnomalar</p>
                    <p className="text-[11px] text-slate-400">
                      {unreadNotificationCount ? unreadNotificationCount + " ta yangi xabar" : "Hammasi ko'rilgan"}
                    </p>
                  </div>
                  {unreadNotificationCount > 0 && (
                    <button
                      type="button"
                      onClick={() => void markNotification()}
                      className="text-[11px] font-bold text-electric-600 hover:text-electric-700"
                    >
                      Barchasini o'qilgan
                    </button>
                  )}
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <Bell className="mx-auto h-7 w-7 text-slate-200" />
                      <p className="mt-2 text-sm font-semibold text-slate-500">Yangi bildirishnoma yo'q</p>
                      <p className="mt-1 text-xs text-slate-400">Yangi lead yoki shikoyat shu yerda chiqadi.</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <Link
                        key={notification.id}
                        href={notification.href ?? "/admin/requests"}
                        onClick={() => void markNotification(notification.id)}
                        className={"flex gap-3 border-b border-line px-4 py-3 transition hover:bg-slate-50 " + (notification.readAt ? "bg-white" : "bg-electric-50/40")}
                      >
                        <span className={"mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold " + (notification.type === "COMPLAINT" ? "bg-rose-50 text-rose-600" : notification.type === "LEAD" ? "bg-emerald-50 text-emerald-600" : "bg-electric-50 text-electric-600")}>
                          {notification.type === "COMPLAINT" ? "!" : notification.type === "LEAD" ? "+" : "i"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-extrabold text-slate-800">{notification.title}</span>
                            {!notification.readAt && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-electric-500" />}
                          </span>
                          <span className="mt-1 block line-clamp-2 text-[11px] leading-4 text-slate-500">{notification.body}</span>
                          <span className="mt-1 block text-[10px] text-slate-400">
                            {new Intl.DateTimeFormat("uz-UZ", { hour: "2-digit", minute: "2-digit" }).format(new Date(notification.createdAt))}
                          </span>
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <SessionMenu avatarClassName="electric-gradient text-white" />
        </div>

        {/* Tab nav */}
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 flex items-center gap-1 overflow-x-auto thin-scroll overscroll-x-contain">
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
                <t.icon className="w-4 h-4 shrink-0" />
                <span>{t.label}</span>
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

      <main className="max-w-[1400px] mx-auto px-4 py-5 sm:px-6 sm:py-7 min-w-0">
        {children}
      </main>
    </div>
  );
}
