"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { SupportLink } from "@/components/support-link";

const googleErrorMessages: Record<string, string> = {
  google_not_configured: "Google kirish sozlanmagan",
  google_cancelled: "Google kirish bekor qilindi",
  google_invalid_state: "Google sessiyasi eskirdi, qayta urinib ko'ring",
  google_token_failed: "Google token olinmadi",
  google_email_unverified: "Google email tasdiqlanmagan",
  google_user_not_found: "Bu Google email uchun kabinet topilmadi",
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const googleError = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Xatolik yuz berdi");
        setLoading(false);
        return;
      }
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Serverga ulanib bo'lmadi");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-navy-900 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-10" />
        <div className="relative flex items-center gap-2.5">
          <LogoMark className="w-11 h-11" variant="white" />
          <span className="font-extrabold text-xl tracking-tight">
            chatspace
          </span>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            Mijozlaringizga AI javob beradi.
            <br />
            <span className="electric-text-gradient">Siz esa sotasiz.</span>
          </h2>
          <p className="text-slate-400 mt-4 max-w-sm">
            Instagram, Telegram va YouTube&apos;dagi barcha murojaatlar — bitta
            panelda, AI nazorati ostida.
          </p>
        </div>
        <div className="relative text-xs text-slate-500">
          © 2026 Chatspace
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center px-6 py-16 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <LogoMark className="w-11 h-11" />
            <span className="font-extrabold text-xl">chatspace</span>
          </div>
          <h1 className="font-extrabold text-2xl tracking-tight">
            Kabinetga kirish
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Google akkauntingiz bilan kabinetingizga kiring
          </p>
          <div className="mt-8 space-y-3.5">
            <a
              href="/api/auth/google/start"
              className="w-full flex items-center justify-center gap-2 bg-electric-500 hover:bg-electric-600 text-white text-sm font-bold py-3.5 rounded-xl transition-colors shadow-[0_4px_14px_rgba(15,94,255,0.3)]"
            >
              <Mail className="w-4 h-4" />
              Google bilan kirish
            </a>
            {googleError && (
              <p className="text-sm text-red-500 font-medium">
                {googleErrorMessages[googleError] ?? "Google orqali kirishda xatolik"}
              </p>
            )}
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-[11px] font-semibold uppercase text-slate-300">
              Zaxira kirish
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-white border border-line rounded-xl px-4 py-3.5 text-sm outline-none placeholder:text-slate-300 focus:border-electric-400 focus:ring-2 focus:ring-electric-100 transition-all"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parol"
              className="w-full bg-white border border-line rounded-xl px-4 py-3.5 text-sm outline-none placeholder:text-slate-300 focus:border-electric-400 focus:ring-2 focus:ring-electric-100 transition-all"
            />
            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-electric-500 hover:bg-electric-600 disabled:opacity-60 text-white text-sm font-bold py-3.5 rounded-xl transition-colors shadow-[0_4px_14px_rgba(15,94,255,0.3)]"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Kirish
            </button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-8">
            Kabinet yo&apos;qmi?{" "}
            <Link href="/#cta" className="text-electric-600 font-semibold">
              Demo uchun ariza qoldiring
            </Link>
          </p>
          <div className="mt-4">
            <SupportLink
              variant="card"
              label="Kirishda yordam kerakmi?"
              description="Login, Google yoki parol bo'yicha muammo bo'lsa, supportga yozing"
              className="p-3"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginContent />
    </Suspense>
  );
}
