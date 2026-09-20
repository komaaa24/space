import Link from "next/link";
import { LogoMark } from "@/components/logo";

type LegalSection = {
  title: string;
  body: string[];
};

export function LegalPage({
  title,
  description,
  updatedAt,
  sections,
}: {
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-screen bg-[#fafbff] text-[#0b1226]">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-20 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark className="h-10 w-10" />
            <span className="text-xl font-extrabold tracking-tight">
              chatspace
            </span>
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-line px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:border-electric-300 hover:text-electric-600"
          >
            Bosh sahifa
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-line bg-white p-7 shadow-[0_18px_60px_rgba(11,18,38,0.05)] md:p-10">
          <div className="mb-8 border-b border-line pb-7">
            <div className="text-xs font-bold uppercase tracking-wider text-electric-600">
              Chatspace legal
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-[42px]">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-500">
              {description}
            </p>
            <p className="mt-4 text-sm font-semibold text-slate-400">
              Oxirgi yangilanish: {updatedAt}
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-extrabold tracking-tight">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600 md:text-[15px]">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl bg-electric-50 p-5 text-sm text-electric-800">
            Savollar uchun Telegram support:{" "}
            <a
              href="https://t.me/chatspacesupport"
              className="font-extrabold text-electric-600 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              @chatspacesupport
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
