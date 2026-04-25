"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

type Props = {
  /** Shown in aria-label and for screen reader context. */
  label: string;
  children: React.ReactNode;
  /** Slightly larger hit target in dense toolbars */
  size?: "sm" | "md";
};

const SIZE_MAP = { sm: "h-4 w-4", md: "h-5 w-5" } as const;
const HIT = { sm: "h-7 w-7 min-h-7 min-w-7", md: "h-8 w-8 min-h-8 min-w-8" } as const;

/**
 * Info: click to open a short help popover. Sits in a flex row with `items-center` and nearby titles or labels.
 */
export default function InfoTip({ label, children, size = "sm" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  const onDocDown = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open, onDocDown]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      className="relative -mx-0.5 inline-flex shrink-0"
      ref={ref}
    >
      <button
        type="button"
        className={[
          "inline-flex select-none items-center justify-center rounded-full",
          "text-slate-400 transition hover:text-slate-600 hover:bg-slate-100",
          "focus:outline-none focus:ring-2 focus:ring-brand-400/35",
          HIT[size],
        ].join(" ")}
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? popoverId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <svg
          className={SIZE_MAP[size]}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open ? (
        <div
          id={popoverId}
          className="absolute z-[100] right-0 top-full mt-1.5 w-[min(calc(100vw-1.5rem),19rem)] rounded-xl border border-slate-200 bg-white p-3 text-left text-xs text-slate-600 shadow-lg leading-snug"
          role="note"
        >
          <div className="space-y-2 [&_a]:text-brand-600 [&_a]:font-medium [&_a]:hover:underline [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-0.5 [&_code]:text-[0.7rem] [&_p]:[&:not(:last-child)]:mb-0">
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}
