"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SHOW_MARKETING_TRY_DEMO, startServerSandboxSession } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ButtonSpinner } from "@/components/ToastProvider";

type Variant = "primary" | "secondary" | "outline" | "link" | "header";

export default function TryDemoButton({
  variant = "secondary",
  className = "",
  children,
  label = "Try demo (no sign-in)",
  /** Shown on the button next to the spinner while the demo is starting. */
  loadingLabel = "Starting demo…",
}: {
  variant?: Variant;
  className?: string;
  children?: React.ReactNode;
  label?: string;
  loadingLabel?: string;
}) {
  const { login } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!SHOW_MARKETING_TRY_DEMO) return null;

  const v =
    variant === "primary"
      ? "btn-primary"
      : variant === "secondary"
        ? "btn-secondary"
        : variant === "header"
          ? "btn-ghost text-sm sm:text-base px-2 sm:px-3 text-brand-800 font-medium border border-brand-200/80 bg-brand-50/50 h-9 sm:min-h-[2.5rem] inline-flex items-center justify-center gap-2"
        : variant === "outline"
          ? "w-full h-12 rounded-full border-2 border-brand-300 bg-white text-brand-800 font-semibold text-sm hover:bg-brand-50 transition"
          : "text-sm font-semibold text-brand-700 hover:text-brand-900 hover:underline";

  const spinnerVariant = variant === "primary" ? "onPrimary" : "onSecondary";

  async function run() {
    setBusy(true);
    setErr("");
    try {
      const u = await startServerSandboxSession();
      login(u);
      router.push("/dashboard");
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : "Could not start demo";
      setErr(m);
    } finally {
      setBusy(false);
    }
  }

  const showSpinner = busy;

  return (
    <div className="inline-flex flex-col gap-1 items-stretch sm:items-start">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className={`${v} ${className}`.trim()}
        aria-busy={showSpinner}
      >
        {children ?? (
          <span className="inline-flex items-center justify-center gap-2 min-w-0">
            {showSpinner ? <ButtonSpinner variant={spinnerVariant} /> : null}
            {showSpinner ? <span className="truncate">{loadingLabel}</span> : <span className="truncate">{label}</span>}
          </span>
        )}
      </button>
      {err && <p className="text-xs text-red-600 max-w-sm">{err}</p>}
    </div>
  );
}
