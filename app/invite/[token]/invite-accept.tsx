"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

type Invitation = {
  email: string;
  role: "ADMIN" | "OPERATOR";
  company: string | null;
  expiresAt: string;
};

export default function InviteAccept({ token }: { token: string }) {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/team/invitations/accept/" + token)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Taklif topilmadi");
        setInvitation(data);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Taklif topilmadi");
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function acceptInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (password.length < 8) {
      setError("Parol kamida 8 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (password !== confirmation) {
      setError("Parollar bir xil emas");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/team/invitations/accept/" + token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Taklifni qabul qilib bo'lmadi");
      window.location.assign(data.redirectTo || "/admin");
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Taklifni qabul qilib bo'lmadi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
        <section className="w-full rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-electric-50 text-electric-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="mb-6">
            <div className="text-sm font-bold text-electric-600">chatspace</div>
            <h1 className="mt-2 text-2xl font-extrabold text-navy-900">Jamoaga qo&apos;shilish</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sizni {invitation?.company || "workspace"} jamoasiga {invitation?.role === "ADMIN" ? "admin" : "operator"} sifatida taklif qilishdi.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Taklif tekshirilmoqda...
            </div>
          ) : error && !invitation ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : (
            <form onSubmit={acceptInvite} className="space-y-4">
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <div className="text-xs text-slate-400">Taklif qilingan email</div>
                <div className="mt-1 font-semibold text-slate-800">{invitation?.email}</div>
              </div>
              <label className="block text-sm font-semibold text-slate-700">
                Yangi parol
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" className="mt-1.5 w-full rounded-xl border border-line px-3 py-3 outline-none transition focus:border-electric-400 focus:ring-2 focus:ring-electric-100" placeholder="Kamida 8 ta belgi" required />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Parolni tasdiqlang
                <input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} autoComplete="new-password" className="mt-1.5 w-full rounded-xl border border-line px-3 py-3 outline-none transition focus:border-electric-400 focus:ring-2 focus:ring-electric-100" placeholder="Parolni qayta kiriting" required />
              </label>
              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-electric-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-electric-600 disabled:cursor-not-allowed disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Jamoaga qo&apos;shilish
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
