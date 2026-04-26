"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ActiveReviewPlatformsStrip from "@/components/ActiveReviewPlatformsStrip";
import { getDashboardStats } from "@/lib/api";
import { activePlatformChips } from "@/lib/reviewPlatformsFromLocations";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import AnalyticsPageSkeleton from "@/components/skeletons/AnalyticsPageSkeleton";
import ImpactOverviewChart from "@/components/ImpactOverviewChart";
import StyledSelect from "@/components/StyledSelect";
import { useDashboardBootstrap } from "../DashboardBootstrapProvider";
import type { DashboardStats } from "@/types";

const PIE_COLORS = { email: "#0ea5e9", sms: "#8b5cf6" };

const STATUS_BAR_COLORS: Record<string, string> = {
  sent: "#0ea5e9",
  scheduled: "#94a3b8",
  failed: "#f87171",
  pending: "#a78bfa",
  cancelled: "#cbd5e1",
  queued: "#64748b",
};

const PLATFORM_CHART_COLOR = "#6366f1";

function pct(n: number, d: number): string {
  if (d <= 0) return "0";
  return Math.min(100, Math.round((n / d) * 100)).toString();
}

export default function AnalyticsPage() {
  const { bootstrap } = useDashboardBootstrap();
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const credits = bootstrap?.credits ?? null;
  const publicCfg = bootstrap?.config ?? null;
  const myRates = bootstrap?.credit_rates ?? null;
  const locations = bootstrap?.locations?.locations ?? [];

  useEffect(() => {
    let live = true;
    setError("");
    setLoading(true);
    getDashboardStats(days)
      .then((s) => {
        if (!live) return;
        setStats(s);
      })
      .catch((e) => {
        if (live) setError(e instanceof Error ? e.message : "Could not load analytics");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [days]);

  const sent = stats?.funnel.sent ?? 0;
  const view = stats?.funnel.view ?? 0;
  const googleClicks = stats?.funnel.click_google ?? 0;
  const feedback = stats?.funnel.submit_feedback ?? 0;
  const creditsUsed = stats?.credits_used ?? 0;

  const openRate = useMemo(
    () => (sent > 0 ? Math.min(100, Math.round((view / sent) * 100)) : null),
    [view, sent],
  );

  /** All message rows in the window (not only `sent`) so test/demo seeds show both email and SMS in the pie even before every row flips to sent. */
  const byChAll = stats?.messages_by_channel;
  const emailN = byChAll?.email ?? 0;
  const smsN = byChAll?.sms ?? 0;
  const channelPie = useMemo(() => {
    const rows: { name: string; value: number; fill: string }[] = [];
    if (emailN > 0) rows.push({ name: "Email", value: emailN, fill: PIE_COLORS.email });
    if (smsN > 0) rows.push({ name: "SMS", value: smsN, fill: PIE_COLORS.sms });
    return rows;
  }, [emailN, smsN]);

  const ratingData = useMemo(() => {
    if (!stats?.rating_distribution) return [];
    return [5, 4, 3, 2, 1].map((r) => ({
      stars: `${r}★`,
      count: stats.rating_distribution[String(r)] || 0,
    }));
  }, [stats?.rating_distribution]);

  const statusBarData = useMemo(() => {
    if (!stats?.messages_by_status) return [];
    return orderStatusKeys(stats.messages_by_status).map((key) => ({
      key,
      name: formatStatusLabel(key),
      value: stats.messages_by_status[key] ?? 0,
      fill: STATUS_BAR_COLORS[key] ?? "#94a3b8",
    }));
  }, [stats?.messages_by_status]);

  const sentChannelPie = useMemo(() => {
    if (!stats?.messages_by_channel_sent) return [];
    const rows: { name: string; value: number; fill: string }[] = [];
    const e = stats.messages_by_channel_sent["email"] ?? 0;
    const s = stats.messages_by_channel_sent["sms"] ?? 0;
    if (e > 0) rows.push({ name: "Email (sent)", value: e, fill: PIE_COLORS.email });
    if (s > 0) rows.push({ name: "SMS (sent)", value: s, fill: PIE_COLORS.sms });
    return rows;
  }, [stats?.messages_by_channel_sent]);

  const platformBarData = useMemo(() => {
    const o = stats?.outbound_clicks_by_platform;
    if (!o || Object.keys(o).length === 0) return [];
    return Object.entries(o)
      .map(([k, v]) => ({
        name: formatPlatformLabel(k),
        value: v,
      }))
      .sort((a, b) => b.value - a.value);
  }, [stats?.outbound_clicks_by_platform]);

  const tapRate = useMemo(
    () => (sent > 0 ? Math.min(100, Math.round((googleClicks / sent) * 100)) : null),
    [googleClicks, sent],
  );
  const feedbackFromSendRate = useMemo(
    () => (sent > 0 ? Math.min(100, Math.round((feedback / sent) * 100)) : null),
    [feedback, sent],
  );
  const creditsPerSend = useMemo(
    () => (sent > 0 ? creditsUsed / sent : null),
    [creditsUsed, sent],
  );

  const platformChips = useMemo(
    () => activePlatformChips(locations, publicCfg),
    [locations, publicCfg],
  );

  if (!loading && (error || !stats)) {
    return (
      <div className="w-full min-w-0 space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error || "No data"}</div>
        <Link href="/dashboard" className="inline-block text-sm font-medium text-brand-600 hover:text-brand-800">
          ← Back to overview
        </Link>
      </div>
    );
  }

  const emailUnit =
    myRates?.email_credits && myRates.email_credits > 0
      ? myRates.email_credits
      : publicCfg?.email_credits && publicCfg.email_credits > 0
        ? publicCfg.email_credits
        : 1;

  return (
    <div className="w-full min-w-0 space-y-8 pb-10">
      <DashboardPageHeader
        eyebrow="Deep dive"
        title="Analytics"
        credits={credits != null ? credits.balance : undefined}
        description={
          <>
            <p className="line-clamp-2 max-w-3xl text-slate-600">
              Pipeline, channels, and routing events for the report period.{" "}
              <Link href="/dashboard" className="font-medium text-brand-600 hover:text-brand-800">
                Overview
              </Link>{" "}
              keeps the headline KPIs and a simple send → open → tap walkthrough.
            </p>
            <Link href="/dashboard" className="mt-2 inline-flex text-sm font-medium text-brand-600 hover:text-brand-800">
              ← Back to overview
            </Link>
          </>
        }
        info={{
          label: "What you see here",
          size: "md",
          children: (
            <p>
              <strong>Overview</strong> shows the three ROI-style cards and a compact journey. <strong>Analytics</strong>{" "}
              adds message <strong>status</strong> counts, <strong>per-store</strong> activity when you have
              locations, <strong>sent-only</strong> channel mix, and <strong>review-link taps by site</strong> when
              available, plus the funnel bar chart and in-app star distribution.
            </p>
          ),
        }}
        end={
        <div className="w-full sm:w-44">
          <label className="label" htmlFor="analytics-range">
            Report period
          </label>
          <StyledSelect
            id="analytics-range"
            value={String(days)}
            onChange={(e) => setDays(Number(e.target.value))}
            disabled={loading}
            className={loading ? "opacity-70" : ""}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </StyledSelect>
        </div>
        }
      />

      {publicCfg && !loading && <ActiveReviewPlatformsStrip platforms={platformChips} className="max-w-3xl" />}

      {loading ? (
        <AnalyticsPageSkeleton />
      ) : (
        stats && (
        <>
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-900">Period totals</h2>
        <p className="text-xs text-slate-500 mt-0.5 mb-3">Raw counts in the window. Headline rates are on Overview.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <AnalyticsMiniStat label="Message rows" value={stats.messages_total} />
          <AnalyticsMiniStat label="Sends" value={sent} />
          <AnalyticsMiniStat label="Google taps" value={googleClicks} />
          <AnalyticsMiniStat label="Private notes" value={feedback} />
        </div>
      </div>

      {stats.store_performance && stats.store_performance.length > 0 && (
        <div className="card p-0 overflow-x-auto">
          <div className="p-5 sm:p-6 border-b border-slate-200/50">
            <h2 className="text-sm font-semibold text-slate-900">By store</h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              {stats.multi_location
                ? "Attributed from each message's store (or the routing page linked to that message). Rows with no store stay in Unassigned when you run multiple locations—set a store on the contact or send so numbers land in the right column."
                : "This row mirrors your business location; add a second store under Settings to compare sites side by side."}
            </p>
          </div>
          <div className="min-w-[720px]">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-600 text-xs font-medium uppercase tracking-wide">
                  <th className="px-4 sm:px-5 py-3 pr-2">Store</th>
                  <th className="px-2 py-3 text-right tabular-nums">Rows</th>
                  <th className="px-2 py-3 text-right tabular-nums">Sends</th>
                  <th className="px-2 py-3 text-right tabular-nums">Credits</th>
                  <th className="px-2 py-3 text-right tabular-nums">Opens</th>
                  <th className="px-2 py-3 text-right tabular-nums">Google</th>
                  <th className="px-2 py-3 text-right tabular-nums">Other</th>
                  <th className="px-4 sm:px-5 py-3 text-right tabular-nums pl-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/90">
                {stats.store_performance.map((row) => (
                  <tr key={row.location_id} className="text-slate-800">
                    <td className="px-4 sm:px-5 py-3 font-medium pr-2">{row.name}</td>
                    <td className="px-2 py-3 text-right tabular-nums text-slate-700">{row.messages_total}</td>
                    <td className="px-2 py-3 text-right tabular-nums text-slate-700">{row.sends}</td>
                    <td className="px-2 py-3 text-right tabular-nums text-slate-700">{row.credits_used}</td>
                    <td className="px-2 py-3 text-right tabular-nums text-slate-700">{row.view}</td>
                    <td className="px-2 py-3 text-right tabular-nums text-slate-700">{row.click_google}</td>
                    <td className="px-2 py-3 text-right tabular-nums text-slate-700">{row.click_outbound}</td>
                    <td className="px-4 sm:px-5 py-3 text-right tabular-nums text-slate-700 pl-2">{row.submit_feedback}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {statusBarData.length > 0 && (
        <div className="card p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-900">Message status pipeline</h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            All review-request rows in this period, grouped by status (scheduled, sent, failed, and more if present).
          </p>
          <div className="h-64 w-full min-w-0 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBarData} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={88}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                  formatter={(v) => {
                    const n = Number(v ?? 0);
                    return [`${n} row${n === 1 ? "" : "s"}`, ""];
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Count">
                  {statusBarData.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-900">Journey from sends</h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">Routing page events: opens, Google / other site taps, private notes.</p>
          <ImpactOverviewChart stats={stats} />
        </div>

        <div className="card p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-900">Per-send efficiency</h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">Derived from sends and credit debits in this period.</p>
          <ul className="space-y-3 text-sm text-slate-700">
            <li className="flex justify-between gap-3 border-b border-slate-100 pb-2.5">
              <span>Link open rate (of sends)</span>
              <span className="font-semibold tabular-nums text-slate-900">
                {sent > 0 ? `${openRate ?? 0}%` : "—"}
              </span>
            </li>
            <li className="flex justify-between gap-3 border-b border-slate-100 pb-2.5">
              <span>Google tap rate (of sends)</span>
              <span className="font-semibold tabular-nums text-slate-900">
                {sent > 0 ? `${tapRate ?? 0}%` : "—"}
              </span>
            </li>
            <li className="flex justify-between gap-3 border-b border-slate-100 pb-2.5">
              <span>Private note rate (of sends)</span>
              <span className="font-semibold tabular-nums text-slate-900">
                {sent > 0 ? `${feedbackFromSendRate ?? 0}%` : "—"}
              </span>
            </li>
            <li className="flex justify-between gap-3">
              <span>Avg. credits per delivered send</span>
              <span className="font-semibold tabular-nums text-slate-900">
                {creditsPerSend != null ? (creditsPerSend < 10 ? creditsPerSend.toFixed(2) : creditsPerSend.toFixed(1)) : "—"}
                {creditsPerSend != null ? " cr" : ""}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5 sm:p-6 min-h-[300px]">
          <h2 className="text-sm font-semibold text-slate-900">All message rows by channel</h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-2">Email vs SMS in this range (queued, scheduled, sent, failed, …).</p>
          {channelPie.length > 0 ? (
            <div className="h-56 w-full min-w-0 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {channelPie.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                    formatter={(v) => {
                      const n = Number(v ?? 0);
                      return [`${n} message${n === 1 ? "" : "s"}`, ""];
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-8">No message rows in this range yet.</p>
          )}
        </div>

        <div className="card p-5 sm:p-6 min-h-[300px]">
          <h2 className="text-sm font-semibold text-slate-900">Delivered sends by channel</h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-2">Only successful sends (credits were charged for these rows).</p>
          {sentChannelPie.length > 0 ? (
            <div className="h-56 w-full min-w-0 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentChannelPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {sentChannelPie.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                    formatter={(v) => {
                      const n = Number(v ?? 0);
                      return [`${n} send${n === 1 ? "" : "s"}`, ""];
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-500 py-8">No delivered sends in this range yet.</p>
          )}
        </div>
      </div>

      {platformBarData.length > 0 && (
        <div className="card p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-slate-900">Review link taps by site</h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            When a customer taps a review destination from your routing page (Google, Yelp, Facebook, …) we attribute it
            to the business location when the link carries that tag.
          </p>
          <div className="h-64 w-full min-w-0 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={platformBarData}
                layout="vertical"
                margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                <Bar dataKey="value" name="Taps" fill={PLATFORM_CHART_COLOR} fillOpacity={0.88} radius={[0, 4, 4, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900">Wallet &amp; spend in this period</h2>
        {credits && (
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li className="flex justify-between border-b border-slate-100 pb-2">
              <span>Credits debited (delivered sends)</span>
              <span className="font-semibold tabular-nums text-slate-900">{creditsUsed} cr</span>
            </li>
            <li className="flex justify-between">
              <span>Google taps (routing)</span>
              <span className="font-semibold tabular-nums text-slate-900">{googleClicks}</span>
            </li>
          </ul>
        )}
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          Email is typically {emailUnit} credit{emailUnit === 1 ? "" : "s"} per send; SMS depends on segments.{" "}
          <Link href="/dashboard/billing" className="font-medium text-brand-600 hover:text-brand-800">
            Open billing
          </Link>{" "}
          to add credits or see rates.
        </p>
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900">Private feedback (in-app)</h2>
        <p className="text-xs text-slate-500 mt-0.5 mb-4">Not Google stars — your internal form.</p>
        {ratingData.some((d) => d.count > 0) ? (
          <div className="h-56 w-full min-w-0 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingData} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis
                  dataKey="stars"
                  type="category"
                  width={40}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
                <Bar dataKey="count" fill="#6366f1" fillOpacity={0.85} radius={[0, 4, 4, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No in-app ratings in this period yet.</p>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Funnel: send → open link → Google tap, plus optional private note.{" "}
        {sent > 0 ? (
          <>
            Opened {openRate ?? 0}% of sends, {pct(googleClicks, sent)}% tapped Google.{" "}
          </>
        ) : null}
        Window: last {stats.window_days ?? days} days.
      </p>
    </>
        )
      ) }
    </div>
  );
}

function formatStatusLabel(key: string): string {
  return key
    .split(/[_-]+/)
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p))
    .join(" ");
}

function formatPlatformLabel(key: string): string {
  const k = key.trim();
  if (!k) return "Other";
  const l = k.toLowerCase();
  if (l === "google" || l === "g") return "Google";
  if (l === "yelp") return "Yelp";
  if (l === "facebook" || l === "fb") return "Facebook";
  if (l === "tripadvisor") return "TripAdvisor";
  return formatStatusLabel(k);
}

function orderStatusKeys(raw: Record<string, number>): string[] {
  const order = ["sent", "scheduled", "failed", "pending", "cancelled", "queued", "delivered", "bounced", "undeliverable"];
  const out: string[] = [];
  const used = new Set<string>();
  for (const o of order) {
    if (Object.prototype.hasOwnProperty.call(raw, o)) {
      out.push(o);
      used.add(o);
    }
  }
  for (const k of Object.keys(raw).sort()) {
    if (!used.has(k)) out.push(k);
  }
  return out;
}

function AnalyticsMiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-3 py-2.5">
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 leading-tight">{label}</div>
      <div className="text-xl font-semibold text-slate-900 tabular-nums mt-0.5">{value}</div>
    </div>
  );
}
