"use client";

import { Bot, Check, Users, Zap } from "lucide-react";

export function HeroChatDemo() {
  return (
    <div className="hero-chat-demo relative">
      <div className="hero-chat-panel rounded-3xl bg-navy-900 p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-10" />
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
        <div className="relative">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="hero-avatar h-9 w-9 rounded-xl bg-gradient-to-tr from-pink-500 to-amber-400" />
            <div>
              <div className="text-sm font-bold">@mijoz_akkaunti</div>
              <div className="text-[11px] text-slate-400">Instagram Direct</div>
            </div>
            <span className="ml-auto flex items-center gap-1.5 text-[11px] bg-electric-500/20 text-electric-300 font-semibold px-2.5 py-1 rounded-full">
              <Bot className="w-3 h-3" /> AI onlayn
            </span>
          </div>

          <div className="hero-chat-thread py-5 text-sm">
            <div className="hero-message hero-message-1 flex">
              <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%]">
                Assalomu alaykum, narxi qancha? Yetkazib berish bormi?
              </div>
            </div>

            <div className="hero-typing flex justify-end">
              <div className="rounded-2xl rounded-br-md bg-electric-500/15 px-4 py-3">
                <span />
                <span />
                <span />
              </div>
            </div>

            <div className="hero-message hero-message-2 flex justify-end">
              <div className="electric-gradient rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
                Vaalaykum assalom! 280 000 so&apos;m, Toshkent bo&apos;ylab
                bepul yetkazamiz. Raqamingizni qoldirasizmi?
              </div>
            </div>

            <div className="hero-message hero-message-3 flex">
              <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-2.5">
                +998 90 123 45 67
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-lead-card absolute -bottom-6 -left-6 rounded-2xl bg-white border border-line shadow-xl shadow-electric-500/10 p-4 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-electric-50 flex items-center justify-center">
          <Users className="w-5 h-5 text-electric-600" />
        </span>
        <div>
          <div className="text-[13px] font-bold flex items-center gap-1.5">
            Yangi lead saqlandi
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-[11px] text-slate-400">
            +998 90 123 45 67 · 5 soniyada
          </div>
        </div>
      </div>

      <div className="hero-speed-card absolute -top-5 -right-4 rounded-2xl bg-white border border-line shadow-xl shadow-electric-500/10 px-4 py-3">
        <div className="text-[11px] text-slate-400">Javob vaqti</div>
        <div className="flex items-center gap-1 text-lg font-extrabold text-electric-600">
          4 soniya <Zap className="h-4 w-4 fill-amber-300 text-amber-400" />
        </div>
      </div>
    </div>
  );
}
