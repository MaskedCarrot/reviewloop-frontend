"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastItem = { id: number; message: string; kind: "success" | "error" };

const ToastContext = createContext<{
  success: (message: string) => void;
  error: (message: string) => void;
} | null>(null);

const AUTO_DISMISS_MS = 3200;

export function useAppToast() {
  const c = useContext(ToastContext);
  if (!c) throw new Error("useAppToast must be used within ToastProvider");
  return c;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, kind: "success" | "error") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-2), { id, message, kind }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  const value = useMemo(
    () => ({
      success: (message: string) => push(message, "success"),
      error: (message: string) => push(message, "error"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto max-w-md rounded-xl border px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur-sm transition ${
              t.kind === "success"
                ? "border-emerald-200/90 bg-emerald-50/95 text-emerald-950 ring-1 ring-inset ring-emerald-200/50"
                : "border-red-200/90 bg-red-50/95 text-red-900 ring-1 ring-inset ring-red-200/50"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Reusable small spinner for primary (white) and secondary (slate) buttons. */
export function ButtonSpinner({ variant = "onPrimary" }: { variant?: "onPrimary" | "onSecondary" | "onEmerald" }) {
  const cls =
    variant === "onPrimary"
      ? "border-white/30 border-t-white"
      : variant === "onEmerald"
        ? "border-emerald-900/25 border-t-emerald-900"
        : "border-slate-400/40 border-t-slate-800";
  return (
    <span
      className={`inline-block h-4 w-4 shrink-0 rounded-full border-2 border-b-transparent animate-spin ${cls}`}
      aria-hidden
    />
  );
}
