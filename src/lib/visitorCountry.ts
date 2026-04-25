import { headers } from "next/headers";

const HEADER_CANDIDATES = ["x-vercel-ip-country", "cf-ipcountry", "x-country-code"] as const;

/**
 * Best-effort 2-letter region from the hosting edge (Vercel, Cloudflare, or custom).
 * Omitted in local dev unless a proxy sets headers.
 */
export async function getVisitorCountryCodeFromHeaders(): Promise<string | null> {
  const h = await headers();
  for (const name of HEADER_CANDIDATES) {
    const v = h.get(name)?.trim().toUpperCase();
    if (v && /^[A-Z]{2}$/.test(v)) return v;
  }
  return null;
}
