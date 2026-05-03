"use client";

import { useMemo, useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { ShimmerBlock } from "@/components/skeletons/Skeleton";
import type { PublicSendRateCountry } from "@/types";

function FlagFor({ code, title }: { code: string; title: string }) {
  if (code === "AQ") {
    return <span className="inline-block w-5 text-center text-slate-200" title={title} aria-hidden>—</span>;
  }
  return (
    <span className="inline-flex w-5 shrink-0" aria-hidden>
      <ReactCountryFlag countryCode={code} svg style={{ width: "1.1em", height: "1.1em" }} title={title} />
    </span>
  );
}

type Props = {
  rows: PublicSendRateCountry[] | null;
  sendRateNotes: string | null;
  myCode: string | null;
  /** Shown after "·" on the matched row (e.g. "your region" on marketing, "you" in dashboard). */
  highlightLabel?: string;
  loading: boolean;
  error: string | null;
  /** Hide the SMS column entirely when SMS isn't available to this viewer (default true). */
  showSms?: boolean;
};

/**
 * Searchable per-country email / SMS credit costs.
 */
export default function SendRatesPanel({ rows, sendRateNotes, myCode, highlightLabel = "you", loading, error, showSms = true }: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!rows) return [];
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (c) => c.name.toLowerCase().includes(s) || c.country_code.toLowerCase().includes(s),
    );
  }, [rows, q]);

  if (error) {
    return <p className="text-sm text-red-700/90">{error}</p>;
  }

  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading all-market rates">
        <ShimmerBlock className="h-3 w-full max-w-sm" />
        <ShimmerBlock className="h-9 w-full max-w-xs rounded-lg" />
        <ShimmerBlock className="h-2.5 w-20" />
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-[1fr_minmax(0,3.5rem)_minmax(0,4.5rem)] items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
            <ShimmerBlock className="h-2 w-14" />
            <ShimmerBlock className="h-2 w-7 justify-self-center" />
            <ShimmerBlock className="h-2 w-5 justify-self-end" />
          </div>
          <ul className="divide-y divide-slate-200">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-2 py-2.5 pl-2 pr-2">
                <ShimmerBlock className="h-5 w-5 shrink-0 rounded" />
                <div className="min-w-0 flex-1 space-y-1">
                  <ShimmerBlock className="h-2.5 w-28 max-w-full" />
                  <ShimmerBlock className="h-2 w-8" />
                </div>
                <ShimmerBlock className="h-3.5 w-4 shrink-0" />
                <ShimmerBlock className="h-3.5 w-4 shrink-0" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (!rows?.length) {
    return <p className="text-sm text-slate-500">Rates are not available.</p>;
  }

  return (
    <div className="space-y-3">
      {sendRateNotes ? <p className="text-xs text-slate-500 leading-relaxed">{sendRateNotes}</p> : null}
      <div>
        <label className="sr-only" htmlFor="rates-search">
          Search countries
        </label>
        <input
          id="rates-search"
          type="search"
          className="w-full max-w-xs rounded-lg border-0 bg-slate-100/80 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/80"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by country or code"
        />
        <p className="text-[11px] text-slate-500 mt-1.5">
          {filtered.length === rows.length ? (
            <>{rows.length} countries</>
          ) : (
            <>
              {filtered.length} of {rows.length} match
            </>
          )}
        </p>
      </div>

      <div className="max-h-[min(52vh,28rem)] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[18rem] text-left text-sm">
          <caption className="sr-only">Credit cost by country: email and SMS per segment</caption>
          <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
            <tr className="text-[10px] font-medium uppercase tracking-widest text-slate-500 border-b border-slate-100">
              <th className="py-2.5 pl-3 pr-2" scope="col">
                Country
              </th>
              <th className="py-2.5 px-2" scope="col">
                Email
              </th>
              {showSms && (
                <th className="py-2.5 pl-2 pr-3" scope="col">
                  SMS
                </th>
              )}
            </tr>
          </thead>
          <tbody className="text-slate-700 divide-y divide-slate-50">
            {filtered.map((c) => {
              const isMine = myCode === c.country_code;
              return (
                <tr
                  key={c.country_code}
                  className={isMine ? "bg-brand-50/35" : "hover:bg-slate-50"}
                >
                  <th scope="row" className="py-2 pl-3 pr-2 font-normal align-top">
                    <div className="flex items-center gap-2 min-w-0 max-w-[11rem] sm:max-w-[16rem]">
                      <FlagFor code={c.country_code} title={c.name} />
                      <span className="text-slate-800 truncate text-[13px]">
                        {c.name}
                        {isMine && (
                          <span className="ml-1 text-[11px] text-brand-700/90 font-medium">· {highlightLabel}</span>
                        )}
                      </span>
                    </div>
                    <div className="pl-7 text-[10px] text-slate-500 font-mono tabular-nums mt-0.5">{c.country_code}</div>
                  </th>
                  <td className="py-2 px-2 tabular-nums text-slate-800 align-top">{c.email_credits}</td>
                  {showSms && (
                    <td className="py-2 pl-2 pr-3 tabular-nums text-slate-600 text-xs align-top" title="Credits per SMS segment">
                      {c.sms_credits_per_segment}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
