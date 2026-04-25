import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata = { title: "Support · ReviewLoop" };

const SUPPORT_EMAIL = "support-reviewloop@maskedcarrotlabs.com";

const supportMailto = `mailto:${SUPPORT_EMAIL}?${new URLSearchParams({
  subject: "ReviewLoop — support",
  body: "Hi team,\n\nMy business: \n\nI need help with: \n\n",
}).toString()}`;

const scheduleCallMailto = `mailto:${SUPPORT_EMAIL}?${new URLSearchParams({
  subject: "Schedule a call — ReviewLoop",
  body: "Hi — I'd like to book a short call. My business: \n\nWhat I'd like to cover: \n",
}).toString()}`;

function IconZap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
      />
    </svg>
  );
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 6h16v12H4V6z" strokeLinejoin="round" />
      <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3.75v2.25M17.25 3.75v2.25M3.75 7.5h16.5M3.75 4.5h16.5A2.25 2.25 0 0 1 22.5 6.75v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18.75V6.75A2.25 2.25 0 0 1 3.75 4.5Z"
      />
    </svg>
  );
}

export default function SupportPage() {
  return (
    <div className="marketing-root">
      <MarketingHeader />

      <main className="flex-1 marketing-section py-10 sm:py-14 max-w-5xl pb-16">
        <header className="marketing-narrow app-section shadow-soft">
          <p className="app-eyebrow">Support</p>
          <h1 className="app-title-hero mt-1">We get back to you fast</h1>
          <p className="app-subtitle text-slate-600 sm:text-base mt-3 leading-relaxed">
            Real people read every message. On business days we usually reply the same day — often within a few hours.
            Thorough or technical issues may take an extra back-and-forth; we always acknowledge right away and set clear
            expectations.
          </p>
        </header>

        <div className="mt-8 sm:mt-10 grid gap-4 sm:gap-6 sm:grid-cols-2">
          <section className="flex flex-col app-section p-6 sm:p-7 shadow-sm sm:min-h-[13rem]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70">
                <IconZap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">What to expect</h2>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                  A prompt first response with next steps — not a ticket in the void, and not a one-size "bot" runaround.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    Same business day for most questions (UK &amp; US hours)
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    Heavy cases (e.g. deliverability) get a real timeline, not radio silence
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="flex flex-col justify-between app-section p-6 sm:p-7 shadow-sm sm:min-h-[13rem]">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800 ring-1 ring-brand-200/60">
                <IconMail className="h-5 w-5" />
              </div>
              <h2 className="mt-3 text-base font-semibold text-slate-900">Write to us</h2>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                Add your business name and what you need; we read everything.
              </p>
            </div>
            <div className="mt-6 sm:mt-4">
              <a
                href={supportMailto}
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-brand-200/80 bg-gradient-to-b from-white to-slate-50/90 px-4 py-3.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-brand-300 hover:from-white hover:to-brand-50/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-400/35 focus:ring-offset-2 sm:py-3.5"
              >
                <IconMail className="h-[1.1rem] w-[1.1rem] text-brand-700" />
                <span>Open in your email app</span>
              </a>
              <p className="mt-3 text-center sm:text-left">
                <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Or write to</span>
                <br />
                <span
                  className="mt-1 inline-block break-all text-sm text-slate-600 font-mono tabular-nums selection:bg-brand-100/80"
                  title="Support address"
                >
                  {SUPPORT_EMAIL}
                </span>
              </p>
            </div>
          </section>
        </div>

        <section className="mt-4 overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50/90 via-amber-50/35 to-white shadow-sm sm:mt-5">
          <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8 sm:p-8">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm ring-1 ring-amber-200/80">
                <IconCalendar className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Prefer a call?</h2>
                <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
                  Send a short note and we'll reply by email to set a time — no pressure, no hard sell. Good for setup
                  walkthroughs or quick questions.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:shrink-0 sm:items-end">
              <a
                href={scheduleCallMailto}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300/60 bg-white px-6 py-3 text-sm font-semibold text-amber-950 shadow-sm transition hover:bg-amber-50/80 hover:border-amber-400/70 min-h-12 sm:w-auto sm:min-w-[10.5rem]"
              >
                <IconCalendar className="h-4 w-4 opacity-80" />
                Request a call
              </a>
            </div>
          </div>
        </section>

        <nav
          className="mt-10 flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-sm text-slate-500"
          aria-label="Related pages"
        >
          <Link href="/" className="rounded-lg px-2 py-1 text-brand-600 font-medium hover:bg-slate-100/80 hover:underline">
            Home
          </Link>
          <span className="text-slate-300" aria-hidden>
            ·
          </span>
          <Link
            href="/pricing"
            className="rounded-lg px-2 py-1 text-brand-600 font-medium hover:bg-slate-100/80 hover:underline"
          >
            Pricing
          </Link>
          <span className="text-slate-300" aria-hidden>
            ·
          </span>
          <Link
            href="/privacy"
            className="rounded-lg px-2 py-1 text-brand-600 font-medium hover:bg-slate-100/80 hover:underline"
          >
            Privacy
          </Link>
        </nav>
      </main>

      <MarketingFooter />
    </div>
  );
}
