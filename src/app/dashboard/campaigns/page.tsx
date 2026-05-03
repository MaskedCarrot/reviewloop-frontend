"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { listCampaigns, listContacts } from "@/lib/api";
import { useDashboardBootstrap } from "../DashboardBootstrapProvider";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import PageLoader from "@/components/PageLoader";
import Disclosure from "@/components/Disclosure";
import EmptyState from "@/components/EmptyState";
import UsageMeter from "@/components/UsageMeter";
import { useAppToast } from "@/components/ToastProvider";
import NewCampaignWizard from "./_components/NewCampaignWizard";
import { campaignStatusTone } from "./_lib/campaignUi";
import type { Campaign, CampaignStatus } from "@/types";

const PAGE_SIZE = 20;

export default function ActiveCampaignsPage() {
  const { bootstrap: sharedBootstrap, refreshBootstrap } = useDashboardBootstrap();
  const [items, setItems] = useState<Campaign[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [listPage, setListPage] = useState(1);
  const [listQ, setListQ] = useState("");
  const [listQDeb, setListQDeb] = useState("");
  const [listStatus, setListStatus] = useState<"all" | CampaignStatus>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [listTick, setListTick] = useState(0);
  const [contactsTotal, setContactsTotal] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const toast = useAppToast();

  useEffect(() => {
    const t = setTimeout(() => setListQDeb(listQ), 300);
    return () => clearTimeout(t);
  }, [listQ]);

  useEffect(() => {
    setListPage(1);
  }, [listQDeb, listStatus, fromDate, toDate]);

  const bootstrapData = useCallback(async () => {
    setLoading(true);
    try {
      const boot = sharedBootstrap ?? (await refreshBootstrap());
      if (!boot) return;
      setCredits(boot.credits?.balance ?? 0);
      try {
        const c = await listContacts({ page: 1, pageSize: 1 });
        setContactsTotal(c.total);
      } catch {
        setContactsTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [sharedBootstrap, refreshBootstrap]);

  const loadCampaigns = useCallback(async () => {
    setListLoading(true);
    setLoadError(null);
    try {
      const s = await listCampaigns({
        page: listPage,
        pageSize: PAGE_SIZE,
        q: listQDeb.trim() || undefined,
        status: listStatus === "all" ? undefined : listStatus,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setItems(s.campaigns);
      setListTotal(s.total);
    } catch (err) {
      // Surface a real message instead of silently showing "no campaigns".
      const msg = err instanceof Error ? err.message : "Could not load campaigns.";
      setLoadError(msg);
      setItems([]);
      setListTotal(0);
      toast.error(msg);
    } finally {
      setListLoading(false);
    }
    // toast is stable from the provider; intentionally omitted from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listPage, listQDeb, listStatus, fromDate, toDate, listTick]);

  useEffect(() => {
    void bootstrapData();
  }, [bootstrapData]);
  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  const hasListFilters = Boolean(
    listQDeb.trim() || fromDate || toDate || listStatus !== "all",
  );
  const startRow = listTotal === 0 ? 0 : (listPage - 1) * PAGE_SIZE + 1;
  const endRow = (listPage - 1) * PAGE_SIZE + items.length;
  const canPrev = listPage > 1;
  const canNext = listPage * PAGE_SIZE < listTotal;

  // Plan / usage gating. ``usage.limits.campaigns_per_month === null`` means the
  // user is on Pro — no cap, button stays enabled. We branch on the limit being
  // a finite number rather than the plan key directly so any future tiers (e.g.
  // an enterprise plan with a different cap) just work.
  const usage = sharedBootstrap?.usage;
  const campaignsLimit = usage?.limits?.campaigns_per_month ?? null;
  const campaignsUsed = usage?.used?.campaigns_this_month ?? 0;
  const atCampaignCap =
    campaignsLimit !== null && campaignsUsed >= campaignsLimit;
  const noContacts = contactsTotal === 0;
  const cannotCreate = atCampaignCap || noContacts;

  return (
    <div className="space-y-6 w-full min-w-0">
      <DashboardPageHeader
        eyebrow="Automated follow-ups"
        title="Campaigns"
        credits={credits != null ? credits : undefined}
        description="Set up a message sequence once and it runs automatically."
        end={
          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            disabled={cannotCreate}
            title={
              atCampaignCap
                ? `Free plan limit reached: ${campaignsLimit} campaigns / month. Upgrade to Pro for unlimited.`
                : noContacts
                  ? "Add at least one contact in People before creating a campaign."
                  : undefined
            }
            className="btn-warm shrink-0 w-full sm:w-fit min-h-10 px-5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            New campaign
          </button>
        }
      />

      {/* Free-plan usage meter. Hidden for Pro users (limit === null). */}
      {!loading && (
        <UsageMeter
          label="Campaigns this month"
          used={campaignsUsed}
          limit={campaignsLimit}
          hint={
            campaignsLimit !== null
              ? `Free plan: ${campaignsLimit} campaigns / month. Resets on the 1st.`
              : undefined
          }
        />
      )}

      {!loading && noContacts && (
        <div className="rounded-2xl border border-warm-200 bg-warm-50/60 px-4 py-3 sm:px-5 sm:py-4 text-sm text-warm-900 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="leading-relaxed">
            <strong className="font-semibold">Add some people first.</strong> Campaigns need at least
            one contact to enrol — head to{" "}
            <Link href="/dashboard/contacts" className="font-semibold underline">
              People
            </Link>{" "}
            to add or import them.
          </p>
          <Link
            href="/dashboard/contacts"
            className="btn-warm h-9 px-4 text-sm shrink-0 w-full sm:w-auto justify-center"
          >
            Open People
          </Link>
        </div>
      )}

      {/* Filters — search + status as primary, dates collapsed */}
      {!loading && (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 sm:flex-1 sm:max-w-md">
              <label className="label" htmlFor="cmp-q">
                Search
              </label>
              <input
                id="cmp-q"
                className="input h-10 text-sm"
                placeholder="Search campaigns by name…"
                value={listQ}
                onChange={(e) => setListQ(e.target.value)}
              />
            </div>
            <div className="sm:w-48">
              <label className="label" htmlFor="cmp-status">
                Status
              </label>
              <select
                id="cmp-status"
                className="input h-10 text-sm w-full"
                value={listStatus}
                onChange={(e) => setListStatus(e.target.value as "all" | CampaignStatus)}
              >
                <option value="all">All statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="running">Running</option>
                <option value="paused">Paused</option>
                <option value="finished">Finished</option>
              </select>
            </div>
          </div>

          <Disclosure
            label="Filter by date created"
            hint={fromDate || toDate ? `${fromDate || "any"} → ${toDate || "any"}` : undefined}
            defaultOpen={Boolean(fromDate || toDate)}
          >
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                className="input h-10 text-sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                aria-label="From"
              />
              <span className="text-slate-400">–</span>
              <input
                type="date"
                className="input h-10 text-sm"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                aria-label="To"
              />
              {fromDate || toDate ? (
                <button
                  type="button"
                  className="btn-ghost text-sm h-10"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  Clear
                </button>
              ) : null}
            </div>
          </Disclosure>

          {hasListFilters ? (
            <button
              type="button"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
              onClick={() => {
                setListQ("");
                setListQDeb("");
                setListStatus("all");
                setFromDate("");
                setToDate("");
                setListPage(1);
              }}
            >
              Clear all filters
            </button>
          ) : null}
        </div>
      )}

      {loading ? (
        <div className="app-section py-12">
          <PageLoader message="Loading campaigns" size="md" />
        </div>
      ) : listTotal === 0 && !hasListFilters && !listLoading ? (
        <EmptyState
          tone="warm"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-7 w-7" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75A1.5 1.5 0 015.25 5.25h13.5a1.5 1.5 0 011.5 1.5v10.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V6.75z"
              />
              <path strokeLinecap="round" d="M3.75 9.75h16.5" />
            </svg>
          }
          title="No campaigns yet"
          body="Create your message templates first, then set up an automated follow-up sequence. We'll handle the timing."
          actions={
            <>
              <button type="button" className="btn-warm" onClick={() => setWizardOpen(true)}>
                New campaign
              </button>
              <Link href="/dashboard/templates" className="btn-secondary">
                Go to Templates
              </Link>
            </>
          }
        />
      ) : (
        <div className="space-y-4">
          {loadError && !listLoading ? (
            <div
              role="alert"
              className="card border-red-200 bg-red-50/70 p-4 text-sm text-red-900"
            >
              <div className="font-semibold">Could not load campaigns</div>
              <div className="mt-1 opacity-80">{loadError}</div>
              <button
                type="button"
                onClick={() => setListTick((t) => t + 1)}
                className="btn btn-secondary mt-3 px-3 py-1.5 text-xs"
              >
                Try again
              </button>
            </div>
          ) : null}
          {listTotal === 0 && hasListFilters && !listLoading && !loadError ? (
            <EmptyState
              tone="muted"
              title="No campaigns match your filters"
              body="Try widening the date range or clearing search."
            />
          ) : null}
          {listLoading && !loading ? (
            <div className="card p-6">
              <PageLoader message="Loading list" size="md" />
            </div>
          ) : null}
          {!listLoading && listTotal > 0 ? (
            <>
              <ul className="grid gap-3" role="list">
                {items.map((c) => {
                  const hrefId = String(c.id).trim();
                  if (!hrefId) return null;
                  const href = `/dashboard/campaigns/${encodeURIComponent(hrefId)}`;
                  return <CampaignRow key={c.id} c={c} href={href} />;
                })}
              </ul>
              {listTotal > 0 && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-700 pt-1">
                  <p className="font-medium">
                    Showing {startRow}–{endRow} of {listTotal.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn-secondary text-sm h-9"
                      disabled={!canPrev || listLoading}
                      onClick={() => setListPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <span className="text-xs tabular-nums text-slate-600 px-1">
                      Page {listPage}
                    </span>
                    <button
                      type="button"
                      className="btn-secondary text-sm h-9"
                      disabled={!canNext || listLoading}
                      onClick={() => setListPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      <NewCampaignWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={() => {
          setWizardOpen(false);
          setListPage(1);
          setListQ("");
          setListQDeb("");
          setListStatus("all");
          setFromDate("");
          setToDate("");
          setListTick((t) => t + 1);
        }}
      />
    </div>
  );
}

/* ------------------------ List row ------------------------ */

/**
 * Whole-row link card. Status is shown as a coloured left bar, an animated dot, and a
 * pill — three redundant cues so the status reads instantly. Progress is a thin meter
 * showing completed recipients out of the total enrolled.
 */
function CampaignRow({ c, href }: { c: Campaign; href: string }) {
  const tone = campaignStatusTone(c.status);
  const total = c.recipient_count ?? c.progress?.total_recipients ?? 0;
  const completed = c.progress?.completed_recipients ?? 0;
  const active = c.progress?.active_recipients ?? 0;
  const stepCount = c.step_count ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isRunning = c.status === "running";
  const isPaused = c.status === "paused";

  return (
    <li>
      <Link
        href={href}
        prefetch={false}
        className="group relative block overflow-hidden rounded-2xl border border-slate-200/85 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-20px_rgba(15,23,42,0.16)] transition-all hover:shadow-card-hover hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-400/30 focus-visible:ring-offset-2"
      >
        {/* Status bar (left edge) */}
        <span
          className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`}
          aria-hidden
        />

        <div className="pl-5 sm:pl-6 pr-4 sm:pr-5 py-4 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              {/* Status row */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.pill}`}
                >
                  <span
                    className={`relative inline-flex h-1.5 w-1.5 rounded-full ${tone.dot}`}
                  >
                    {isRunning ? (
                      <span
                        className={`absolute inline-flex h-full w-full animate-ping rounded-full ${tone.dot} opacity-75`}
                      />
                    ) : null}
                  </span>
                  {tone.label}
                </span>
                {isPaused ? (
                  <span className="text-xs text-amber-800">
                    sends are on hold
                  </span>
                ) : null}
              </div>

              {/* Name */}
              <h2 className="mt-2 text-base sm:text-lg font-semibold tracking-tight text-slate-900 truncate">
                {c.name}
              </h2>

              {/* Meta line */}
              <p className="mt-1 text-xs text-slate-600 tabular-nums">
                {stepCount} step{stepCount === 1 ? "" : "s"}
                <span className="text-slate-300 mx-1.5">·</span>
                {total.toLocaleString()} {total === 1 ? "person" : "people"} enrolled
                {active > 0 ? (
                  <>
                    <span className="text-slate-300 mx-1.5">·</span>
                    <span className="text-slate-700">{active.toLocaleString()} in progress</span>
                  </>
                ) : null}
              </p>
            </div>

            {/* Right: chevron */}
            <span
              aria-hidden
              className="hidden sm:inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors group-hover:bg-slate-100 group-hover:text-slate-700"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 3l5 5-5 5"
                />
              </svg>
            </span>
          </div>

          {/* Progress meter — only when there are recipients */}
          {total > 0 ? (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Progress
                </span>
                <span className="text-xs font-semibold tabular-nums text-slate-700">
                  {completed.toLocaleString()} / {total.toLocaleString()}
                  <span className="text-slate-400 font-normal ml-1.5">
                    ({pct}%)
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    c.status === "finished"
                      ? "bg-slate-400"
                      : isPaused
                        ? "bg-amber-400"
                        : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
