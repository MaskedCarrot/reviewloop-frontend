"use client";

import Link from "next/link";
import ReactCountryFlag from "react-country-flag";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import SendRatesPanel from "@/components/credits/SendRatesPanel";
import SectionLabel from "@/components/SectionLabel";
import { TOPUP_PACKS, usd } from "@/lib/pricingDisplay";
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
  sendRates: PublicSendRatesResponse | null;
  membership: MembershipOffers | null;
  /** True when the live API was unreachable or returned an error. */
  usedFallback: boolean;
};

export default function PricingView({
  visitorCountry,
  marketName,
  emailPerSend,
  smsPerSegment,
  sendRates,
  membership,
  usedFallback,
}: Props) {
  const tiers = membership?.tiers?.length
    ? membership.tiers
    : [{ key: "pro", display_name: "Pro", display_price: usd(7) + " / month", monthly_credits: 200, polar_configured: true }];

  return (
    <div className="marketing-root">
      <MarketingHeader />

      <div className="marketing-narrow flex-1 px-0 pt-8 sm:pt-10 pb-16 sm:pb-20">
        <header>
          <p className="app-eyebrow">Pricing</p>
          <h1 className="app-title-hero mt-1">Credits, Pro, and send rates</h1>
          <p className="app-subtitle text-slate-600 sm:text-base max-w-xl mt-2">
            One meter for every send. We estimate Pro value using your network region (no account required).
          </p>
        </header>

        {usedFallback && (
          <p className="mt-4 text-xs text-amber-800/90 bg-amber-50/80 border border-amber-200/50 rounded-2xl px-3 py-2">
            Showing static reference prices — live table could not be reached. Refresh or try again later.
          </p>
        )}

        <div
          className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl border border-slate-200/50 bg-slate-50/40 px-4 py-3.5"
          role="status"
        >
          <div>
            <p className="app-eyebrow">Your market estimate</p>
            <p className="text-sm text-slate-800 mt-1">
              {visitorCountry && marketName ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex items-center" aria-hidden>
                    <ReactCountryFlag countryCode={visitorCountry} svg style={{ width: "1.15em", height: "1.15em" }} title="" />
                  </span>
                  <span className="font-medium">{marketName}</span>
                  <span className="text-slate-400" aria-hidden>
                    ·
                  </span>
                  <span className="text-slate-600">
                    {emailPerSend} cr <span className="text-slate-400">/</span> email, {smsPerSegment} cr <span className="text-slate-400">/</span>{" "}
                    SMS segment
                  </span>
                </span>
              ) : (
                <span className="text-slate-600">
                  Region not detected — defaulting to base rates: {emailPerSend} cr / email, {smsPerSegment} cr / SMS segment. Use{" "}
                  <code className="text-xs bg-white/80 px-1.5 py-0.5 rounded">?country=US</code> in the URL to preview a market.
                </span>
              )}
            </p>
          </div>
        </div>

        <section className="mt-10" aria-labelledby="pro-heading">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <SectionLabel id="pro-heading">Pro</SectionLabel>
              <p className="mt-0.5 text-sm text-slate-500">Monthly credit refill. No per-seat fee. Same app features on every tier.</p>
            </div>
          </div>
          {membership?.notes ? <p className="mt-3 text-xs text-slate-500 leading-relaxed">{membership.notes}</p> : null}

          <div className="mt-4 space-y-3">
            {tiers.map((t) => {
              const em = maxEmails(t.monthly_credits, emailPerSend);
              const sm = maxSmsSegments(t.monthly_credits, smsPerSegment);
              return (
                <div
                  key={t.key}
                  className="rounded-2xl border border-slate-200/50 bg-white px-4 sm:px-5 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{t.display_name}</p>
                    <p className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
                      {t.display_price}
                    </p>
                    <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
                      {t.monthly_credits.toLocaleString()} credits / month → up to {em.toLocaleString()} emails or {sm.toLocaleString()}{" "}
                      SMS segments
                    </p>
                  </div>
                  <Link
                    href="/login?new=1"
                    className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center btn-primary px-5 py-2.5 text-sm min-h-11"
                  >
                    Get started
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="topup-heading">
          <div>
            <SectionLabel>One-time top-ups</SectionLabel>
            <p className="mt-0.5 text-sm text-slate-500" id="topup-heading">
              Buy more credits anytime after sign-in.
            </p>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200/50 overflow-hidden bg-white">
            {TOPUP_PACKS.map((row) => {
              const em = maxEmails(row.credits, emailPerSend);
              const sm = maxSmsSegments(row.credits, smsPerSegment);
              return (
                <div
                  key={row.credits}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-900 text-sm sm:text-base">
                      {row.credits.toLocaleString()} credits
                      <span className="text-slate-400"> · </span> up to {em.toLocaleString()} emails
                      <span className="text-slate-400"> · </span> {sm.toLocaleString()} SMS
                    </p>
                    <p className="text-xs text-slate-500">Illustrates capacity at your current send-rate estimate.</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900 tabular-nums shrink-0 sm:text-right">{usd(row.priceUsd)}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-12 scroll-mt-24" id="rates" aria-labelledby="rates-heading">
          <div>
            <SectionLabel id="rates-heading">All markets</SectionLabel>
            <p className="mt-0.5 text-sm text-slate-500">How many credits each send type uses, by country.</p>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200/50 bg-white/90 px-4 sm:px-5 py-5">
            <SendRatesPanel
              rows={sendRates?.countries ?? null}
              sendRateNotes={sendRates?.send_rate_notes ?? null}
              myCode={visitorCountry}
              highlightLabel="your region"
              loading={false}
              error={sendRates ? null : "Rates could not be loaded."}
            />
          </div>
        </section>

        <p className="mt-10 text-sm text-slate-500 text-center sm:text-left">
          <a href="mailto:hello@maskedcarrotlabs.com" className="text-brand-600 font-medium hover:underline">
            Contact
          </a>
          {" · "}
          <Link href="/how-it-works" className="text-brand-600 font-medium hover:underline">
            How it works
          </Link>
          {" · "}
          <Link href="/" className="text-brand-600 font-medium hover:underline">
            Home
          </Link>
        </p>
      </div>

      <MarketingFooter />
    </div>
  );
}
