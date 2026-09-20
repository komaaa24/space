"use client";

import { useMemo, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";

type BillingCycle = "monthly" | "yearly";

const plans = [
  {
    id: "free",
    name: "FREE",
    monthly: 0,
    yearlyMonthly: 0,
    badge: "",
    features: [
      { label: "Instagram Automation: 200 dialog/oy", included: true },
      { label: "Avtojavob ochiq", included: true },
      { label: "AI Agent yopiq", included: false },
      { label: "Katalog yopiq", included: false },
    ],
  },
  {
    id: "pro",
    name: "PRO",
    monthly: 75000,
    yearlyMonthly: 50000,
    badge: "Ommabop",
    features: [
      { label: "Instagram Automation cheksiz", included: true },
      { label: "Avtojavob ochiq", included: true },
      { label: "AI Agent yopiq", included: false },
      { label: "Katalog yopiq", included: false },
    ],
  },
  {
    id: "vip",
    name: "VIP",
    monthly: 300000,
    yearlyMonthly: 225000,
    badge: "",
    features: [
      { label: "Instagram Automation cheksiz", included: true },
      { label: "Avtojavob ochiq", included: true },
      { label: "AI Agent ochiq", included: true },
      { label: "Katalog ochiq", included: true },
    ],
  },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("uz-UZ").format(value);
}

export function PricingSection() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const isYearly = cycle === "yearly";

  const summary = useMemo(() => {
    const proSavings = (plans[1].monthly - plans[1].yearlyMonthly) * 12;
    const vipSavings = (plans[2].monthly - plans[2].yearlyMonthly) * 12;
    return Math.max(proSavings, vipSavings);
  }, []);

  return (
    <section id="pricing" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center">
          <h2 className="text-3xl md:text-[40px] font-extrabold tracking-tight">
            Tariflar
          </h2>
          <p className="text-slate-500 mt-4">
            Biznesingiz hajmiga mos rejani tanlang
          </p>
          <div className="mt-8 inline-flex items-center rounded-2xl border border-line bg-white p-1 shadow-[0_12px_35px_rgba(11,18,38,0.08)]">
            {(["monthly", "yearly"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCycle(value)}
                className={`relative min-w-32 rounded-xl px-5 py-3 text-sm font-extrabold transition-all duration-300 ${
                  cycle === value
                    ? "bg-electric-500 text-white shadow-[0_10px_25px_rgba(15,94,255,0.28)]"
                    : "text-slate-500 hover:text-[#0b1226]"
                }`}
              >
                {value === "monthly" ? "Oylik" : "Yillik"}
              </button>
            ))}
          </div>
          <div
            className={`mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border border-electric-100 bg-electric-50 px-4 py-2 text-sm font-bold text-electric-700 transition-all duration-500 ${
              isYearly ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-70"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Yillikda {formatMoney(summary)} so&apos;mgacha tejaysiz
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-14 items-stretch">
          {plans.map((plan) => {
            const monthlyPrice = plan.monthly;
            const yearlyTotal = plan.yearlyMonthly * 12;
            const displayPrice = isYearly ? yearlyTotal : monthlyPrice;
            const monthlyTotal = plan.monthly * 12;
            const savings = monthlyTotal - yearlyTotal;
            const discount =
              plan.monthly > 0
                ? Math.round((1 - plan.yearlyMonthly / plan.monthly) * 100)
                : 0;
            const highlighted = plan.id === "pro";

            return (
              <div
                key={plan.id}
                className={`group relative overflow-hidden rounded-[28px] p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_70px_rgba(15,94,255,0.16)] ${
                  highlighted
                    ? "bg-navy-900 text-white shadow-[0_24px_70px_rgba(11,18,38,0.22)]"
                    : "bg-white border border-line"
                }`}
              >
                {highlighted && (
                  <>
                    <div className="absolute inset-0 dot-grid opacity-10" />
                    <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-electric-500/25 blur-3xl transition-transform duration-700 group-hover:scale-125" />
                    <span className="absolute top-6 right-6 electric-gradient text-white text-[11px] font-bold px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </>
                )}

                <div className="relative flex h-full flex-col">
                  <h3 className="font-extrabold text-lg">{plan.name}</h3>
                  <div className="mt-5 min-h-[92px]">
                    <div className="flex items-baseline gap-1 transition-all duration-500">
                      <span className="text-[34px] font-extrabold tracking-tight tabular-nums">
                        {formatMoney(displayPrice)}
                      </span>
                      <span className="text-sm text-slate-400">
                        {isYearly ? "so'm/yil" : "so'm/oy"}
                      </span>
                    </div>
                    <div
                      className={`mt-2 text-sm transition-all duration-500 ${
                        isYearly
                          ? "translate-y-0 opacity-100"
                          : "translate-y-1 opacity-60"
                      } ${highlighted ? "text-cyan-100" : "text-slate-500"}`}
                    >
                      {isYearly
                        ? `Oyiga ${formatMoney(plan.yearlyMonthly)} so'mdan`
                        : plan.monthly === 0
                          ? "Boshlash uchun bepul"
                          : `Yillik tanlasangiz ${formatMoney(savings)} so'm tejaysiz`}
                    </div>
                    {isYearly && savings > 0 && (
                      <div
                        className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${
                          highlighted
                            ? "bg-white/10 text-cyan-100"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        -{discount}% • {formatMoney(savings)} so&apos;m tejaladi
                      </div>
                    )}
                  </div>

                  <ul className="mt-7 space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature.label}
                        className={`flex items-start gap-2.5 text-sm leading-6 ${
                          feature.included
                            ? ""
                            : highlighted
                              ? "text-slate-400"
                              : "text-slate-500"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                            feature.included
                              ? highlighted
                                ? "bg-electric-500/30"
                                : "bg-electric-50"
                              : highlighted
                                ? "bg-white/10"
                                : "bg-slate-100"
                          }`}
                        >
                          {feature.included ? (
                            <Check
                              className={`w-3 h-3 ${
                                highlighted ? "text-cyan-300" : "text-electric-600"
                              }`}
                            />
                          ) : (
                            <X
                              className={`w-3 h-3 ${
                                highlighted ? "text-slate-400" : "text-slate-400"
                              }`}
                            />
                          )}
                        </span>
                        {feature.label}
                      </li>
                    ))}
                  </ul>

                  <div
                    className={`mt-6 rounded-2xl border p-4 text-sm transition-all duration-500 ${
                      isYearly
                        ? "scale-100 opacity-100"
                        : "scale-[0.98] opacity-75"
                    } ${
                      highlighted
                        ? "border-white/10 bg-white/5 text-cyan-50"
                        : "border-line bg-[#fafbff] text-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span>{isYearly ? "Yillik to'lov" : "Oylik to'lov"}</span>
                      <strong className="whitespace-nowrap text-base text-inherit">
                        {formatMoney(displayPrice)} so&apos;m
                      </strong>
                    </div>
                  </div>

                  <a
                    href="#cta"
                    className={`mt-8 block text-center font-bold py-3.5 rounded-2xl text-sm transition-all duration-300 hover:-translate-y-0.5 ${
                      highlighted
                        ? "bg-electric-500 hover:bg-electric-600 text-white shadow-[0_14px_30px_rgba(15,94,255,0.32)]"
                        : "border border-line hover:border-electric-300 hover:bg-electric-50"
                    }`}
                  >
                    Tanlash
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
