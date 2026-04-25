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
        "relative z-0 inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200/60 bg-white/90 px-3 py-2 text-sm",
        "shadow-sm shadow-slate-900/[0.04] ring-1 ring-slate-100/80",
        "text-slate-800 transition-colors hover:border-brand-200/70 hover:bg-brand-50/40 hover:ring-brand-200/25",
        "focus:outline-none focus:ring-2 focus:ring-brand-400/30",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Credits</span>
      <span className="font-semibold tabular-nums text-slate-900">{balance.toLocaleString()}</span>
    </Link>
  );
}
