function envDevFlag(v: string | undefined): boolean {
  if (v == null || v === "") return false;
  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

export const IS_TEST_MODE = envDevFlag(process.env.NEXT_PUBLIC_TEST_MODE);
export const USE_BROWSER_MOCK = envDevFlag(process.env.NEXT_PUBLIC_BROWSER_MOCK);
export const IS_DEV = envDevFlag(process.env.NEXT_PUBLIC_DEV);
const IS_NEXT_DEV = typeof process !== "undefined" && process.env.NODE_ENV === "development";
export const useLocalDefaultApi = IS_DEV || IS_NEXT_DEV;
export const SHOW_DEMO_BYPASS = IS_NEXT_DEV || IS_DEV || IS_TEST_MODE || USE_BROWSER_MOCK;
export const SHOW_MARKETING_TRY_DEMO = process.env.NEXT_PUBLIC_DISABLE_TRY_DEMO !== "1";

const LOCAL_API = "http://127.0.0.1:8000";
const PROD_API = "https://api.maskedcarrotlabs.com";

export const PUBLIC_API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim() || (useLocalDefaultApi ? LOCAL_API : PROD_API);
export const API_BASE = PUBLIC_API_BASE;

export const PUBLIC_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (useLocalDefaultApi ? "http://127.0.0.1:3001" : "https://reviewloop.maskedcarrotlabs.com");

export function isBrowserLocalMockApp(): boolean {
  if (typeof window === "undefined") return false;
  return USE_BROWSER_MOCK || IS_TEST_MODE;
}
