import type { PublicConfig } from "@/types";
import rawList from "@/data/iso3166-slim-2.json";

export const ALL_COUNTRIES: { code: string; name: string }[] = rawList as {
  code: string;
  name: string;
}[];

export function getSmsSupportedList(cfg: PublicConfig | null | undefined): string[] {
  if (!cfg) return [];
  return (cfg.sms_supported_countries ?? cfg.country_allowlist) as string[];
}

export function countrySupportsSms(countryCode: string | undefined, smsSupportedAlpha2: string[] | undefined): boolean {
  if (!countryCode || !smsSupportedAlpha2?.length) return false;
  return smsSupportedAlpha2.map((c) => c.toUpperCase()).includes(countryCode.trim().toUpperCase());
}
