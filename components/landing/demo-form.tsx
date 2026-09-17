"use client";

import { useState } from "react";
import { Clock, Loader2, Check } from "lucide-react";

export function DemoForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit() {
    if (!name.trim() || !phone.trim() || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="mt-9 flex flex-col items-center gap-2 max-w-lg mx-auto">
        <span className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">
          <Check className="w-6 h-6" />
        </span>
        <p className="font-bold">Arizangiz qabul qilindi!</p>
        <p className="text-electric-100 text-sm">
          Jamoamiz tez orada siz bilan bog'lanadi.
        </p>
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mt-9 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ismingiz"
          required
          className="flex-1 rounded-xl px-4 py-3.5 text-sm text-[#0b1226] bg-white placeholder:text-slate-400 outline-none"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+998 90 123 45 67"
          required
          className="flex-1 rounded-xl px-4 py-3.5 text-sm text-[#0b1226] bg-white placeholder:text-slate-400 outline-none"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="bg-navy-900 hover:bg-navy-800 font-bold px-6 py-3.5 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {status === "sending" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Yuborish"
          )}
        </button>
      </form>
      {status === "error" && (
        <p className="text-center text-sm text-red-100 mt-3">
          Xatolik yuz berdi, qayta urinib ko'ring
        </p>
      )}
      <p className="text-electric-100 text-xs mt-5 flex items-center justify-center gap-1.5">
        <Clock className="w-3.5 h-3.5" /> 15 daqiqa ichida aloqaga chiqamiz
      </p>
    </>
  );
}
