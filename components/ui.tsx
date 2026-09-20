import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white border border-line hover:border-electric-200 transition-colors ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between px-6 pt-5 pb-3">
      <div>
        <h3 className="font-semibold text-[15px] tracking-tight">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  icon,
  value,
  label,
  trend,
  hero = false,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  trend?: string;
  hero?: boolean;
}) {
  if (hero) {
    return (
      <div className="rounded-2xl electric-gradient text-white p-5 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="flex items-center justify-between">
          <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            {icon}
          </span>
          {trend && (
            <span className="text-[11px] font-semibold bg-white/15 px-2 py-1 rounded-lg">
              {trend}
            </span>
          )}
        </div>
        <div className="text-[28px] font-extrabold tracking-tight mt-4 leading-none">
          {value}
        </div>
        <div className="text-[13px] text-electric-100 mt-1.5">{label}</div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-white border border-line p-5">
      <div className="flex items-center justify-between">
        <span className="w-9 h-9 rounded-xl bg-electric-50 flex items-center justify-center text-electric-600">
          {icon}
        </span>
        {trend && (
          <span className="text-[11px] font-semibold text-electric-600 bg-electric-50 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <div className="text-[28px] font-extrabold tracking-tight mt-4 leading-none">
        {value}
      </div>
      <div className="text-[13px] text-slate-400 mt-1.5">{label}</div>
    </div>
  );
}

const badgeStyles: Record<string, string> = {
  blue: "bg-electric-50 text-electric-600",
  red: "bg-red-50 text-red-600",
  yellow: "bg-amber-50 text-amber-600",
  green: "bg-emerald-50 text-emerald-600",
  gray: "bg-slate-100 text-slate-500",
  navy: "bg-navy-900 text-white",
};

export function Badge({
  color = "blue",
  dot = false,
  children,
}: {
  color?: keyof typeof badgeStyles;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${badgeStyles[color]}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[21px] font-extrabold tracking-tight sm:text-[22px]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Avatar({ name, color }: { name: string; color?: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold shrink-0"
      style={{
        background:
          color ?? `hsl(${(name.charCodeAt(0) * 37) % 360} 60% 50%)`,
      }}
    >
      {initials}
    </div>
  );
}

export const inputCls =
  "w-full bg-white border border-line rounded-xl px-4 py-3 text-sm outline-none placeholder:text-slate-300 focus:border-electric-400 focus:ring-2 focus:ring-electric-100 transition-all";

export function PrimaryButton({
  children,
  className = "",
  onClick,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 bg-electric-500 hover:bg-electric-600 text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-[0_4px_14px_rgba(15,94,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 bg-white border border-line hover:border-electric-300 text-slate-600 text-[13px] font-medium px-4 py-2.5 rounded-xl transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
