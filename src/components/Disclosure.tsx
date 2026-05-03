"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";

/**
 * Progressive disclosure — keep the page short by default and let users opt into long-tail
 * content (sample requests, advanced filters, technical reference tables, etc).
 *
 * Renders as a native <details>-shaped affordance for screen readers. We don't use the
 * <details>/<summary> elements directly because we want the chevron animation and full
 * control over keyboard focus styles.
 */
export default function Disclosure({
  label,
  defaultOpen = false,
  children,
  hint,
  size = "md",
}: {
  label: ReactNode;
  hint?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  const labelClass =
    size === "sm"
      ? "text-xs font-semibold text-slate-700"
      : "text-sm font-semibold text-slate-800";

  return (
    <div
      className={[
        "rounded-2xl border bg-white transition-shadow",
        open
          ? "border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-28px_rgba(15,23,42,0.16)]"
          : "border-slate-200/85 shadow-soft",
      ].join(" ")}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={[
          "w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-left",
          "rounded-2xl hover:bg-slate-50/70 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-400/30 focus-visible:ring-offset-2",
        ].join(" ")}
      >
        <span className="min-w-0 flex-1">
          <span className={`${labelClass} block truncate`}>{label}</span>
          {hint && !open ? (
            <span className="block text-xs text-slate-500 mt-0.5 truncate">{hint}</span>
          ) : null}
        </span>
        <span
          className={[
            "grid h-7 w-7 shrink-0 place-items-center rounded-full transition-all",
            open ? "bg-warm-50 text-warm-700 rotate-45" : "bg-slate-100 text-slate-600",
          ].join(" ")}
          aria-hidden
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {open ? (
        <div id={id} className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-slate-100">
          {children}
        </div>
      ) : null}
    </div>
  );
}
