"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { listSortedIanaTimezones } from "@/lib/ianaTimezones";
import { getTimezonesForCountry } from "@/lib/countryTimezones";

type Props = {
  id?: string;
  value: string;
  onChange: (iana: string) => void;
  disabled?: boolean;
  className?: string;
  /** Shown when no value yet */
  placeholder?: string;
  /**
   * ISO-3166 alpha-2 country code. When provided, the dropdown surfaces zones for that
   * country in a top group ("Time zones in <country>") so users don't have to scroll
   * through the full IANA list. The full list is still available below.
   */
  countryCode?: string;
  /**
   * Optional human-readable country label, used as the heading for the country group
   * (e.g. "Time zones in United States"). Falls back to `countryCode` when omitted.
   */
  countryLabel?: string;
};

export default function TimezoneCombobox({
  id: idProp,
  value,
  onChange,
  disabled,
  className = "",
  placeholder = "Search time zones…",
  countryCode,
  countryLabel,
}: Props) {
  const autoId = useId();
  const listboxId = `${autoId}-tz-list`;
  const inputId = idProp ?? `${autoId}-tz-input`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});

  const allZones = useMemo(() => {
    const base = listSortedIanaTimezones();
    const v = (value || "").trim();
    if (v && !base.includes(v)) {
      return [v, ...base].sort((a, b) => a.localeCompare(b));
    }
    return base;
  }, [value]);

  /** Zones that belong to the selected country (intersection with the full list). */
  const countryZones = useMemo(() => {
    if (!countryCode) return [] as string[];
    const set = new Set(allZones);
    return getTimezonesForCountry(countryCode).filter((z) => set.has(z));
  }, [allZones, countryCode]);

  /**
   * When grouping, "other" is everything that isn't already in the country group, so we
   * never show the same zone twice. The currently selected zone is hoisted into the
   * country group too (when it actually belongs there).
   */
  const otherZones = useMemo(() => {
    if (countryZones.length === 0) return allZones;
    const inCountry = new Set(countryZones);
    return allZones.filter((z) => !inCountry.has(z));
  }, [allZones, countryZones]);

  const q = query.trim().toLowerCase();
  const matches = useCallback((z: string) => (q ? z.toLowerCase().includes(q) : true), [q]);

  const filteredCountry = useMemo(() => countryZones.filter(matches), [countryZones, matches]);
  const filteredOther = useMemo(() => otherZones.filter(matches), [otherZones, matches]);
  const totalFiltered = filteredCountry.length + filteredOther.length;
  const groupHeading = countryLabel || countryCode || "";

  const reposition = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
        const maxH = Math.min(500, Math.max(120, window.innerHeight - r.bottom - 16));
    setPanelStyle({
      position: "fixed",
      left: r.left,
      top: r.bottom + 4,
      width: r.width,
      maxHeight: maxH,
      zIndex: 50,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    const RO = typeof ResizeObserver !== "undefined" ? ResizeObserver : null;
    const ro = RO ? new RO(reposition) : null;
    if (ro && rootRef.current) ro.observe(rootRef.current);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      ro?.disconnect();
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
      setQuery("");
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const display = (value || "").trim() || "—";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        id={inputId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
          setQuery("");
        }}
        className="input w-full flex cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="min-w-0 truncate font-normal tabular-nums">{display}</span>
        <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={inputId}
          style={panelStyle}
          className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-slate-900/5"
        >
          <div className="shrink-0 border-b border-slate-100 p-2">
            <input
              className="input w-full py-2 text-sm"
              autoFocus
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  setOpen(false);
                  setQuery("");
                }
              }}
            />
          </div>
          <ul
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain py-1"
            role="presentation"
          >
            {totalFiltered === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">No matching time zones.</li>
            ) : (
              <>
                {filteredCountry.length > 0 && (
                  <li role="presentation">
                    <div className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {groupHeading ? `Time zones in ${groupHeading}` : "Time zones in this country"}
                    </div>
                    <ul role="presentation">
                      {filteredCountry.map((z) => (
                        <li key={`c-${z}`} role="option" aria-selected={z === value}>
                          <button
                            type="button"
                            className={`flex w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                              z === value ? "bg-brand-50/80 font-medium text-brand-900" : "text-slate-800"
                            }`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              onChange(z);
                              setOpen(false);
                              setQuery("");
                            }}
                          >
                            {z}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                )}
                {filteredOther.length > 0 && (
                  <li role="presentation">
                    {filteredCountry.length > 0 && (
                      <div className="mt-1 border-t border-slate-100 px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        All time zones
                      </div>
                    )}
                    <ul role="presentation">
                      {filteredOther.map((z) => (
                        <li key={`a-${z}`} role="option" aria-selected={z === value}>
                          <button
                            type="button"
                            className={`flex w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                              z === value ? "bg-brand-50/80 font-medium text-brand-900" : "text-slate-800"
                            }`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              onChange(z);
                              setOpen(false);
                              setQuery("");
                            }}
                          >
                            {z}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
