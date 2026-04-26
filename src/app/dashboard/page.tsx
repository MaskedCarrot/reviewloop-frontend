"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense, useEffect, useMemo, useState } from "react";
import ActiveReviewPlatformsStrip from "@/components/ActiveReviewPlatformsStrip";
import {
  getCredits,
  getDashboardStats,
  getPublicConfig,
  listMyLocations,
} from "@/lib/api";
import { useDashboardBootstrap } from "./DashboardBootstrapProvider";
import { activePlatformChips } from "@/lib/reviewPlatformsFromLocations";
import DashboardOverviewSkeleton from "@/components/skeletons/DashboardOverviewSkeleton";
import StyledSelect from "@/components/StyledSelect";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import WelcomeHandoffBanner from "@/components/WelcomeHandoffBanner";
import type { BusinessLocation, CreditState, DashboardStats, MyCreditRates, PublicConfig } from "@/types";

function pct(n: number, d: number): string {
  if (d <= 0) return "0";
  return Math.min(100, Math.round((n / d) * 100)).toString();
}

export default function DashboardOverview() {
  const { bootstrap } = useDashboardBootstrap();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [credits, setCredits] = useState<CreditState | null>(null);
  const [publicCfg, setPublicCfg] = useState<PublicConfig | null>(null);
  const [myRates, setMyRates] = useState<MyCreditRates | null>(null);
  const [days, setDays] = useState(30);
  const [error, setError] = useState("");
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    let live = true;
    setError("");
    getDashboardStats(days)
      .then(async (s) => {
        if (!live) return;
        setStats(s);
        const boot = bootstrap;
        if (boot) {
          setCredits(boot.credits);
          setPublicCfg(boot.config);
          setLocations(boot.locations?.locations ?? []);
          setMyRates(boot.credit_rates);
        } else {
          const [c, p, locs] = await Promise.all([
            getCredits().catch(() => null),
            getPublicConfig().catch(() => null),
            listMyLocations().catch(() => ({ locations: [] as BusinessLocation[], default_location_id: null as string | null })),
          ]);
          if (!live) return;
          if (c) setCredits(c);
          if (p) setPublicCfg(p);
          if (locs) setLocations(locs.locations);
        }
      })
      .catch((e) => {
        if (live) setError(e instanceof Error ? e.message : "Could not load dashboard");
      })
      .finally(() => {
        if (live) setInitialLoadDone(true);
      });
    return () => {
      live = false;
    };
  }, [days, bootstrap]);

  const sent = stats?.funnel.sent ?? 0;
  const view = stats?.funnel.view ?? 0;
  const googleClicks = stats?.funnel.click_google ?? 0;
  const outboundClicks = stats?.funnel.click_outbound ?? 0;
  const reviewSiteTaps = googleClicks + outboundClicks;
  const feedback = stats?.funnel.submit_feedback ?? 0;
  const creditsUsed = stats?.credits_used ?? 0;

  const tapRate = useMemo(
    () => (sent > 0 ? Math.min(100, Math.round((reviewSiteTaps / sent) * 100)) : null),
    [reviewSiteTaps, sent],
  );
  const openRate = useMemo(
    () => (sent > 0 ? Math.min(100, Math.round((view / sent) * 100)) : null),
    [view, sent],
  );
  const creditsPerTap = useMemo(
    () => (reviewSiteTaps > 0 ? creditsUsed / reviewSiteTaps : null),
    [creditsUsed, reviewSiteTaps],
  );

  const reviewTapsFunnelSub = useMemo((): ReactNode => {
    if (sent === 0) return "—";
    const line1 = `${pct(reviewSiteTaps, sent)}% of sends`;
    if (reviewSiteTaps === 0) return line1;
    return (
      <>
        <span>{line1}</span>
        {outboundClicks > 0 ? (
          <span className="block text-slate-500 mt-0.5">
            {googleClicks} to Google, {outboundClicks} to other public review sites (Yelp, TripAdvisor, Facebook, etc. —
            as configured for each store)
          </span>
        ) : (
          <span className="block text-slate-500 mt-0.5">
            These taps are from your Google / one-tap options on the routing page. Taps to Yelp, TripAdvisor, and any
            other site links you add in Store settings also show up here.
          </span>
        )}
      </>
    );
  }, [googleClicks, outboundClicks, reviewSiteTaps, sent]);

  const lowBalance = credits != null && credits.balance <= credits.low_balance_threshold;
  const emailUnit =
    myRates?.email_credits && myRates.email_credits > 0
      ? myRates.email_credits
      : publicCfg?.email_credits && publicCfg.email_credits > 0
        ? publicCfg.email_credits
        : 1;
  const estEmailsLeft = credits != null ? Math.floor(credits.balance / emailUnit) : null;

  const platformChips = useMemo(() => activePlatformChips(locations, publicCfg), [locations, publicCfg]);

  const showData = initialLoadDone && !error && stats;
  const showSkeleton = !initialLoadDone && !error;

  return (
    <div className="w-full max-w-6xl space-y-8 sm:space-y-10 pb-10">
      <DashboardPageHeader
        eyebrow="At a glance"
        title="Overview"
        description="Key stats and how people move from your sends to your review links and feedback in this period."
        info={{
          label: "More about the overview",
          size: "md",
          children: (
            <p>
              Taps count Google and other public review sites you add per store (Yelp, TripAdvisor, etc.). Open{" "}
              <Link href="/dashboard/analytics" className="font-medium text-brand-600 hover:underline">
                Analytics
              </Link>{" "}
              for the full charts and per-site table.
            </p>
          ),
        }}
        end={
          <div className="w-full sm:w-[min(100%,11rem)]">
            <label className="label" htmlFor="dash-range">
              Report period
            </label>
            <StyledSelect id="dash-range" value={String(days)} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </StyledSelect>
          </div>
        }
      />

      {showData && publicCfg && (
        <ActiveReviewPlatformsStrip platforms={platformChips} className="max-w-3xl" />
      )}

      <Suspense fallback={null}>
        <WelcomeHandoffBanner />
      </Suspense>

      {showData && lowBalance && credits && (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/80 px-4 py-3.5 sm:px-5 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-medium text-amber-950">Balance low — {credits.balance} credits left</div>
            <div className="text-sm text-amber-900/80">Sends pause at zero. Top up to keep review requests flowing.</div>
          </div>
          <Link href="/dashboard/billing" className="btn-warm shrink-0">
            Add credits
          </Link>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200/60 bg-red-50/50 px-3 py-2.5 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      {showSkeleton && <DashboardOverviewSkeleton />}

      {showData && (
        <section className="grid gap-4 lg:grid-cols-3">
          <RoiCard
            title="Review site tap rate"
            value={sent === 0 ? "—" : tapRate == null ? "0" : String(tapRate)}
            unit={sent === 0 ? "" : "%"}
            hint="Taps to any public review link (Google, Yelp, and other sites) out of all messages you sent in this period."
            accent="violet"
          />
          <RoiCard
            title="Link open rate"
            value={sent === 0 ? "—" : openRate == null ? "0" : String(openRate)}
            unit={sent === 0 ? "" : "%"}
            hint="Customers who opened your review link at least once after a send."
            accent="blue"
          />
          <RoiCard
            title="Credits per review tap"
            value={creditsPerTap == null ? "—" : creditsPerTap < 10 ? creditsPerTap.toFixed(1) : creditsPerTap.toFixed(0)}
            unit={creditsPerTap == null ? "" : " cr"}
            hint="Credits from sends in this period divided by all review site taps (lower = more credit-efficient)."
            accent="emerald"
          />
        </section>
      )}

      {showData && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-900">From send to review</h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">Typical path for one customer</p>
            <FunnelFlow
              steps={[
                { key: "send", label: "Message sent", value: sent, sub: "review requests in period" },
                { key: "view", label: "Opened link", value: view, sub: sent ? `${pct(view, sent)}% of sends` : "—" },
                { key: "g", label: "Tapped a review site", value: reviewSiteTaps, sub: reviewTapsFunnelSub },
                { key: "f", label: "Private feedback", value: feedback, sub: "internal form" },
              ]}
            />
            {sent === 0 && (
              <p className="text-sm text-slate-500 mt-4 pt-3 border-t border-slate-100">
                No sends in this range yet.{" "}
                <Link href="/dashboard/templates" className="font-medium text-brand-600 hover:text-brand-700">
                  Review your templates
                </Link>
                , then{" "}
                <Link href="/dashboard/contacts" className="font-medium text-brand-600 hover:text-brand-700">
                  add someone
                </Link>{" "}
                to see the funnel.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="card p-5 h-full min-h-[180px]">
              <h2 className="text-sm font-semibold text-slate-900">Credit wallet</h2>
              {credits && publicCfg && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-slate-800">
                    <span className="text-slate-500">Balance</span>{" "}
                    <span className="font-semibold tabular-nums text-slate-900">{credits.balance.toLocaleString()}</span>{" "}
                    <span className="text-slate-600">credits</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Roughly <strong className="text-slate-800">{estEmailsLeft}</strong> email sends at {emailUnit} cr each with your
                    current balance (SMS costs more in most plans).
                  </p>
                  <p className="text-xs text-slate-500">
                    Used <strong className="text-slate-700">{creditsUsed}</strong> credits on messages in the selected period
                    {stats.window_days ? ` (last ${stats.window_days} days).` : "."}
                  </p>
                  <Link href="/dashboard/billing" className="inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700 mt-1">
                    Billing & top-up →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function RoiCard({
  title,
  value,
  unit,
  hint,
  accent,
}: {
  title: string;
  value: string;
  unit: string;
  hint: string;
  accent: "violet" | "blue" | "emerald";
}) {
  const bar =
    accent === "violet" ? "border-l-violet-500" : accent === "blue" ? "border-l-sky-500" : "border-l-emerald-500";
  return (
    <div className={`card p-4 sm:p-5 border-l-4 pl-4 sm:pl-5 ${bar}`}>
      <div className="app-eyebrow">{title}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl sm:text-4xl font-semibold tabular-nums text-slate-900 leading-none">{value}</span>
        {unit ? <span className="text-lg font-medium text-slate-500">{unit}</span> : null}
      </div>
      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{hint}</p>
    </div>
  );
}

function FunnelFlow({
  steps,
}: {
  steps: { key: string; label: string; value: number; sub: ReactNode }[];
}) {
  return (
    <ol className="space-y-0">
      {steps.map((s, i) => (
        <li key={s.key} className="flex gap-0">
          <div className="flex flex-col items-center w-10 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-600 ring-2 ring-slate-200 z-[1]" />
            {i < steps.length - 1 ? <div className="w-0.5 flex-1 min-h-[1.5rem] bg-slate-200" /> : null}
          </div>
          <div className={`pb-4 ${i === steps.length - 1 ? "pt-0" : ""} flex-1 -mt-0.5`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-semibold text-slate-800">{s.label}</span>
              <span className="text-lg font-semibold tabular-nums text-slate-900">{s.value}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.sub}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
