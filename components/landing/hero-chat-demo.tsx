"use client";

import {
  BarChart3,
  Bot,
  Check,
  CreditCard,
  MessageCircle,
  Send,
  Users,
  Zap,
} from "lucide-react";

function PhoneFrame({
  className = "",
  children,
  blue = false,
}: {
  className?: string;
  children: React.ReactNode;
  blue?: boolean;
}) {
  return (
    <div
      className={`rounded-[34px] border border-white/70 bg-white p-2 shadow-[0_24px_70px_rgba(15,94,255,0.16)] ${className}`}
    >
      <div
        className={`relative flex aspect-[9/18] flex-col overflow-hidden rounded-[28px] ${
          blue ? "electric-gradient text-white" : "bg-[#f7faff] text-[#0b1226]"
        }`}
      >
        <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-black/10" />
        {children}
      </div>
    </div>
  );
}

export function HeroChatDemo() {
  return (
    <div className="hero-chat-demo relative mx-auto min-h-[520px] w-full max-w-[640px] sm:min-h-[610px] lg:mx-0">
      <div className="absolute inset-x-6 top-10 h-80 rounded-[48px] bg-electric-500/8 blur-3xl" />

      <PhoneFrame
        blue
        className="hero-phone-float absolute left-1/2 top-0 z-20 w-[240px] -translate-x-1/2 rotate-[-7deg] sm:left-[47%] sm:w-[292px] lg:w-[310px]"
      >
        <div className="relative flex flex-1 flex-col p-5 pt-10">
          <div className="flex items-center justify-between text-[11px] font-bold text-white/80">
            <span>9:41</span>
            <span>Chatspace</span>
          </div>
          <div className="mt-8">
            <div className="text-sm font-semibold text-white/75">
              Bugungi AI savdo
            </div>
            <div className="mt-2 text-[34px] font-extrabold leading-none tracking-tight">
              42 lead
            </div>
          </div>
          <div className="mt-7 rounded-3xl bg-white p-4 text-[#0b1226] shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-400">
                  Javob tezligi
                </div>
                <div className="mt-1 text-2xl font-extrabold">4 soniya</div>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-electric-50 text-electric-600">
                <Zap className="h-5 w-5 fill-amber-300 text-amber-400" />
              </span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-[#edf3ff]">
              <div className="h-full w-[82%] rounded-full bg-electric-500" />
            </div>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/14 p-3">
              <MessageCircle className="h-4 w-4 text-cyan-100" />
              <div className="mt-2 text-lg font-extrabold">128</div>
              <div className="text-[10px] text-white/70">dialog</div>
            </div>
            <div className="rounded-2xl bg-white/14 p-3">
              <BarChart3 className="h-4 w-4 text-cyan-100" />
              <div className="mt-2 text-lg font-extrabold">97%</div>
              <div className="text-[10px] text-white/70">aniqlik</div>
            </div>
          </div>
        </div>
      </PhoneFrame>

      <PhoneFrame className="hero-phone-float hero-phone-delay-1 absolute left-0 top-24 hidden w-[198px] rotate-[-18deg] sm:block lg:left-2">
        <div className="flex flex-1 flex-col p-4 pt-9">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
            <span>Inbox</span>
            <Send className="h-3.5 w-3.5 text-sky-500" />
          </div>
          <div className="mt-6 rounded-2xl bg-white p-3 shadow-sm">
            <div className="text-[11px] font-bold">Instagram</div>
            <div className="mt-2 rounded-xl bg-[#f1f5ff] p-2 text-[10px] text-slate-500">
              Narxi qancha? Yetkazib berish bormi?
            </div>
            <div className="ml-auto mt-2 rounded-xl bg-electric-500 p-2 text-[10px] font-semibold text-white">
              Albatta, narx va yetkazib berishni yubordim.
            </div>
          </div>
          <div className="mt-auto rounded-2xl bg-electric-50 p-3">
            <div className="text-[10px] text-electric-600">AI javob berdi</div>
            <div className="mt-1 text-xl font-extrabold text-electric-700">
              24/7
            </div>
          </div>
        </div>
      </PhoneFrame>

      <PhoneFrame className="hero-phone-float hero-phone-delay-2 absolute right-0 top-20 hidden w-[210px] rotate-[16deg] sm:block lg:right-0">
        <div className="flex flex-1 flex-col p-4 pt-9">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
            <span>To&apos;lov</span>
            <CreditCard className="h-3.5 w-3.5 text-electric-500" />
          </div>
          <div className="mt-8 rounded-3xl electric-gradient p-4 text-white">
            <div className="text-[10px] text-white/70">Buyurtma</div>
            <div className="mt-2 text-2xl font-extrabold">280k</div>
            <div className="mt-6 h-7 rounded-xl bg-white/20" />
          </div>
          <div className="mt-4 space-y-2">
            {["Lead saqlandi", "Operatorga bildirish", "Katalog yuborildi"].map(
              (item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-xl bg-white p-2 text-[10px] font-bold shadow-sm"
                >
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  {item}
                </div>
              ),
            )}
          </div>
        </div>
      </PhoneFrame>

      <div className="hero-lead-card absolute bottom-8 left-3 z-30 flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-xl shadow-electric-500/10 sm:bottom-10 sm:left-10">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric-50">
          <Users className="h-5 w-5 text-electric-600" />
        </span>
        <div>
          <div className="flex items-center gap-1.5 text-[13px] font-bold">
            Yangi lead saqlandi
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="text-[11px] text-slate-400">
            +998 90 123 45 67 · 5 soniyada
          </div>
        </div>
      </div>

      <div className="hero-speed-card absolute right-4 top-[335px] z-30 rounded-2xl border border-line bg-white px-4 py-3 shadow-xl shadow-electric-500/10 sm:right-10 sm:top-[390px]">
        <div className="text-[11px] text-slate-400">AI holati</div>
        <div className="flex items-center gap-1 text-lg font-extrabold text-electric-600">
          Online <Bot className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
