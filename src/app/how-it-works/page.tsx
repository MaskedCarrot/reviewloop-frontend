import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import {
  HowItWorksHeroImage,
  VisCollect,
  VisCustomer,
  VisDashboard,
  VisTemplate,
} from "@/components/marketing/HowItWorksVisuals";
import { PRO_PLAN, upToReviewEmails, upToSms, usd } from "@/lib/pricingDisplay";

const STEPS = [
  {
    title: "Bring your list together",
    body: "Upload a CSV, drop a QR at the register, pipe from a webhook (POS, Zapier, your stack), or add people by hand. Everyone ends up in one place so you're not copying from three inboxes.",
    Visual: VisCollect,
  },
  {
    title: "Write once, send many",
    body: "You set templates for email and — where we support it — SMS. Each send uses credits so you always know what a month looks like before the bill does.",
    Visual: VisTemplate,
  },
  {
    title: "One page for the customer",
    body: "They see a clear path to your Google review link. If they're not ready to post publicly, they can send you a private note so you still learn what went wrong.",
    Visual: VisCustomer,
  },
  {
    title: "Measure and tune",
    body: "The dashboard shows opens, taps, Google intent, and private notes. When your balance hits zero, sends stop — no surprise overages.",
    Visual: VisDashboard,
  },
] as const;

export default function HowItWorksPage() {
  const e = upToReviewEmails(PRO_PLAN.credits);
  const s = upToSms(PRO_PLAN.credits);

  return (
    <div className="marketing-root">
      <MarketingHeader />

      <section className="marketing-section pt-8 sm:pt-10 pb-10 sm:pb-12 max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="order-2 lg:order-1 space-y-3 animate-home-in">
            <p className="app-eyebrow text-brand-700/90">The flow</p>
            <h1 className="app-title-hero leading-tight">How ReviewLoop works</h1>
            <p className="text-lg sm:text-xl text-slate-700">From first contact to reviews and feedback — without the awkward in-person ask.</p>
            <p className="text-sm text-slate-500">
              Pro {usd(PRO_PLAN.priceUsd)}/mo · up to {e} emails or {s} SMS (or a mix).{" "}
              <Link href="/pricing" className="text-brand-600 font-medium hover:underline">
                See pricing
              </Link>
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/login?new=1" className="btn-primary px-6 py-2.5 text-base shadow-sm min-h-11">
                Get started
              </Link>
              <Link href="/" className="btn-secondary px-6 py-2.5 text-base min-h-11">
                Home
              </Link>
            </div>
          </div>
          <div className="order-1 lg:order-2 flex justify-center">
            <HowItWorksHeroImage />
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto w-full marketing-section pb-20 space-y-10 sm:space-y-14">
        {STEPS.map((step, i) => {
          const Vis = step.Visual;
          const flip = i % 2 === 1;
          return (
            <article
              key={step.title}
              className="grid gap-6 lg:grid-cols-2 lg:gap-10 items-center app-section"
            >
              <div className={flip ? "lg:order-2" : undefined}>
                <p className="app-eyebrow text-brand-600/90">Step {i + 1}</p>
                <h2 className="mt-1.5 text-xl sm:text-2xl font-semibold text-slate-900">{step.title}</h2>
                <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">{step.body}</p>
              </div>
              <div className={`flex justify-center ${flip ? "lg:order-1" : ""}`}>
                <Vis />
              </div>
            </article>
          );
        })}

        <div className="app-section text-center shadow-soft">
          <p className="text-xl sm:text-2xl font-semibold text-slate-900">Ready to try it on your business?</p>
          <p className="mt-2 text-slate-600 max-w-md mx-auto text-sm sm:text-base">
            Create an account and send your first follow-up when you're ready.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/login?new=1" className="btn-primary px-6 py-2.5 text-base min-h-11 shadow-sm">
              Get started
            </Link>
            <Link href="/pricing" className="btn-secondary px-6 py-2.5 text-base min-h-11">
              View pricing
            </Link>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
