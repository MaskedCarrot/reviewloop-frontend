"use client";

import { useDashboardBootstrap } from "@/app/dashboard/DashboardBootstrapProvider";

/**
 * Dashboard links to open the live customer QR/routing page and the private feedback form (?form=1).
 * Uses the stable /q/{businessId}?l={locationId} URL derived from bootstrap — available as soon as
 * the business is created, with no dependency on a sent message.
 */
export default function PreviewCustomerPageLinks({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { bootstrap } = useDashboardBootstrap();

  const businessId = bootstrap?.business?.id;
  const defaultLocationId = bootstrap?.locations?.default_location_id ?? null;

  if (!businessId) {
    return (
      <p className={`text-xs text-slate-500 leading-relaxed ${className}`}>
        {compact
          ? "Create your business profile to get a review link."
          : "Complete your business profile to generate your review link."}
      </p>
    );
  }

  const base = `/q/${encodeURIComponent(businessId)}`;
  const url = defaultLocationId ? `${base}?l=${encodeURIComponent(defaultLocationId)}` : base;

  return (
    <p className={`text-sm text-slate-600 ${className}`}>
      <span className="text-slate-500">{compact ? "Preview: " : "See the live page: "}</span>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-warm-700 hover:text-warm-800 hover:underline"
      >
        Open review page
      </a>
    </p>
  );
}
