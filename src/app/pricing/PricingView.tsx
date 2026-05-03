"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ReactCountryFlag from "react-country-flag";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import Reveal from "@/components/marketing/Reveal";
import SendRatesPanel from "@/components/credits/SendRatesPanel";
import { FREE_PLAN, PRO_PLAN, TOPUP_PACKS, usd } from "@/lib/pricingDisplay";
import type { MembershipOffers, PublicSendRatesResponse } from "@/types";

function maxEmails(credits: number, emailPerSend: number) {
  if (credits <= 0 || emailPerSend <= 0) return 0;
  return Math.floor(credits / emailPerSend);
}

function maxSmsSegments(credits: number, smsPerSegment: number) {
  if (credits <= 0 || smsPerSegment <= 0) return 0;
  return Math.floor(credits / smsPerSegment);
}

type Props = {
  visitorCountry: string | null;
  marketName: string | null;
  emailPerSend: number;
  smsPerSegment: number;
  showSms?: boolean;
  sendRates: PublicSendRatesResponse | null;
  membership: MembershipOffers | null;
  usedFallback: boolean;
};

const PRICING_FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "What's a credit?",
    a: (
      <>
        One credit = one send. Most countries cost{" "}
        <span className="font-semibold text-slate-900">1 credit per email</span>. SMS varies
        by country (we show the live rate above). Credits never expire — they roll month
        to month, on Free and Pro alike.
      </>
    ),
  },
  {
    q: "What's the catch with Free?",
    a: (
      <>
        Free is a real plan, not a trial: it stays free forever. The trade-offs are{" "}
        <span className="font-semibold text-slate-900">no included credits</span> — you
        buy what you need, up to{" "}
        <span className="font-semibold text-slate-900">{FREE_PLAN.monthlyPurchaseCap}{" "}
        credits per month</span> — plus{" "}
        <span className="font-semibold text-slate-900">{FREE_PLAN.monthlyCampaigns}{" "}
        campaigns per month</span> and{" "}
        <span className="font-semibold text-slate-900">a single shop / location</span>.
        Pro removes all three caps and adds a monthly credit grant.
      </>
    ),
  },
  {
    q: "Will you charge me for overages?",
    a: (
      <>
        Never. The moment your balance hits zero, sends stop. We&apos;ll email you
        when you&apos;re low so nothing in flight gets dropped, but we&apos;ll never
        silently bill you more than you signed up for.
      </>
    ),
  },
  {
    q: "Can I top up on Free?",
    a: (
      <>
        Yes. On Free you can buy up to{" "}
        <span className="font-semibold text-slate-900">{FREE_PLAN.monthlyPurchaseCap} credits per
        UTC month</span> — once you hit that cap, you wait until the 1st (or upgrade
        to Pro for unlimited purchases). Spending the credits you already own is
        never restricted, and credits never expire.
      </>
    ),
  },
  {
    q: "Can I cancel?",
    a: (
      <>
        Two clicks in your settings. No &ldquo;let me transfer you to retention&rdquo;.
        You keep access until the end of the billing period. We don&apos;t hold your
        reviews hostage — export everything to CSV any time.
      </>
    ),
  },
  {
    q: "Do you offer a free trial?",
    a: (
      <>
        The Free plan is the trial — no credit card, no clock ticking. Top up a
        few credits and send your first review requests; decide if Pro is worth
        it once you&apos;ve seen the loop work. If you upgrade and it&apos;s not
        for you in week one,{" "}
        <a className="link" href="mailto:hello@maskedcarrotlabs.com">email us</a>{" "}
        and we&apos;ll refund every cent.
      </>
    ),
  },
  {
    q: "Is SMS included?",
    a: (
      <>
        Email works on both plans. SMS is opt-in, country-dependent, and uses the same
        credit pool — see the rates table above. Most owners start with email-only,
        which converts surprisingly well.
      </>
    ),
  },
  {
    q: "What if I have multiple shops?",
    a: (
      <>
        Pro covers as many locations as you have under the same business profile. Each
        location can have its own template, quiet hours, and review links. Free is
        single-location only — that&apos;s the cleanest mental model for an owner
        running a single shop. If you&apos;re an agency managing many businesses,{" "}
        <a className="link" href="mailto:hello@maskedcarrotlabs.com">drop us a line</a>{" "}
        — we&apos;ll set you up properly.
      </>
    ),
  },
];

