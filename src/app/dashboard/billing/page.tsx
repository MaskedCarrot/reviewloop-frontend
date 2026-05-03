"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCredits,
  getMembershipOffers,
  getMyCreditRates,
  getMyBusiness,
  getPublicSendRatesByCountry,
  patchCreditSettings,
  PUBLIC_SITE_ORIGIN,
  startSubscriptionCheckout,
  startTopUp,
} from "@/lib/api";
import { useDashboardBootstrap } from "../DashboardBootstrapProvider";
import { shortDate } from "@/app/dashboard/contacts/_components/contactFormat";
import SendRatesPanel from "@/components/credits/SendRatesPanel";
import { ButtonSpinner, useAppToast } from "@/components/ToastProvider";
import { useBrowserLocalMockApp } from "@/lib/useBrowserLocalMockApp";
import SectionLabel from "@/components/SectionLabel";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import Disclosure from "@/components/Disclosure";
import BillingPageSkeleton from "@/components/skeletons/BillingPageSkeleton";
import type { CreditState, MembershipOffer, MyCreditRates, PublicSendRateCountry } from "@/types";
import { isSmsEnabledForBusiness } from "@/lib/countryUi";

const PACKS = [
  { key: "topup_100", label: "100", price: "$10", credits: 100 },
  { key: "topup_200", label: "200", price: "$18", credits: 200 },
  { key: "topup_500", label: "500", price: "$40", credits: 500 },
  { key: "topup_2000", label: "2,000", price: "$140", credits: 2_000 },
];

const section = "app-section";

