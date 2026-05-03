import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import Reveal from "@/components/marketing/Reveal";
import { USE_CASES, USE_CASE_TONES } from "@/components/marketing/useCasesData";

export const metadata = {
  title: "Use cases · GoodWord",
  description:
    "Hand-tuned templates and timing for cafés, salons, dentists, trades, restaurants and online shops. Pick the playbook closest to your business and start sending today.",
};

export default function UseCasesPage() {
  return (
    <div className="marketing-root">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 right-[-15%] h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-warm-200/50 via-warm-100/30 to-transparent blur-3xl animate-float-blob" />
        <div className="absolute bottom-[-10rem] left-[-15%] h-[22rem] w-[22rem] rounded-full bg-gradient-to-tr from-brand-100/40 to-sky-100/30 blur-3xl animate-float-blob-2" />
      </div>

      <MarketingHeader />

      {/* ---------------- HERO ---------------- */}
      <section className="marketing-section pt-12 sm:pt-16 pb-8 sm:pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <span className="marketing-eyebrow mx-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
            Vertical playbooks
          </span>
          <h1 className="display-title-xl mt-4 text-slate-900">
            Pick the version of <em>you</em>.
          </h1>
          <p className="mt-5 text-lg text-slate-700 leading-relaxed">
            We've baked the timing, the tone, and the templates that work for your kind of
            business. Pick yours, copy the template, send your first message today.
          </p>
        </div>

        {/* Anchor nav */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {USE_CASES.map((u) => {
            const tone = USE_CASE_TONES[u.tone];
            return (
              <a
                key={u.slug}
                href={`#${u.slug}`}
                className={`inline-flex items-center gap-2 rounded-full border bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors ${tone.iconRing}`}
              >
                <span>{u.emoji}</span>
                <span>{u.label}</span>
              </a>
            );
          })}
        </div>
      </section>

      {/* ---------------- USE CASE SECTIONS ---------------- */}
      <section className="marketing-section pb-12 max-w-6xl space-y-12 sm:space-y-16">
        {USE_CASES.map((u, i) => {
          const tone = USE_CASE_TONES[u.tone];
          return (
            <Reveal key={u.slug} as="section">
              <article
                id={u.slug}
                className={`scroll-mt-28 rounded-[2rem] border bg-gradient-to-br ${tone.card} p-6 sm:p-10 shadow-card`}
              >
                <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12 items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-14 w-14 place-items-center rounded-2xl ${tone.iconBg} text-2xl ring-1 ${tone.iconRing}`}
                      >
                        {u.emoji}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${tone.chip}`}>
                        Playbook {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <h2 className="display-title-lg mt-5 text-slate-900">{u.title}</h2>
                    <p className="mt-3 text-base sm:text-lg text-slate-700 leading-relaxed">
                      {u.pitch}
                    </p>

                    <ul className="mt-6 space-y-2.5">
                      {u.outcomes.map((o) => (
                        <li key={o} className="flex items-start gap-2.5 text-[0.95rem] text-slate-700">
                          <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-7 rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-sm px-5 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Insight
                      </p>
                      <p className="mt-1.5 text-sm text-slate-800 italic leading-relaxed">
                        “{u.insight}”
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link href="/login?new=1" className="cta-warm">
                        Use this playbook
                      </Link>
                      <Link href="/how-it-works" className="cta-ghost">
                        How the loop works →
                      </Link>
                    </div>
                  </div>

                  {/* Email mock */}
                  <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-card">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold tracking-wide uppercase">Email preview</span>
                      <span className="font-mono">Today · 2:14 pm</span>
                    </div>
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <p className="text-[12px] text-slate-500">From: Your business</p>
                      <p className="text-[12px] text-slate-500">To: Maya Patel</p>
                      <p className="mt-2 text-base font-semibold text-slate-900">
                        {u.template.subject}
                      </p>
                    </div>
                    <div className="mt-3 whitespace-pre-line rounded-xl bg-slate-50/80 px-4 py-3 text-sm text-slate-800 leading-relaxed">
                      {u.template.body}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                      <span>1 credit · email</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold uppercase tracking-wide text-emerald-700">
                        Authenticated sender
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </section>

      {/* ---------------- "DON'T SEE YOURS" ---------------- */}
      <section className="marketing-section py-12 max-w-3xl">
        <Reveal>
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card text-center">
            <p className="marketing-eyebrow mx-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
              Don't see your industry?
            </p>
            <h2 className="display-title-lg mt-3 text-slate-900">
              These six are starters — not limits.
            </h2>
            <p className="mt-3 text-base text-slate-700 leading-relaxed max-w-xl mx-auto">
              Gym, vet, accountant, photographer, tutor, fitness studio, real-estate agent…
              the loop works for any business with happy customers and a Google profile.
              The starting templates apply; the tone is yours.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/login?new=1" className="cta-warm">
                Start free
              </Link>
              <a href="mailto:hello@maskedcarrotlabs.com" className="cta-secondary">
                Tell us your industry
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <MarketingFooter />
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <path d="M5 12l5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
