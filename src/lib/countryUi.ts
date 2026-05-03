import type { Business, PublicConfig } from "@/types";
import rawList from "@/data/iso3166-slim-2.json";

export const ALL_COUNTRIES: { code: string; name: string }[] = rawList as {
  code: string;
  name: string;
}[];

export function getSmsSupportedList(cfg: PublicConfig | null | undefined): string[] {
  if (!cfg) return [];
  return (cfg.sms_supported_countries ?? []) as string[];
}

export function countrySupportsSms(
  countryCode: string | undefined,
  smsSupportedAlpha2: string[] | undefined,
): boolean {
  if (!countryCode || !smsSupportedAlpha2?.length) return false;
  return smsSupportedAlpha2
    .map((c) => c.toUpperCase())
    .includes(countryCode.trim().toUpperCase());
}

/**
 * The single source of truth for "should SMS UI appear for this logged-in business?".
 * SMS is hidden until admin flips ``sms_enabled`` to true on the business. The country
 * allowlist alone is no longer enough.
 */
export function isSmsEnabledForBusiness(biz: Business | null | undefined): boolean {
  return !!biz && biz.sms_enabled === true;
}

/**
 * Should public marketing pages (home / pricing / how-it-works / compliance / privacy)
 * mention SMS at all? Driven by the backend ``sms_public_preview`` flag — false by
 * default, so anonymous visitors see GoodWord as email-only.
 */
export function isSmsPublicPreviewOn(cfg: PublicConfig | null | undefined): boolean {
  if (!cfg) return false;
  return cfg.sms_public_preview === true;
}
