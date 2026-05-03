"use client";

import Link from "next/link";

type Props = {
  /** Heading next to the bar (e.g. "Campaigns this month"). */
  label: string;
  /** Current usage. Clamped to [0, limit] for the visual; the text shows the raw value. */
  used: number;
  /** Hard cap. ``null`` means unlimited (Pro): the meter is hidden entirely. */
  limit: number | null;
  /** Optional sub-label rendered under the meter (e.g. "Resets on the 1st"). */
  hint?: string;
  /**
   * Optional href shown when the user is at-or-near the cap. Defaults to /pricing.
   * Pass ``null`` to suppress the upgrade nudge entirely.
   */
  upgradeHref?: string | null;
  /** Optional override for the upgrade-nudge label. */
  upgradeLabel?: string;
  /** Compact variant for inline placement (no shadow, no rounded card). */
  inline?: boolean;
};

/**
 * Simple horizontal progress meter for Free-tier usage. Hidden for Pro users
 * (``limit === null``). When ``used >= limit`` the bar turns warm and shows
 * an "Upgrade to Pro" CTA.
 *
 * The component is read-only; it never mutates state. Lock-out logic for the
 * underlying button (e.g. "New campaign") lives next to the button itself,
 * because the locking semantics differ per surface.
 */
export default function UsageMeter({
  label,
  used,
  limit,
  hint,
  upgradeHref = "/pricing",
  upgradeLabel = "Upgrade to Pro",
  inline = false,
}: Props) {
  if (limit === null) return null;

  const safeLimit = Math.max(1, limit);
  const safeUsed = Math.max(0, used);
  const pct = Math.min(100, Math.round((safeUsed / safeLimit) * 100));
  const atCap = safeUsed >= limit;
  const nearCap = !atCap && pct >= 80;

  const barTone = atCap
    ? "bg-warm-500"
    : nearCap
      ? "bg-warm-400"
      : "bg-slate-700";

  const wrapperCls = inline
    ? "w-full"
    : "rounded-2xl border border-slate-200/85 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_-12px_rgba(15,23,42,0.10)]";

  return (
    <div className={wrapperCls}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
          {label}
        </span>
        <span className="text-sm font-semibold tabular-nums text-slate-800">
          {safeUsed.toLocaleString()}
          <span className="text-slate-400"> / </span>
          {limit.toLocaleString()}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`h-full ${barTone} transition-[width] duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {(hint || atCap || nearCap) && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className={atCap ? "font-semibold text-warm-700" : "text-slate-500"}>
            {atCap
              ? "Limit reached for this month."
              : nearCap
                ? `Almost there — ${(limit - safeUsed).toLocaleString()} left.`
                : hint || ""}
          </span>
          {(atCap || nearCap) && upgradeHref && (
            <Link
              href={upgradeHref}
              className="font-semibold text-warm-700 hover:underline underline-offset-2"
            >
              {upgradeLabel} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
