"use client";

import type { ReactNode } from "react";

export type TabItem<TValue extends string> = {
  value: TValue;
  label: string;
  /** Optional badge/count rendered next to the label. */
  badge?: ReactNode;
};

/**
 * Compact pill-style tab bar. Used for in-page navigation when a page has 2-4 sub-views.
 * The aim is the user can immediately see all sub-sections of the page on screen, without
 * scrolling to discover them.
 */
export default function Tabs<TValue extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className = "",
}: {
  items: TabItem<TValue>[];
  value: TValue;
  onChange: (next: TValue) => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={[
        "inline-flex w-full sm:w-auto rounded-2xl border border-slate-200/80 bg-slate-100/70 p-1 gap-0.5",
        className,
      ].join(" ")}
    >
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={[
              "relative flex-1 sm:flex-none min-h-[2.25rem] px-4 py-1.5 rounded-xl text-sm font-semibold transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-400/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              active
                ? "bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_14px_-8px_rgba(15,23,42,0.16)] ring-1 ring-slate-200/70"
                : "text-slate-600 hover:text-slate-900",
            ].join(" ")}
          >
            <span className="inline-flex items-center gap-2">
              {it.label}
              {it.badge != null ? (
                <span
                  className={[
                    "inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                    active ? "bg-warm-50 text-warm-700" : "bg-slate-200 text-slate-700",
                  ].join(" ")}
                >
                  {it.badge}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
