import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import ReviewPlatformIcon from "@/components/ReviewPlatformIcon";
import TryDemoButton from "@/components/TryDemoButton";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { HomeThreeSteps } from "@/components/marketing/HomePageSections";
import { HeroProductVisual } from "@/components/marketing/HeroProductVisual";
import { PRO_PLAN, upToReviewEmails, usd } from "@/lib/pricingDisplay";

export default function HomePage() {
  const proEmails = upToReviewEmails(PRO_PLAN.credits);

  return (
    <div className="marketing-root relative">
      {/* Fixed layer so blurs never extend the document / scroll area */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 right-[-20%] h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-amber-100/50 via-brand-100/30 to-sky-100/25 blur-3xl" />
        <div className="absolute bottom-0 left-[-15%] h-[22rem] w-[22rem] rounded-full bg-gradient-to-tr from-sky-100/40 to-brand-50/20 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-slate-50/30" />
      </div>

      <MarketingHeader />

      <section className="marketing-section pt-5 sm:pt-8 pb-8 sm:pb-10">
        <div className="grid grid-cols-1 gap-8 lg:gap-12 lg:grid-cols-2 items-center max-w-6xl mx-auto">
          <div className="space-y-4 sm:space-y-5 animate-home-in">
            <h1 className="app-hero-title">
              Get Google reviews after the visit — without the awkward till-side ask.
            </h1>
            <p className="text-base sm:text-lg text-slate-700 max-w-xl leading-snug">
              One text or email, one link. We&apos;re built for <span className="font-semibold text-slate-800">local shops, cafés, and trades</span> in the
              US, UK, and more.
            </p>
            <p className="text-xs text-slate-500 flex items-center flex-wrap gap-x-2 gap-y-1.5 max-w-xl">
              <span>Your routing page can surface</span>
              {(["google", "yelp", "facebook", "tripadvisor"] as const).map((id) => (
                <span key={id} className="inline-flex" title={id}>
                  <ReviewPlatformIcon platformId={id} size="sm" />
                </span>
              ))}
              <span>and other sites you add per store.</span>
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
              <Link
                href="/login?new=1"
                className="inline-flex items-center justify-center btn-primary px-5 py-2.5 text-base font-semibold shadow-md min-h-11"
              >
                Get started
              </Link>
              <TryDemoButton
                variant="secondary"
                className="px-5 py-2.5 text-base min-h-11 font-semibold"
                label="Try demo"
              />
            </div>
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">
                {usd(PRO_PLAN.priceUsd)}/mo
              </span>{" "}
              · {proEmails} review emails / mo included ·{" "}
              <Link className="text-brand-600 font-medium hover:underline" href="/pricing">
                Pricing
              </Link>
            </p>
            <p className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1 max-w-md">
              <span>Opt-in on every add</span>
              <span className="text-slate-300" aria-hidden>
                ·
              </span>
              <span>Stops at zero credits</span>
              <span className="text-slate-300" aria-hidden>
                ·
              </span>
              <span>Unsubscribe on every send</span>
            </p>
          </div>
          <div className="flex justify-center lg:justify-end shrink-0 animate-home-in max-lg:max-w-xs max-lg:mx-auto">
            <HeroProductVisual />
          </div>
        </div>
      </section>

      <HomeThreeSteps />

      <section className="marketing-section py-8 sm:py-10 max-w-2xl">
        <div className="app-section text-center shadow-soft">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Ready in minutes</h2>
          <div className="mt-4 flex flex-col sm:flex-row flex-wrap justify-center gap-2.5">
            <Link
              href="/login?new=1"
              className="inline-flex items-center justify-center btn-primary px-5 py-2.5 text-sm font-semibold min-h-10"
            >
              Get started
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center btn-secondary px-5 py-2.5 text-sm font-semibold min-h-10"
            >
              How it works
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            <Link href="/support" className="text-brand-600 font-medium hover:underline">
              Support
            </Link>{" "}
            ~24h
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
