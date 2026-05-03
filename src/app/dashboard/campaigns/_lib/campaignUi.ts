import type { CampaignRecipient, CampaignStatus } from "@/types";

export function statusLabel(s: string): string {
  if (s === "active") return "In progress";
  if (s === "completed") return "All steps done";
  if (s === "stopped") return "Stopped";
  if (s === "pending") return "Pending";
  return s;
}

/** Visual tokens for a campaign-level status. Used by both list and detail views. */
export type CampaignStatusTone = {
  /** Short capitalised label. */
  label: string;
  /** Background + text classes for a pill. */
  pill: string;
  /** Text colour class for emphasised status text. */
  text: string;
  /** Border colour class for the left status bar on list rows. */
  bar: string;
  /** Solid background colour class for the icon dot. */
  dot: string;
};

export function campaignStatusTone(s: CampaignStatus): CampaignStatusTone {
  if (s === "running")
    return {
      label: "Running",
      pill: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200",
      text: "text-emerald-800",
      bar: "bg-emerald-500",
      dot: "bg-emerald-500",
    };
  if (s === "paused")
    return {
      label: "Paused",
      pill: "bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200",
      text: "text-amber-900",
      bar: "bg-amber-400",
      dot: "bg-amber-500",
    };
  if (s === "scheduled")
    return {
      label: "Scheduled",
      pill: "bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-200",
      text: "text-sky-800",
      bar: "bg-sky-500",
      dot: "bg-sky-500",
    };
  if (s === "finished")
    return {
      label: "Finished",
      pill: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
      text: "text-slate-700",
      bar: "bg-slate-300",
      dot: "bg-slate-400",
    };
  // Defensive fallback for any unknown status — including legacy "draft" rows
  // from older deployments. New campaigns can only ever land in one of the
  // four statuses above (see backend pricing doc / campaigns.py lifecycle).
  // We widen `s` to `string` here because TypeScript narrows to `never` after
  // the four exhaustive matches above, but the data still comes from the wire
  // and could theoretically carry an unexpected legacy value.
  const fallback = (s as unknown as string) || "Unknown";
  return {
    label: fallback.charAt(0).toUpperCase() + fallback.slice(1),
    pill: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
    text: "text-slate-700",
    bar: "bg-slate-300",
    dot: "bg-slate-400",
  };
}

/** Pill colour for the per-recipient status (active / completed / stopped / pending). */
export function recipientStatusPillClass(s: string): string {
  if (s === "active") return "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200";
  if (s === "completed") return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
  if (s === "stopped") return "bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-200";
  if (s === "pending") return "bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-200";
  return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
}

export function personProgress(row: CampaignRecipient): string {
  const n = row.step_count;
  if (row.status === "active") {
    if (row.next_scheduled) {
      const t = new Date(row.next_scheduled.send_at);
      return `Next: message ${row.next_scheduled.step_index + 1} of ${n} — ${t.toLocaleString()}`;
    }
    if (row.current_step === 0) return "Not sent yet";
    if (n <= 0) return "In progress";
    return `Up to message ${row.current_step} of ${n} sent`;
  }
  if (row.status === "completed" && n > 0) return `Finished all ${n} steps`;
  if (row.current_step > 0 && n > 0) return `Stopped at message ${row.current_step} of ${n}`;
  return "—";
}
