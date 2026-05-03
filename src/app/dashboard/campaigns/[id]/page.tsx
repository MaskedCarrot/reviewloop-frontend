"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  activateCampaign,
  getCampaign,
  listCampaignRecipients,
  pauseCampaign,
  resumeCampaign,
} from "@/lib/api";
import PageLoader from "@/components/PageLoader";
import PauseCampaignConfirmDialog from "../_components/PauseCampaignConfirmDialog";
import NewCampaignWizard, { type CampaignPrefill } from "../_components/NewCampaignWizard";
import {
  campaignStatusTone,
  recipientStatusPillClass,
  statusLabel,
} from "../_lib/campaignUi";
import type { Campaign, CampaignRecipient, CampaignStep } from "@/types";

const PEOPLE_PAGE_SIZE = 25;

function fmtDelay(minutes: number): string {
  if (minutes === 0) return "immediately";
  if (minutes < 60) return `${minutes}m`;
  if (minutes % 1440 === 0) return `${minutes / 1440}d`;
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  return `${Math.round(minutes / 60)}h`;
}

type StepState = "completed" | "running" | "upcoming";

function computeStepStates(steps: CampaignStep[], campaign: Campaign): StepState[] {
  const { status } = campaign;
  if (status === "scheduled") return steps.map(() => "upcoming");
  if (status === "finished") return steps.map(() => "completed");
  if (!campaign.started_at) return steps.map(() => "upcoming");

  const startMs = new Date(campaign.started_at).getTime();
  let pausedMs = (campaign.total_paused_seconds ?? 0) * 1000;
  if (status === "paused" && campaign.paused_at) {
    pausedMs += Date.now() - new Date(campaign.paused_at).getTime();
  }
  const effectiveElapsedMs = Date.now() - startMs - pausedMs;

  let cumMs = 0;
  let lastFiredIdx = -1;
  for (let i = 0; i < steps.length; i++) {
    cumMs += steps[i].delay_minutes * 60 * 1000;
    if (effectiveElapsedMs >= cumMs) lastFiredIdx = i;
  }

  return steps.map((_, i) => {
    if (i < lastFiredIdx) return "completed";
    if (i === lastFiredIdx) return "running";
    return "upcoming";
  });
}

function shortDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = (typeof params.id === "string" ? params.id : "").trim();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [allRecipients, setAllRecipients] = useState<CampaignRecipient[]>([]);
  const [recipTotal, setRecipTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState<string | null>(null);

  const [toggling, setToggling] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [pauseError, setPauseError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardPrefill, setWizardPrefill] = useState<CampaignPrefill | undefined>();
  const [cloneLoading, setCloneLoading] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [peoplePage, setPeoplePage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQ(searchInput);
      setPeoplePage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadCore = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrored(null);
    try {
      const [c, r] = await Promise.all([
        getCampaign(id),
        listCampaignRecipients(id, { page: 1, pageSize: 500 }),
      ]);
      setCampaign(c);
      setAllRecipients(r.recipients);
      setRecipTotal(r.total);
    } catch (e) {
      setErrored(e instanceof Error ? e.message : "Could not load campaign");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  const filteredRecipients = useMemo(() => {
    const q = searchQ.toLowerCase().trim();
    if (!q) return allRecipients;
    return allRecipients.filter(
      (r) =>
        r.contact.name?.toLowerCase().includes(q) ||
        r.contact.email?.toLowerCase().includes(q) ||
        r.contact.phone_e164?.includes(q),
    );
  }, [allRecipients, searchQ]);

  const pageCount = Math.ceil(filteredRecipients.length / PEOPLE_PAGE_SIZE);
  const pageRecipients = filteredRecipients.slice(
    (peoplePage - 1) * PEOPLE_PAGE_SIZE,
    peoplePage * PEOPLE_PAGE_SIZE,
  );

  async function openCloneWizard() {
    if (!campaign) return;
    setCloneLoading(true);
    try {
      const contactIds = allRecipients.map((r) => r.contact.id);
      const prefillSteps =
        campaign.steps?.map((s) => {
          const m = s.delay_minutes;
          if (m > 0 && m % 1440 === 0)
            return { template_id: s.template_id, delay_value: m / 1440, delay_unit: "days" as const };
          if (m > 0 && m % 60 === 0)
            return { template_id: s.template_id, delay_value: m / 60, delay_unit: "hours" as const };
          return { template_id: s.template_id, delay_value: m, delay_unit: "minutes" as const };
        }) ?? [];
      setWizardPrefill({
        name: `Copy of ${campaign.name}`,
        location_id: campaign.location_id,
        steps: prefillSteps,
        contact_ids: contactIds,
      });
      setWizardOpen(true);
    } finally {
      setCloneLoading(false);
    }
  }

  if (!id) return null;

  const isRunning = campaign?.status === "running";
  const isPaused = campaign?.status === "paused";
  const isFinished = campaign?.status === "finished";
  const isScheduled = campaign?.status === "scheduled";

  const steps = campaign?.steps ?? [];
  const stepStates = campaign ? computeStepStates(steps, campaign) : [];
  const totalPeople = recipTotal || campaign?.recipient_count || 0;
  const progress = campaign?.progress;
  const completedRecips = progress?.completed_recipients ?? 0;
  const activeRecips = progress?.active_recipients ?? 0;
  const tone = campaign ? campaignStatusTone(campaign.status) : null;

  return (
    <div className="space-y-6 w-full min-w-0">
      <Link
        href="/dashboard/campaigns"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors w-fit"
      >
        <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" aria-hidden>
          <path
            d="M10 3L5 8l5 5"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to campaigns
      </Link>

      {loading ? (
        <div className="card p-12">
          <PageLoader message="Loading campaign" size="md" />
        </div>
      ) : errored ? (
        <div className="card p-6 text-sm text-slate-700">
          {errored}
          <button
            type="button"
            className="btn-ghost block mt-3"
            onClick={() => router.push("/dashboard/campaigns")}
          >
            Back
          </button>
        </div>
      ) : !campaign || !tone ? null : (
        <>
          {/* ── Hero ── */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
            {/* Top status bar */}
            <span className={`block h-1.5 w-full ${tone.bar}`} aria-hidden />

            <div className="p-5 sm:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                {/* Left: status + title + meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.pill}`}
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
                    {progress?.next_scheduled_at && (isRunning || isPaused) ? (
                      <span className="text-xs text-slate-600">
                        Next send {shortDateTime(progress.next_scheduled_at)}
                      </span>
                    ) : null}
                  </div>

                  <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 truncate">
                    {campaign.name}
                  </h1>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 tabular-nums">
                    <span>
                      {steps.length} step{steps.length === 1 ? "" : "s"}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span>
                      {totalPeople.toLocaleString()}{" "}
                      {totalPeople === 1 ? "person" : "people"} enrolled
                    </span>
                    {campaign.started_at ? (
                      <>
                        <span className="text-slate-300">·</span>
                        <span>Started {shortDateTime(campaign.started_at)}</span>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap lg:justify-end">
                  {isScheduled && (
                    <button
                      type="button"
                      className="btn-primary text-sm h-10 px-5"
                      disabled={activating}
                      onClick={async () => {
                        setActivateError(null);
                        setActivating(true);
                        try {
                          await activateCampaign(id);
                          await loadCore();
                        } catch (e) {
                          setActivateError(
                            e instanceof Error ? e.message : "Could not activate campaign",
                          );
                        } finally {
                          setActivating(false);
                        }
                      }}
                    >
                      {activating ? "Starting…" : "Start now"}
                    </button>
                  )}
                  {isPaused && (
                    <button
                      type="button"
                      className="btn-primary text-sm h-10 px-5"
                      disabled={toggling}
                      onClick={async () => {
                        setResumeError(null);
                        setToggling(true);
                        try {
                          await resumeCampaign(id);
                          await loadCore();
                        } catch (e) {
                          setResumeError(
                            e instanceof Error ? e.message : "Could not resume",
                          );
                        } finally {
                          setToggling(false);
                        }
                      }}
                    >
                      {toggling ? "Resuming…" : "Resume"}
                    </button>
                  )}
                  {isRunning && (
                    <button
                      type="button"
                      className="btn-secondary text-sm h-10 px-5"
                      disabled={toggling}
                      onClick={() => {
                        setPauseError(null);
                        setPauseDialogOpen(true);
                      }}
                    >
                      Pause
                    </button>
                  )}
                  {!isFinished && (
                    <button
                      type="button"
                      className="btn-ghost text-sm h-10 px-4"
                      onClick={openCloneWizard}
                      disabled={cloneLoading}
                    >
                      {cloneLoading ? "Loading…" : "Clone"}
                    </button>
                  )}
                </div>
              </div>

              {/* KPI grid */}
              {totalPeople > 0 ? (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Kpi
                    label="Enrolled"
                    value={totalPeople.toLocaleString()}
                  />
                  <Kpi
                    label="In progress"
                    value={activeRecips.toLocaleString()}
                    valueClass="text-emerald-700"
                  />
                  <Kpi
                    label="Completed"
                    value={completedRecips.toLocaleString()}
                  />
                  <Kpi
                    label="Done"
                    value={`${
                      totalPeople > 0
                        ? Math.round((completedRecips / totalPeople) * 100)
                        : 0
                    }%`}
                  />
                </div>
              ) : null}

              {/* Inline errors */}
              {activateError ? (
                <p
                  className="mt-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                  role="alert"
                >
                  {activateError}
                </p>
              ) : null}
              {resumeError ? (
                <p
                  className="mt-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                  role="alert"
                >
                  {resumeError}
                </p>
              ) : null}
            </div>
          </section>

          {/* ── Steps ── */}
          {steps.length > 0 && (
            <section className="card p-5 sm:p-6">
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Message sequence
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    What every enrolled person receives, in order.
                  </p>
                </div>
                <span className="text-xs font-semibold tabular-nums text-slate-500 shrink-0">
                  {steps.length} {steps.length === 1 ? "step" : "steps"}
                </span>
              </div>
              <StepTimeline steps={steps} stepStates={stepStates} />
            </section>
          )}

          {/* ── People ── */}
          <section className="card overflow-hidden">
            <div className="px-5 py-4 sm:px-6 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-base font-semibold text-slate-900">People</h2>
                {recipTotal > 0 ? (
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    {filteredRecipients.length !== recipTotal
                      ? `Showing ${filteredRecipients.length.toLocaleString()} of ${recipTotal.toLocaleString()}`
                      : `${recipTotal.toLocaleString()} ${recipTotal === 1 ? "person" : "people"}`}
                  </p>
                ) : null}
              </div>
              <input
                type="search"
                placeholder="Search name, email or phone…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input h-9 text-sm w-full max-w-[260px]"
              />
            </div>

            {pageRecipients.length === 0 ? (
              <div className="px-5 py-12 sm:px-6 text-sm text-slate-500 text-center">
                {searchQ
                  ? "No people match your search."
                  : "No one is enrolled in this campaign yet."}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-5 sm:px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                          Person
                        </th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                          Status
                        </th>
                        <th className="px-3 pr-5 sm:pr-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                          Step
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pageRecipients.map((row) => {
                        const stepN = row.step_count;
                        const stepLabel =
                          stepN > 0
                            ? `${Math.min(row.current_step + 1, stepN)} / ${stepN}`
                            : "—";
                        return (
                          <tr
                            key={row.recipient_id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-5 sm:px-6 py-3 align-middle">
                              <div className="font-medium text-slate-900 truncate max-w-[260px]">
                                {row.contact.name || "—"}
                              </div>
                              <div className="text-xs text-slate-500 truncate max-w-[260px] mt-0.5">
                                {row.contact.email || row.contact.phone_e164 || ""}
                              </div>
                            </td>
                            <td className="px-3 py-3 align-middle">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${recipientStatusPillClass(
                                  row.status,
                                )}`}
                              >
                                {statusLabel(row.status)}
                              </span>
                            </td>
                            <td className="px-3 pr-5 sm:pr-6 py-3 align-middle text-right">
                              <span className="text-xs font-semibold text-slate-700 tabular-nums">
                                {stepLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {pageCount > 1 && (
                  <div className="px-5 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500 tabular-nums">
                      {(peoplePage - 1) * PEOPLE_PAGE_SIZE + 1}–
                      {Math.min(
                        peoplePage * PEOPLE_PAGE_SIZE,
                        filteredRecipients.length,
                      )}{" "}
                      of {filteredRecipients.length.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className="btn-secondary text-xs h-8 px-3"
                        disabled={peoplePage <= 1}
                        onClick={() => setPeoplePage((p) => p - 1)}
                      >
                        Previous
                      </button>
                      <span className="text-xs text-slate-600 tabular-nums px-1">
                        {peoplePage} / {pageCount}
                      </span>
                      <button
                        type="button"
                        className="btn-secondary text-xs h-8 px-3"
                        disabled={peoplePage >= pageCount}
                        onClick={() => setPeoplePage((p) => p + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}

      <PauseCampaignConfirmDialog
        open={pauseDialogOpen}
        onOpenChange={(o) => {
          setPauseDialogOpen(o);
          if (!o) setPauseError(null);
        }}
        campaignName={campaign?.name || "this campaign"}
        busy={toggling}
        error={pauseError}
        onConfirm={async () => {
          setPauseError(null);
          setToggling(true);
          try {
            await pauseCampaign(id);
            setPauseDialogOpen(false);
            await loadCore();
          } catch (e) {
            setPauseError(e instanceof Error ? e.message : "Could not pause");
          } finally {
            setToggling(false);
          }
        }}
      />

      <NewCampaignWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        prefill={wizardPrefill}
        onCreated={(newId) => {
          setWizardOpen(false);
          router.push(`/dashboard/campaigns/${encodeURIComponent(newId)}`);
        }}
      />
    </div>
  );
}

/* ----------------------- Small subcomponents ----------------------- */

function Kpi({
  label,
  value,
  valueClass = "text-slate-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div
        className={`mt-1 text-xl sm:text-2xl font-semibold tabular-nums leading-none ${valueClass}`}
      >
        {value}
      </div>
    </div>
  );
}

function StepDot({ state }: { state: StepState }) {
  if (state === "completed") {
    return (
      <div className="relative shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500 text-white">
        <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden>
          <path
            d="M3 8.5l3.5 3L13 5"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  if (state === "running") {
    return (
      <div className="relative shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500 ring-4 ring-emerald-100">
        <span className="block w-2.5 h-2.5 rounded-full bg-white" />
        <span className="absolute inset-0 rounded-full bg-emerald-400/60 animate-ping" />
      </div>
    );
  }
  return (
    <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 border-slate-200">
      <span className="block w-2 h-2 rounded-full bg-slate-300" />
    </div>
  );
}

function StepTimeline({
  steps,
  stepStates,
}: {
  steps: CampaignStep[];
  stepStates: StepState[];
}) {
  return (
    <ol className="space-y-0">
      {steps.map((step, i) => {
        const state = stepStates[i] ?? "upcoming";
        const isCompleted = state === "completed";
        const isRunning = state === "running";
        const isLast = i === steps.length - 1;
        const templateName = step.goodword_templates?.name ?? `Template ${step.template_id}`;
        const channel = step.goodword_templates?.channel;
        const subject = step.goodword_templates?.subject;
        const delayLabel =
          i === 0
            ? step.delay_minutes === 0
              ? "Sends immediately"
              : `Sends after ${fmtDelay(step.delay_minutes)}`
            : `+${fmtDelay(step.delay_minutes)} after step ${i}`;

        return (
          <li key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <StepDot state={state} />
              {!isLast ? (
                <div
                  className={`w-0.5 flex-1 my-1.5 min-h-[2rem] ${
                    isCompleted ? "bg-emerald-300" : "bg-slate-200"
                  }`}
                />
              ) : null}
            </div>

            <div className={`flex-1 min-w-0 ${!isLast ? "pb-5" : ""} pt-0.5`}>
              <div
                className={`rounded-xl border px-4 py-3 transition-colors ${
                  isRunning
                    ? "bg-emerald-50/60 border-emerald-200"
                    : isCompleted
                      ? "bg-white border-slate-200"
                      : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Step {i + 1}
                      </span>
                      {channel ? (
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            channel === "email"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-violet-100 text-violet-800"
                          }`}
                        >
                          {channel}
                        </span>
                      ) : null}
                    </div>
                    <p
                      className={`mt-1 text-sm font-semibold truncate ${
                        isCompleted || isRunning ? "text-slate-900" : "text-slate-700"
                      }`}
                    >
                      {templateName}
                    </p>
                    {channel === "email" && subject ? (
                      <p className="mt-0.5 text-xs text-slate-500 truncate">
                        Subject: {subject}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-xs text-slate-600">{delayLabel}</p>
                  </div>

                  {isCompleted ? (
                    <span className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      Sent
                    </span>
                  ) : null}
                  {isRunning ? (
                    <span className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200">
                      Sending
                    </span>
                  ) : null}
                  {!isCompleted && !isRunning ? (
                    <span className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
                      Upcoming
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
