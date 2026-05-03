import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import Reveal from "@/components/marketing/Reveal";

export const metadata = {
  title: "FAQ · GoodWord",
  description:
    "Plain-English answers to the questions small-business owners actually ask: pricing, deliverability, GDPR, Google's review-gating policy, multi-location, exporting your data.",
};

type Group = {
  id: string;
  title: string;
  emoji: string;
  items: { q: string; a: React.ReactNode }[];
};

const GROUPS: Group[] = [
  {
    id: "general",
    title: "Getting started",
    emoji: "👋",
    items: [
      {
        q: "What is GoodWord, in one sentence?",
        a: (
          <>
            GoodWord sends a friendly nudge after a customer's visit, routes the happy
            ones to Google in one tap, and quietly catches unhappy feedback before it
            becomes a public 1-star.
          </>
        ),
      },
      {
        q: "How long does setup take?",
        a: (
          <>
            Most owners are sending their first request within ten minutes of signing in.
            See the{" "}
            <Link href="/how-it-works#first-10" className="link">
              10-minute walkthrough
            </Link>
            .
          </>
        ),
      },
      {
        q: "Do I need a website?",
        a: (
          <>
            Nope. We work as long as you have a Google Business Profile (or Yelp, Facebook
            page, etc.) for customers to leave a review on.
          </>
        ),
      },
      {
        q: "What if I have multiple locations?",
        a: (
          <>
            On Pro, one subscription covers all of them. Each location can have its own
            template, quiet hours, and review links. Add them in Settings → Locations.
            (Free is single-location.)
          </>
        ),
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing & billing",
    emoji: "💳",
    items: [
      {
        q: "What does Pro include?",
        a: (
          <>
            $7/month gets you 200 credits each month — about 200 emails. Unlimited
            locations, templates, contacts. The credits roll over while you stay on Pro.
          </>
        ),
      },
      {
        q: "What's a credit?",
        a: (
          <>
            One unit of sending. 1 email = 1 credit in most countries. SMS varies by
            country (see the{" "}
            <Link href="/pricing#rates" className="link">
              rates table
            </Link>
            ). Credits never expire.
          </>
        ),
      },
      {
        q: "Will I get hit with overage fees?",
        a: (
          <>
            No. The moment your balance hits zero, sends stop. We email you a heads-up
            before you run out so nothing in flight gets lost.
          </>
        ),
      },
      {
        q: "Can I cancel?",
        a: (
          <>
            Two clicks in your settings, no retention call. You keep access until the end
            of the billing period. We don't hold your data hostage — export to CSV anytime.
          </>
        ),
      },
      {
        q: "Refunds?",
        a: (
          <>
            If GoodWord isn't earning its keep within 7 days, email us and we'll refund
            every cent. We'd rather lose a month than your trust.
          </>
        ),
      },
    ],
  },
  {
    id: "deliverability",
    title: "Deliverability",
    emoji: "📬",
    items: [
      {
        q: "Will my emails actually reach the inbox?",
        a: (
          <>
            Yes — that's the whole point. We send from an authenticated pool with SPF, DKIM
            and DMARC fully configured on our side. Your customers see emails branded with
            your business name and a one-tap unsubscribe. Beta cohort lands in the inbox
            roughly 97% of the time.
          </>
        ),
      },
      {
        q: "What domain do you send from?",
        a: (
          <>
            We send from an authenticated address we own and maintain
            (<span className="font-mono text-slate-800">noreply-goodword@maskedcarrotlabs.com</span>),
            with the recipient seeing <em>your</em> business name as the &ldquo;From&rdquo;
            label. You don&apos;t need to set up DKIM, SPF, DMARC, or anything in DNS —
            we&apos;ve done that work, professionally, and we keep it healthy.
          </>
        ),
      },
      {
        q: "What about bounces and spam complaints?",
        a: (
          <>
            We track them in real time and automatically suppress that address forever, so
            you don't keep mailing dead inboxes. Suppressions show in the dashboard.
          </>
        ),
      },
      {
        q: "Do you send SMS?",
        a: (
          <>
            We do, where supported. SMS is opt-in per account because carrier costs and
            compliance differ by country. Email-only converts surprisingly well — most
            owners start there.
          </>
        ),
      },
    ],
  },
  {
    id: "compliance",
    title: "Compliance & ethics",
    emoji: "🛡️",
    items: [
      {
        q: "Is this allowed by Google?",
        a: (
          <>
            Yes — and we're careful to stay on the right side of the line. Google's policy
            forbids "review gating" (blocking unhappy customers from leaving public
            reviews). We <em>don't</em> do that. We let everyone leave a public review;
            we simply offer the option of private feedback alongside it. No filters, no
            locks.
          </>
        ),
      },
      {
        q: "Is it GDPR-compliant?",
        a: (
          <>
            Yes. Every contact has a logged opt-in source. Every email has a one-tap
            unsubscribe. We never re-contact a stop. Data lives in EU + US regions
            depending on your account region.
          </>
        ),
      },
      {
        q: "Can I export everything?",
        a: (
          <>
            Yes — your contacts, sends, replies and feedback all export as CSV from the
            dashboard. You own your data; we're just hosting it.
          </>
        ),
      },
      {
        q: "What about CAN-SPAM / CASL / PECR?",
        a: (
          <>
            Our defaults satisfy CAN-SPAM (US), CASL (Canada), GDPR (EU), the
            Australian Spam Act, and equivalent regimes — physical address in every send,
            identifiable sender, opt-out on every message, opt-in audit trail. See the{" "}
            <Link href="/compliance" className="link">
              compliance page
            </Link>
            .
          </>
        ),
      },
    ],
  },
  {
    id: "product",
    title: "How it works in practice",
    emoji: "⚙️",
    items: [
      {
        q: "What if a customer's review URL changes?",
        a: (
          <>
            Google occasionally rewrites Place IDs. We re-validate review links nightly
            and email you if one breaks. You can also paste a fresh link any time —
            there's no caching surprise.
          </>
        ),
      },
      {
        q: "Can I import from Square / Shopify / Toast / Jobber / ServiceM8?",
        a: (
          <>
            Yes. Export to CSV from your tool, drag the file onto People → Import. We
            auto-map columns; you only need name + email at minimum.
          </>
        ),
      },
      {
        q: "Can I use this with my CRM / Zapier?",
        a: (
          <>
            Yes — every account gets a webhook endpoint. Pipe a "customer paid" event
            from your POS, CRM, or Zapier trigger straight in.
          </>
        ),
      },
      {
        q: "Does it work for online / e-commerce stores?",
        a: (
          <>
            Yes. Trigger us from a "parcel delivered" webhook (Shopify / Woo / etc.) so
            the nudge lands the day after unboxing — when it has the most pull.
          </>
        ),
      },
    ],
  },
  {
    id: "account",
    title: "Account & data",
    emoji: "🔐",
    items: [
      {
        q: "Is my data shared with anyone?",
        a: (
          <>
            No. We don't sell, share, or train models on your customer data. Sub-processors
            are limited to delivery infrastructure (SendGrid for email, Twilio for SMS,
            Supabase for storage). The full list is on the{" "}
            <Link href="/privacy" className="link">
              privacy page
            </Link>
            .
          </>
        ),
      },
      {
        q: "Can I delete my account and everything in it?",
        a: (
          <>
            Yes. Settings → Account → Delete. We hard-delete all customer data within 30
            days. (We keep accounting records as required by law.)
          </>
        ),
      },
      {
        q: "Who's behind this?",
        a: (
          <>
            GoodWord is built by{" "}
            <a className="link" href="https://maskedcarrotlabs.com">
              Masked Carrot Labs
            </a>{" "}
            — a tiny independent product studio. No VC, no growth-hacking team,
            no chatbots. Just us, building tools we'd want to use ourselves.
          </>
        ),
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="marketing-root">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 right-[-15%] h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-warm-200/50 via-warm-100/30 to-transparent blur-3xl animate-float-blob" />
        <div className="absolute bottom-[-10rem] left-[-15%] h-[18rem] w-[18rem] rounded-full bg-gradient-to-tr from-emerald-100/40 to-brand-100/30 blur-3xl animate-float-blob-2" />
      </div>

      <MarketingHeader />

      <section className="marketing-section pt-12 sm:pt-16 pb-8">
        <div className="max-w-3xl mx-auto text-center">
          <span className="marketing-eyebrow mx-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
            FAQ
          </span>
          <h1 className="display-title-xl mt-4 text-slate-900">
            Honest answers, no marketing waffle.
          </h1>
          <p className="mt-5 text-lg text-slate-700 leading-relaxed">
            If something's missing, write to us — we read every message and update this
            page when we see the same question twice.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {GROUPS.map((g) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span>{g.emoji}</span>
              <span>{g.title}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="marketing-section pb-12 max-w-3xl space-y-10">
        {GROUPS.map((g) => (
          <Reveal key={g.id} as="section">
            <div id={g.id} className="scroll-mt-28">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-warm-50 text-2xl ring-1 ring-warm-200">
                  {g.emoji}
                </span>
                <h2 className="display-title text-2xl sm:text-3xl text-slate-900">{g.title}</h2>
              </div>
              <div className="mt-5 divide-y divide-slate-200 rounded-3xl border border-slate-200/80 bg-white shadow-soft overflow-hidden">
                {g.items.map((it) => (
                  <details key={it.q} className="group">
                    <summary className="cursor-pointer list-none px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between gap-4 hover:bg-slate-50/80">
                      <span className="text-base font-semibold text-slate-900 leading-snug">{it.q}</span>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition-transform group-open:rotate-45">
                        <PlusIcon className="h-4 w-4" />
                      </span>
                    </summary>
                    <div className="px-5 sm:px-7 pb-5 sm:pb-6 text-sm sm:text-[0.95rem] text-slate-700 leading-relaxed">
                      {it.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="marketing-section pb-20">
        <Reveal>
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-card text-center max-w-2xl mx-auto">
            <h3 className="display-title-lg text-slate-900">Still wondering something?</h3>
            <p className="mt-3 text-base text-slate-700 leading-relaxed">
              Email us — we read every message, and we'll update this page if we see your
              question twice.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <a
                href="mailto:hello@maskedcarrotlabs.com"
                className="cta-warm"
              >
                Email hello@maskedcarrotlabs.com
              </a>
              <Link href="/support" className="cta-secondary">
                Or schedule a call
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <MarketingFooter />
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
