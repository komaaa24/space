"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

interface SessionUser {
  email: string;
  role: "OWNER" | "CLIENT_ADMIN";
  company: string | null;
  plan: string | null;
}

function initialsFromEmail(email: string) {
  const name = email.split("@")[0];
  return name.slice(0, 2).toUpperCase();
}

export function SessionMenu({
  avatarClassName,
}: {
  avatarClassName: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center ${avatarClassName}`}
      >
        {user ? initialsFromEmail(user.email) : "…"}
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-64 rounded-2xl bg-white border border-line shadow-xl shadow-black/5 p-3 z-50 text-slate-900">
          {user ? (
            <>
              <div className="px-2 py-1.5">
                <div className="text-[13px] font-bold truncate">
                  {user.company ?? "Chatspace HQ"}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  {user.email}
                </div>
              </div>
              <div className="h-px bg-line my-2" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Chiqish
              </button>
            </>
          ) : (
            <div className="px-2 py-1.5 text-xs text-slate-400">
              Yuklanmoqda...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
