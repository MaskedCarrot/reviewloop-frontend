"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  canEdit?: boolean;
  onEdit?: () => void | Promise<void>;
  canOptOut: boolean;
  onOptOut: () => void | Promise<void>;
  canOptIn: boolean;
  onOptIn: () => void | Promise<void>;
  onRemove: () => void | Promise<void>;
};

const MENU_WIDTH = 192; // w-48

function placeMenu(
  button: DOMRect,
  menuHeight: number,
): { top: number; left: number } {
  const pad = 8;
  const gap = 6;
  let top = button.bottom + gap;
  if (top + menuHeight > window.innerHeight - pad) {
    top = button.top - menuHeight - gap;
  }
  top = Math.max(pad, Math.min(top, window.innerHeight - menuHeight - pad));
  let left = button.right - MENU_WIDTH;
  left = Math.max(pad, Math.min(left, window.innerWidth - MENU_WIDTH - pad));
  return { top, left };
}

export default function ContactMoreMenu({
  canEdit,
  onEdit,
  canOptOut,
  onOptOut,
  canOptIn,
  onOptIn,
  onRemove,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const b = btnRef.current?.getBoundingClientRect();
    const m = menuRef.current;
    if (!b) return;
    const items = (canEdit ? 1 : 0) + (canOptOut ? 1 : 0) + (canOptIn ? 1 : 0) + 1;
    const h = m?.offsetHeight ?? items * 44 + 8;
    setPos(placeMenu(b, h));
  }, [canEdit, canOptOut, canOptIn]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const id = requestAnimationFrame(() => updatePosition());
    return () => cancelAnimationFrame(id);
  }, [open, canEdit, canOptOut, canOptIn, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menuContent =
    open && typeof document !== "undefined" ? (
      <div
        ref={menuRef}
        role="menu"
        className="fixed z-[300] w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-slate-900/5"
        style={{ top: pos.top, left: pos.left }}
      >
        {canEdit && onEdit && (
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3.5 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            onClick={async () => {
              setOpen(false);
              await onEdit();
            }}
          >
            Edit contact…
          </button>
        )}
        {canOptOut && (
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3.5 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            onClick={async () => {
              setOpen(false);
              await onOptOut();
            }}
          >
            Opt out
          </button>
        )}
        {canOptIn && (
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3.5 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            onClick={async () => {
              setOpen(false);
              await onOptIn();
            }}
          >
            Opt back in
          </button>
        )}
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3.5 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
          onClick={async () => {
            setOpen(false);
            await onRemove();
          }}
        >
          Remove contact…
        </button>
      </div>
    ) : null;

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="More actions"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="sr-only">Open menu</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>
      {menuContent && createPortal(menuContent, document.body)}
    </div>
  );
}
