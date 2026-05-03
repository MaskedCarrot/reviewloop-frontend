function envDevFlag(v: string | undefined): boolean {
  if (v == null || v === "") return false;
  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

function envText(v: string | undefined): string | undefined {
  const s = v?.trim();
  return s ? s : undefined;
}

const PUBLIC_DEV_FLAG = process.env.NEXT_PUBLIC_DEV;
const LEGACY_DEV_FLAG = process.env.DEV;

export const IS_TEST_MODE = envDevFlag(process.env.NEXT_PUBLIC_TEST_MODE);
export const USE_BROWSER_MOCK = envDevFlag(process.env.NEXT_PUBLIC_BROWSER_MOCK);
export const IS_DEV = envDevFlag(PUBLIC_DEV_FLAG) || envDevFlag(LEGACY_DEV_FLAG);
const IS_NEXT_DEV = typeof process !== "undefined" && process.env.NODE_ENV === "development";
export const useLocalDefaultApi = IS_DEV || IS_NEXT_DEV;
export const SHOW_DEMO_BYPASS = IS_NEXT_DEV || IS_DEV || IS_TEST_MODE || USE_BROWSER_MOCK;
export const SHOW_MARKETING_TRY_DEMO = process.env.NEXT_PUBLIC_DISABLE_TRY_DEMO !== "1";
export const GOOGLE_CLIENT_ID = envText(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) ?? "";

/**
 * Controls whether the per-business "From name (email)" and "SMS sender label" inputs
 * appear in Settings and Onboarding. Hidden by default — most deployments configure
 * these at the platform level, and exposing them confuses end users. Set
 * `NEXT_PUBLIC_SHOW_SENDER_FIELDS=1` to re-enable the inputs.
 *
 * When hidden, the backend keeps using whatever values are already on the business
 * record; new businesses fall back to the business name for `from_name` (matching the
 * onboarding fallback) and an empty `sms_sender_id`.
 */
export const SHOW_SENDER_FIELDS = envDevFlag(process.env.NEXT_PUBLIC_SHOW_SENDER_FIELDS);

/**
 * Email allowed to access the /admin page on the frontend. Compared (case-insensitive)
 * with the logged-in user's email. The backend enforces the same gate independently
 * via ``GOODWORD_ADMIN_EMAIL`` — this is purely for hiding the UI.
 *
 * Defaults to 2000apoorv@gmail.com (project owner) when the env var is unset.
 */
export const ADMIN_EMAIL =
  envText(process.env.NEXT_PUBLIC_ADMIN_EMAIL)?.toLowerCase() ?? "2000apoorv@gmail.com";

export function isAdminUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

const LOCAL_API = "http://127.0.0.1:8080";
const PROD_API = "https://api.maskedcarrotlabs.com";

export const PUBLIC_API_BASE = envText(process.env.NEXT_PUBLIC_API_URL) || (useLocalDefaultApi ? LOCAL_API : PROD_API);
export const API_BASE = PUBLIC_API_BASE;

export const PUBLIC_SITE_ORIGIN =
  envText(process.env.NEXT_PUBLIC_SITE_URL) ||
  (useLocalDefaultApi ? "http://127.0.0.1:3001" : "https://goodword.maskedcarrotlabs.com");

export function isBrowserLocalMockApp(): boolean {
  if (typeof window === "undefined") return false;
  if (USE_BROWSER_MOCK || IS_TEST_MODE) return true;
  return localStorage.getItem("goodword_try_demo_local") === "1";
}
