import Link from "next/link";

/**
 * Consistent credit balance control for dashboard page headers. Links to billing.
 */
export default function DashboardCreditBalance({
  balance,
  href = "/dashboard/billing",
  className = "",
}: {
  balance: number;
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={[
        "relative z-0 inline-flex shrink-0 items-center gap-2.5 rounded-2xl border border-warm-200/80 bg-white px-3.5 py-2 text-sm",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_-12px_rgba(229,114,36,0.25)]",
        "text-slate-800 transition-all hover:border-warm-300 hover:bg-warm-50/60",
        "focus:outline-none focus:ring-2 focus:ring-warm-400/30",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="grid h-5 w-5 place-items-center rounded-full bg-warm-100 text-warm-700">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3" aria-hidden>
          <path d="M12 2l2.4 6.2H21l-5 3.8 1.9 6L12 15.8 5.1 18l1.9-6-5-3.8h6.6L12 2z" />
        </svg>
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-warm-700">Credits</span>
      <span className="font-semibold tabular-nums text-slate-900">{balance.toLocaleString()}</span>
    </Link>
  );
}