export default function PricingView({
  visitorCountry,
  marketName,
  emailPerSend,
  smsPerSegment,
  showSms = false,
  sendRates,
  membership,
  usedFallback,
}: Props) {
  // Single Pro tier. Earlier multi-tier mocks have been retired — see
  // pricing_config.py + goodword_pricing.yaml. We still respect server-resolved
  // pricing (different markets get different display_price) and only fall back
  // to the static constants when the server preview can't be reached.
  const proTier =
    membership?.tiers?.[0] ??
    {
      key: "pro",
      display_name: "Pro",
      display_price: usd(PRO_PLAN.priceUsd) + " / month",
      monthly_credits: PRO_PLAN.monthlyCredits,
      polar_configured: true,
    };

  // ---------- credit calculator ----------
  // Free has no monthly credit grant, so "fitsFree" is gauged by whether the
  // user's monthly volume can be funded within Free's purchase cap. Anything
  // beyond that cap requires Pro (which removes the cap).
  const [perDay, setPerDay] = useState<number>(20);
  const calc = useMemo(() => {
    const sendsPerMonth = perDay * 22;
    const creditsNeeded = sendsPerMonth * Math.max(emailPerSend, 1);
    const fitsFreePurchaseCap = creditsNeeded <= FREE_PLAN.monthlyPurchaseCap;
    const fitsProMonthly = creditsNeeded <= proTier.monthly_credits;
    const recommendedTopup = !fitsProMonthly
      ? TOPUP_PACKS.find((p) => p.credits >= creditsNeeded - proTier.monthly_credits)
      : null;
    return {
      sendsPerMonth,
      creditsNeeded,
      fitsFreePurchaseCap,
      fitsProMonthly,
      recommendedTopup,
    };
  }, [perDay, emailPerSend, proTier.monthly_credits]);

  return (
    <div className="marketing-root">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 right-[-15%] h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-warm-200/50 via-warm-100/30 to-transparent blur-3xl animate-float-blob" />
        <div className="absolute bottom-[-8rem] left-[-15%] h-[22rem] w-[22rem] rounded-full bg-gradient-to-tr from-brand-100/40 to-sky-100/30 blur-3xl animate-float-blob-2" />
      </div>

      <MarketingHeader />

      {/* ---------------- HERO ---------------- */}
      <section className="marketing-section pt-12 sm:pt-16 pb-8 sm:pb-10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="marketing-eyebrow mx-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
            Pricing built for small shops
          </span>
          <h1 className="display-title-xl mt-4 text-slate-900">
            Start free. <em>Go Pro when you outgrow it.</em>
          </h1>
          <p className="mt-5 text-lg text-slate-700 leading-relaxed">
            Two plans, no surprises. Every send uses one credit. Free covers your first
            handful of campaigns each month. Pro takes the caps off and adds a generous
            monthly credit refill. If it&apos;s not earning its keep in week one, we
            refund every cent.
          </p>
        </div>

        {usedFallback && (
          <p className="mt-6 mx-auto max-w-xl text-xs text-amber-900 bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-center">
            Showing static reference prices — live table couldn&apos;t be reached.
            Refresh or try again.
          </p>
        )}
      </section>

      {/* ---------------- FREE vs PRO ---------------- */}
      <section className="marketing-section pb-12 max-w-5xl">
        <div className="grid gap-5 lg:grid-cols-2 items-stretch">
          {/* FREE */}
          <Reveal>
            <article className="relative h-full flex flex-col rounded-[2rem] border border-slate-200/80 bg-white p-7 sm:p-9 shadow-soft">
              <p className="marketing-eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Free
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="display-title-xl text-slate-900">$0</p>
                <p className="text-base text-slate-600">/ month</p>
              </div>
              <p className="mt-3 text-base text-slate-700 leading-relaxed">
                For owner-operators trying GoodWord. Buy top-ups when you need credits
                — they never expire. No card to start.
              </p>

              <ul className="mt-6 space-y-2.5 text-sm text-slate-700 flex-1">
                {[
                  `${FREE_PLAN.monthlyCampaigns} campaigns / month`,
                  `${FREE_PLAN.locations} store / location`,
                  `Buy up to ${FREE_PLAN.monthlyPurchaseCap} credits per month — credits never expire`,
                  "Routes to Google · Yelp · Facebook · custom",
                  "Private feedback intercept on bad ratings",
                  "Real-human support (slower than Pro)",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                <Link href="/login?new=1" className="cta-secondary w-full justify-center">
                  Start free
                </Link>
              </div>
            </article>
          </Reveal>

          {/* PRO */}
          <Reveal delay={80}>
            <article className="relative h-full flex flex-col overflow-hidden rounded-[2rem] border border-warm-300 bg-gradient-to-br from-warm-50 via-white to-white p-7 sm:p-9 shadow-card">
              <div
                className="pointer-events-none absolute inset-0 -z-0"
                aria-hidden
                style={{
                  background:
                    "radial-gradient(640px 280px at 0% 0%, rgba(229, 114, 36, 0.18), transparent 60%)",
                }}
              />
              <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-warm-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Most owners pick this
              </span>

              <div className="relative">
                <p className="marketing-eyebrow">
                  <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
                  {proTier.display_name}
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <p className="display-title-xl text-slate-900">
                    {proTier.display_price.split(" ")[0]}
                  </p>
                  <p className="text-base text-slate-600">/ month</p>
                </div>
                <p className="mt-3 text-base text-slate-700 leading-relaxed">
                  {proTier.monthly_credits.toLocaleString()} credits each month — enough
                  for{" "}
                  <span className="font-semibold text-slate-900">
                    {maxEmails(proTier.monthly_credits, emailPerSend).toLocaleString()} emails
                  </span>
                  {showSms && (
                    <>
                      {" "}or{" "}
                      <span className="font-semibold text-slate-900">
                        {maxSmsSegments(proTier.monthly_credits, smsPerSegment).toLocaleString()} SMS
                      </span>{" "}
                      (any mix)
                    </>
                  )}
                  . Unused credits roll over.
                </p>

                <ul className="mt-6 space-y-2.5 text-sm text-slate-700 flex-1">
                  {[
                    "Unlimited campaigns",
                    "Unlimited stores / locations",
                    "Unlimited credit top-ups",
                    `${proTier.monthly_credits.toLocaleString()} credits / month included`,
                    "Same-day human support",
                    "Everything in Free",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7">
                  <Link href="/login?new=1" className="cta-warm w-full justify-center">
                    Start Pro — free first 7 days
                  </Link>
                </div>
              </div>
            </article>
          </Reveal>
        </div>

        {/* Market-aware mini-card under both plans */}
        <Reveal delay={140}>
          <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft flex flex-wrap items-center gap-x-6 gap-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Your market
            </p>
            <div className="flex items-center gap-2">
              {visitorCountry && marketName ? (
                <>
                  <ReactCountryFlag
                    countryCode={visitorCountry}
                    svg
                    style={{ width: "1.4em", height: "1.4em" }}
                    title=""
                  />
                  <span className="text-base font-semibold text-slate-900">{marketName}</span>
                </>
              ) : (
                <span className="text-base font-semibold text-slate-700">Default rates</span>
              )}
            </div>
            <div className="flex items-center gap-5 text-sm text-slate-700">
              <span>
                Email: <span className="font-semibold text-slate-900 tabular-nums">{emailPerSend} cr / send</span>
              </span>
              {showSms && (
                <span>
                  SMS: <span className="font-semibold text-slate-900 tabular-nums">{smsPerSegment} cr / segment</span>
                </span>
              )}
            </div>
            <p className="ml-auto text-[11px] text-slate-500 leading-relaxed">
              Detected automatically. Use{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                ?country=US
              </code>{" "}
              to preview another.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ---------------- WHICH PLAN ---------------- */}
      <section className="marketing-section py-12">
        <Reveal>
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-9 shadow-card">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="marketing-eyebrow">
                  <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
                  Which plan fits you?
                </p>
                <h2 className="display-title-lg mt-3 text-slate-900">
                  Slide it. We&apos;ll tell you.
                </h2>
              </div>
              <p className="text-sm text-slate-600 max-w-xs">
                Most owners send fewer than they expect — the loop works because it&apos;s{" "}
                <span className="font-semibold text-slate-900">consistent</span>, not big.
              </p>
            </div>

            <div className="mt-7 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <label htmlFor="per-day" className="block text-sm font-semibold text-slate-700">
                  Customers you&apos;d email per day
                </label>
                <div className="mt-3 flex items-baseline gap-3">
                  <input
                    id="per-day"
                    type="range"
                    min={1}
                    max={120}
                    value={perDay}
                    onChange={(e) => setPerDay(Number(e.target.value))}
                    className="w-full accent-warm-500 cursor-pointer"
                    aria-label="Customers per day"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 tabular-nums">
                  <span>1</span>
                  <span>30</span>
                  <span>60</span>
                  <span>90</span>
                  <span>120+</span>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4">
                  <p className="text-sm text-slate-700">
                    <span className="text-3xl sm:text-4xl font-display font-medium text-slate-900 tabular-nums leading-none">
                      {perDay}
                    </span>{" "}
                    customers / day
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    ≈{" "}
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {calc.sendsPerMonth.toLocaleString()}
                    </span>{" "}
                    sends / month ·{" "}
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {calc.creditsNeeded.toLocaleString()}
                    </span>{" "}
                    credits / month
                  </p>
                </div>
              </div>

              {/* Recommendation */}
              <div className="rounded-2xl border border-warm-200/80 bg-gradient-to-br from-warm-50 to-white p-5 shadow-soft">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-700">
                  Recommended
                </p>
                {calc.fitsFreePurchaseCap ? (
                  <>
                    <h3 className="display-title mt-2 text-2xl text-slate-900">
                      Free is plenty.
                    </h3>
                    <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                      Your monthly volume fits Free&apos;s{" "}
                      {FREE_PLAN.monthlyPurchaseCap}-credit purchase cap. Start
                      there, top up as needed, upgrade only when you outgrow it.
                    </p>
                    <Link href="/login?new=1" className="cta-secondary mt-5 inline-flex">
                      Start free
                    </Link>
                  </>
                ) : calc.fitsProMonthly ? (
                  <>
                    <h3 className="display-title mt-2 text-2xl text-slate-900">
                      Pro covers it.
                    </h3>
                    <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                      You&apos;d burn through Free in days at this volume. Pro&apos;s{" "}
                      {proTier.monthly_credits.toLocaleString()}-credit refill handles
                      your month with credits to spare.
                    </p>
                    <Link href="/login?new=1" className="cta-warm mt-5 inline-flex">
                      Start Pro
                    </Link>
                  </>
                ) : (
                  <>
                    <h3 className="display-title mt-2 text-2xl text-slate-900">
                      Pro + a top-up.
                    </h3>
                    <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                      Pro grants {proTier.monthly_credits.toLocaleString()} credits.
                      You&apos;d want an extra{" "}
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {(calc.creditsNeeded - proTier.monthly_credits).toLocaleString()}
                      </span>{" "}
                      this month. Top-ups never expire, so any leftover rolls over.
                    </p>
                    {calc.recommendedTopup && (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">
                          {calc.recommendedTopup.credits.toLocaleString()}-credit pack ·{" "}
                          {usd(calc.recommendedTopup.priceUsd)}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Pay once. Credits never expire.
                        </p>
                      </div>
                    )}
                    <Link href="/login?new=1" className="cta-warm mt-4 inline-flex">
                      Start Pro
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- TOP-UP PACKS ---------------- */}
      <section className="marketing-section py-12 max-w-5xl">
        <Reveal>
          <p className="marketing-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
            One-time top-ups
          </p>
          <h2 className="display-title-lg mt-3 text-slate-900">
            Need extra credits? Just buy a pack.
          </h2>
          <p className="mt-3 text-base text-slate-700 max-w-xl">
            Available on both plans. Pay once. Credits never expire. (On Free
            you can buy up to {FREE_PLAN.monthlyPurchaseCap} credits per UTC
            month — Pro removes the cap entirely.)
          </p>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOPUP_PACKS.map((row, i) => {
            const em = maxEmails(row.credits, emailPerSend);
            const sm = maxSmsSegments(row.credits, smsPerSegment);
            const pricePerCredit = (row.priceUsd / row.credits) * 100;
            const isMid = i === 2;
            return (
              <Reveal key={row.credits} delay={i * 80}>
                <div
                  className={[
                    "h-full rounded-3xl border p-5 sm:p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card-hover",
                    isMid
                      ? "border-warm-300 bg-gradient-to-br from-warm-50 to-white"
                      : "border-slate-200/80 bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="display-title text-2xl text-slate-900 tabular-nums">
                      {row.credits.toLocaleString()}
                    </p>
                    {isMid && (
                      <span className="rounded-full bg-warm-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Most popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">credits</p>
                  <p className="mt-4 text-3xl font-display font-medium text-slate-900 tabular-nums">
                    {usd(row.priceUsd)}
                  </p>
                  <p className="text-[11px] text-slate-500 tabular-nums">
                    ≈ {pricePerCredit.toFixed(2)}¢ / credit
                  </p>
                  <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      Up to {em.toLocaleString()} emails
                    </li>
                    {showSms && (
                      <li className="flex items-start gap-2">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        Up to {sm.toLocaleString()} SMS segments
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      Never expire
                    </li>
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ---------------- DAY-1 PROMISE ---------------- */}
      <section className="marketing-section py-12 max-w-4xl">
        <Reveal>
          <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-6 sm:p-8 shadow-soft flex flex-col sm:flex-row items-start gap-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
              <ShieldIcon className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <h3 className="display-title text-xl sm:text-2xl text-slate-900">
                The week-one promise.
              </h3>
              <p className="mt-2 text-base text-slate-700 leading-relaxed">
                Try Pro on your real customers. If it&apos;s not earning its keep within
                7 days,{" "}
                <a
                  className="font-semibold text-emerald-800 underline underline-offset-4 decoration-emerald-300 hover:decoration-emerald-700"
                  href="mailto:hello@maskedcarrotlabs.com"
                >
                  email us
                </a>{" "}
                and we&apos;ll refund every cent — no forms, no hold music. We&apos;d
                rather lose a month than your trust.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- SEND RATES TABLE ---------------- */}
      <section
        className="marketing-section py-12 scroll-mt-24"
        id="rates"
        aria-labelledby="rates-heading"
      >
        <Reveal>
          <p className="marketing-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
            Send rates by country
          </p>
          <h2 id="rates-heading" className="display-title-lg mt-3 text-slate-900">
            Your country might be cheaper.
          </h2>
          <p className="mt-3 text-base text-slate-700 max-w-xl">
            Carrier costs differ wildly. We pass the real difference on, no markup tricks.
          </p>
        </Reveal>

        <div className="mt-7 rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-soft">
          <SendRatesPanel
            rows={sendRates?.countries ?? null}
            sendRateNotes={sendRates?.send_rate_notes ?? null}
            myCode={visitorCountry}
            highlightLabel="your region"
            loading={false}
            error={sendRates ? null : "Rates could not be loaded."}
            showSms={showSms}
          />
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="marketing-section py-16 sm:py-20 max-w-3xl">
        <Reveal>
          <p className="marketing-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
            Common pricing questions
          </p>
          <h2 className="display-title-lg mt-3 text-slate-900">
            Things owners actually ask.
          </h2>
        </Reveal>

        <div className="mt-8 divide-y divide-slate-200 rounded-3xl border border-slate-200/80 bg-white shadow-soft overflow-hidden">
          {PRICING_FAQ.map((row) => (
            <details key={row.q} className="group">
              <summary className="cursor-pointer list-none px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between gap-4 hover:bg-slate-50/80">
                <span className="text-base font-semibold text-slate-900">{row.q}</span>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-700 transition-transform group-open:rotate-45">
                  <PlusIcon className="h-4 w-4" />
                </span>
              </summary>
              <div className="px-5 sm:px-7 pb-5 sm:pb-6 text-sm sm:text-[0.95rem] text-slate-700 leading-relaxed">
                {row.a}
              </div>
            </details>
          ))}
        </div>

        <p className="mt-6 text-sm text-slate-600 text-center">
          Have a question we didn&apos;t answer?{" "}
          <a className="link" href="mailto:hello@maskedcarrotlabs.com">Email us</a>{" "}
          — we read every message.
        </p>
      </section>

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="marketing-section pb-20">
        <Reveal>
          <div className="rounded-[2rem] bg-slate-900 text-white p-8 sm:p-12 shadow-card-hover relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0 opacity-80"
              aria-hidden
              style={{
                background:
                  "radial-gradient(700px 320px at 0% 0%, rgba(229, 114, 36, 0.30), transparent 55%)",
              }}
            />
            <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] items-center">
              <div>
                <h2 className="display-title-lg text-white">
                  Pricing should never be the reason you wait.
                </h2>
                <p className="mt-3 text-base text-slate-200 leading-relaxed max-w-xl">
                  Sign up free, send your first nudge today. Pay nothing until you decide
                  it&apos;s working.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 lg:justify-end">
                <Link href="/login?new=1" className="cta-warm">
                  Start free
                </Link>
                <Link
                  href="/support"
                  className="btn px-5 sm:px-6 py-3 text-base font-semibold min-h-12 bg-white/10 text-white border border-white/20 hover:bg-white/15"
                >
                  Talk to us
                </Link>
              </div>
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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3l8 3v6c0 4.5-3 8-8 9-5-1-8-4.5-8-9V6l8-3z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
