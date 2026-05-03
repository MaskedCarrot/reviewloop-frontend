import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import Reveal from "@/components/marketing/Reveal";

export const metadata = {
  title: "Help & contact · GoodWord",
  description:
    "Real human support, same day. Read the quick fixes for the most common setup questions, then email or schedule a call if you still need a hand.",
};

const SUPPORT_EMAIL = "support-goodword@maskedcarrotlabs.com";

const supportMailto = `mailto:${SUPPORT_EMAIL}?${new URLSearchParams({
  subject: "GoodWord — support",
  body: "Hi team,\n\nMy business: \n\nI need help with: \n\n",
}).toString()}`;

const callMailto = `mailto:${SUPPORT_EMAIL}?${new URLSearchParams({
  subject: "Schedule a 20-min call — GoodWord",
  body:
    "Hi — I'd like to book a short call.\n\nMy business: \nA good time for me: \nWhat I'd like to cover: \n",
}).toString()}`;

const COMMON_SETUP: { title: string; body: string }[] = [
  {
    title: "1. Confirm your business basics",
    body:
      "Sign in → Settings → Business. Your business name shows up as the \"From\" label on every send, so put your real, customer-facing name. Country and timezone control quiet hours. No DNS, no DKIM — sending is already authenticated on our side.",
  },
  {
    title: "2. Add your review links",
    body:
      "Settings → Locations → Review links. Drop in your Google, Yelp, Facebook (or any other) link. We'll auto-suggest your Google review link if you tell us your business name + city.",
  },
  {
    title: "3. Pick a starter template",
    body:
      "Templates → New from preset. We ship voice-tuned starters per industry (café, salon, dentist, trades, restaurant, ecom). Edit the sentence, save, send a test to yourself.",
  },
  {
    title: "4. Bring in a few customers",
    body:
      "People → Add. Upload a small CSV (we accept any column order — just tell us which is the email), or print the QR poster from QR → Print. Send your first batch when you're ready.",
  },
];

const QUICK_FAQ: { q: string; a: string; href?: string }[] = [
  {
    q: "Emails are landing in promotions / spam",
    a: "Sender authentication is handled on our side, so it's almost never a DNS issue. Most often it's a subject line that screams promotional (\"Please leave us a 5-star review!\") or a contact list with stale addresses. Try a calmer subject and check your suppression list under Settings → Suppressions. Email us if it persists — we read the headers for you.",
  },
  {
    q: "I can't find my Google review link",
    a: "Search your business in Google Maps → 'Write a review'. Copy that URL into Settings → Locations → Review links. Or — paste your Place ID and we'll generate the link for you.",
  },
  {
    q: "How do I import customers from Square / Toast / Jobber?",
    a: "Export to CSV from your tool, then drag the file onto People → Import. We'll auto-map columns — you only need name + email at minimum.",
  },
  {
    q: "Why isn't anyone replying yet?",
    a: "Two things to check, in order: (1) is your timing reasonable for your industry? (cafés: ~4h after visit; salons: ~2h; trades: next day) (2) is your subject line conversational, not 'Please leave us a 5-star review!'? The defaults we ship are good — small tweaks beat big ones. Sender authentication is already handled on our side.",
  },
  {
    q: "Can I bulk-stop sends to one customer?",
    a: "Yes. People → Search them → 'Stop messaging'. They'll be permanently suppressed across all locations under your business.",
  },
  {
    q: "I want SMS, not email — how do I enable it?",
    a: "SMS is opt-in. Settings → Messaging → 'Request SMS access'. We'll get back to you the same business day to switch it on for your account.",
  },
];

