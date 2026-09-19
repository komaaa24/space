import { Headphones, Send } from "lucide-react";

export const SUPPORT_HANDLE = "@chatspacesupport";
export const SUPPORT_URL = "https://t.me/chatspacesupport";

type SupportLinkProps = {
  variant?: "pill" | "dark" | "card" | "subtle";
  label?: string;
  description?: string;
  className?: string;
};

export function SupportLink({
  variant = "pill",
  label = "Support",
  description,
  className = "",
}: SupportLinkProps) {
  if (variant === "card") {
    return (
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noreferrer"
        className={`group flex flex-col gap-3 rounded-2xl border border-line bg-[#f8faff] p-4 transition-colors hover:border-electric-200 hover:bg-white sm:flex-row sm:items-center ${className}`}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-electric-50 text-electric-600 transition-colors group-hover:bg-electric-500 group-hover:text-white">
          <Headphones className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold text-navy-900">{label}</span>
          <span className="mt-0.5 block text-xs leading-5 text-slate-400">
            {description ?? "Tarif, to'lov yoki ulanish bo'yicha yordam kerak bo'lsa yozing"}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 self-start rounded-xl bg-white px-3 py-2 text-xs font-bold text-electric-600 shadow-sm sm:self-auto">
          <Send className="h-3.5 w-3.5" />
          {SUPPORT_HANDLE}
        </span>
      </a>
    );
  }

  if (variant === "dark") {
    return (
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-[13px] font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white ${className}`}
      >
        <Headphones className="h-4 w-4 text-cyan-300" />
        {label}
      </a>
    );
  }

  if (variant === "subtle") {
    return (
      <a
        href={SUPPORT_URL}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center gap-1.5 text-xs font-bold text-electric-600 transition-colors hover:text-electric-700 ${className}`}
      >
        <Send className="h-3.5 w-3.5" />
        {SUPPORT_HANDLE}
      </a>
    );
  }

  return (
    <a
      href={SUPPORT_URL}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-600 transition-colors hover:border-electric-200 hover:text-electric-600 ${className}`}
    >
      <Headphones className="h-4 w-4 text-electric-500" />
      {label}
    </a>
  );
}
