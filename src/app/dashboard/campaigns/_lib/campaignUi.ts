import type { ReviewSequenceEnrollment } from "@/types";

export function statusLabel(s: string): string {
  if (s === "active") return "In progress";
  if (s === "completed") return "All steps done";
  if (s === "stopped_replied") return "Engaged (review/feedback)";
  if (s === "cancelled") return "Stopped (by you)";
  return s;
}

export function personProgress(row: ReviewSequenceEnrollment): string {
  const n = row.step_count;
  if (row.status === "active") {
    if (row.next_scheduled) {
      const t = new Date(row.next_scheduled.send_at);
      return `Next: message ${row.next_scheduled.step_index + 1} of ${n} — ${t.toLocaleString()}`;
    }
    if (row.last_sent_step_index == null) return "Not sent yet";
    if (n <= 0) return "In progress";
    return `Up to message ${row.last_sent_step_index + 1} of ${n} sent${row.messages_sent > 0 ? ` (${row.messages_sent} sends)` : ""}`;
  }
  if (row.status === "completed" && n > 0) return `Finished all ${n} steps`;
  if (row.last_sent_step_index != null && n > 0) return `Stopped at message ${row.last_sent_step_index + 1} of ${n}`;
  return "—";
}
