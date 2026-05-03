"use client";

import { useEffect, useId } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignName: string;
  busy: boolean;
  onConfirm: () => void;
  error?: string | null;
};

/**
 * Replaces the browser `confirm` for pausing a follow-up campaign; matches the app's modal look.
 */
export default function PauseCampaignConfirmDialog({ open, onOpenChange, campaignName, busy, onConfirm, error }: Props) {
  const labelId = useId();

  useEffect(() => {
    if (!open) return;
    const t = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onOpenChange(false);
    };
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  }, [open, busy, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      onClick={() => {
        if (!busy) onOpenChange(false);
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-1 bg-gradient-to-br from-amber-50/90 via-white to-rose-50/40">
          <div className="rounded-[14px] bg-white/80 px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-800"
                aria-hidden
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H8zm7 0a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 id={labelId} className="text-base font-semibold text-slate-900 leading-tight">
                  Pause "{campaignName}"?
                </h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  No new people can be added, and we won't schedule the next follow-up for anyone in this list.{" "}
                  <span className="text-slate-700">Messages that are already scheduled (including follow-ups) still send.</span>{" "}
                  You can resume the campaign any time.
                </p>
                {error ? (
                  <p className="text-sm text-red-800 bg-red-50 border border-red-100 rounded-lg px-2.5 py-2 mt-3" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
          <button
            type="button"
            className="btn-ghost text-sm h-9 px-4"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:opacity-50"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Pausing…" : "Pause campaign"}
          </button>
        </div>
      </div>
    </div>
  );
}
