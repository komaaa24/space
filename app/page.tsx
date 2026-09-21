import Link from "next/link";
import {
  Bot,
  BarChart3,
  Users,
  BookOpen,
  ArrowRight,
  Send,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Instagram, Youtube } from "@/components/brand-icons";
import { DemoForm } from "@/components/landing/demo-form";
import { HeroChatDemo } from "@/components/landing/hero-chat-demo";
import { PricingSection } from "@/components/landing/pricing-section";
import { LogoMark } from "@/components/logo";
import { SupportLink } from "@/components/support-link";

const steps = [
  {
    n: "01",
    title: "Kanallarni ulang",
    desc: "Instagram, Telegram yoki YouTube — 2 daqiqada, texnik bilimsiz.",
  },
  {
    n: "02",
    title: "Agentni o'rgating",
    desc: "Bilimlar bazasiga narxlar, katalog va korxona ma'lumotlarini yuklang.",
  },
  {
    n: "03",
    title: "Savdoni kuzating",
    desc: "AI javob beradi, leadlarni yig'adi — siz faqat buyurtmalarni qabul qilasiz.",
  },
];

export default function Landing() {
  return (
    <div className="bg-white text-[#0b1226]">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-lg border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="w-11 h-11 sm:w-14 sm:h-14" />
            <span className="font-extrabold text-xl tracking-tight sm:text-2xl">
              chatspace
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#features" className="hover:text-[#0b1226]">Imkoniyatlar</a>
            <a href="#how" className="hover:text-[#0b1226]">Qanday ishlaydi</a>
            <a href="#pricing" className="hover:text-[#0b1226]">Tariflar</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 hover:text-[#0b1226] px-2 py-2 sm:px-3"
            >
              Kirish
            </Link>
            <a
              href="#cta"
              className="text-sm font-semibold bg-electric-500 hover:bg-electric-600 text-white px-3 py-2.5 rounded-xl transition-colors shadow-[0_4px_14px_rgba(15,94,255,0.3)] sm:px-4"
            >
              Demo olish
            </a>
          </div>
        </div>
      </header>

      {/* Hero — left aligned, split layout */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-electric-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-24 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 border border-electric-200 bg-electric-50 text-electric-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Savdo uchun AI agent platformasi
            </div>
            <h1 className="text-[34px] sm:text-4xl md:text-[56px] font-extrabold tracking-tight leading-[1.05]">
              Mijozlaringizga{" "}
              <span className="electric-text-gradient">AI javob beradi.</span>{" "}
              Siz esa sotasiz.
            </h1>
            <p className="text-base sm:text-lg text-slate-500 mt-5 sm:mt-6 leading-relaxed">
              Instagram, Telegram va YouTube&apos;dagi har bir komment va DM&apos;ga AI
              agent siz kabi javob qaytaradi, leadlarni yig&apos;adi va buyurtma
              rasmiylashtiradi — 24/7, 5 soniyada.
            </p>
            <div className="flex flex-col gap-3 mt-8 sm:mt-9 sm:flex-row sm:items-center">
              <a
                href="#cta"
                className="inline-flex items-center justify-center gap-2 bg-electric-500 hover:bg-electric-600 text-white font-bold px-7 py-3.5 rounded-2xl transition-colors shadow-[0_8px_24px_rgba(15,94,255,0.35)]"
              >
                Bepul demo olish <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 border border-line hover:border-electric-300 font-bold px-7 py-3.5 rounded-2xl transition-colors"
              >
                Panelni ko&apos;rish
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-8 sm:mt-10 text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Ulanadi:
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Instagram className="w-4.5 h-4.5 text-pink-500" /> Instagram
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Send className="w-4.5 h-4.5 text-sky-500" /> Telegram
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Youtube className="w-4.5 h-4.5 text-red-500" /> YouTube
              </span>
            </div>
          </div>

          <HeroChatDemo />
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-line bg-[#fafbff]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 grid gap-6 text-center sm:grid-cols-3">
          {[
            ["5 soniya", "o'rtacha javob vaqti"],
            ["24/7", "tunu-kun ishlaydi"],
            ["0 ta", "o'tkazib yuborilgan xabar"],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="text-3xl font-extrabold electric-text-gradient">
                {v}
              </div>
              <div className="text-sm text-slate-400 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features — bento grid */}
      <section id="features" className="py-14 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-[40px] font-extrabold tracking-tight text-center">
            Bitta platforma — <span className="electric-text-gradient">barcha muloqot</span>
          </h2>
          <p className="text-slate-500 text-center mt-4 max-w-xl mx-auto">
            Kech javob tufayli mijoz yo&apos;qotish endi tarixda qoladi
          </p>

          <div className="grid gap-3 mt-8 md:grid-cols-3 md:gap-4 md:mt-14">
            {/* Big card */}
            <div className="md:col-span-2 rounded-2xl md:rounded-3xl bg-navy-900 text-white p-4 md:p-8 relative overflow-hidden">
              <div className="absolute inset-0 dot-grid opacity-10" />
              <div className="relative flex items-start gap-4 md:block">
                <span className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-xl md:rounded-2xl electric-gradient flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-base leading-snug md:text-2xl md:mt-5">
                    AI agent — siz kabi muloqot qiladi
                  </h3>
                  <p className="text-xs md:text-base text-slate-400 mt-1.5 md:mt-2 max-w-md leading-relaxed">
                    Bilimlar bazangizga tayanib har bir savolga aniq javob
                    beradi, katalog yuboradi, buyurtma rasmiylashtiradi va
                    mijoz raqamini so&apos;rab leadga aylantiradi.
                  </p>
                  <div className="hidden md:flex items-center gap-2 mt-6 flex-wrap">
                    {["Savol-javob", "Katalog yuborish", "Buyurtma", "Lead yig'ish"].map(
                      (t) => (
                        <span
                          key={t}
                          className="text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-lg"
                        >
                          {t}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl md:block md:rounded-3xl border border-line p-4 md:p-7 hover:border-electric-300 transition-colors">
              <span className="w-11 h-11 shrink-0 rounded-xl bg-electric-50 flex items-center justify-center">
                <Users className="w-5.5 h-5.5 text-electric-600" />
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-base leading-snug md:text-lg md:mt-4">
                  Leadlar avtopilotda
                </h3>
                <p className="text-xs md:text-sm text-slate-500 mt-1.5 md:mt-2 leading-relaxed">
                  Qiziqqan mijozlar raqami so&apos;raladi va holatiga qarab saralanib,
                  arizalar bo&apos;limiga tushadi.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl md:block md:rounded-3xl border border-line p-4 md:p-7 hover:border-electric-300 transition-colors">
              <span className="w-11 h-11 shrink-0 rounded-xl bg-electric-50 flex items-center justify-center">
                <ShieldAlert className="w-5.5 h-5.5 text-electric-600" />
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-base leading-snug md:text-lg md:mt-4">
                  Shikoyat va takliflar
                </h3>
                <p className="text-xs md:text-sm text-slate-500 mt-1.5 md:mt-2 leading-relaxed">
                  AI ularni ajratib alohida bo&apos;limlarga saqlaydi — hech narsa
                  e&apos;tibordan chetda qolmaydi.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl md:block md:rounded-3xl border border-line p-4 md:p-7 hover:border-electric-300 transition-colors">
              <span className="w-11 h-11 shrink-0 rounded-xl bg-electric-50 flex items-center justify-center">
                <BookOpen className="w-5.5 h-5.5 text-electric-600" />
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-base leading-snug md:text-lg md:mt-4">
                  AI Studio
                </h3>
                <p className="text-xs md:text-sm text-slate-500 mt-1.5 md:mt-2 leading-relaxed">
                  Bilimlar bazasi, FAQ, stsenariylar va sinov maydoni — agentni
                  bir joydan boshqaring.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl md:block md:rounded-3xl border border-line p-4 md:p-7 hover:border-electric-300 transition-colors">
              <span className="w-11 h-11 shrink-0 rounded-xl bg-electric-50 flex items-center justify-center">
                <BarChart3 className="w-5.5 h-5.5 text-electric-600" />
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-base leading-snug md:text-lg md:mt-4">
                  To&apos;liq analitika
                </h3>
                <p className="text-xs md:text-sm text-slate-500 mt-1.5 md:mt-2 leading-relaxed">
                  Dialoglar, javob vaqti, kanal statistikasi va intentlar — 7/30
                  kunlik kesimda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-14 md:py-24 bg-[#fafbff] border-y border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-[40px] font-extrabold tracking-tight text-center">
            3 qadamda ishga tushadi
          </h2>
          <div className="grid gap-3 mt-8 md:grid-cols-3 md:gap-5 md:mt-14">
            {steps.map((s) => (
              <div
                key={s.n}
                className="flex items-start gap-4 rounded-2xl md:block md:rounded-3xl bg-white border border-line p-4 md:p-7 relative"
              >
                <span className="w-12 shrink-0 text-2xl font-extrabold leading-none text-electric-200 md:w-auto md:text-5xl md:text-electric-100">
                  {s.n}
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold text-base leading-snug md:text-lg md:mt-3">
                    {s.title}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 mt-1.5 md:mt-2 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      {/* CTA */}
      <section id="cta" className="pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="rounded-[32px] electric-gradient text-white p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-white/10" />
            <div className="relative">
              <h2 className="text-3xl md:text-[40px] font-extrabold tracking-tight">
                Bepul demo uchun ariza qoldiring
              </h2>
              <p className="text-electric-100 mt-3">
                Jamoamiz platformani biznesingizga moslab ko&apos;rsatib beradi
              </p>
              <DemoForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <LogoMark className="w-7 h-7" />
            <span className="font-bold text-slate-600">chatspace</span>
          </div>
          <div>© 2026 Chatspace. Barcha huquqlar himoyalangan.</div>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/admin" className="hover:text-slate-600">
              Mijoz paneli
            </Link>
            <Link href="/owner" className="hover:text-slate-600">
              Boshqaruv
            </Link>
            <Link href="/privacy" className="hover:text-slate-600">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-600">
              Terms
            </Link>
            <Link href="/data-deletion" className="hover:text-slate-600">
              Data deletion
            </Link>
            <SupportLink variant="subtle" />
          </div>
        </div>
      </footer>
    </div>
  );
}
