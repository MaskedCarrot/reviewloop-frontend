import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import HeroFlowVisual from "@/components/marketing/HeroFlowVisual";
import Reveal from "@/components/marketing/Reveal";
import AnimatedCounter from "@/components/marketing/AnimatedCounter";
import { getPublicConfig } from "@/lib/api/goodwordApi";
import { PRO_PLAN, upToReviewEmails, upToSms, usd } from "@/lib/pricingDisplay";

export const metadata = {
  title: "How GoodWord works — from first send to first 5★",
  description:
    "A walk-through of the GoodWord loop: bring your customer list, send the right nudge at the right moment, route happy ones to Google, catch unhappy feedback privately. 10-minute setup.",
};

export default async function HowItWorksPage() {
  const e = upToReviewEmails(PRO_PLAN.monthlyCredits);
  const s = upToSms(PRO_PLAN.monthlyCredits);
  const config = await getPublicConfig().catch(() => null);
  const showSms = config?.sms_public_preview === true;

  const steps: {
    n: string;
    title: string;
    body: React.ReactNode;
    visual: React.ReactNode;
    bullets: string[];
  }[] = [
    {
      n: "01",
      title: "Bring your list together",
      body: (
        <>
          Wherever your customers live today — a spreadsheet, a POS export, a paper sign-up
          sheet — we make it easy to bring them in. Add by hand, upload a CSV, or drop a
          QR poster at the counter and let people sign themselves up.
        </>
      ),
      bullets: [
        "Drag-and-drop CSV import with smart column mapping",
        "Per-business QR poster (printable, brand-coloured)",
        "Auto-dedup on email — never message the same person twice",
        "GDPR-compliant opt-in audit trail recorded for every contact",
      ],
      visual: <BringTogetherVisual />,
    },
    {
      n: "02",
      title: "Write the message once",
      body: showSms ? (
        <>
          Pick a tone, edit the template (we ship sensible defaults per industry), and add
          personalisation tokens. Email and — where supported — SMS, with separate
          templates per location if you want regional voice.
        </>
      ) : (
        <>
          Pick a tone, edit the email template (we ship sensible defaults per industry),
          and add personalisation tokens. Different locations can have different voices —
          your Wimbledon shop's email can be different from your Brighton one.
        </>
      ),
      bullets: [
        "Industry-tuned starters — café, salon, dentist, trades, restaurant, ecom",
        "Personalisation tokens: {{first_name}}, {{location}}, {{review_link}}",
        "Live preview with a fake customer — no risk of sending tests by accident",
        showSms ? "Email and SMS templates kept in sync" : "Add SMS later — it's an opt-in upgrade",
      ],
      visual: <TemplateVisual />,
    },
    {
      n: "03",
      title: "We send at the right moment",
      body: (
        <>
          Most "review nudges" fail because they're sent badly. We default to the timing
          that actually converts for your industry — and respect quiet hours so we never
          ping anyone at 3am.
        </>
      ),
      bullets: [
        "Sensible per-industry delay defaults (cafés: 4 hours; salons: 2 hours; trades: next day)",
        "Quiet hours per location — we hold sends until your timezone's morning",
        "Authenticated sending pool we run for you — no DNS records, no DKIM headaches",
        "Real-time delivery + bounce tracking via SendGrid + Twilio",
      ],
      visual: <TimingVisual />,
    },
    {
      n: "04",
      title: "One tap to a review — or to you",
      body: (
        <>
          The customer sees a clean page with a single big button. If they tap 5 stars,
          they go to your Google form pre-filled. If they tap 1-3 stars, we route them to a
          private feedback form so the gripe lands in your inbox, not on Google.
        </>
      ),
      bullets: [
        "Deep-links straight to Google's mobile review composer",
        "Routes to Yelp / Facebook / TripAdvisor based on your platform mix",
        "Private-feedback form for unhappy ratings — closes the loop with the customer",
        "Mobile-, desktop- and in-app-browser tested (Instagram + Facebook in-app especially)",
      ],
      visual: <RoutingVisual />,
    },
    {
      n: "05",
      title: "Measure, tune, repeat",
      body: (
        <>
          Your dashboard shows opens, taps, Google intents and private notes. You'll see
          which template is converting, which location is on a hot streak, and whose
          delivery rate dipped — so you can keep refining the loop.
        </>
      ),
      bullets: [
        "Real-time KPI dashboard — opens, taps, Google intents, private notes",
        "Compare templates / locations / industries head-to-head",
        "Suppression list managed automatically (bounces, complaints, unsubscribes)",
        "Credits never expire; sends stop the moment your balance hits zero — no surprise overages",
      ],
      visual: <DashboardVisual />,
    },
  ];

  return (
    <div className="marketing-root">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 right-[-15%] h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-warm-200/50 via-warm-100/30 to-transparent blur-3xl animate-float-blob" />
        <div className="absolute bottom-[-8rem] left-[-15%] h-[22rem] w-[22rem] rounded-full bg-gradient-to-tr from-brand-100/40 to-sky-100/30 blur-3xl animate-float-blob-2" />
      </div>

      <MarketingHeader />

      {/* ---------------- HERO ---------------- */}
      <section className="marketing-section pt-12 sm:pt-16 pb-10 sm:pb-16">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16 items-center">
          <div className="space-y-6 animate-home-in">
            <span className="marketing-eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
              The whole loop, in 5 steps
            </span>
            <h1 className="display-title-xl text-slate-900">
              From first send to first <em>5-star</em> — usually within a day.
            </h1>
            <p className="text-lg text-slate-700 max-w-xl leading-relaxed">
              GoodWord is built around a simple loop: collect, ask kindly, route to the
              right place, learn. Here's the whole thing — no fluff, no jargon.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/login?new=1" className="cta-warm">
                Try it free
              </Link>
              <Link href="#first-10" className="cta-secondary">
                See the 10-minute setup
              </Link>
            </div>
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{usd(PRO_PLAN.priceUsd)}/mo</span> ·
              up to {e} emails{showSms ? <> or {s} SMS (or a mix)</> : null} ·{" "}
              <Link href="/pricing" className="link">
                see pricing
              </Link>
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <HeroFlowVisual />
          </div>
        </div>
      </section>

      {/* ---------------- TIMELINE STEPS ---------------- */}
      <section className="marketing-section pb-16 sm:pb-24 max-w-5xl">
        <div className="relative">
          {/* Vertical guide line on lg+ */}
          <div
            aria-hidden
            className="hidden md:block absolute left-[3.25rem] top-12 bottom-12 w-px bg-gradient-to-b from-warm-300/0 via-warm-300/70 to-warm-300/0"
          />
          <ol className="space-y-10 sm:space-y-14">
            {steps.map((step, i) => (
              <Reveal key={step.n} as="li" delay={i * 80}>
                <article className="relative grid gap-6 md:grid-cols-[5.5rem_1fr] md:gap-8 items-start">
                  {/* Step pill */}
                  <div className="relative md:pt-1">
                    <div className="inline-flex md:flex md:flex-col items-center gap-3 md:gap-2">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-900 text-white text-sm font-semibold shadow-card">
                        {step.n}
                      </span>
                      <span className="hidden md:inline-flex marketing-eyebrow border-warm-200 bg-warm-50 text-warm-700">
                        Step {Number(step.n)}
                      </span>
                    </div>
                  </div>

                  {/* Card */}
                  <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-soft hover:shadow-card transition-shadow">
                    <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:gap-10 items-start">
                      <div>
                        <h2 className="display-title text-2xl sm:text-3xl text-slate-900 leading-tight">
                          {step.title}
                        </h2>
                        <p className="mt-3 text-base text-slate-700 leading-relaxed">{step.body}</p>
                        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                          {step.bullets.map((b) => (
                            <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 grid place-items-center min-h-[10rem]">
                        {step.visual}
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- FIRST 10 MINUTES ---------------- */}
      <section id="first-10" className="marketing-section py-16 sm:py-20">
        <Reveal>
          <div className="rounded-3xl border border-warm-200/80 bg-gradient-to-br from-warm-50 via-white to-white p-7 sm:p-10 shadow-card">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr] items-start">
              <div>
                <p className="marketing-eyebrow">
                  <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
                  Your first 10 minutes
                </p>
                <h2 className="display-title-lg mt-3 text-slate-900">
                  Sign up at 9:00 — sending by 9:10.
                </h2>
                <p className="mt-4 text-base text-slate-700 leading-relaxed max-w-md">
                  We've shaved every onboarding step we could. Most owners are sending their
                  first review request before their second coffee.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/login?new=1" className="cta-warm">
                    Start the 10-minute setup
                  </Link>
                  <Link href="/use-cases" className="cta-ghost">
                    See vertical playbooks →
                  </Link>
                </div>
              </div>
              <ol className="space-y-3">
                {[
                  { time: "0:00", label: "Sign in with Google" },
                  { time: "1:00", label: "Add your business + first location" },
                  { time: "3:00", label: "Pick the industry-tuned email template" },
                  { time: "5:00", label: "Add 1 contact (yourself!) and send a test" },
                  { time: "7:00", label: "Drop a CSV of recent customers, or print the QR" },
                  { time: "10:00", label: "Watch your first reply come in" },
                ].map((row) => (
                  <li
                    key={row.time}
                    className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-soft"
                  >
                    <span className="grid h-9 w-12 shrink-0 place-items-center rounded-md bg-slate-900 text-xs font-bold tabular-nums text-white">
                      {row.time}
                    </span>
                    <span className="text-sm text-slate-800">{row.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- METRICS / TRUST ---------------- */}
      <section className="marketing-section py-16 sm:py-20 max-w-5xl">
        <Reveal>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                v: <AnimatedCounter to={28} suffix="%" />,
                label: "Average reply rate",
                hint: "Across the beta cohort",
              },
              {
                v: <AnimatedCounter to={3.4} decimals={1} suffix="×" />,
                label: "More reviews per month",
                hint: "Compared to till-side asking",
              },
              {
                v: <AnimatedCounter to={9} />,
                label: "Average minutes to first send",
                hint: "From sign-in to inbox-delivered",
              },
            ].map((it) => (
              <div
                key={it.label}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft text-center"
              >
                <p className="text-4xl sm:text-5xl font-display font-medium text-slate-900 tabular-nums leading-none">
                  {it.v}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{it.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{it.hint}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="marketing-section pb-20">
        <Reveal>
          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-10 text-center shadow-card">
            <p className="marketing-eyebrow mx-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
              Ready when you are
            </p>
            <h2 className="display-title-lg mt-4 text-slate-900">
              Try it on your business — free.
            </h2>
            <p className="mt-3 text-base sm:text-lg text-slate-700 max-w-xl mx-auto leading-relaxed">
              Sign in with Google, drop in a contact, send your first nudge. Whole thing
              takes less time than a coffee break.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/login?new=1" className="cta-warm">
                Start free
              </Link>
              <Link href="/pricing" className="cta-secondary">
                See pricing
              </Link>
              <Link href="/faq" className="cta-ghost">
                Read the FAQ →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <MarketingFooter />
    </div>
  );
}

/* ---------- per-step inline visuals ---------- */

function BringTogetherVisual() {
  return (
    <div className="w-full grid grid-cols-3 gap-2 text-center">
      {[
        { label: "CSV", emoji: "📄" },
        { label: "QR poster", emoji: "📱" },
        { label: "Hand", emoji: "✍️" },
      ].map((it) => (
        <div
          key={it.label}
          className="rounded-xl border border-slate-200 bg-white px-2 py-3 shadow-sm"
        >
          <div className="text-xl">{it.emoji}</div>
          <p className="mt-1 text-[0.65rem] font-semibold text-slate-700">{it.label}</p>
        </div>
      ))}
      <div className="col-span-3 mt-1 rounded-xl bg-slate-900 text-white px-3 py-2 text-xs font-semibold flex items-center justify-between">
        <span>One unified contact list</span>
        <span className="rounded-md bg-warm-500 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide">
          212 contacts
        </span>
      </div>
    </div>
  );
}

function TemplateVisual() {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-slate-400">
        Email template
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900">
        Hey {`{{first_name}}`} — thanks ☕
      </p>
      <p className="mt-1 text-xs text-slate-700 leading-snug">
        If you have 20s, would you mind sharing how it went?
      </p>
      <span className="mt-3 inline-flex items-center gap-1 rounded-md bg-slate-900 text-white px-2 py-1 text-[0.65rem] font-semibold">
        Leave a review
      </span>
    </div>
  );
}

function TimingVisual() {
  return (
    <div className="w-full text-left">
      <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-slate-400">
        Send window
      </p>
      <div className="mt-2 relative h-2 rounded-full bg-slate-200">
        <span className="absolute left-[20%] right-[15%] inset-y-0 rounded-full bg-warm-500/80" />
        <span className="absolute left-[45%] -top-1 h-4 w-4 rounded-full bg-white border-2 border-warm-500 shadow-sm" />
      </div>
      <div className="mt-1.5 flex justify-between text-[0.6rem] font-medium text-slate-500 tabular-nums">
        <span>9am</span>
        <span>1pm</span>
        <span>5pm</span>
        <span>9pm</span>
      </div>
      <p className="mt-2 text-xs text-slate-700">
        Cafés convert best 2–5pm. We default there; you can override.
      </p>
    </div>
  );
}

function RoutingVisual() {
  return (
    <div className="w-full">
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-center">
        <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-slate-400">Tap rating</p>
        <div className="mt-1 flex items-center justify-center gap-1 text-warm-500">
          {[0, 1, 2, 3, 4].map((i) => (
            <svg key={i} className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 6.2H21l-5 3.8 1.9 6L12 15.8 5.1 18l1.9-6-5-3.8h6.6L12 2z" />
            </svg>
          ))}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1.5 text-[0.65rem] font-semibold text-emerald-800 text-center">
          5★ → Google
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5 text-[0.65rem] font-semibold text-amber-800 text-center">
          1–3★ → You
        </div>
      </div>
    </div>
  );
}

function DashboardVisual() {
  return (
    <div className="w-full text-left">
      <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-slate-400">
        Last 30 days
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <KpiSm label="Sent" v="318" />
        <KpiSm label="Opened" v="74%" />
        <KpiSm label="5★" v="41" />
      </div>
      <div className="mt-3 h-12 flex items-end gap-1">
        {[6, 8, 5, 9, 11, 7, 12, 10, 13, 16, 12, 18].map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-t-sm bg-gradient-to-t from-warm-300 to-warm-500"
            style={{ height: `${(h / 18) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function KpiSm({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded-md bg-white border border-slate-200 px-2 py-1.5 text-center">
      <p className="text-sm font-semibold text-slate-900 tabular-nums leading-none">{v}</p>
      <p className="mt-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
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
