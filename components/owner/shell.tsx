"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Building2,
  Users,
  Megaphone,
  Settings,
  Bell,
} from "lucide-react";
import { SessionMenu } from "@/components/session-menu";
import { LogoMark } from "@/components/logo";
import { SupportLink } from "@/components/support-link";

const tabs = [
  { href: "/owner", label: "Boshqaruv", icon: LayoutGrid },
  { href: "/owner/clients", label: "Mijozlar", icon: Building2 },
  { href: "/owner/leads", label: "Leadlar", icon: Users },
  { href: "/owner/ads", label: "Reklama", icon: Megaphone },
  { href: "/owner/settings", label: "Sozlamalar", icon: Settings },
];

export function OwnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  useEffect(() => {
    fetch("/api/leads")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const count = (data?.leads ?? []).filter(
          (l: { status: string }) => l.status === "NEW",
        ).length;
        setNewLeadsCount(count);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* Dark header — boshqaruv markazini mijoz panelidan ajratib turadi */}
      <header className="sticky top-0 z-40 bg-navy-900/95 text-white backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-[60px] sm:h-16 flex items-center gap-3 sm:gap-4">
          <Link href="/owner" className="flex items-center gap-2.5 shrink-0">
            <LogoMark className="w-10 h-10 sm:w-11 sm:h-11" variant="white" />
            <span className="font-extrabold text-[17px] tracking-tight">
              chatspace
            </span>
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-electric-500/20 text-electric-300 px-2 py-1 rounded-md">
            HQ
          </span>

          <div className="flex-1" />

          <SupportLink variant="dark" className="hidden lg:inline-flex" />

          <button className="relative w-9 h-9 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-400">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
          </button>
          <SessionMenu avatarClassName="bg-white/10 text-white" />
        </div>

        <div className="max-w-[1400px] mx-auto px-4 pb-3 md:hidden">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <div>
              <div className="text-[13px] font-bold">Owner boshqaruv</div>
              <div className="text-[11px] text-slate-400">
                Mijozlar, tariflar va statistikalar
              </div>
            </div>
            <span className="rounded-lg bg-electric-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-electric-200">
              HQ
            </span>
          </div>
        </div>

        <div className="hidden max-w-[1400px] mx-auto px-6 md:flex items-center gap-1 overflow-x-auto thin-scroll">
          {tabs.map((t) => {
            const active =
              t.href === "/owner"
                ? pathname === "/owner"
                : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`relative flex items-center gap-1.5 px-3.5 py-3 text-[13px] font-medium whitespace-nowrap transition-colors ${
                  active ? "text-cyan-300" : "text-slate-400 hover:text-white"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
                {t.href === "/owner/leads" && newLeadsCount > 0 && (
                  <span className="w-4.5 h-4.5 rounded-full bg-cyan-400 text-navy-900 text-[9px] font-bold flex items-center justify-center">
                    {newLeadsCount}
                  </span>
                )}
                {active && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-cyan-400" />
                )}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-5 pb-28 sm:px-6 md:py-7 md:pb-7">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-navy-900/95 text-white shadow-[0_-18px_45px_rgba(7,13,36,0.22)] backdrop-blur-xl pb-safe md:hidden">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {tabs.map((t) => {
            const active =
              t.href === "/owner"
                ? pathname === "/owner"
                : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`relative flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1.5 py-2 text-[10px] font-bold transition-all ${
                  active
                    ? "bg-cyan-400 text-navy-900 shadow-[0_10px_24px_rgba(34,211,238,0.25)]"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-xl ${
                    active ? "bg-white/35" : "bg-white/5"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                </span>
                <span className="truncate">{t.label}</span>
                {t.href === "/owner/leads" && newLeadsCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-cyan-300 px-1 text-[9px] font-extrabold text-navy-900 ring-2 ring-navy-900">
                    {newLeadsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
