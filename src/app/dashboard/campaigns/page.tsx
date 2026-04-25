"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSequence, getSessionBootstrap, listCampaigns, listSequences } from "@/lib/api";
import { shortDate } from "@/app/dashboard/contacts/_components/contactFormat";
import EnrollInCampaignDialog from "@/app/dashboard/contacts/_components/EnrollInCampaignDialog";
import ActiveReviewPlatformsStrip from "@/components/ActiveReviewPlatformsStrip";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import InfoTip from "@/components/InfoTip";
import { ButtonSpinner, useAppToast } from "@/components/ToastProvider";
import PageLoader from "@/components/PageLoader";
import { countrySupportsSms, getSmsSupportedList } from "@/lib/countryUi";
import { activePlatformChips } from "@/lib/reviewPlatformsFromLocations";
import type {
  Business,
  BusinessLocation,
  Campaign,
  PublicConfig,
  ReviewSequence,
  ReviewSequenceLinkStyle,
  ReviewSequenceListStatus,
} from "@/types";

const PAGE_SIZE = 20;

function listStatusLabel(s: ReviewSequenceListStatus) {
  if (s === "running") return "Running";
  if (s === "paused") return "Paused";
  return "Completed";
}

function listStatusPillClass(s: ReviewSequenceListStatus) {
  if (s === "running") return "bg-emerald-100 text-emerald-900";
  if (s === "paused") return "bg-amber-100 text-amber-900";
  return "bg-slate-200 text-slate-700";
}

