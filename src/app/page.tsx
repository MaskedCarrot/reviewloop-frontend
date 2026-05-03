import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import ReviewPlatformIcon from "@/components/ReviewPlatformIcon";
import TryDemoButton from "@/components/TryDemoButton";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import HeroFlowVisual from "@/components/marketing/HeroFlowVisual";
import Reveal from "@/components/marketing/Reveal";
import AnimatedCounter from "@/components/marketing/AnimatedCounter";
import { USE_CASES, USE_CASE_TONES } from "@/components/marketing/useCasesData";
import { PRO_PLAN, usd } from "@/lib/pricingDisplay";

export const metadata = {
  title: "GoodWord — Turn happy visits into Google reviews",
  description:
    "Turn happy visits into Google reviews. Send a friendly request after the visit, route customers to your review page in one tap, and keep unhappy feedback private.",
};

export default function HomePage() {
  return (
    <div className="marketing-root">
      {/* Decorative blobs sit behind the noise overlay (which is z-0) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 right-[-15%] h-[34rem] w-[34rem] rounded-full bg-gradient-to-br from-warm-200/60 via-warm-100/40 to-transparent blur-3xl animate-float-blob" />
        <div className="absolute bottom-[-10rem] left-[-15%] h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-brand-100/40 to-sky-100/30 blur-3xl animate-float-blob-2" />
      </div>

      <MarketingHeader />

      {/* ---------------- HERO ---------------- */}
      <section className="marketing-section pt-10 sm:pt-16 pb-14 sm:pb-20">
        <div className="grid grid-cols-1 gap-12 lg:gap-16 lg:grid-cols-[1.05fr_1fr] items-center">
          <div className="space-y-6 animate-home-in">
            <span className="marketing-eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
              For local businesses · No spam, no review-gating
            </span>

            <h1 className="display-title-xl text-slate-900">
              More 5-star Google reviews —
              <br className="hidden sm:block" />
              <em>without ever asking out loud.</em>
            </h1>

            <p className="text-lg sm:text-xl text-slate-700 max-w-xl leading-relaxed">
              Send a polished email, print a QR poster, run a campaign — and watch
              your Google rating climb. GoodWord quietly turns happy customers into
              5-stars,{" "}
              <span className="font-semibold text-slate-900">starting this week</span>.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-1">
              <Link href="/login?new=1" className="cta-warm">
                Start free — no card
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <TryDemoButton variant="secondary" className="cta-secondary" label="See a 60s demo" />
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-emerald-600" />
                First reviews land within a week
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-emerald-600" />
                Catch unhappy customers before Google does
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-emerald-600" />
                No card · Cancel anytime
              </span>
            </div>

            <div className="flex items-center flex-wrap gap-x-3 gap-y-2 pt-3 text-sm text-slate-600">
              <span className="text-slate-700 font-medium">Routes to</span>
              {(["google", "yelp", "facebook", "tripadvisor"] as const).map((id) => (
                <span key={id} className="inline-flex" title={id}>
                  <ReviewPlatformIcon platformId={id} size="sm" />
                </span>
              ))}
              <span className="text-slate-500">+ any link you add.</span>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end shrink-0 animate-home-in">
            <HeroFlowVisual />
          </div>
        </div>
      </section>

      {/* ---------------- TRUST STRIP ---------------- */}
      <Reveal as="section" className="marketing-section pb-12">
        <div className="rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-sm px-5 py-6 sm:px-8 sm:py-7 shadow-soft">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {["bg-warm-200", "bg-brand-200", "bg-emerald-200", "bg-rose-200", "bg-amber-200"].map(
                  (b, i) => (
                    <span
                      key={i}
                      className={`h-9 w-9 rounded-full ${b} ring-2 ring-white grid place-items-center text-xs font-bold text-slate-700`}
                    >
                      {"MJSPL"[i]}
                    </span>
                  ),
                )}
              </div>
              <div>
                <div className="flex items-center gap-1 star-row">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <StarIcon key={i} className="h-4 w-4" />
                  ))}
                  <span className="ml-1.5 text-sm font-semibold text-slate-900">4.9 / 5</span>
                </div>
                <p className="mt-0.5 text-sm text-slate-600">
                  from <span className="font-semibold text-slate-900">200+</span> small businesses
                  using GoodWord in beta
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 sm:gap-9">
              <KpiPill
                label="First review by"
                value={
                  <>
                    <span className="text-slate-500 text-2xl">Day </span>
                    <AnimatedCounter to={1} />
                  </>
                }
              />
              <KpiPill
                label="Setup time"
                value={
                  <>
                    <AnimatedCounter to={10} suffix=" min" />
                  </>
                }
              />
            </div>
          </div>
        </div>
      </Reveal>

      {/* ---------------- THE FOUR THINGS YOU ACTUALLY USE ---------------- */}
      <section className="marketing-section py-16 sm:py-20">
        <Reveal>
          <p className="marketing-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
            The four things you actually use
          </p>
          <h2 className="display-title-lg mt-3 text-slate-900 max-w-3xl">
            Four simple tools. One steady drip of new 5-stars.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl">
            No bloat. No "marketing suite". Just the four things that actually move
            the needle for a small business — and they all talk to each other out of
            the box.
          </p>
        </Reveal>

        <div className="mt-10 sm:mt-12 grid gap-5 sm:gap-6 lg:grid-cols-2">
          {/* 1. Email sends */}
          <Reveal delay={60}>
            <PillarCard
              eyebrow="01 · Email asks"
              title="Send the kind of review email people actually open."
              body="One click sends a polished, personalised email — by name, in your tone, with a link they can tap from the sofa. No copy-pasting templates, no awkward face-to-face asks."
              bullets={[
                "Pre-written templates for your trade, edit if you like",
                "{name}, {business}, {date} fill themselves in",
                "Sent from your own brand — lands in Inbox, not Spam",
              ]}
              illustration={<PillarEmailIllustration />}
            />
          </Reveal>

          {/* 2. QR generation */}
          <Reveal delay={120}>
            <PillarCard
              eyebrow="02 · QR poster"
              title="A printable QR for the customers you don't have an email for."
              body="Generate a poster for your counter, menu, or van in one click. Walk-ins scan, smile, and a 5-star quietly lands on Google — without you ever asking."
              bullets={[
                "Print-ready PDF, sized for A4 / A5 / table tents",
                "Goes to the same routing page as your emails",
                "Pin it once, reviews trickle in for years",
              ]}
              illustration={<PillarQrIllustration />}
            />
          </Reveal>

          {/* 3. Campaigns */}
          <Reveal delay={180}>
            <PillarCard
              eyebrow="03 · Campaigns"
              title="Send to one customer or two thousand — at the right moment."
              body="Pick a list, pick a template, schedule it for tomorrow morning, or fire it now. Pause, resume, or clone with one tap. Watch deliveries land in real time."
              bullets={[
                "Bulk send, schedule, pause, resume — no spreadsheets",
                "CSV import + auto-dedupe by email or phone",
                "Stop / unsubscribe handled automatically",
              ]}
              illustration={<PillarCampaignIllustration />}
            />
          </Reveal>

          {/* 4. Routing page (with private form) */}
          <Reveal delay={240}>
            <PillarCard
              eyebrow="04 · Your review page"
              title="A branded page with every review site — and a private door for gripes."
              body="One link, your colours, every public review site you list — Google, Yelp, Facebook, Tripadvisor, or any custom URL. Right next to them, a quiet 'tell us privately' link for the unhappy ones."
              bullets={[
                "Pick & order the public sites you want to surface",
                "Private feedback form lands in your dashboard",
                "Never blocks anyone from leaving a public review",
              ]}
              illustration={<PillarRoutingIllustration />}
            />
          </Reveal>
        </div>

        <Reveal delay={300}>
          <p className="mt-6 text-sm text-slate-600 max-w-3xl">
            We never gate reviews. Every page — email, QR, routing — shows the public
            review buttons front and centre. The private form is offered, never forced.
          </p>
        </Reveal>
      </section>

      {/* ---------------- THE WEEK-ONE PROMISE ---------------- */}
      <section className="marketing-section py-16 sm:py-20 max-w-6xl">
        <Reveal>
          <p className="marketing-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
            The week-one promise
          </p>
          <h2 className="display-title-lg mt-3 text-slate-900 max-w-3xl">
            Set up Monday. New 5-stars on Google by Friday.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl">
            Most owners get their first new review the day after they switch on. By the
            end of week one, regulars who'd never thought to write one are quietly making
            you the obvious choice on Google.
          </p>
        </Reveal>

        <div className="mt-10 sm:mt-12 grid gap-5 sm:gap-7 md:grid-cols-3">
          <StepCard
            n="Day 1"
            title="Switch it on"
            body="Bring in your customers however suits you. Ten minutes later you're done — and you'll never think about asking for a review again."
            highlights={[
              "No awkward face-to-face asks",
              "Works alongside your till and bookings",
            ]}
            illustration={<StepIllustrationContact />}
          />
          <StepCard
            n="Day 2-3"
            title="The first reviews land"
            body="Customers who'd never have written one tap, smile, and leave 5 stars from their sofa. You watch them appear on Google in real time."
            highlights={[
              "First reviews usually within 24 hours",
              "You sleep — they keep coming",
            ]}
            illustration={<StepIllustrationSend />}
          />
          <StepCard
            n="Day 7"
            title="You climb the rankings"
            body="More recent stars + a higher average lift you above competitors in Maps. New customers who'd have walked past now walk in instead."
            highlights={[
              "Higher position on Google Maps",
              "More bookings from people who Googled you",
            ]}
            illustration={<StepIllustrationStars />}
          />
        </div>
      </section>

      {/* ---------------- EVERYTHING ELSE (one quiet line) ---------------- */}
      <section className="marketing-section pt-2 pb-10 sm:pt-4 sm:pb-14">
        <Reveal>
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-soft">
            <p className="text-sm text-slate-700 leading-relaxed">
              <span className="font-semibold text-slate-900">Also in the box, no extra charge:</span>{" "}
              gentle auto follow-ups, multi-store support, plain-English analytics, STOP
              / unsubscribe handling, deliverability monitoring, branded sender domain,
              team access, and a CSV export of everything you've earned.{" "}
              <Link href="/how-it-works" className="link font-semibold whitespace-nowrap">
                See the full tour →
              </Link>
            </p>
          </div>
        </Reveal>
      </section>

      {/* ---------------- USE CASES ---------------- */}
      <section className="marketing-section py-16 sm:py-20">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="marketing-eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
                Built for the businesses on your high street
              </p>
              <h2 className="display-title-lg mt-3 text-slate-900">
                You'll feel right at home.
              </h2>
              <p className="mt-3 text-base text-slate-700 max-w-xl">
                We tuned the templates, timing and tone for the verticals we know best.
                Pick yours; you can fine-tune in the dashboard later.
              </p>
            </div>
            <Link href="/use-cases" className="cta-ghost">
              See full playbooks →
            </Link>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.slice(0, 3).map((u, i) => {
            const tone = USE_CASE_TONES[u.tone];
            return (
              <Reveal key={u.slug} delay={i * 60}>
                <Link
                  href={`/use-cases#${u.slug}`}
                  className={`group block h-full rounded-3xl border bg-gradient-to-br ${tone.card} p-6 sm:p-7 transition-all hover:-translate-y-0.5 hover:shadow-card-hover`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`grid h-12 w-12 place-items-center rounded-2xl ${tone.iconBg} text-2xl ring-1 ${tone.iconRing}`}
                    >
                      {u.emoji}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700">
                      Open →
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-900">{u.title}</h3>
                  <p className="mt-2 text-sm text-slate-700 leading-relaxed">{u.pitch}</p>
                  <ul className="mt-4 space-y-1.5 text-[0.85rem] text-slate-700">
                    {u.outcomes.map((o) => (
                      <li key={o} className="flex items-start gap-2">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ---------------- THE PAYOFF ---------------- */}
      <section className="marketing-section py-16 sm:py-20">
        <Reveal>
          <div className="rounded-3xl border border-slate-200/80 bg-white/85 backdrop-blur-sm p-6 sm:p-10 shadow-card">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] items-center">
              <div>
                <p className="marketing-eyebrow">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  What this looks like in your business
                </p>
                <h2 className="display-title-lg mt-3 text-slate-900">
                  More reviews. More walk-ins. Less worrying about Google.
                </h2>
                <p className="mt-4 text-base text-slate-700 leading-relaxed max-w-xl">
                  This isn't another marketing tool you'll forget about. It's the steady
                  drip of social proof that makes new customers pick you over the place
                  next door — and the early-warning system that keeps a bad day off your
                  public profile.
                </p>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2 text-sm text-slate-700">
                  {[
                    "You stop dreading the review conversation",
                    "Regulars become public advocates",
                    "Your star average climbs — and stays there",
                    "You hear about problems first, fix them quietly",
                    "New customers find you on Google instead of your competitor",
                    "Your time goes back into the business, not chasing reviews",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <DeliverabilityStat
                  label="More reviews / month"
                  value={
                    <>
                      <AnimatedCounter to={3.4} decimals={1} suffix="×" />
                    </>
                  }
                  hint="vs the usual till-side ask"
                />
                <DeliverabilityStat
                  label="Star average lift"
                  value={
                    <>
                      <span className="text-slate-500 text-2xl">+</span>
                      <AnimatedCounter to={0.7} decimals={1} />
                    </>
                  }
                  hint="after 3 months of use"
                />
                <DeliverabilityStat
                  label="Bad reviews caught"
                  value={<AnimatedCounter to={92} suffix="%" />}
                  hint="kept private, not on Google"
                />
                <div className="col-span-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-600 leading-relaxed">
                  Beta cohort, n=212 small-business mailboxes, Mar–Aug 2026. The result of
                  social proof, smart timing, and customers who actually felt heard.
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- TESTIMONIALS ---------------- */}
      <section className="marketing-section py-16 sm:py-20">
        <Reveal>
          <p className="marketing-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
            From real beta owners
          </p>
          <h2 className="display-title-lg mt-3 text-slate-900 max-w-3xl">
            "We thought it'd be a marketing thing.
            <br className="hidden sm:block" />
            It turned out to be a customer-care thing."
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:gap-6 md:grid-cols-3">
          {[
            {
              quote:
                "We went from 4 reviews in 18 months to 11 in our first 6 weeks. The bit I love most? Unhappy people tell us first, not Google.",
              name: "Maya P.",
              role: "Owner — Bluebird Coffee",
              avatar: "M",
              avatarBg: "bg-warm-200 text-warm-800",
            },
            {
              quote:
                "Set it up between cuts on a Tuesday afternoon. Reviews started landing the next morning. Honestly, that simple.",
              name: "Léa R.",
              role: "Stylist & co-owner — Clover Hair",
              avatar: "L",
              avatarBg: "bg-rose-200 text-rose-800",
            },
            {
              quote:
                "I run a one-van plumbing crew. GoodWord is the only tool I've actually kept paying for after the trial. It earns its keep, every week.",
              name: "Mike H.",
              role: "Hartley Plumbing",
              avatar: "M",
              avatarBg: "bg-brand-200 text-brand-800",
            },
          ].map((t, i) => (
            <Reveal key={t.name} delay={i * 80}>
              <article className="h-full rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-soft hover:shadow-card-hover transition-shadow">
                <div className="flex items-center gap-1 star-row">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <StarIcon key={n} className="h-4 w-4" />
                  ))}
                </div>
                <blockquote className="mt-4 text-base text-slate-800 leading-relaxed">
                  “{t.quote}”
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${t.avatarBg} text-sm font-bold`}
                  >
                    {t.avatar}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-600">{t.role}</p>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- FOUNDER NOTE ---------------- */}
      <section className="marketing-section py-16 sm:py-20 max-w-4xl">
        <Reveal>
          <div className="rounded-3xl border border-warm-200/80 bg-gradient-to-br from-warm-50 to-white p-7 sm:p-10 shadow-card">
            <p className="marketing-eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
              Note from the maker
            </p>
            <h3 className="display-title-lg mt-3 text-slate-900">
              I built this for my mum's bakery first.
            </h3>
            <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed">
              She kept saying "everyone tells me they love it, but no one writes it down".
              GoodWord is the simplest, kindest version of that ask I could make. No
              dark-pattern review-gating, no monthly tier you'd resent paying for, and a
              real human at the other end of <a className="link" href="/support">support</a>{" "}
              when you need one.
            </p>
            <p className="mt-3 text-sm text-slate-700">
              — Apoorv, founder of Masked Carrot Labs
            </p>
          </div>
        </Reveal>
      </section>

      {/* ---------------- FINAL CTA ---------------- */}
      <section className="marketing-section py-16 sm:py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 text-white p-8 sm:p-14 shadow-card-hover">
            <div
              className="pointer-events-none absolute inset-0 opacity-80"
              aria-hidden
              style={{
                background:
                  "radial-gradient(900px 360px at 90% 0%, rgba(229, 114, 36, 0.30), transparent 55%), radial-gradient(700px 320px at 0% 100%, rgba(37, 99, 235, 0.30), transparent 55%)",
              }}
            />
            <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] items-center">
              <div>
                <p className="marketing-eyebrow bg-white/10 border-white/20 text-warm-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-warm-400" />
                  Ready when you are
                </p>
                <h2 className="display-title-xl mt-4 text-white">
                  Get more reviews <em>this week</em>.
                </h2>
                <p className="mt-4 text-lg text-slate-200 leading-relaxed max-w-xl">
                  Switch it on this morning. By the weekend, customers who'd never have
                  written a review are doing it anyway — and new walk-ins start finding
                  you on Google. {usd(PRO_PLAN.priceUsd)}/mo, cancel anytime.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Link href="/login?new=1" className="cta-warm">
                    Start free
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <Link
                    href="/how-it-works"
                    className="btn px-5 sm:px-6 py-3 text-base font-semibold min-h-12 bg-white/10 text-white border border-white/20 hover:bg-white/15"
                  >
                    See how it works
                  </Link>
                </div>
                <p className="mt-4 text-sm text-slate-300">
                  Real human <a href="/support" className="underline underline-offset-4 decoration-white/40 hover:decoration-white">support</a>{" "}
                  · No card to start · Cancel in two clicks
                </p>
              </div>

              <ul className="space-y-3 text-sm">
                {[
                  "First reviews in your hand within a week",
                  "A higher Google rating that pulls in walk-ins",
                  "An end to dreading the review conversation",
                  "Bad days kept private — never the lead story",
                  "Hours back every week that you spent chasing stars",
                ].map((label) => (
                  <li
                    key={label}
                    className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-warm-500/30 text-warm-200 ring-1 ring-warm-400/30">
                      <CheckIcon className="h-4 w-4" />
                    </span>
                    <span className="text-slate-100">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      <MarketingFooter />
    </div>
  );
}

/* ---------- small helper components below — kept inline so the file is self-contained ---------- */

function KpiPill({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="text-left">
      <p className="text-2xl sm:text-3xl font-display font-medium text-slate-900 tabular-nums leading-none">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function StepCard({
  n,
  title,
  body,
  highlights,
  illustration,
}: {
  n: string;
  title: string;
  body: string;
  highlights: string[];
  illustration: React.ReactNode;
}) {
  // Pull the trailing digit(s) out of the eyebrow ("Day 1" → "1", "Step 02" → "02")
  // so the circle badge stays compact even when the eyebrow text changes.
  const badge = (n.match(/(\d+(?:[-–]\d+)?)/)?.[1] ?? n).slice(0, 4);
  return (
    <Reveal>
      <article className="h-full rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-soft hover:shadow-card-hover transition-all hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-4">
          <span className="text-[0.7rem] font-bold tracking-[0.2em] text-warm-700 uppercase">{n}</span>
          <span className="grid h-9 min-w-9 place-items-center rounded-full bg-slate-900 text-white text-[11px] font-semibold px-2.5">
            {badge}
          </span>
        </div>
        <h3 className="mt-3 text-xl font-semibold text-slate-900 leading-tight">{title}</h3>
        <p className="mt-2 text-sm text-slate-700 leading-relaxed">{body}</p>
        <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 h-32 grid place-items-center">
          {illustration}
        </div>
        <ul className="mt-5 space-y-1.5 text-sm text-slate-700">
          {highlights.map((h) => (
            <li key={h} className="flex items-start gap-2">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </article>
    </Reveal>
  );
}

function StepIllustrationContact() {
  return (
    <div className="flex w-full items-center justify-center gap-2">
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm w-44">
        <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-slate-400">Add</p>
        <p className="mt-1 text-sm font-medium text-slate-900">Maya Patel</p>
        <p className="text-xs text-slate-600">maya@example.com</p>
      </div>
      <div className="text-slate-400 text-2xl">+</div>
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm w-32">
        <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-slate-400">CSV</p>
        <p className="mt-1 text-sm font-medium text-slate-900 truncate">customers.csv</p>
        <p className="text-xs text-slate-600">+212 contacts</p>
      </div>
    </div>
  );
}

function StepIllustrationSend() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute left-2 top-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm w-40">
        <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-slate-400">Email</p>
        <p className="mt-0.5 text-xs font-medium text-slate-800 truncate">Hey Maya — thanks ☕</p>
      </div>
      <div className="absolute right-2 bottom-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm w-40">
        <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-emerald-700">Delivered</p>
        <p className="mt-0.5 text-xs font-medium text-slate-800">at 2:14 pm</p>
      </div>
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-warm-500 text-white shadow-card animate-send-fly"
        style={{ width: "2.4rem", height: "2.4rem" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M5 12l14-7-7 14-2-5-5-2z" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </span>
    </div>
  );
}

function StepIllustrationStars() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1 text-warm-500">
        {[0, 1, 2, 3, 4].map((i) => (
          <StarIcon key={i} className="h-6 w-6" />
        ))}
      </div>
      <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
        Routed to Google
      </div>
    </div>
  );
}

/* ----- Pillar card used in the "Four things you actually use" section ----- */

function PillarCard({
  eyebrow,
  title,
  body,
  bullets,
  illustration,
}: {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  illustration: React.ReactNode;
}) {
  return (
    <article className="h-full rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-soft hover:shadow-card-hover transition-all hover:-translate-y-0.5 flex flex-col">
      <div className="grid gap-5 sm:grid-cols-[1fr_minmax(0,9rem)] items-start">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.2em] text-warm-700 uppercase">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-xl sm:text-[1.35rem] font-semibold text-slate-900 leading-snug">
            {title}
          </h3>
        </div>
        <div className="hidden sm:flex justify-end">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 w-full max-w-[9rem] aspect-square grid place-items-center">
            {illustration}
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm sm:text-base text-slate-700 leading-relaxed">
        {body}
      </p>
      <ul className="mt-5 space-y-1.5 text-sm text-slate-700">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ---- Pillar illustrations (small, restrained — they sit beside copy, not above) ---- */

function PillarEmailIllustration() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-x-2 top-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
        <p className="text-[7px] font-semibold uppercase tracking-wide text-slate-400">
          To: Maya
        </p>
        <p className="mt-0.5 text-[9px] font-medium text-slate-800 truncate">
          Quick favour from Bluebird?
        </p>
      </div>
      <div className="absolute inset-x-2 bottom-2 rounded-lg bg-warm-500 text-white px-2 py-1 shadow-sm text-center">
        <span className="text-[9px] font-semibold">Leave a review →</span>
      </div>
    </div>
  );
}

function PillarQrIllustration() {
  return (
    <svg viewBox="0 0 32 32" className="h-12 w-12 text-slate-900" fill="currentColor" aria-hidden>
      <path d="M3 3h9v9H3V3zm2 2v5h5V5H5zm15-2h9v9h-9V3zm2 2v5h5V5h-5zM3 20h9v9H3v-9zm2 2v5h5v-5H5z" />
      <path d="M14 3h2v2h-2zM18 3h2v2h-2zM14 6h2v2h-2zM14 9h2v2h-2zM18 7h2v2h-2zM21 14h2v2h-2zM25 14h2v2h-2zM18 14h2v2h-2zM14 14h2v2h-2zM3 14h2v2H3zM7 14h2v2H7zM11 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2zM22 18h2v2h-2zM26 18h2v2h-2zM14 22h2v2h-2zM18 22h2v2h-2zM21 26h2v2h-2zM25 26h2v2h-2zM14 26h2v2h-2zM18 26h2v2h-2z" />
    </svg>
  );
}

function PillarCampaignIllustration() {
  return (
    <div className="flex flex-col items-stretch gap-1 w-full px-1">
      {[
        { tone: "bg-emerald-100 text-emerald-700", label: "Sent · 412" },
        { tone: "bg-warm-100 text-warm-700", label: "Opened · 248" },
        { tone: "bg-brand-100 text-brand-700", label: "Reviewed · 39" },
      ].map((row) => (
        <div
          key={row.label}
          className={`flex items-center justify-between rounded-md ${row.tone} px-2 py-1 text-[9px] font-semibold`}
        >
          <span>{row.label}</span>
          <span aria-hidden>›</span>
        </div>
      ))}
    </div>
  );
}

function PillarRoutingIllustration() {
  return (
    <div className="w-full px-1 space-y-1">
      <div className="rounded-md bg-white border border-slate-200 px-2 py-1 flex items-center gap-1.5 shadow-sm">
        <span className="h-2.5 w-2.5 rounded-full bg-[#4285F4]" />
        <span className="text-[9px] font-semibold text-slate-700">Google</span>
        <span className="ml-auto text-[8px] text-amber-500">★★★★★</span>
      </div>
      <div className="rounded-md bg-white border border-slate-200 px-2 py-1 flex items-center gap-1.5 shadow-sm">
        <span className="h-2.5 w-2.5 rounded-full bg-[#1877F2]" />
        <span className="text-[9px] font-semibold text-slate-700">Facebook</span>
      </div>
      <div className="rounded-md bg-rose-50 border border-rose-200 px-2 py-1 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="text-[9px] font-medium text-rose-700">
          Tell us privately
        </span>
      </div>
    </div>
  );
}

function DeliverabilityStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-soft">
      <p className="text-2xl sm:text-3xl font-display font-medium text-slate-900 tabular-nums leading-none">
        {value}
      </p>
      <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
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

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l2.4 6.2H21l-5 3.8 1.9 6L12 15.8 5.1 18l1.9-6-5-3.8h6.6L12 2z" />
    </svg>
  );
}
