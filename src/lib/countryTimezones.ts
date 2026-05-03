/**
 * Map an ISO-3166 alpha-2 country code to the IANA time zones used in that country.
 *
 * Primary source is the runtime `Intl.Locale.prototype.getTimeZones()` API (V8 ≥ 12,
 * Safari 17+, Firefox 134+). When unavailable we fall back to a static map generated
 * from Node's ICU (see `src/data/countryTimezones.json`) so older runtimes still get
 * a reasonable answer.
 *
 * IANA aliases (e.g. `Asia/Calcutta` / `Asia/Kolkata`) are both valid identifiers and
 * are accepted by `Intl.DateTimeFormat` and the backend zoneinfo, so the list returned
 * here intentionally mirrors whatever the host runtime considers canonical.
 */
import staticMap from "@/data/countryTimezones.json";

type CountryTimezoneMap = Record<string, string[]>;

const STATIC_MAP = staticMap as CountryTimezoneMap;

const runtimeCache = new Map<string, string[]>();

interface IntlLocaleWithTimeZones extends Intl.Locale {
  getTimeZones?(): string[];
}

function readFromIntl(code: string): string[] | null {
  if (typeof Intl === "undefined" || typeof Intl.Locale !== "function") return null;
  try {
    const loc = new Intl.Locale(`und-${code}`) as IntlLocaleWithTimeZones;
    if (typeof loc.getTimeZones === "function") {
      const zones = loc.getTimeZones();
      if (Array.isArray(zones) && zones.length > 0) return zones;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Sorted list of canonical IANA zones for a country. Empty array if unknown. */
export function getTimezonesForCountry(countryCode: string | null | undefined): string[] {
  const code = (countryCode || "").trim().toUpperCase();
  if (!code) return [];
  const cached = runtimeCache.get(code);
  if (cached) return cached;

  const fromIntl = readFromIntl(code);
  const fromStatic = STATIC_MAP[code];
  const merged = new Set<string>([...(fromIntl ?? []), ...(fromStatic ?? [])]);
  const sorted = Array.from(merged).sort((a, b) => a.localeCompare(b));
  runtimeCache.set(code, sorted);
  return sorted;
}

/**
 * Best-guess default zone for a country. Picks the most populous / capital zone where
 * we have a hint, else falls back to the first sorted zone.
 *
 * Hints intentionally cover the largest-population country variants only — for everyone
 * else the alphabetically first IANA zone (which is what most single-zone countries
 * have) is already correct.
 */
const PREFERRED_DEFAULT: Record<string, string> = {
  US: "America/New_York",
  CA: "America/Toronto",
  AU: "Australia/Sydney",
  RU: "Europe/Moscow",
  BR: "America/Sao_Paulo",
  MX: "America/Mexico_City",
  AR: "America/Buenos_Aires",
  CN: "Asia/Shanghai",
  ID: "Asia/Jakarta",
  KZ: "Asia/Almaty",
  CL: "America/Santiago",
  ES: "Europe/Madrid",
  PT: "Europe/Lisbon",
  NZ: "Pacific/Auckland",
};

export function getDefaultTimezoneForCountry(
  countryCode: string | null | undefined,
): string | null {
  const code = (countryCode || "").trim().toUpperCase();
  if (!code) return null;
  const zones = getTimezonesForCountry(code);
  if (zones.length === 0) return null;
  const preferred = PREFERRED_DEFAULT[code];
  if (preferred && zones.includes(preferred)) return preferred;
  return zones[0];
}

/** True if `zone` is one of the IANA zones we track for `countryCode`. */
export function timezoneBelongsToCountry(
  zone: string | null | undefined,
  countryCode: string | null | undefined,
): boolean {
  if (!zone) return false;
  const zones = getTimezonesForCountry(countryCode);
  return zones.includes(zone);
}

/**
 * Reverse lookup — given an IANA zone (typically the browser's
 * `Intl.DateTimeFormat().resolvedOptions().timeZone`), return the most
 * likely ISO-3166 alpha-2 country code, or null when ambiguous.
 *
 * Used to seed onboarding without locking the user into a hardcoded default.
 */
export function guessCountryFromTimezone(
  zone: string | null | undefined,
): string | null {
  const z = (zone || "").trim();
  if (!z) return null;
  for (const [code, zones] of Object.entries(STATIC_MAP)) {
    if (zones.includes(z)) return code;
  }
  return null;
}
