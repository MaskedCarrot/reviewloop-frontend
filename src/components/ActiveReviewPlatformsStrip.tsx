import ReviewPlatformIcon from "@/components/ReviewPlatformIcon";
import type { ActivePlatformChip } from "@/lib/reviewPlatformsFromLocations";

/**
 * Compact row of which review sites are configured (at least one HTTPS link on a store).
 */
export default function ActiveReviewPlatformsStrip({
  platforms,
  className = "",
}: {
  platforms: ActivePlatformChip[];
  className?: string;
}) {
  if (platforms.length === 0) {
    return (
      <p className={["text-xs text-slate-500", className].filter(Boolean).join(" ")}>
        No public review links yet — add at least one HTTPS link per store in{" "}
        <a className="font-medium text-brand-600 hover:underline" href="/dashboard/settings#store-locations">
          Settings → Store locations
        </a>
        .
      </p>
    );
  }
  return (
    <div
      className={["flex flex-wrap items-center gap-x-3 gap-y-1.5", className].filter(Boolean).join(" ")}
      role="status"
      aria-label="Active review channels"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Review links on</span>
      <ul className="flex flex-wrap items-center gap-2">
        {platforms.map((p) => (
          <li
            key={p.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-slate-50/90 px-2.5 py-1 text-xs font-medium text-slate-800"
          >
            <ReviewPlatformIcon platformId={p.id} size="sm" />
            <span>
              {p.label}
              {p.storeCount > 1 ? <span className="text-slate-500 font-normal"> ({p.storeCount} stores)</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
