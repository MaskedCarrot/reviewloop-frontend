import type { ReactNode } from "react";

/**
 * Empty-state block used across dashboard list pages.
 * Tone:
 * - "neutral" for "nothing here yet" prompts
 * - "warm" for "do this next" prompts
 * - "muted" for filtered "no results" cases
 */
export default function EmptyState({
  icon,
  title,
  body,
  actions,
  tone = "neutral",
  className = "",
}: {
  icon?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  actions?: ReactNode;
  tone?: "neutral" | "warm" | "muted";
  className?: string;
}) {
  const ringByTone = {
    neutral: "border-slate-200/85",
    warm: "border-warm-200/80 bg-gradient-to-br from-warm-50/70 to-white",
    muted: "border-slate-200/70 bg-slate-50/60",
  }[tone];
  const iconByTone = {
    neutral: "bg-warm-50 text-warm-700 ring-warm-200",
    warm: "bg-warm-100 text-warm-700 ring-warm-200",
    muted: "bg-slate-100 text-slate-600 ring-slate-200",
  }[tone];

  return (
    <section
      className={[
        "rounded-3xl border bg-white px-6 py-10 sm:py-12 text-center",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-28px_rgba(15,23,42,0.16)]",
        ringByTone,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon ? (
        <div className={`mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl ring-1 ${iconByTone}`}>{icon}</div>
      ) : null}
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {body ? <p className="mt-2 text-sm text-slate-700 leading-relaxed max-w-md mx-auto">{body}</p> : null}
      {actions ? <div className="mt-5 flex flex-wrap justify-center gap-2.5">{actions}</div> : null}
    </section>
  );
}