export default function ActiveCampaignsPage() {
  const [items, setItems] = useState<ReviewSequence[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [listPage, setListPage] = useState(1);
  const [listQ, setListQ] = useState("");
  const [listQDeb, setListQDeb] = useState("");
  const [listStatus, setListStatus] = useState<"all" | "running" | "paused" | "completed">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [templates, setTemplates] = useState<Campaign[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [biz, setBiz] = useState<Business | null>(null);
  const [cfg, setCfg] = useState<PublicConfig | null>(null);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [editing, setEditing] = useState<"new" | null>(null);
  const [enrollFor, setEnrollFor] = useState<string | null>(null);
  const [formName, setFormName] = useState("Review campaign");
  const [formActive, setFormActive] = useState(true);
  const [formSteps, setFormSteps] = useState<
    { campaign_id: string; delay_after_previous_minutes: number }[]
  >([{ campaign_id: "", delay_after_previous_minutes: 60 }]);
  const [formLocationId, setFormLocationId] = useState<string>("");
  const [formLinkStyle, setFormLinkStyle] = useState<ReviewSequenceLinkStyle>("hosted");
  const [saving, setSaving] = useState(false);
  const [listTick, setListTick] = useState(0);
  const [displayTimeZone, setDisplayTimeZone] = useState("UTC");
  const toast = useAppToast();

  useEffect(() => {
    const t = setTimeout(() => setListQDeb(listQ), 300);
    return () => clearTimeout(t);
  }, [listQ]);

  useEffect(() => {
    setListPage(1);
  }, [listQDeb, listStatus, fromDate, toDate]);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const [c, boot] = await Promise.all([listCampaigns(), getSessionBootstrap()]);
      setTemplates(c.campaigns);
      setBiz(boot.business);
      setCfg(boot.config);
      setCredits(boot.credits?.balance ?? 0);
      setLocations(boot.locations?.locations ?? []);
      setDisplayTimeZone(boot.display_timezone || boot.business?.timezone || "UTC");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSequences = useCallback(async () => {
    setListLoading(true);
    try {
      const s = await listSequences({
        page: listPage,
        pageSize: PAGE_SIZE,
        q: listQDeb.trim() || undefined,
        status: listStatus,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setItems(s.sequences);
      setListTotal(s.total);
    } catch {
      setItems([]);
      setListTotal(0);
    } finally {
      setListLoading(false);
    }
  }, [listPage, listQDeb, listStatus, fromDate, toDate, listTick]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    void loadSequences();
  }, [loadSequences]);

  function newCampaign() {
    setEditing("new");
    setFormName("New campaign");
    setFormActive(true);
    setFormLinkStyle("hosted");
    const fromDefault = biz?.default_location_id
      ? locations.find((l) => l.id === biz.default_location_id)
      : null;
    const def = fromDefault || locations[0] || null;
    setFormLocationId(def?.id || "");
    setFormSteps([{ campaign_id: templates[0]?.id || "", delay_after_previous_minutes: 60 }]);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Campaign name is required.");
      return;
    }
    if (formSteps.length === 0) {
      toast.error("Add at least one step to the campaign.");
      return;
    }
    for (const st of formSteps) {
      if (!st.campaign_id) {
        toast.error("Pick a message template for every step.");
        return;
      }
    }
    const loc = formLocationId.trim() || null;
    if ((formLinkStyle === "direct_google" || formLinkStyle === "direct_yelp") && !loc) {
      toast.error(
        "Pick a store for this campaign to use a direct Google or Yelp link, or use the single Review page link style.",
      );
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        is_active: formActive,
        location_id: loc,
        review_link_style: formLinkStyle,
        steps: formSteps.map((s) => ({ ...s })),
      };
      await createSequence(payload);
      setEditing(null);
      setListPage(1);
      setListQ("");
      setListQDeb("");
      setListStatus("all");
      setFromDate("");
      setToDate("");
      setListTick((t) => t + 1);
      toast.success("Campaign created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create campaign");
    } finally {
      setSaving(false);
    }
  }

  const sms = !!biz && (cfg ? countrySupportsSms(biz.country_code, getSmsSupportedList(cfg)) : true);
  const platformChips = useMemo(() => activePlatformChips(locations, cfg), [locations, cfg]);
  const enrollCampaignName = enrollFor ? items.find((c) => c.id === enrollFor)?.name || "Campaign" : "";
  const hasListFilters = Boolean(listQDeb.trim() || fromDate || toDate || listStatus !== "all");
  const startRow = listTotal === 0 ? 0 : (listPage - 1) * PAGE_SIZE + 1;
  const endRow = (listPage - 1) * PAGE_SIZE + items.length;
  const canPrev = listPage > 1;
  const canNext = listPage * PAGE_SIZE < listTotal;

  return (
    <div className="space-y-6 w-full min-w-0">
      <DashboardPageHeader
        eyebrow="Follow-ups"
        title="Campaigns"
        credits={credits != null ? credits : undefined}
        description={
          <p className="line-clamp-2">
            Set up a sequence once, then use the detail view to see progress. After a campaign is created, it can't
            be edited or deleted; you can <strong>pause</strong> it to block new people and new follow-up steps
            (what's already scheduled will still send).
          </p>
        }
        info={{
          label: "Follow-up rules",
          size: "md",
          children: (
            <p>
              A campaign is built from your{" "}
              <Link href="/dashboard/templates" className="font-medium text-brand-600 hover:underline">
                message templates
              </Link>
              . Open any campaign to see people, step counts, replies, and scheduled sends. Pausing does not remove
              pending sends. Use{" "}
              <Link href="/dashboard/analytics" className="font-medium text-brand-600 hover:underline">
                Analytics
              </Link>{" "}
              for deeper history.
            </p>
          ),
        }}
        end={
          <button type="button" onClick={newCampaign} className="btn-primary shrink-0 w-full sm:w-fit min-h-10">
            New campaign
          </button>
        }
      />

      {cfg && <ActiveReviewPlatformsStrip platforms={platformChips} className="max-w-3xl" />}

      <div
        className="flex items-center gap-2 overflow-visible rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-2.5 sm:px-4 text-amber-950/90"
        role="status"
      >
        <p className="text-sm font-medium min-w-0">Open a campaign for the full picture — steps, people, and outcomes.</p>
        <InfoTip label="Pause and scheduling" size="md">
          <p>
            "Pause" turns off the campaign: no new enrollments and we won't schedule the next follow-up for anyone. Any
            email/SMS rows that are already scheduled in the system will still be delivered. You can resume later; you
            still can't change the message steps once created.
          </p>
        </InfoTip>
      </div>

      {!loading && !editing && (
        <div className="card p-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-4 sm:gap-y-2">
            <div className="min-w-0 sm:flex-1 sm:max-w-xs">
              <label className="text-[10px] font-medium uppercase tracking-wide text-slate-500" htmlFor="cmp-q">
                Name
              </label>
              <input
                id="cmp-q"
                className="input mt-0.5 w-full h-9 text-sm"
                placeholder="Search by campaign name…"
                value={listQ}
                onChange={(e) => setListQ(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-wide text-slate-500" htmlFor="cmp-status">
                Status
              </label>
              <select
                id="cmp-status"
                className="input mt-0.5 w-full h-9 text-sm min-w-[160px]"
                value={listStatus}
                onChange={(e) => setListStatus(e.target.value as "all" | "running" | "paused" | "completed")}
              >
                <option value="all">All</option>
                <option value="running">Running</option>
                <option value="paused">Paused (people in progress)</option>
                <option value="completed">Off &amp; idle</option>
              </select>
            </div>
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 block">Created (your time zone)</span>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <input
                  type="date"
                  className="input h-9 text-sm w-full sm:w-auto"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  aria-label="Created on or after"
                />
                <span className="text-slate-400">–</span>
                <input
                  type="date"
                  className="input h-9 text-sm w-full sm:w-auto"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  aria-label="Created on or before"
                />
              </div>
            </div>
            {hasListFilters && (
              <div className="sm:ml-auto">
                <button
                  type="button"
                  className="btn-ghost text-sm h-9"
                  onClick={() => {
                    setListQ("");
                    setListQDeb("");
                    setListStatus("all");
                    setFromDate("");
                    setToDate("");
                    setListPage(1);
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500">
            <strong>Running</strong> is on. <strong>Paused</strong> is off with people still in the sequence.{" "}
            <strong>Off &amp; idle</strong> is off and nobody in progress. The date range uses calendar days in your business
            time zone (from Settings), matching when each campaign was created.
          </p>
        </div>
      )}

      {editing && (
        <form onSubmit={submitForm} className="card p-5 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">New campaign</h2>
          <p className="text-sm text-slate-600">You can't change steps or the store link mode after you save. Pause the campaign if you need to prevent new work.</p>
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} />
            Start as running (you can pause from the campaign page later)
          </label>
          <div className="space-y-2">
            <label className="label">Store (review links)</label>
            <p className="text-xs text-slate-500 -mt-0.5">
              This follow-up only uses the Google / Yelp (and other) links for the store you select. Configure stores
              under <Link href="/dashboard/settings" className="text-brand-600 font-medium hover:underline">Settings</Link>.
            </p>
            <select
              className="input"
              value={formLocationId}
              onChange={(e) => setFormLocationId(e.target.value)}
            >
              <option value="">Auto (template or contact, then your default store)</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="label">What goes in <code className="text-xs bg-slate-100 px-1 rounded">{"{link}"}</code> in your templates</label>
            <select
              className="input"
              value={formLinkStyle}
              onChange={(e) => setFormLinkStyle(e.target.value as ReviewSequenceLinkStyle)}
            >
              <option value="hosted">Review page (all options, private feedback) — default</option>
              <option value="direct_google">One-tap: Google (tracked) for this store</option>
              <option value="direct_yelp">One-tap: Yelp (tracked) for this store</option>
            </select>
            <p className="text-xs text-slate-500">
              You can also use <code className="bg-slate-100 px-0.5 rounded">{"{link_google}"}</code> and{" "}
              <code className="bg-slate-100 px-0.5 rounded">{"{link_yelp}"}</code> in a template. Direct links and the
              Review page are chosen when the message is sent, using the store above.
            </p>
            {(formLinkStyle === "direct_google" || formLinkStyle === "direct_yelp") && !formLocationId.trim() && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
                Choose a store above so we know which Google or Yelp link to use.
              </p>
            )}
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-800">Steps (order = send order)</p>
            {formSteps.map((s, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row gap-2 sm:items-end rounded-lg border border-slate-200 p-3 bg-slate-50/50"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-500">Template {i + 1} (email or SMS)</span>
                  <select
                    className="input mt-1"
                    value={s.campaign_id}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFormSteps((prev) => {
                        const n = [...prev];
                        n[i] = { ...n[i], campaign_id: v };
                        return n;
                      });
                    }}
                    required
                  >
                    <option value="" disabled>
                      Select template…
                    </option>
                    {templates
                      .filter((t) => t.channel === "email" || (t.channel === "sms" && sms))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.channel})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="w-full sm:w-32">
                  <span className="text-xs text-slate-500">
                    {i === 0 ? "First send in (min)" : "Then after (min)"}
                  </span>
                  <input
                    type="number"
                    className="input mt-1"
                    min={0}
                    max={20160}
                    value={s.delay_after_previous_minutes}
                    onChange={(e) => {
                      const n = Number(e.target.value) || 0;
                      setFormSteps((prev) => {
                        const a = [...prev];
                        a[i] = { ...a[i], delay_after_previous_minutes: n };
                        return a;
                      });
                    }}
                  />
                </div>
                {formSteps.length > 1 && (
                  <button
                    type="button"
                    className="text-sm text-red-600 h-9"
                    onClick={() => setFormSteps((prev) => prev.filter((_, j) => j !== i))}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {formSteps.length < 8 && (
              <button
                type="button"
                className="text-sm text-brand-700 font-medium"
                onClick={() => setFormSteps((p) => [...p, { campaign_id: "", delay_after_previous_minutes: 1440 }])}
              >
                + Add follow-up step
              </button>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setEditing(null);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary inline-flex items-center justify-center gap-2"
              disabled={saving || templates.length === 0}
            >
              {saving ? (
                <>
                  <ButtonSpinner />
                  Creating…
                </>
              ) : (
                "Create campaign"
              )}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="card p-12">
          <PageLoader message="Loading campaigns" size="md" />
        </div>
      ) : listTotal === 0 && !hasListFilters && !editing && !listLoading ? (
        <div className="card p-8 text-sm text-slate-600 text-center">
          No campaigns yet. Create message templates, then a multi-step campaign. Open a campaign to see details, or
          <Link className="text-brand-600 font-medium mx-1" href="/dashboard/contacts">enroll from People</Link> when
          a campaign is running.
        </div>
      ) : !editing ? (
        <div className="space-y-3">
          {listTotal === 0 && hasListFilters && !listLoading ? (
            <div className="card p-6 text-sm text-slate-600 text-center">No campaigns match your filters. Try a different name, status, or date range.</div>
          ) : null}
          {listLoading && !loading ? (
            <div className="card p-6">
              <PageLoader message="Loading list" size="md" />
            </div>
          ) : null}
          {!listLoading && listTotal > 0 ? (
            <>
              <ul className="space-y-3" role="list" aria-busy={listLoading}>
                {items.map((c) => {
                  const hrefId = String(c.id).trim();
                  if (!hrefId) return null;
                  const href = `/dashboard/campaigns/${encodeURIComponent(hrefId)}`;
                  const ls: ReviewSequenceListStatus =
                    c.list_status ?? (c.is_active ? "running" : c.active_enrollments > 0 ? "paused" : "completed");
                  return (
                    <li key={c.id} className="card p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
                        <Link
                          href={href}
                          prefetch={false}
                          className="group min-w-0 flex flex-1 sm:flex-row sm:items-center sm:justify-between gap-3 -m-1 p-1 rounded-xl text-left
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 focus-visible:ring-offset-2
                            sm:-m-0 sm:p-0 sm:rounded-none sm:focus-visible:ring-0 sm:focus-visible:ring-offset-0"
                        >
                          <div className="min-w-0 sm:flex-1 sm:pr-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-900 text-lg group-hover:text-brand-800 group-hover:underline">
                                {c.name}
                              </span>
                              <span className={`pill ${listStatusPillClass(ls)}`}>{listStatusLabel(ls)}</span>
                            </div>
                            <p className="text-sm text-slate-600 mt-0.5">
                              {c.step_count} step{c.step_count === 1 ? "" : "s"} · {c.active_enrollments} in progress
                              {c.review_link_style && c.review_link_style !== "hosted" && (
                                <span>
                                  {" "}
                                  · {c.review_link_style === "direct_google" ? "Link: Google" : c.review_link_style === "direct_yelp" ? "Link: Yelp" : null}
                                </span>
                              )}
                              {c.created_at && (
                                <span className="text-slate-500">
                                  {" "}
                                  · created {shortDate(c.created_at, displayTimeZone)}
                                </span>
                              )}
                            </p>
                          </div>
                          <span className="inline-flex shrink-0 self-start sm:self-center items-center btn-primary text-sm w-fit">
                            Open
                          </span>
                        </Link>
                        {c.is_active && (
                          <button
                            type="button"
                            className="btn-secondary text-sm shrink-0 self-start sm:self-center"
                            onClick={() => setEnrollFor(c.id === enrollFor ? null : c.id)}
                          >
                            Add people
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {listTotal > 0 && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-600">
                  <p>
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
                    <span className="text-xs tabular-nums text-slate-500">Page {listPage}</span>
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
      ) : null}

      {enrollFor && (
        <EnrollInCampaignDialog
          open
          onOpenChange={(o) => {
            if (!o) setEnrollFor(null);
          }}
          sequenceId={enrollFor}
          campaignName={enrollCampaignName}
          onEnrolled={() => {
            setListTick((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}
