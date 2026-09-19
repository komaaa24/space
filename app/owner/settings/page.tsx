"use client";

import { useEffect, useState } from "react";
import { PageTitle, PrimaryButton, inputCls } from "@/components/ui";
import { SUPPORT_HANDLE, SupportLink } from "@/components/support-link";

export default function OwnerSettingsPage() {
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setEmail(data.user?.email ?? ""));
  }, []);

  async function changePassword() {
    if (!currentPassword || !newPassword || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Xatolik yuz berdi");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <PageTitle title="Sozlamalar" subtitle="Boshqaruv paneli sozlamalari" />

      <div className="rounded-2xl bg-white border border-line p-6 space-y-4">
        <h3 className="font-bold">Akkaunt</h3>
        <div>
          <label className="block text-[13px] font-semibold mb-1.5">
            Email
          </label>
          <input value={email} disabled className={inputCls} />
          <p className="text-xs text-slate-400 mt-1.5">
            Login (email) o&apos;zgartirish uchun {SUPPORT_HANDLE} ga yozing.
          </p>
        </div>
        <SupportLink
          variant="card"
          label="Owner support"
          description="Kabinetlar, tariflar yoki billing sozlamalari bo'yicha yordam"
        />
      </div>

      <div className="rounded-2xl bg-white border border-line p-6 space-y-4">
        <h3 className="font-bold">Parol</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold mb-1.5">
              Joriy parol
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-1.5">
              Yangi parol
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        <div className="flex items-center gap-3">
          <PrimaryButton onClick={changePassword} disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Parolni yangilash"}
          </PrimaryButton>
          {success && (
            <span className="text-xs font-semibold text-emerald-500">
              Yangilandi
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
