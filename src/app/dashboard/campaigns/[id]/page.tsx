"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  getCredits,
  getSequence,
  getSequenceEnrollments,
  getSequenceStats,
  resumeSequenceCampaign,
  stopSequenceCampaign,
} from "@/lib/api";
import EnrollInCampaignDialog from "@/app/dashboard/contacts/_components/EnrollInCampaignDialog";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import PageLoader from "@/components/PageLoader";
import PauseCampaignConfirmDialog from "../_components/PauseCampaignConfirmDialog";
import { personProgress, statusLabel } from "../_lib/campaignUi";
import type { ReviewSequence, ReviewSequenceEnrollment, ReviewSequenceStats, ReviewSequenceStep } from "@/types";

type Detail = {
  name: string;
  is_active: boolean;
  location_id?: string | null;
  review_link_style?: string;
  steps: ReviewSequenceStep[];
} | null;

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = (typeof params.id === "string" ? params.id : "").trim();
  const [seq, setSeq] = useState<Detail>(null);
  const [st, setSt] = useState<ReviewSequenceStats | null>(null);
  const [enrollments, setEnrollments] = useState<ReviewSequenceEnrollment[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [pauseError, setPauseError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrored(null);
    try {
      const [s, stats, e, cr] = await Promise.all([
        getSequence(id) as Promise<ReviewSequence & { steps: ReviewSequenceStep[] }>,
        getSequenceStats(id),
        getSequenceEnrollments(id, 200),
        getCredits(),
      ]);
      setSeq({ name: s.name, is_active: !!s.is_active, location_id: s.location_id, review_link_style: s.review_link_style, steps: s.steps });
      setSt(stats);
      setEnrollments(e.enrollments);
      setCredits(cr.balance ?? 0);
    } catch (e) {
      setErrored(e instanceof Error ? e.message : "Could not load campaign");
      setSeq(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!id) {
    return null;
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/dashboard/campaigns" className="text-sm text-brand-700 font-medium hover:underline w-fit">
          ← Back to campaigns
        </Link>
      </div>
      <DashboardPageHeader
        eyebrow="Follow-up campaign"
        title={seq?.name || "Campaign"}
        credits={credits != null ? credits : undefined}
        description={
          <p>
            This campaign is fixed after creation.{" "}
            <strong>Pause</strong> blocks new people and new follow-up steps; message rows already scheduled still send.{" "}
            <Link href="/dashboard/analytics" className="text-brand-600 font-medium hover:underline">
              Analytics
            </Link>{" "}
            has send history and exports.
          </p>
        }
      />

      {loading ? (
        <div className="card p-12">
          <PageLoader message="Loading campaign" size="md" />
        </div>
      ) : errored ? (
        <div className="card p-6 text-sm text-slate-700">
          {errored}
          <button type="button" className="btn-ghost block mt-3" onClick={() => router.push("/dashboard/campaigns")}>
            Back
          </button>
        </div>
      ) : !seq || !st ? null : (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {seq.is_active ? (
                <span className="pill bg-emerald-100 text-emerald-900">Running</span>
              ) : (
                <span className="pill bg-slate-200 text-slate-700">Paused</span>
              )}
              {seq.is_active && (
                <button
                  type="button"
                  className="btn-danger-outline text-sm"
                  disabled={toggling}
                  onClick={() => {
                    setPauseError(null);
                    setPauseDialogOpen(true);
                  }}
                >
                  Pause campaign
                </button>
              )}
              {!seq.is_active && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/95 to-white px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-sm ring-1 ring-inset ring-emerald-200/50 transition hover:from-emerald-100/80 hover:shadow disabled:opacity-50 min-w-[8rem]"
                  disabled={toggling}
                  onClick={async () => {
                    setResumeError(null);
                    setToggling(true);
                    try {
                      await resumeSequenceCampaign(id);
                      setPauseError(null);
                      await load();
                    } catch (e) {
                      setResumeError(e instanceof Error ? e.message : "Could not resume");
                    } finally {
                      setToggling(false);
                    }
                  }}
                >
                  {toggling ? (
                    "…"
                  ) : (
                    <>
                      <svg
                        className="h-5 w-5 text-emerald-600 shrink-0"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M8 5.14v14.72L19.48 12 8 5.14z" />
                      </svg>
                      Resume campaign
                    </>
                  )}
                </button>
              )}
              {seq.is_active && (
                <button type="button" className="btn-secondary text-sm" onClick={() => setEnrollOpen(true)}>
                  Add people
                </button>
              )}
            </div>
            {!seq.is_active && !toggling && (
              <p className="text-xs text-slate-600 pl-0.5 max-w-xl leading-relaxed">
                New enrollments and follow-up steps run again. Scheduled messages from before the pause are unchanged.
              </p>
            )}
            {resumeError ? (
              <p className="text-sm text-red-800 bg-red-50 border border-red-100 rounded-lg px-3 py-2 max-w-lg" role="alert">
                {resumeError}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="card p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Steps in sequence</p>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-1">{st.step_count}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">People added (ever)</p>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-1">{st.enrollments.total}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">In progress</p>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-1">{st.enrollments.active}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Step messages sent (total)</p>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-1">
                {st.step_sends_count ?? st.messages_sent}
              </p>
              <p className="text-xs text-slate-500 mt-1">All sends in this follow-up, across people.</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">People who finished all steps</p>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-1">
                {st.finished_all_steps_count ?? st.enrollments.completed}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Open review or feedback (stopped for them)</p>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-1">{st.enrollments.stopped_replied}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Messages still scheduled</p>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-1">
                {st.scheduled_messages_pending ?? 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">These will send even if you pause the campaign for new work.</p>
            </div>
            <div className="card p-4 sm:col-span-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Enrollments by outcome</p>
              <p className="text-sm text-slate-700 mt-2">
                <span className="font-medium">Completed (all steps):</span> {st.enrollments.completed} ·{" "}
                <span className="font-medium">Cancelled / ended:</span> {st.enrollments.cancelled}
              </p>
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-3">People in this campaign</h2>
            {enrollments.length === 0 ? (
              <p className="text-sm text-slate-500">No one is enrolled in this list yet, or the run predates this view.</p>
            ) : (
              <div className="max-w-full overflow-x-auto">
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                      <th className="pb-2 pr-3 font-medium">Person</th>
                      <th className="pb-2 pr-3 font-medium">Status</th>
                      <th className="pb-2 font-medium">Progress / next</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((row) => (
                      <tr key={row.enrollment_id} className="border-b border-slate-50 last:border-0">
                        <td className="py-2.5 pr-3 align-top">
                          <div className="font-medium text-slate-800">{row.contact.name}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[220px]">
                            {row.contact.email || row.contact.phone_e164 || "—"}
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 align-top text-slate-700">{statusLabel(row.status)}</td>
                        <td className="py-2.5 align-top text-slate-600">{personProgress(row)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {id && (
        <PauseCampaignConfirmDialog
          open={pauseDialogOpen}
          onOpenChange={(o) => {
            setPauseDialogOpen(o);
            if (!o) setPauseError(null);
          }}
          campaignName={seq?.name || "this campaign"}
          busy={toggling}
          error={pauseError}
          onConfirm={async () => {
            setPauseError(null);
            setToggling(true);
            try {
              await stopSequenceCampaign(id);
              setPauseDialogOpen(false);
              await load();
            } catch (e) {
              setPauseError(e instanceof Error ? e.message : "Could not pause");
            } finally {
              setToggling(false);
            }
          }}
        />
      )}

      {id && (
        <EnrollInCampaignDialog
          open={enrollOpen}
          onOpenChange={(o) => {
            setEnrollOpen(o);
            if (!o) void load();
          }}
          sequenceId={id}
          campaignName={seq?.name || "Campaign"}
          onEnrolled={() => void load()}
        />
      )}
    </div>
  );
}
