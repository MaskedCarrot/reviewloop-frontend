"use client";

import { useEffect, useRef } from "react";
import { ButtonSpinner } from "./ToastProvider";

type Props = {
  open: boolean;
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

/**
 * App-styled confirm dialog. Use instead of `window.confirm` so destructive
 * flows match the rest of the UI (and so we can theme / test them).
 */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dlg.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dlg}
      onClose={onCancel}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
      aria-modal="true"
      aria-labelledby="confirm-dlg-title"
      className="w-[min(92vw,26rem)] rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-900/40"
    >
      <div className="px-5 pt-5 pb-3">
        <h2 id="confirm-dlg-title" className="text-base font-semibold text-slate-900">
          {title}
        </h2>
        {body ? (
          <div className="mt-2 text-sm leading-relaxed text-slate-600">{body}</div>
        ) : null}
      </div>
      <div className="flex flex-row-reverse items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            void onConfirm();
          }}
          className={[
            "btn h-10 px-4 inline-flex items-center gap-2 font-semibold",
            tone === "danger"
              ? "bg-red-600 text-white border border-red-600 hover:bg-red-700 hover:border-red-700"
              : "bg-brand-600 text-white border border-brand-600 hover:bg-brand-700 hover:border-brand-700",
          ].join(" ")}
        >
          {busy ? (
            <>
              <ButtonSpinner /> Working…
            </>
          ) : (
            confirmLabel
          )}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="btn-ghost h-10 px-4"
        >
          {cancelLabel}
        </button>
      </div>
    </dialog>
  );
}
