function envDev(v: string | undefined) {
  if (v == null || v === "") return false;
  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

const IS_DEV = envDev(process.env.NEXT_PUBLIC_DEV);
const IS_NEXT_DEV = typeof process !== "undefined" && process.env.NODE_ENV === "development";
const useLocal = IS_DEV || IS_NEXT_DEV;
export const PUBLIC_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (useLocal ? "http://127.0.0.1:3001" : "https://reviewloop.maskedcarrotlabs.com");

const stripSlash = (o: string) => o.replace(/\/$/, "");

/**
 * Public /q/… and /r/… links must use the same host the user is actually on. Dev defaults to
 * 127.0.0.1:3001 in {@link PUBLIC_SITE_ORIGIN}, but many people use localhost:3001; those are
 * different origins (separate localStorage), so "Open in new tab" looked empty when Try demo
 * only had the flag on localhost. In the browser, always use the current origin.
 */
export function getPublicOriginForClientLinks(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return stripSlash(window.location.origin);
  }
  return stripSlash(PUBLIC_SITE_ORIGIN);
}
