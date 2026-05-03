import type { BusinessLocation, PublicConfig, ReviewDestination, ReviewPlatformInfo, RoutingBusinessInfo } from "@/types";

function isHttpsUrl(u: string | null | undefined): boolean {
  return (u || "").trim().toLowerCase().startsWith("https://");
}

export type ActivePlatformChip = {
  id: string;
  label: string;
  /** How many store rows have a valid link for this platform. */
  storeCount: number;
};

/**
 * Build a de-duplicated list of review sites that are configured (HTTPS URL) on at least one store.
 * All platforms (including Google) use `platform_links[platformId]`.
 */
export function activePlatformChips(
  locations: BusinessLocation[] | null | undefined,
  publicConfig: PublicConfig | null | undefined
): ActivePlatformChip[] {
  const locs = locations || [];
  const fromCfg = (publicConfig?.review_platforms || []) as ReviewPlatformInfo[];
  const byId = new Map(fromCfg.map((p) => [p.id, p] as [string, ReviewPlatformInfo]));
  const orderedIds = fromCfg.map((p) => p.id);
  const seen = new Set<string>();
  const out: ActivePlatformChip[] = [];

  for (const id of orderedIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const p = byId.get(id);
    if (!p) continue;
    const n = locs.filter((l) => isHttpsUrl(l.platform_links?.[id])).length;
    if (n < 1) continue;
    out.push({ id: p.id, label: p.label, storeCount: n });
  }
  return out;
}

export function isPlatformUrlActive(platformId: string, loc: BusinessLocation): boolean {
  return isHttpsUrl(loc.platform_links?.[platformId]);
}

/**
 * /r/ and /q/ — use `review_destinations` from the server response.
 */
export function publicReviewPageDestinations(
  biz: Pick<RoutingBusinessInfo, "review_destinations" | "location_id">,
): ReviewDestination[] {
  return (biz.review_destinations || []).filter((d) => (d.url || "").trim() !== "");
}
