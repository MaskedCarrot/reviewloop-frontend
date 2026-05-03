"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  getCredits,
  getDashboardStats,
  getPublicConfig,
  listMyLocations,
} from "@/lib/api";
import { useDashboardBootstrap } from "./DashboardBootstrapProvider";
import DashboardOverviewSkeleton from "@/components/skeletons/DashboardOverviewSkeleton";
import StyledSelect from "@/components/StyledSelect";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import EmptyState from "@/components/EmptyState";
import KpiCard from "@/components/KpiCard";
import WelcomeHandoffBanner from "@/components/WelcomeHandoffBanner";
import type {
  BusinessLocation,
  CreditState,
  DashboardStats,
  MyCreditRates,
  PublicConfig,
} from "@/types";

function pct(n: number, d: number): string {
  if (d <= 0) return "0";
  return Math.min(100, Math.round((n / d) * 100)).toString();
}

/**
 * Overview — first thing people see. One hero KPI ("did anyone tap a review link?") and one
 * primary action. Everything else is supporting context, sized down so this never feels
 * crowded.
 */
export default function DashboardOverview() {
  const { bootstrap } = useDashboardBootstrap();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [credits, setCredits] = useState<CreditState | null>(null);
  const [publicCfg, setPublicCfg] = useState<PublicConfig | null>(null);
  const [myRates, setMyRates] = useState<MyCreditRates | null>(null);
  const [days, setDays] = useState(30);
  const [error, setError] = useState("");
  const [, setLocations] = useState<BusinessLocation[]>([]);
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
            listMyLocations().catch(() => ({
              locations: [] as BusinessLocation[],
              default_location_id: null as string | null,
            })),
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
  const reviewSiteTaps = stats?.funnel.click_platform ?? 0;
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

  const lowBalance = credits != null && credits.balance <= credits.low_balance_threshold;
  const emailUnit =
    myRates?.email_credits && myRates.email_credits > 0
      ? myRates.email_credits
      : publicCfg?.email_credits && publicCfg.email_credits > 0
        ? publicCfg.email_credits
        : 1;
  const estEmailsLeft = credits != null ? Math.floor(credits.balance / emailUnit) : null;

  const showData = initialLoadDone && !error && stats;
  const showSkeleton = !initialLoadDone && !error;
  const noActivity = showData && sent === 0;

  return (
    <div className="w-full max-w-5xl space-y-6 sm:space-y-8 pb-10">
      <DashboardPageHeader
        eyebrow="At a glance"
        title="Overview"
        credits={credits?.balance}
        end={
          <div className="w-full sm:w-[min(100%,11rem)]">
            <label className="label" htmlFor="dash-range">Period</label>
            <StyledSelect
              id="dash-range"
              value={String(days)}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </StyledSelect>
          </div>
        }
      />

      <Suspense fallback={null}>
        <WelcomeHandoffBanner />
      </Suspense>

      {/* Free-plan summary card — single upgrade nudge on the dashboard.
          The Free model is: 0 monthly grant, may PURCHASE up to N credits per
          UTC month, spend whatever you own. We show purchase-cap progress and
          link to billing to top up. */}
      {(() => {
        const usage = bootstrap?.usage;
        if (!usage) return null;
        const cap = usage.limits.credits_purchase_per_month;
        if (cap === null) return null;
        const bought = usage.used.credits_purchased_this_month ?? 0;
        const remaining = Math.max(0, cap - bought);
        const pct = Math.min(100, Math.round((bought / Math.max(1, cap)) * 100));
        const atCap = bought >= cap;
        return (
          <div className="rounded-2xl border border-warm-200/80 bg-gradient-to-br from-warm-50 to-white p-4 sm:p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-700">
                  You&apos;re on Free
                </p>
                <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                  {atCap ? (
                    <>
                      You&apos;ve hit this month&apos;s purchase cap of{" "}
                      <span className="font-semibold tabular-nums">
                        {cap.toLocaleString()}
                      </span>{" "}
                      credits. Existing credits still send normally — your cap
                      resets on the 1st, or upgrade to Pro for unlimited
                      purchases and a monthly credit grant.
                    </>
                  ) : (
                    <>
                      You can still buy{" "}
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {remaining.toLocaleString()}
                      </span>{" "}
                      credits this month. Upgrade to Pro to remove the cap and
                      get a monthly credit grant.
                    </>
                  )}
                </p>
                <div
                  className="mt-3 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-white"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Free plan monthly purchase usage"
                >
                  <div
                    className={`h-full ${atCap ? "bg-warm-500" : "bg-warm-400"} transition-[width] duration-300`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500 tabular-nums">
                  {bought.toLocaleString()} / {cap.toLocaleString()} credits purchased this month
                </p>
              </div>
              <Link href="/pricing" className="cta-warm shrink-0 h-10 px-4 text-sm">
                Upgrade to Pro
              </Link>
            </div>
          </div>
        );
      })()}

      {showData && lowBalance && credits ? (
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-amber-50/60 px-4 py-3.5 sm:px-5 flex items-center justify-between gap-3 flex-wrap shadow-soft">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M12 9v4M12 17h.01M5 19h14a2 2 0 001.7-3L13.7 4a2 2 0 00-3.4 0L3.3 16A2 2 0 005 19z" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-amber-950">Balance low — {credits.balance} credits left</p>
              <p className="text-sm text-amber-900/90">
                Sends pause at zero. Roughly {estEmailsLeft} emails left at current rates.
              </p>
            </div>
          </div>
          <Link href="/dashboard/billing" className="btn-warm shrink-0">
            Add credits
          </Link>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      {showSkeleton ? <DashboardOverviewSkeleton /> : null}

      {noActivity ? (
        <EmptyState
          tone="warm"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-7 w-7" aria-hidden>
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          }
          title={`No review requests in the last ${days} days`}
          body="Add a few customers and we'll send your default template — you'll see the funnel fill in here. The first one usually takes under five minutes."
          actions={
            <>
              <Link href="/dashboard/contacts" className="btn-warm">Add people</Link>
              <Link href="/dashboard/templates" className="btn-secondary">Review template</Link>
              <Link href="/dashboard/qr" className="btn-ghost">Get a QR code</Link>
            </>
          }
        />
      ) : null}

      {showData && !noActivity ? (
        <>
          {/* Hero stat */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-200/85 bg-white px-6 py-7 sm:px-8 sm:py-8 shadow-card">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-gradient-to-br from-warm-200/60 via-warm-100/30 to-transparent blur-2xl"
            />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="app-eyebrow">
                  <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
                  Headline result
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="display-title-xl text-slate-900 tabular-nums leading-none">
                    {tapRate ?? 0}
                  </span>
                  <span className="text-2xl font-semibold text-slate-500">%</span>
                </div>
                <p className="mt-3 text-sm text-slate-700 max-w-md leading-relaxed">
                  of customers you messaged in the last {days} days tapped a public review link
                  (Google, Yelp, TripAdvisor, etc.).
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Link href="/dashboard/contacts" className="btn-primary h-11 px-5 text-sm">
                  Add people
                </Link>
                <Link href="/dashboard/analytics" className="btn-secondary h-11 px-5 text-sm">
                  See analytics
                </Link>
              </div>
            </div>

            <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7 pt-6 border-t border-slate-200/80">
              <KpiCard value={sent.toLocaleString()} label="Sent" />
              <KpiCard
                value={view.toLocaleString()}
                label="Opened"
                hint={sent ? `${pct(view, sent)}% open` : "—"}
              />
              <KpiCard
                value={reviewSiteTaps.toLocaleString()}
                label="Review taps"
                hint={sent ? `${pct(reviewSiteTaps, sent)}% of sends` : "—"}
                accent="warm"
              />
              <KpiCard value={feedback.toLocaleString()} label="Private feedback" />
            </div>
          </section>

          {/* Funnel — supporting */}
          <section className="app-section">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h2 className="app-section-heading">Customer journey</h2>
                <p className="text-xs text-slate-500 mt-0.5">From your message to a public review</p>
              </div>
              <p className="text-xs text-slate-500 tabular-nums">
                {creditsUsed.toLocaleString()} credits used
              </p>
            </div>
            <div className="mt-5">
              <FunnelFlow
                steps={[
                  { key: "send", label: "Message sent", value: sent, sub: "review requests in period" },
                  {
                    key: "view",
                    label: "Opened link",
                    value: view,
                    sub: sent ? `${openRate ?? 0}% of sends` : "—",
                  },
                  {
                    key: "g",
                    label: "Tapped a review site",
                    value: reviewSiteTaps,
                    sub: sent ? `${tapRate ?? 0}% of sends` : "—",
                  },
                  { key: "f", label: "Private feedback", value: feedback, sub: "internal form" },
                ]}
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function FunnelFlow({
  steps,
}: {
  steps: { key: string; label: string; value: number; sub: ReactNode }[];
}) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const widthPct = Math.max(8, Math.round((s.value / max) * 100));
        const isLast = i === steps.length - 1;
        return (
          <li key={s.key} className="grid grid-cols-[1.5rem_1fr] gap-3 items-start">
            <div className="flex flex-col items-center pt-2">
              <span className="h-2.5 w-2.5 rounded-full bg-warm-500 ring-4 ring-warm-100" />
              {!isLast ? <span className="w-px flex-1 bg-slate-200 mt-1" /> : null}
            </div>
            <div className="pb-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800">{s.label}</span>
                <span className="text-base font-semibold tabular-nums text-slate-900">{s.value.toLocaleString()}</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-warm-400 to-warm-500"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{s.sub}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
