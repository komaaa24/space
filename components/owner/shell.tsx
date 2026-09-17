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
      <header className="bg-navy-900 text-white">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/owner" className="flex items-center gap-2.5 shrink-0">
            <LogoMark className="w-11 h-11" variant="white" />
            <span className="font-extrabold text-[17px] tracking-tight">
              chatspace
            </span>
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-electric-500/20 text-electric-300 px-2 py-1 rounded-md">
            HQ
          </span>

          <div className="flex-1" />

          <button className="relative w-9 h-9 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-400">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
          </button>
          <SessionMenu avatarClassName="bg-white/10 text-white" />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 flex items-center gap-1 overflow-x-auto thin-scroll">
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

      <main className="max-w-[1400px] mx-auto px-6 py-7">{children}</main>
    </div>
  );
}