export default function SupportPage() {
  return (
    <div className="marketing-root">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 right-[-15%] h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-warm-200/50 via-warm-100/30 to-transparent blur-3xl animate-float-blob" />
        <div className="absolute bottom-[-8rem] left-[-15%] h-[18rem] w-[18rem] rounded-full bg-gradient-to-tr from-emerald-100/40 to-brand-100/30 blur-3xl animate-float-blob-2" />
      </div>

      <MarketingHeader />

      {/* ---------------- HERO ---------------- */}
      <section className="marketing-section pt-12 sm:pt-16 pb-8">
        <div className="max-w-3xl mx-auto text-center">
          <span className="marketing-eyebrow mx-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
            Help & contact
          </span>
          <h1 className="display-title-xl mt-4 text-slate-900">
            Real humans. <em>Same day.</em>
          </h1>
          <p className="mt-5 text-lg text-slate-700 leading-relaxed">
            Most issues are fixed below in two minutes. If yours isn't, write to us — we
            read every message and reply the same business day.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-pulse-ring" />
              <span className="relative inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-sm font-semibold text-emerald-800">
              All systems normal — usually replying within 2-4 hours
            </span>
          </div>
        </div>
      </section>

      {/* ---------------- GET HELP CARDS ---------------- */}
      <section className="marketing-section pt-4 pb-12 max-w-5xl">
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-soft h-full flex flex-col">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-200">
                  <MailIcon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="display-title text-xl text-slate-900">Write to us</h2>
                  <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
                    Add your business name and what you'd like sorted. We read everything.
                  </p>
                </div>
              </div>
              <div className="mt-5 sm:mt-auto pt-5">
                <a href={supportMailto} className="cta-warm w-full justify-center">
                  <MailIcon className="h-4 w-4" />
                  Open in your email app
                </a>
                <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Or write to
                </p>
                <p className="mt-1 text-center text-sm text-slate-700 font-mono break-all">
                  {SUPPORT_EMAIL}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-3xl border border-warm-200/80 bg-gradient-to-br from-warm-50 to-white p-6 sm:p-7 shadow-soft h-full flex flex-col">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-warm-100 text-warm-700 ring-1 ring-warm-200">
                  <CalendarIcon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="display-title text-xl text-slate-900">Schedule a 20-min call</h2>
                  <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
                    Best for setup walkthroughs, deliverability questions, or trickier multi-location stuff.
                  </p>
                </div>
              </div>
              <ul className="mt-5 space-y-1.5 text-sm text-slate-700">
                {[
                  "Find your Google Place ID + review link",
                  "Pick the right template for your industry",
                  "Sanity-check your first send",
                  "Talk through pricing or multi-location setups",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 sm:mt-auto pt-5">
                <a href={callMailto} className="cta-secondary w-full justify-center">
                  <CalendarIcon className="h-4 w-4" />
                  Request a call
                </a>
                <p className="mt-3 text-center text-[11px] text-slate-500">
                  No hard sell. Honest 20 minutes.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- COMMON SETUP ---------------- */}
      <section className="marketing-section py-12 max-w-5xl">
        <Reveal>
          <p className="marketing-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
            Common setup
          </p>
          <h2 className="display-title-lg mt-3 text-slate-900">
            The 4 things to do on day one.
          </h2>
          <p className="mt-3 text-base text-slate-700 max-w-xl">
            If you've never set up an email tool before — start here. Each step takes just
            a few minutes.
          </p>
        </Reveal>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2">
          {COMMON_SETUP.map((row, i) => (
            <Reveal key={row.title} as="li" delay={i * 60}>
              <div className="h-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft hover:shadow-card-hover transition-shadow">
                <h3 className="text-base font-semibold text-slate-900">{row.title}</h3>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">{row.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ---------------- QUICK FAQ ---------------- */}
      <section className="marketing-section py-12 max-w-3xl">
        <Reveal>
          <p className="marketing-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
            Quick fixes
          </p>
          <h2 className="display-title-lg mt-3 text-slate-900">
            The 6 things people ask most.
          </h2>
        </Reveal>

        <div className="mt-7 divide-y divide-slate-200 rounded-3xl border border-slate-200/80 bg-white shadow-soft overflow-hidden">
          {QUICK_FAQ.map((row, i) => (
            <details key={row.q} className="group" open={i === 0}>
              <summary className="cursor-pointer list-none px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between gap-4 hover:bg-slate-50/80">
                <span className="text-base font-semibold text-slate-900">{row.q}</span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition-transform group-open:rotate-45">
                  <PlusIcon className="h-4 w-4" />
                </span>
              </summary>
              <p className="px-5 sm:px-7 pb-5 sm:pb-6 text-sm sm:text-[0.95rem] text-slate-700 leading-relaxed">
                {row.a}
              </p>
            </details>
          ))}
        </div>

        <p className="mt-6 text-sm text-slate-600 text-center">
          More in our{" "}
          <Link href="/faq" className="link">
            full FAQ
          </Link>
          .
        </p>
      </section>

      {/* ---------------- STATUS / TRUST ---------------- */}
      <section className="marketing-section py-12 max-w-5xl">
        <Reveal>
          <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-6 sm:p-8 shadow-soft">
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                {
                  label: "Avg first reply",
                  value: "2–4h",
                  hint: "During business hours",
                },
                {
                  label: "Issues resolved in 1 reply",
                  value: "78%",
                  hint: "Last 90 days",
                },
                {
                  label: "Founder-replies",
                  value: "Often",
                  hint: "On harder questions",
                },
              ].map((row) => (
                <div key={row.label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                  <p className="text-2xl sm:text-3xl font-display font-medium text-slate-900 leading-none">
                    {row.value}
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {row.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{row.hint}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-slate-700 leading-relaxed">
              We're a small team — but you'll never get stuck in a chatbot loop. If your
              question takes time, we'll tell you the timeline up-front.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ---------------- FOOTER NAV ---------------- */}
      <section className="marketing-section pb-20">
        <nav
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-600"
          aria-label="Related pages"
        >
          <Link href="/" className="link">
            Home
          </Link>
          <span className="text-slate-400" aria-hidden>
            ·
          </span>
          <Link href="/how-it-works" className="link">
            How it works
          </Link>
          <span className="text-slate-400" aria-hidden>
            ·
          </span>
          <Link href="/pricing" className="link">
            Pricing
          </Link>
          <span className="text-slate-400" aria-hidden>
            ·
          </span>
          <Link href="/faq" className="link">
            FAQ
          </Link>
          <span className="text-slate-400" aria-hidden>
            ·
          </span>
          <Link href="/privacy" className="link">
            Privacy
          </Link>
        </nav>
      </section>

      <MarketingFooter />
    </div>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 6h16v12H4V6z" strokeLinejoin="round" />
      <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3.75v2.25M17.25 3.75v2.25M3.75 7.5h16.5M3.75 4.5h16.5A2.25 2.25 0 0 1 22.5 6.75v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18.75V6.75A2.25 2.25 0 0 1 3.75 4.5Z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <path d="M5 12l5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
