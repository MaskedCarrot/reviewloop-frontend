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
import InfoTip from "@/components/InfoTip";
import BillingPageSkeleton from "@/components/skeletons/BillingPageSkeleton";
import type { CreditState, MembershipOffer, MyCreditRates, PublicSendRateCountry } from "@/types";

const PACKS = [
  { key: "topup_500", label: "500", price: "$5" },
  { key: "topup_2000", label: "2,000", price: "$15" },
  { key: "topup_5000", label: "5,000", price: "$30" },
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
          description="Balance, Pro, top-ups, and per-country send costs in one place."
          info={{
            label: "How credits work",
            size: "md",
            children: (
              <p>
                Monthly <strong>Pro</strong> or one-time <strong>top-ups</strong>. Sending pauses at zero balance.{" "}
                <strong>Email</strong> and <strong>SMS</strong> debit by the rates for your market (and all markets in
                the list below the fold).
              </p>
            ),
          }}
        />
        {isLocalMock && (
          <p className="text-xs text-slate-600 border border-slate-200/80 rounded-2xl px-3 py-2 bg-slate-50/80">
            Preview: checkout and credits are local only; no real charges.
          </p>
        )}
      </div>

      {error && (
        <div
          className="rounded-lg border border-red-200/60 bg-red-50/50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      {creditsDataLoading ? (
        <BillingPageSkeleton />
      ) : (
        <>
      {/* Balance */}
      <section className={section} aria-labelledby="balance-heading">
        <p id="balance-heading" className="sr-only">
          Current credit balance
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">Available</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-light tabular-nums text-slate-900 tracking-tight sm:text-6xl">
                {credits?.balance ?? 0}
              </span>
              <span className="text-sm text-slate-500 pb-1.5">credits</span>
            </div>
            {credits != null && (
              <p className="text-xs text-slate-500 mt-2">
                Low-balance email at {credits.low_balance_threshold} credits
              </p>
            )}
          </div>
          {myRates && (
            <div className="sm:max-w-xs sm:text-right border-t border-slate-100/90 pt-3 sm:border-0 sm:pt-0">
              <p className="text-[11px] text-slate-400 uppercase tracking-widest">Your market</p>
              <p className="text-sm text-slate-600 mt-1">
                {myRates.country_code && (
                  <span className="text-slate-500 mr-1">{myRates.country_code}</span>
                )}
                {myRates.email_credits} <span className="text-slate-400">email</span>
                <span className="text-slate-300 mx-1">·</span>
                {myRates.sms_credits_per_segment}{" "}
                <span className="text-slate-400">SMS / seg.</span>
              </p>
              {myRates.notes ? <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{myRates.notes}</p> : null}
            </div>
          )}
        </div>
      </section>

      {/* Pro */}
      {membership && membership.tiers.length > 0 && (
        <section className={section} aria-labelledby="pro-heading">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <div id="pro-heading" className="flex items-center gap-1.5">
                <SectionLabel>Pro</SectionLabel>
                <InfoTip size="sm" label="Pro plans">
                  <p>
                    Same Pro features. Monthly credits and price follow your business country. Extra notes (tax, etc.) may
                    show under a tier.
                  </p>
                </InfoTip>
              </div>
            </div>
          </div>
          {membership.notes && (
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">{membership.notes}</p>
          )}
          <ul className="space-y-2">
            {membership.tiers.map((t) => (
              <li
                key={t.key}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-slate-100/80 last:border-0 first:pt-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.display_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.monthly_credits} credits / month · {t.display_price || "—"}
                    {!t.polar_configured && <span className="text-amber-700/90"> · setup pending</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void startSub(t.key)}
                  disabled={busy || !t.polar_configured}
                  className="shrink-0 btn-primary h-9 px-4 text-sm min-w-[7.5rem] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {busy ? "…" : "Subscribe"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {membership && membership.tiers.length === 0 && (
        <p className="text-sm text-amber-900/80">No Pro tiers are configured for this host yet.</p>
      )}

      {/* Top up */}
      <section className={section} aria-labelledby="topup-heading">
        <SectionLabel id="topup-heading">Top up</SectionLabel>
        <p className="text-sm text-slate-500 mt-1 mb-4">One-time credits, same balance.</p>
        <div className="grid grid-cols-3 gap-2">
          {PACKS.map((p) => (
            <button
              key={p.key}
              type="button"
              disabled={busy}
              onClick={() => void topUp(p.key)}
              className="flex flex-col items-stretch rounded-xl border border-slate-200/50 bg-slate-50/30 px-2 py-3 text-center transition hover:border-brand-300/50 hover:bg-brand-50/25 hover:shadow-sm disabled:opacity-50"
            >
              <span className="text-lg font-medium tabular-nums text-slate-900">{p.label}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">credits</span>
              <span className="text-sm text-slate-500 mt-2">{p.price}</span>
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={saveThreshold} className={section}>
        <div className="flex items-center gap-1.5 mb-2">
          <SectionLabel>Low balance</SectionLabel>
          <InfoTip size="sm" label="Low-balance email">
            <p>
              One email the first time you hit this level; further notices only if still low, after 3+ days, so you are
              not spammed.
            </p>
          </InfoTip>
        </div>
        <p className="text-sm text-slate-500 mb-3">Get emailed when you cross this number.</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="h-9 w-28 rounded-lg border-0 bg-slate-100/80 px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200"
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
            className="btn-secondary h-9 px-3 text-sm inline-flex items-center justify-center gap-2"
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
        </>
      )}

      {/* All markets — merged send rates */}
      <section className={section} id="rates" aria-labelledby="rates-heading">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-1.5">
              <SectionLabel id="rates-heading">All markets</SectionLabel>
              <InfoTip size="md" label="Per-country send costs">
                <p>
                  Credits for one <strong>email</strong> and for one <strong>SMS segment</strong> in each market. Your
                  Settings country is marked in the list.
                </p>
              </InfoTip>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">How many credits a send uses, by country.</p>
          </div>
        </div>
        <SendRatesPanel
          rows={sendRows}
          sendRateNotes={sendNotes}
          myCode={myCountryCode}
          loading={sendLoad}
          error={sendErr}
        />
      </section>

      {!creditsDataLoading && credits && credits.ledger.length > 0 && (
        <section className={section} aria-labelledby="ledger-heading">
          <SectionLabel id="ledger-heading">Recent activity</SectionLabel>
          <ul className="mt-3 text-sm space-y-0 divide-y divide-slate-100/80">
            {credits.ledger.map((row, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                <div>
                  <div className="text-slate-700 capitalize">{row.reason.replace(/_/g, " ")}</div>
                  <div className="text-xs text-slate-400 tabular-nums">
                    {shortDate(row.created_at, ledgerTimeZone)}
                  </div>
                </div>
                <div
                  className={[
                    "text-sm font-medium tabular-nums shrink-0",
                    row.delta < 0 ? "text-red-600" : "text-emerald-600",
                  ].join(" ")}
                >
                  {row.delta > 0 ? "+" : ""}
                  {row.delta}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
