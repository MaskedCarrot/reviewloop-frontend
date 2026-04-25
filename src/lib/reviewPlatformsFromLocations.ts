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
 * Google uses each location's Google review field; other platforms use `platform_links[platformId]`.
 */
export function activePlatformChips(
  locations: BusinessLocation[] | null | undefined,
  publicConfig: PublicConfig | null | undefined
): ActivePlatformChip[] {
  const locs = locations || [];
  const fromCfg = (publicConfig?.review_platforms || []) as ReviewPlatformInfo[];
  const byId = new Map(fromCfg.map((p) => [p.id, p] as [string, ReviewPlatformInfo]));
  const orderedIds = [
    "google",
    ...fromCfg.filter((p) => p.id !== "google").map((p) => p.id),
  ];
  const seen = new Set<string>();
  const out: ActivePlatformChip[] = [];

  for (const id of orderedIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    if (id === "google") {
      const n = locs.filter((l) => isHttpsUrl(l.gmb_review_url)).length;
      if (n < 1) continue;
      out.push({
        id: "google",
        label: byId.get("google")?.label || "Google",
        storeCount: n,
      });
      continue;
    }
    const p = byId.get(id);
    if (!p) continue;
    const n = locs.filter((l) => isHttpsUrl(l.platform_links?.[id] || "")).length;
    if (n < 1) continue;
    out.push({ id: p.id, label: p.label, storeCount: n });
  }
  return out;
}

export function isPlatformUrlActive(
  platformId: string,
  loc: BusinessLocation
): boolean {
  if (platformId === "google") return isHttpsUrl(loc.gmb_review_url);
  return isHttpsUrl(loc.platform_links?.[platformId] || "");
}

/**
 * /r/ and /q/ — use `review_destinations` for store-scoped responses (`location_id` set). Do not use the
 * legacy `gmb_review_url` on the payload as a second Google when `review_destinations` is empty, or
 * customers would see a Google button for business-level GMB with no per-store link.
 * Legacy: no `location_id` (oldest "business-only" GMB) still allows a single Google from `gmb_review_url`.
 */
export function publicReviewPageDestinations(
  biz: Pick<RoutingBusinessInfo, "review_destinations" | "gmb_review_url" | "location_id">,
): ReviewDestination[] {
  const withUrl = (d: ReviewDestination) => (d.url || "").trim() !== "";
  const scoped = biz.location_id != null && String(biz.location_id).trim() !== "";
  if (scoped) {
    return (biz.review_destinations || []).filter(withUrl);
  }
  if (biz.review_destinations && biz.review_destinations.length > 0) {
    return biz.review_destinations.filter(withUrl);
  }
  const g = (biz.gmb_review_url || "").trim();
  if (g) {
    return [{ id: "google", label: "Google", url: g }];
  }
  return [];
}
