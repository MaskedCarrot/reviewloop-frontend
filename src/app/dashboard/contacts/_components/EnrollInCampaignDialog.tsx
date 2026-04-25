"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  enrollInSequenceBatched,
  ENROLL_MAX_PER_REQUEST,
  fetchAllContactIdsMatching,
  getIngestPresets,
  getMyBusiness,
  listContacts,
  listMyLocations,
} from "@/lib/api";
import InfoTip from "@/components/InfoTip";
import { ButtonSpinner, useAppToast } from "@/components/ToastProvider";
import type { Business, BusinessLocation, Contact, IngestPresets } from "@/types";
import { ContactListStoreFilter } from "./ContactStoreSelects";
import { shortDate } from "./contactFormat";

const PREVIEW_PAGE = 100;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sequenceId: string;
  campaignName: string;
  onEnrolled: () => void;
};

/**
 * Add people to a follow-up campaign: search + ingestion date range, optional "select everyone matching"
 * (full list, not one page), and batched enroll (200 per API call).
 */
export default function EnrollInCampaignDialog({ open, onOpenChange, sequenceId, campaignName, onEnrolled }: Props) {
  const [enrollSearch, setEnrollSearch] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [enrollContacts, setEnrollContacts] = useState<Contact[]>([]);
  const [matchTotal, setMatchTotal] = useState(0);
  const [enrollPicked, setEnrollPicked] = useState<Set<string>>(() => new Set());
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [allMatchingBusy, setAllMatchingBusy] = useState(false);
  const [ingestPresets, setIngestPresets] = useState<IngestPresets | null>(null);
  const [enrollLocations, setEnrollLocations] = useState<BusinessLocation[]>([]);
  const [enrollDefaultLocationId, setEnrollDefaultLocationId] = useState<string | null>(null);
  const [enrollStoreId, setEnrollStoreId] = useState("");
  const [searchListStoreId, setSearchListStoreId] = useState("");
  const toast = useAppToast();

  const defaultStoreLabel = useMemo(() => {
    if (!enrollDefaultLocationId) {
      return "Default store (set under Settings if you add a store)";
    }
    const loc = enrollLocations.find((l) => l.id === enrollDefaultLocationId);
    return loc ? `Default: ${loc.name}` : "Default business store";
  }, [enrollDefaultLocationId, enrollLocations]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setQDebounced(enrollSearch.trim()), 200);
    return () => clearTimeout(t);
  }, [enrollSearch, open]);

  useEffect(() => {
    if (!open) {
      setEnrollSearch("");
      setQDebounced("");
      setCreatedFrom("");
      setCreatedTo("");
      setEnrollPicked(new Set());
      setEnrollContacts([]);
      setMatchTotal(0);
      setEnrollError("");
      setIngestPresets(null);
      setEnrollLocations([]);
      setEnrollDefaultLocationId(null);
      setEnrollStoreId("");
      setSearchListStoreId("");
      return;
    }
    getIngestPresets()
      .then(setIngestPresets)
      .catch(() => setIngestPresets(null));
    (async () => {
      const [b, locs] = await Promise.all([
        getMyBusiness().catch(() => ({ business: null })),
        listMyLocations().catch(() => ({ locations: [] as BusinessLocation[], default_location_id: null as string | null })),
      ]);
      setEnrollDefaultLocationId((b.business as Business | null)?.default_location_id ?? locs.default_location_id ?? null);
      setEnrollLocations(locs.locations);
    })();
  }, [open, sequenceId]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setEnrollLoading(true);
      try {
        const c = await listContacts({
          q: qDebounced || undefined,
          createdFrom: createdFrom || undefined,
          createdTo: createdTo || undefined,
          locationId: searchListStoreId || undefined,
          page: 1,
          pageSize: PREVIEW_PAGE,
        });
        setEnrollContacts(c.contacts);
        setMatchTotal(c.total);
      } catch {
        setEnrollContacts([]);
        setMatchTotal(0);
      } finally {
        setEnrollLoading(false);
      }
    })();
  }, [open, qDebounced, createdFrom, createdTo, searchListStoreId, sequenceId]);

  const filterActive = Boolean(qDebounced || createdFrom || createdTo || searchListStoreId);
  const pickedCount = enrollPicked.size;

  const toggle = useCallback((id: string) => {
    setEnrollPicked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const selectAllOnPage = useCallback(() => {
    setEnrollPicked((prev) => {
      const n = new Set(prev);
      enrollContacts.forEach((c) => n.add(c.id));
      return n;
    });
  }, [enrollContacts]);

  const clearPicked = useCallback(() => setEnrollPicked(new Set()), []);

  const selectAllMatching = useCallback(async () => {
    if (matchTotal === 0) {
      setEnrollError("No one matches the current search and dates.");
      return;
    }
    if (
      matchTotal > 500 &&
      !confirm(
        `Select all ${matchTotal.toLocaleString()} people matching these filters? You can add them to the campaign in the next step.`,
      )
    ) {
      return;
    }
    setAllMatchingBusy(true);
    setEnrollError("");
    try {
      const { ids, total, truncated } = await fetchAllContactIdsMatching({
        q: qDebounced || undefined,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
        locationId: searchListStoreId || undefined,
      });
      setEnrollPicked(new Set(ids));
      if (truncated) {
        setEnrollError(
          `Selected first ${ids.length.toLocaleString()} of many matches (service limit). Narrow filters if needed.`,
        );
        return;
      }
      if (ids.length < total) {
        setEnrollError(`Selected ${ids.length} of ${total} matches.`);
        return;
      }
    } catch (e) {
      setEnrollError(e instanceof Error ? e.message : "Could not load contacts");
    } finally {
      setAllMatchingBusy(false);
    }
  }, [matchTotal, qDebounced, createdFrom, createdTo, searchListStoreId]);

  const onPageIds = enrollContacts.map((c) => c.id);
  const allOnPageSelected = onPageIds.length > 0 && onPageIds.every((id) => enrollPicked.has(id));
  const someOnPageSelected = onPageIds.some((id) => enrollPicked.has(id)) && !allOnPageSelected;

  async function runEnroll() {
    setEnrollError("");
    if (!sequenceId?.trim()) {
      setEnrollError("No campaign is selected. Close and try again from the campaign page.");
      return;
    }
    if (enrollPicked.size === 0) {
      setEnrollError('Select people, use "All on this page" or "Everyone matching…", or use the People list.');
      return;
    }
    if (
      pickedCount > 300 &&
      !confirm(`Add ${pickedCount.toLocaleString()} people to this campaign? This may use credits for each first-step send.`)
    ) {
      return;
    }
    setEnrollLoading(true);
    try {
      const r = await enrollInSequenceBatched(sequenceId, Array.from(enrollPicked), {
        locationId: enrollStoreId.trim() || null,
      });
      if (r.errors.length && r.enrolled.length === 0) {
        setEnrollError(
          r.errors[0] ? `${r.errors[0].error} (${r.errors[0].contact_id.slice(0, 6)}…)` : "No one was added.",
        );
        return;
      }
      onEnrolled();
      setEnrollPicked(new Set());
      if (r.enrolled.length > 0) {
        toast.success(
          r.errors.length
            ? `Added ${r.enrolled.length} — ${r.errors.length} skipped`
            : `Added ${r.enrolled.length} to this campaign`,
        );
      }
      if (r.errors.length) {
        setEnrollError(
          `Added ${r.enrolled.length}. ${r.errors.length} skipped: ${r.errors[0].error}…`,
        );
        return;
      }
      onOpenChange(false);
    } catch (e) {
      setEnrollError(e instanceof Error ? e.message : "Could not enroll contacts");
    } finally {
      setEnrollLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 bg-black/30"
      role="dialog"
      aria-modal="true"
      onClick={() => {
        if (!enrollLoading && !allMatchingBusy) onOpenChange(false);
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-slate-900 flex-1 min-w-0">Add people to "{campaignName}"</h3>
            <InfoTip size="md" label="How adding people to this campaign works">
              <p>
                Search and date range match the <strong>People</strong> list (same as List tab). The table is a
                sample — use <strong>Everyone matching</strong> to load every id, then add. We skip people already in this
                campaign and dedupe. Adds go in API batches of {ENROLL_MAX_PER_REQUEST} contacts. You can do the same from
                the list with <strong>All matching</strong>.
              </p>
            </InfoTip>
          </div>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            Search, optional store, and ingested-on dates in your business time zone — then &quot;Everyone matching&quot; to
            select the full list.
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-end sm:gap-x-2 sm:gap-y-2">
            <div className="sm:col-span-3 min-w-0">
              <label className="text-[10px] font-medium uppercase tracking-wide text-slate-500" htmlFor="enroll-search">
                Search
              </label>
              <input
                id="enroll-search"
                className="input mt-0.5 w-full h-9 text-sm"
                placeholder="Name, email, external ref…"
                value={enrollSearch}
                onChange={(e) => setEnrollSearch(e.target.value)}
              />
            </div>
            <ContactListStoreFilter
              className="sm:col-span-3 min-w-0"
              id="enroll-list-store"
              locations={enrollLocations}
              value={searchListStoreId}
              onChange={setSearchListStoreId}
              disabled={enrollLoading}
            />
            <div className="sm:col-span-6 min-w-0">
              <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Quick
                {ingestPresets?.timezone ? (
                  <span className="ml-1 font-normal normal-case text-slate-500" title="Business time zone (Settings)">
                    ({ingestPresets.timezone})
                  </span>
                ) : null}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/80 text-slate-800 hover:bg-slate-100 disabled:opacity-50"
                  disabled={!ingestPresets}
                  onClick={() => {
                    if (!ingestPresets) return;
                    setCreatedFrom(ingestPresets.today);
                    setCreatedTo(ingestPresets.today);
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/80 text-slate-800 hover:bg-slate-100 disabled:opacity-50"
                  disabled={!ingestPresets}
                  onClick={() => {
                    if (!ingestPresets) return;
                    setCreatedFrom(ingestPresets.yesterday);
                    setCreatedTo(ingestPresets.yesterday);
                  }}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/80 text-slate-800 hover:bg-slate-100 disabled:opacity-50"
                  disabled={!ingestPresets}
                  onClick={() => {
                    if (!ingestPresets) return;
                    setCreatedFrom(ingestPresets.last7_from);
                    setCreatedTo(ingestPresets.last7_to);
                  }}
                >
                  Last 7 days
                </button>
              </div>
            </div>
            <div className="sm:col-span-6 min-w-0">
              <label className="text-[10px] font-medium uppercase tracking-wide text-slate-500" htmlFor="enroll-ingest-from">
                Ingested from
              </label>
              <input
                id="enroll-ingest-from"
                type="date"
                className="input mt-0.5 w-full h-9 text-sm"
                value={createdFrom}
                onChange={(e) => setCreatedFrom(e.target.value)}
              />
            </div>
            <div className="sm:col-span-4 min-w-0">
              <label className="text-[10px] font-medium uppercase tracking-wide text-slate-500" htmlFor="enroll-ingest-to">
                to
              </label>
              <input
                id="enroll-ingest-to"
                type="date"
                className="input mt-0.5 w-full h-9 text-sm"
                value={createdTo}
                onChange={(e) => setCreatedTo(e.target.value)}
              />
            </div>
            {filterActive && (
              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  className="h-9 text-sm font-medium text-slate-600 hover:text-slate-900 w-full"
                  onClick={() => {
                    setEnrollSearch("");
                    setQDebounced("");
                    setCreatedFrom("");
                    setCreatedTo("");
                    setSearchListStoreId("");
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          {enrollLocations.length > 1 ? (
            <div className="mt-3 min-w-0 sm:max-w-md">
              <label className="text-[10px] font-medium uppercase tracking-wide text-slate-500" htmlFor="enroll-store">
                Store
              </label>
              <select
                id="enroll-store"
                className="input mt-0.5 w-full h-9 text-sm"
                value={enrollStoreId}
                onChange={(e) => setEnrollStoreId(e.target.value)}
              >
                <option value="">{defaultStoreLabel}</option>
                {enrollLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                {enrollDefaultLocationId
                  ? "First messages use the selected store's review links. The default is your business default store."
                  : "Pick which store's Google/Yelp/Review links to use. With no default store set, we still resolve a store for each send; choose a store to pin this add."}
              </p>
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-slate-600" aria-live="polite">
              {enrollLoading
                ? "…"
                : `${matchTotal.toLocaleString()} ${matchTotal === 1 ? "match" : "matches"}`}{" "}
              · preview{" "}
              {Math.min(PREVIEW_PAGE, enrollContacts.length) || 0} rows
            </span>
            <button
              type="button"
              className="btn-ghost h-8 px-2 text-xs"
              onClick={selectAllOnPage}
              disabled={!enrollContacts.length || enrollLoading}
            >
              All on preview
            </button>
            <button
              type="button"
              className="btn-ghost h-8 px-2 text-xs font-semibold text-brand-800"
              onClick={() => void selectAllMatching()}
              disabled={enrollLoading || allMatchingBusy || matchTotal === 0}
            >
              {allMatchingBusy ? "Loading…" : "Everyone matching…"}
            </button>
            <button type="button" className="btn-ghost h-8 px-2 text-xs" onClick={clearPicked} disabled={enrollPicked.size === 0}>
              Clear selection
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-2 min-h-0">
          {enrollLoading && enrollContacts.length === 0 && !qDebounced && !createdFrom && !createdTo ? (
            <p className="text-sm text-slate-500 p-2">Loading…</p>
          ) : (
            <ul className="space-y-0.5 pr-0.5">
              {enrollContacts.map((p) => {
                const checked = enrollPicked.has(p.id);
                return (
                  <li key={p.id}>
                    <label className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded text-brand-600"
                        checked={checked}
                        onChange={() => toggle(p.id)}
                      />
                      <span className="text-sm text-slate-800 truncate">
                        {p.name || p.email || p.phone_e164 || p.id}
                        {p.unsubscribed_at ? <span className="text-amber-700/90"> · opted out</span> : null}
                        {p.unsubscribed_at && p.last_message_at ? (
                          <span className="text-slate-400"> · last send {shortDate(p.last_message_at)}</span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          {matchTotal > PREVIEW_PAGE && (
            <p className="text-[11px] text-slate-500 px-2 py-2">
              Preview is limited to the first {PREVIEW_PAGE} rows. Use <strong>Everyone matching…</strong> to select
              the full {matchTotal.toLocaleString()}.
            </p>
          )}
        </div>
        {enrollError && <p className="text-xs text-amber-900 px-4 pb-1 whitespace-pre-wrap">{enrollError}</p>}
        <div className="p-3 border-t border-slate-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <p className="text-xs text-slate-500" aria-live="polite">
            {pickedCount.toLocaleString()} selected
            {someOnPageSelected && !allOnPageSelected && <span> (some on preview)</span>}
            {allOnPageSelected && onPageIds.length > 0 && <span> (all on preview)</span>}
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => onOpenChange(false)} disabled={enrollLoading}>
              Close
            </button>
            <button
              type="button"
              className="btn-primary inline-flex items-center justify-center gap-2"
              onClick={() => void runEnroll()}
              disabled={enrollLoading || allMatchingBusy}
            >
              {enrollLoading ? (
                <>
                  <ButtonSpinner />
                  Adding…
                </>
              ) : pickedCount ? (
                `Add ${pickedCount.toLocaleString()} to campaign`
              ) : (
                "Add to campaign"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
