import type { ReactNode } from "react";

/**
 * KPI card used across the dashboard.
 *
 *   - `value`  — the primary big number / display string
 *   - `label`  — small uppercase label
 *   - `hint`   — secondary line under the label (e.g. "% of sends")
 *   - `accent` — optional warm/blue/emerald glow on the side; defaults to none
 *
 * Always opaque, always with the same shadow recipe — keeps every dashboard surface
 * visually consistent without forcing every page to redefine its own card.
 */
export default function KpiCard({
  value,
  label,
  hint,
  accent,
  trailing,
  className = "",
}: {
  value: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
  /** Coloured glow at top-right; pass null/undefined to skip. */
  accent?: "warm" | "brand" | "emerald" | null;
  /** Optional trailing element (e.g. trend arrow) shown next to the value. */
  trailing?: ReactNode;
  className?: string;
}) {
  const accentClass = accent
    ? {
        warm: "from-warm-100/70",
        brand: "from-brand-100/60",
        emerald: "from-emerald-100/60",
      }[accent]
    : null;
  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border border-slate-200/85 bg-white px-5 py-4 sm:py-5",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-20px_rgba(15,23,42,0.16)]",
        "transition-shadow hover:shadow-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {accentClass ? (
        <span
          aria-hidden
          className={`pointer-events-none absolute -top-12 -right-10 h-32 w-32 rounded-full bg-gradient-to-br ${accentClass} to-transparent blur-xl`}
        />
      ) : null}
      <div className="relative flex items-baseline gap-2">
        <span className="text-3xl sm:text-[2rem] font-semibold tabular-nums text-slate-900 leading-none">{value}</span>
        {trailing ? <span className="text-sm font-medium text-slate-500">{trailing}</span> : null}
      </div>
      <p className="relative mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      {hint ? <p className="relative mt-1 text-[11px] text-slate-500 leading-snug">{hint}</p> : null}
    </div>
  );
}
