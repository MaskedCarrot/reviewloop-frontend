import { dispatchTestMode } from "@/lib/testMode/dispatch";
import { isBrowserLocalMockApp } from "./config";
import { API_BASE } from "./config";

export function useClientMockDispatch(): boolean {
  return typeof window !== "undefined" && isBrowserLocalMockApp();
}

const MOCK_DELAY_MS = 1000;

export async function request<T>(path: string, opts: RequestInit = {}, options: { auth?: boolean } = {}): Promise<T> {
  const auth = options.auth !== false;
  const userId = auth && typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
  if (useClientMockDispatch()) {
    const method = (opts.method || "GET").toUpperCase();
    let body: unknown = undefined;
    if (opts.body && typeof opts.body === "string" && (method === "POST" || method === "PUT" || method === "PATCH")) {
      const raw = opts.body;
      if (raw && raw !== "null" && raw !== "undefined" && raw !== "false") {
        try {
          body = JSON.parse(raw) as unknown;
        } catch {
          body = undefined;
        }
      }
    }
    const isMutating = !["GET", "HEAD", "OPTIONS"].includes(method);
    if (isMutating) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
    }
    return dispatchTestMode(path, method, body, userId, auth) as T;
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(userId ? { "X-User-Id": userId } : {}),
        ...opts.headers,
      },
    });
  } catch (e) {
    const isNetwork = e instanceof TypeError || (e instanceof Error && e.name === "AbortError");
    if (isNetwork) {
      throw new Error("Could not reach the server. Please check your connection and try again.");
    }
    throw e;
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const d = (body as { detail?: unknown }).detail;
    const detailStr = Array.isArray(d)
      ? d.map((x: { msg?: string; loc?: unknown }) => x?.msg || JSON.stringify(x)).join("; ")
      : d;
    throw new Error(
      (detailStr as string) || (body as { error?: string }).error || `Request failed (${res.status})`,
    );
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

export function authHeaderForUserId(): Record<string, string> {
  const id = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
  if (!id) return {};
  return { "X-User-Id": id };
}
