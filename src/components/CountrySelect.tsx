"use client";

import { useEffect, useRef, useState } from "react";
import ReactCountryFlag from "react-country-flag";

type Opt = { code: string; name: string };

export default function CountrySelect({
  value,
  onChange,
  options,
  id,
}: {
  value: string;
  onChange: (code: string) => void;
  options: Opt[];
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = options.find((o) => o.code === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [open]);

  return (
    <div className="relative min-w-0 max-w-full" ref={rootRef}>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="input relative w-full min-w-0 max-w-full text-left flex items-center gap-2.5 pr-10 appearance-none"
        disabled={!options.length}
        title={current ? `${current.name} (${current.code})` : undefined}
      >
        {current && (
          <>
            <span className="shrink-0 w-6 flex items-center justify-center" aria-hidden>
              <ReactCountryFlag countryCode={current.code} svg title={current.code} style={{ width: "1.35em", height: "1.35em" }} />
            </span>
            <span className="flex-1 min-w-0 truncate">
              {current.name} <span className="text-slate-500">({current.code})</span>
            </span>
            <span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="opacity-70">
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </>
        )}
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg ring-1 ring-black/5"
        >
          {options.map((c) => (
            <li key={c.code} role="option" aria-selected={c.code === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(c.code);
                  setOpen(false);
                }}
                className={`w-full min-w-0 text-left flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-slate-50 ${
                  c.code === value ? "bg-brand-50" : ""
                }`}
                title={`${c.name} (${c.code})`}
              >
                <span className="w-6 flex justify-center shrink-0" aria-hidden>
                  <ReactCountryFlag countryCode={c.code} svg title={c.code} style={{ width: "1.35em", height: "1.35em" }} />
                </span>
                <span className="min-w-0 flex-1 truncate text-left">
                  {c.name} <span className="text-slate-500">({c.code})</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