export default function BillingPage() {
  const { bootstrap, refreshBootstrap } = useDashboardBootstrap();
  const isLocalMock = useBrowserLocalMockApp();
  const [credits, setCredits] = useState<CreditState | null>(null);
  const [myRates, setMyRates] = useState<MyCreditRates | null>(null);
  const [membership, setMembership] = useState<{ tiers: MembershipOffer[]; notes: string | null } | null>(null);
  const [sendRows, setSendRows] = useState<PublicSendRateCountry[] | null>(null);
  const [sendNotes, setSendNotes] = useState<string | null>(null);
  const [myCountryCode, setMyCountryCode] = useState<string | null>(null);
  const [ledgerTimeZone, setLedgerTimeZone] = useState("UTC");
  const [sendLoad, setSendLoad] = useState(true);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [thresholdBusy, setThresholdBusy] = useState(false);
  const [thresholdEdit, setThresholdEdit] = useState<number | "">("");
  const [error, setError] = useState("");
  const toast = useAppToast();
  /** After first `refresh` only — follow-up refetches (e.g. after saving threshold) keep the real values visible. */
  const initialFetchDone = useRef(false);
  const [creditsDataLoading, setCreditsDataLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [boot, r, m, s] = await Promise.all([
        bootstrap ? Promise.resolve(bootstrap) : refreshBootstrap(),
        getMyCreditRates().catch(() => null),
        getMembershipOffers().catch(() => null),
        getPublicSendRatesByCountry().catch(() => null),
      ]);
      if (boot) {
        setCredits(boot.credits);
        setLedgerTimeZone(boot.display_timezone || boot.business?.timezone || "UTC");
        setThresholdEdit(boot.credits.low_balance_threshold);
        const cc = boot.business?.country_code?.trim().toUpperCase();
        setMyCountryCode(cc && cc.length === 2 ? cc : null);
      } else {
        const [c, b] = await Promise.all([getCredits().catch(() => null), getMyBusiness().catch(() => null)]);
        if (c) {
          setCredits(c);
          setThresholdEdit(c.low_balance_threshold);
        }
        if (b?.business) setLedgerTimeZone((b.business.timezone || "UTC").trim() || "UTC");
        const cc = b?.business?.country_code?.trim().toUpperCase();
        setMyCountryCode(cc && cc.length === 2 ? cc : null);
      }
      setMyRates(r);
      if (m) {
        setMembership({ tiers: m.tiers, notes: m.notes });
      } else {
        setMembership(null);
      }
      if (s) {
        setSendRows(s.countries);
        setSendNotes(s.send_rate_notes);
        setSendErr(null);
      } else {
        setSendErr("Could not load all-market rates");
        setSendRows(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load billing information");
    } finally {
      setSendLoad(false);
      if (!initialFetchDone.current) {
        initialFetchDone.current = true;
        setCreditsDataLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Scroll to #rates when coming from /dashboard/credit-rates redirect
  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;
    if (window.location.hash !== "#rates") return;
    requestAnimationFrame(() => {
      document.getElementById("rates")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [sendLoad]);

  async function startSub(tierKey: string) {
    setBusy(true);
    setError("");
    try {
      const url = `${PUBLIC_SITE_ORIGIN}/dashboard/billing?subscribed=ok`;
      const res = await startSubscriptionCheckout(url, tierKey);
      window.location.href = res.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not start checkout");
    } finally {
      setBusy(false);
    }
  }

  async function topUp(packKey: string) {
    setBusy(true);
    setError("");
    try {
      const url = `${PUBLIC_SITE_ORIGIN}/dashboard/billing?topup=ok`;
      const res = await startTopUp(packKey, url);
      window.location.href = res.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not start top-up");
    } finally {
      setBusy(false);
    }
  }

  async function saveThreshold(e: React.FormEvent) {
    e.preventDefault();
    if (thresholdEdit === "") return;
    setThresholdBusy(true);
    setError("");
    try {
      await patchCreditSettings(Number(thresholdEdit));
      await refresh();
      toast.success("Low-balance setting saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setThresholdBusy(false);
    }
  }

  return (
    <div className="app-page">
      <div className="space-y-2">
        <DashboardPageHeader
          title="Credits"
          description="Top up to keep sending. Sending pauses at zero balance."
          end={
            <a
              href="#topup"
              className="btn-warm shrink-0 w-full sm:w-fit min-h-10 px-5"
            >
              Add credits
            </a>
          }
        />
        {isLocalMock && (
          <p className="text-xs font-medium text-slate-700 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
            Preview: checkout and credits are local only; no real charges.
          </p>
        )}
      </div>

      {error && (
        <div
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      {creditsDataLoading ? (
        <BillingPageSkeleton />
      ) : (
        <>
      {/* Balance — splashy warm-tinted hero */}
      <section
        className="relative overflow-hidden rounded-3xl border border-warm-200/80 bg-gradient-to-br from-warm-50 via-white to-white p-6 sm:p-8 shadow-card"
        aria-labelledby="balance-heading"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-12 h-56 w-56 rounded-full bg-gradient-to-br from-warm-200/55 via-warm-100/30 to-transparent blur-2xl"
        />
        <p id="balance-heading" className="sr-only">Current credit balance</p>
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="app-eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
              Available balance
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="display-title-xl text-slate-900 tabular-nums leading-none">
                {credits?.balance.toLocaleString() ?? 0}
              </span>
              <span className="text-base font-medium text-slate-600 pb-1.5">credits</span>
            </div>
            {credits != null && (
              <p className="text-sm text-slate-600 mt-3">
                Low-balance email at{" "}
                <span className="font-semibold text-slate-800 tabular-nums">
                  {credits.low_balance_threshold}
                </span>{" "}
                credits
              </p>
            )}
          </div>
          {myRates && (
            <div className="sm:max-w-xs sm:text-right border-t border-slate-200/70 pt-4 sm:border-0 sm:pt-0">
              <p className="app-eyebrow-quiet">Your market</p>
              <p className="text-sm text-slate-800 mt-1.5">
                {myRates.country_code && (
                  <span className="font-semibold text-slate-900 mr-1.5">{myRates.country_code}</span>
                )}
                <span className="font-semibold text-slate-900 tabular-nums">{myRates.email_credits}</span>
                <span className="text-slate-600"> per email</span>
                {isSmsEnabledForBusiness(bootstrap?.business) && (
                  <>
                    <span className="text-slate-400 mx-2">·</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{myRates.sms_credits_per_segment}</span>
                    <span className="text-slate-600"> per SMS seg.</span>
                  </>
                )}
              </p>
              {myRates.notes ? (
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{myRates.notes}</p>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Top up — primary action */}
      <section className={section} id="topup" aria-labelledby="topup-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
          <SectionLabel id="topup-heading">One-time top up</SectionLabel>
          <p className="text-xs text-slate-500">credits never expire</p>
        </div>
        {/* Free-plan purchase cap notice. Pro = limits.credits_purchase_per_month is null. */}
        {(() => {
          const u = bootstrap?.usage;
          const cap = u?.limits.credits_purchase_per_month;
          if (!u || cap == null) {
            return (
              <p className="text-sm text-slate-600 mb-4">Pick a pack to add credits to your balance.</p>
            );
          }
          const bought = u.used.credits_purchased_this_month ?? 0;
          const remaining = Math.max(0, cap - bought);
          const atCap = remaining <= 0;
          return (
            <div className="mb-4 rounded-xl border border-warm-200 bg-warm-50 px-3.5 py-3 text-sm text-slate-700">
              <p>
                You&apos;re on Free — purchases are capped at{" "}
                <span className="font-semibold text-slate-900 tabular-nums">
                  {cap.toLocaleString()}
                </span>{" "}
                credits per UTC month.{" "}
                {atCap ? (
                  <>
                    Cap reached this month. Resets on the 1st, or{" "}
                    <a className="link" href="/pricing">upgrade to Pro</a> for unlimited
                    purchases.
                  </>
                ) : (
                  <>
                    You can still buy{" "}
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {remaining.toLocaleString()}
                    </span>{" "}
                    more this month.
                  </>
                )}
              </p>
            </div>
          );
        })()}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PACKS.map((p, i) => {
            const isMid = i === 2;
            const cap = bootstrap?.usage?.limits.credits_purchase_per_month ?? null;
            const bought = bootstrap?.usage?.used.credits_purchased_this_month ?? 0;
            const remaining = cap == null ? Number.POSITIVE_INFINITY : Math.max(0, cap - bought);
            const exceedsCap = p.credits > remaining;
            const disabled = busy || exceedsCap;
            return (
              <button
                key={p.key}
                type="button"
                disabled={disabled}
                onClick={() => void topUp(p.key)}
                title={exceedsCap ? `Exceeds your Free monthly purchase cap. Upgrade to Pro for unlimited.` : undefined}
                className={[
                  "relative flex flex-col items-stretch rounded-2xl border-2 px-3 py-5 text-center transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-400/30",
                  exceedsCap
                    ? "cursor-not-allowed opacity-50 border-slate-200 bg-slate-50"
                    : isMid
                      ? "border-warm-300 bg-gradient-to-br from-warm-50 to-white hover:border-warm-400 hover:shadow-card disabled:opacity-50"
                      : "border-slate-200 bg-white hover:border-warm-300 hover:bg-warm-50/40 hover:shadow-card disabled:opacity-50",
                ].join(" ")}
              >
                {isMid && !exceedsCap ? (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-warm-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                    Most popular
                  </span>
                ) : null}
                <span className="text-2xl font-semibold tabular-nums text-slate-900">{p.label}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">credits</span>
                <span className="text-base font-semibold text-warm-700 mt-2">{p.price}</span>
                {exceedsCap ? (
                  <span className="mt-1.5 text-[10px] font-medium text-slate-500">
                    over Free cap
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {/* Pro subscription */}
      {membership && membership.tiers.length > 0 && (
        <Disclosure
          label="Subscribe to Pro for monthly credits"
          hint={`${membership.tiers.length} ${membership.tiers.length === 1 ? "tier" : "tiers"} · monthly billing`}
        >
          {membership.notes && (
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">{membership.notes}</p>
          )}
          <ul className="space-y-1">
            {membership.tiers.map((t) => (
              <li
                key={t.key}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-slate-200 last:border-0"
              >
                <div>
                  <p className="text-base font-semibold text-slate-900">{t.display_name}</p>
                  <p className="text-sm text-slate-700 mt-0.5">
                    <span className="font-semibold tabular-nums">{t.monthly_credits.toLocaleString()}</span> credits / month
                    <span className="text-slate-400 mx-1.5">·</span>
                    <span className="font-semibold">{t.display_price || "—"}</span>
                    {!t.polar_configured && <span className="text-amber-800 ml-1.5">· setup pending</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void startSub(t.key)}
                  disabled={busy || !t.polar_configured}
                  className="shrink-0 btn-secondary h-10 px-5 text-sm min-w-[7.5rem]"
                >
                  {busy ? "…" : "Subscribe"}
                </button>
              </li>
            ))}
          </ul>
        </Disclosure>
      )}

      <Disclosure
        label="Low-balance email alert"
        hint={credits ? `Email me at ${credits.low_balance_threshold} credits` : undefined}
      >
        <form onSubmit={saveThreshold} className="space-y-3">
          <p className="text-sm text-slate-600">
            We&apos;ll email you the first time you cross this level — at most once every few days.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="input h-10 w-28"
              type="number"
              min={0}
              name="low_balance_threshold"
              value={thresholdEdit}
              onChange={(e) => setThresholdEdit(e.target.value === "" ? "" : Number(e.target.value))}
              aria-label="Low balance credit threshold"
            />
            <button
              type="submit"
              disabled={thresholdBusy}
              className="btn-secondary h-10 px-4 text-sm"
            >
              {thresholdBusy ? (
                <>
                  <ButtonSpinner variant="onSecondary" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </Disclosure>

      {!creditsDataLoading && credits && credits.ledger.length > 0 ? (
        <Disclosure
          label="Recent activity"
          hint={`${credits.ledger.length} ${credits.ledger.length === 1 ? "entry" : "entries"}`}
        >
          <ul className="text-sm divide-y divide-slate-200">
            {credits.ledger.map((row, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <div>
                  <div className="font-medium text-slate-800 capitalize">{row.reason.replace(/_/g, " ")}</div>
                  <div className="text-xs text-slate-500 tabular-nums mt-0.5">
                    {shortDate(row.created_at, ledgerTimeZone)}
                  </div>
                </div>
                {/*
                  Don't rely on color alone (red/green) — adds a leading "+" or
                  "−" sign and an aria-label so screen-readers and people with
                  color-vision differences can still tell credits from debits.
                */}
                <div
                  className={[
                    "flex items-center gap-1 text-sm font-semibold tabular-nums shrink-0",
                    row.delta < 0 ? "text-red-700" : "text-emerald-700",
                  ].join(" ")}
                  aria-label={
                    row.delta < 0
                      ? `Debit of ${Math.abs(row.delta)} credits`
                      : `Credit of ${row.delta} credits`
                  }
                >
                  <span aria-hidden className="text-base leading-none">
                    {row.delta < 0 ? "−" : "+"}
                  </span>
                  <span>{Math.abs(row.delta)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Disclosure>
      ) : null}

      <Disclosure
        label="Send rates by country"
        hint="How many credits one email or SMS segment costs"
      >
        <SendRatesPanel
          rows={sendRows}
          sendRateNotes={sendNotes}
          myCode={myCountryCode}
          loading={sendLoad}
          error={sendErr}
          showSms={isSmsEnabledForBusiness(bootstrap?.business)}
        />
      </Disclosure>
        </>
      )}
    </div>
  );
}
