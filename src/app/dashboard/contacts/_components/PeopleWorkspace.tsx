"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  enrollInSequenceBatched,
  fetchAllContactIdsMatching,
  getSessionBootstrap,
  listCampaigns,
  listContacts,
  listSequences,
} from "@/lib/api";
import { countrySupportsSms, getSmsSupportedList } from "@/lib/countryUi";
import { useBrowserLocalMockApp } from "@/lib/useBrowserLocalMockApp";
import { ButtonSpinner, useAppToast } from "@/components/ToastProvider";
import ActiveReviewPlatformsStrip from "@/components/ActiveReviewPlatformsStrip";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import InfoTip from "@/components/InfoTip";
import { activePlatformChips } from "@/lib/reviewPlatformsFromLocations";
import type { Business, BusinessLocation, Campaign, Contact, IngestPresets, PublicConfig, ReviewSequence } from "@/types";
import SendsLogPanel from "@/components/SendsLogPanel";
import AddPeopleDialog from "./AddPeopleDialog";
import { ContactListStoreFilter } from "./ContactStoreSelects";
import ContactsTable from "./ContactsTable";
import ListStats from "./ListStats";

const DEFAULT_PAGE_SIZE = 25;

export default function PeopleWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isSendsTab = searchParams.get("tab") === "sends";
  const [addPeopleOpen, setAddPeopleOpen] = useState(false);

  const isLocalMock = useBrowserLocalMockApp();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [listHasNext, setListHasNext] = useState(false);
  const [emailTemplateId, setEmailTemplateId] = useState("");
  const [smsTemplateId, setSmsTemplateId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [listStoreId, setListStoreId] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sequences, setSequences] = useState<ReviewSequence[]>([]);
  const [rowSelected, setRowSelected] = useState<Set<string>>(() => new Set());
  const [enrollTargetId, setEnrollTargetId] = useState("");
  const [enrollBulkBusy, setEnrollBulkBusy] = useState(false);
  const [enrollBulkHint, setEnrollBulkHint] = useState("");
  const [enrollAllMatchingBusy, setEnrollAllMatchingBusy] = useState(false);
  const [enrollStoreId, setEnrollStoreId] = useState("");
  const [loading, setLoading] = useState(true);
  const [biz, setBiz] = useState<Business | null>(null);
  const [cfg, setCfg] = useState<PublicConfig | null>(null);
  const [ingestPresets, setIngestPresets] = useState<IngestPresets | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | undefined>(undefined);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const toast = useAppToast();

  const platformChips = useMemo(() => activePlatformChips(locations, cfg), [locations, cfg]);
  const displayTimeZone = useMemo(
    () => (ingestPresets?.timezone || biz?.timezone || "UTC").trim() || "UTC",
    [ingestPresets, biz],
  );

  const activeSequences = useMemo(() => sequences.filter((s) => s.is_active), [sequences]);

  const sms =
    (!!biz && countrySupportsSms(biz.country_code, getSmsSupportedList(cfg))) || (isLocalMock && !!biz);

  const filterActive = Boolean(searchQ.trim() || createdFrom || createdTo || listStoreId);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQ(searchInput);
      setListPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setListPage(1);
  }, [createdFrom, createdTo, listPageSize, listStoreId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, boot, m, seq] = await Promise.all([
        listContacts({
          q: searchQ.trim() || undefined,
          createdFrom: createdFrom || undefined,
          createdTo: createdTo || undefined,
          locationId: listStoreId || undefined,
          page: listPage,
          pageSize: listPageSize,
        }),
        getSessionBootstrap().catch(() => null),
        listCampaigns(),
        listSequences({ page: 1, pageSize: 2000, status: "all" }),
      ]);
      if (c.contacts.length === 0 && c.total > 0) {
        const last = Math.max(1, Math.ceil(c.total / listPageSize));
        if (listPage > last) {
          setListPage(last);
          return;
        }
      }
      setContacts(c.contacts);
      setListTotal(c.total);
      setListHasNext(c.has_next);
      if (boot) {
        setBiz(boot.business);
        setCfg(boot.config);
        setIngestPresets(boot.ingest_presets);
        setCreditBalance(boot.credits?.balance);
        setLocations(boot.locations?.locations ?? []);
      }
      setCampaigns(m.campaigns);
      setSequences(seq.sequences);
    } finally {
      setLoading(false);
    }
  }, [searchQ, createdFrom, createdTo, listPage, listPageSize, listStoreId]);

  const onToggleRow = useCallback((id: string) => {
    setRowSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
    setEnrollBulkHint("");
  }, []);

  const onToggleAllOnPage = useCallback(() => {
    setRowSelected((prev) => {
      const ids = contacts.map((c) => c.id);
      if (ids.length === 0) return prev;
      const all = ids.every((id) => prev.has(id));
      const n = new Set(prev);
      if (all) for (const id of ids) n.delete(id);
      else for (const id of ids) n.add(id);
      return n;
    });
    setEnrollBulkHint("");
  }, [contacts]);

  const clearRowSelection = useCallback(() => {
    setRowSelected(new Set());
    setEnrollBulkHint("");
  }, []);

  const selectAllMatchingFilters = useCallback(async () => {
    if (listTotal === 0) {
      setEnrollBulkHint("No one matches the current search and date filters.");
      return;
    }
    if (listTotal > 500 && !confirm(`Select all ${listTotal.toLocaleString()} people who match the current filters?`)) {
      return;
    }
    setEnrollAllMatchingBusy(true);
    setEnrollBulkHint("");
    try {
      const { ids, total, truncated } = await fetchAllContactIdsMatching({
        q: searchQ.trim() || undefined,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
        locationId: listStoreId || undefined,
      });
      setRowSelected(new Set(ids));
      if (truncated) {
        setEnrollBulkHint(
          `Selected first ${ids.length.toLocaleString()} matches (limit). Narrow filters. Listed total was ${total.toLocaleString()}.`,
        );
        return;
      }
      if (ids.length < total) {
        setEnrollBulkHint(`Selected ${ids.length} of ${total}.`);
        return;
      }
      setEnrollBulkHint(`${ids.length.toLocaleString()} selected (everyone matching your filters).`);
    } catch (e) {
      setEnrollBulkHint(e instanceof Error ? e.message : "Could not load contacts");
    } finally {
      setEnrollAllMatchingBusy(false);
    }
  }, [listTotal, searchQ, createdFrom, createdTo, listStoreId]);

  const addSelectionToCampaign = useCallback(async () => {
    if (!enrollTargetId || rowSelected.size === 0) return;
    const n = rowSelected.size;
    if (n > 500 && !confirm(`Add ${n.toLocaleString()} people to this campaign? First-step messages use credits as usual.`)) {
      return;
    }
    setEnrollBulkBusy(true);
    setEnrollBulkHint("");
    try {
      const r = await enrollInSequenceBatched(enrollTargetId, Array.from(rowSelected), {
        locationId: enrollStoreId.trim() || null,
      });
      if (r.errors.length && r.enrolled.length === 0) {
        setEnrollBulkHint(
          r.errors[0]?.error
            ? `${r.errors[0].error} (e.g. wrong channel, missing contact info, or already in this campaign).`
            : "No one was added.",
        );
        return;
      }
      if (r.errors.length) {
        setEnrollBulkHint(
          `Added ${r.enrolled.length.toLocaleString()} people. ${r.errors.length} skipped (already enrolled, opted out, or not eligible for the first step).`,
        );
        toast.success(`Added ${r.enrolled.length} — some contacts skipped`);
      } else {
        setEnrollBulkHint(`Added ${r.enrolled.length.toLocaleString()} to the campaign.`);
        toast.success(`Added ${r.enrolled.length} to the campaign`);
      }
      setRowSelected(new Set());
      await load();
    } catch (e) {
      setEnrollBulkHint(e instanceof Error ? e.message : "Could not add to campaign");
    } finally {
      setEnrollBulkBusy(false);
    }
  }, [enrollTargetId, rowSelected, load, enrollStoreId]);

  useEffect(() => {
    void load();
  }, [load]);

  function goTab(next: "list" | "sends") {
    if (next === "sends") {
      router.replace("/dashboard/contacts?tab=sends", { scroll: false });
    } else {
      router.replace("/dashboard/contacts", { scroll: false });
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Contacts & sends"
        title="People"
        credits={creditBalance}
        description={
          isSendsTab ? (
            <p className="line-clamp-2">
              Outbound log (last 30 days). The <strong>List</strong> tab is your address book.
            </p>
          ) : (
            <p className="line-clamp-2">
              <strong className="text-slate-800">List</strong> = your contacts.{" "}
              <strong className="text-slate-800">Sends</strong> = the log. Add via <strong>Add people</strong> or{" "}
              <Link href="/dashboard/qr" className="font-medium text-brand-600 hover:underline">
                Connect
              </Link>
              .
            </p>
          )
        }
        info={
          isSendsTab
            ? {
                label: "About the Sends log",
                size: "md" as const,
                children: (
                  <p>
                    <strong>Sends</strong> is the outbound log. Open <strong>List</strong> for your saved contacts,{" "}
                    <a className="font-medium text-brand-600 hover:underline" href="/dashboard/campaigns">
                      Campaigns
                    </a>{" "}
                    for sequences, and{" "}
                    <a className="font-medium text-brand-600 hover:underline" href="/dashboard/qr">
                      Connect
                    </a>{" "}
                    to collect sign-ups.
                  </p>
                ),
              }
            : {
                label: "People list, one-off sends, and campaigns",
                size: "md" as const,
                children: (
                  <p>
                    Row actions send a <strong>single</strong> email or SMS using your defaults. Use{" "}
                    <a className="font-medium text-brand-600 hover:underline" href="/dashboard/campaigns">
                      Campaigns
                    </a>{" "}
                    for multi-step follow-ups. Ingested-on dates use your business time zone. Import or Connect to add
                    people. We don&apos;t message contacts who have opted out.
                  </p>
                ),
              }
        }
        end={
          !isSendsTab ? (
            <button type="button" onClick={() => setAddPeopleOpen(true)} className="btn-primary shrink-0 w-full sm:w-auto min-h-10">
              Add people
            </button>
          ) : undefined
        }
      />

      {cfg && <ActiveReviewPlatformsStrip platforms={platformChips} className="max-w-3xl" />}

      <div
        className="inline-flex w-full max-w-md flex-wrap sm:flex-nowrap rounded-2xl border border-slate-200/50 bg-slate-50/80 p-1 gap-0.5"
        role="tablist"
        aria-label="People views"
      >
        <button
          type="button"
          role="tab"
          id="tab-list"
          aria-selected={!isSendsTab}
          aria-controls="tabpanel-people"
          onClick={() => goTab("list")}
          className={[
            "min-h-[2.5rem] flex-1 min-w-[8rem] rounded-[0.7rem] px-3 py-2 text-sm font-medium transition",
            !isSendsTab
              ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
              : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
          ].join(" ")}
        >
          List
        </button>
        <button
          type="button"
          role="tab"
          id="tab-sends"
          aria-selected={isSendsTab}
          aria-controls="tabpanel-sends"
          onClick={() => goTab("sends")}
          className={[
            "min-h-[2.5rem] flex-1 min-w-[8rem] rounded-[0.7rem] px-3 py-2 text-sm font-medium transition",
            isSendsTab
              ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
              : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
          ].join(" ")}
        >
          Sends
        </button>
      </div>

      {!isSendsTab && (
        <section
          className="rounded-xl border border-slate-200/80 bg-white overflow-visible"
          id="tabpanel-people"
          role="tabpanel"
          aria-labelledby="tab-list"
        >
          <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-slate-100">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-semibold text-slate-900">Your list</h2>
                  <InfoTip size="md" label="List actions, filters, and campaigns">
                    <p>
                      <strong>Email</strong> or <strong>SMS</strong> on a row: one request. For a sequence, select rows, choose
                      a <strong>campaign</strong>, then <strong>Add to campaign</strong> (or start from{" "}
                      <a className="font-medium text-brand-600 hover:underline" href="/dashboard/campaigns">Campaigns</a>).
                      Search and dates cover the full list, not one page. <strong>All matching</strong> selects every row
                      that fits the filter. We skip opted-out people.
                    </p>
                  </InfoTip>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 max-w-2xl">
                  {ingestPresets?.timezone
                    ? `Search and ingested-on dates use your business time zone (${ingestPresets.timezone}).`
                    : "Search and ingested-on dates use your business time zone from Settings."}{" "}
                  One-off on each row, or select + add to a campaign.
                </p>
              </div>
              {!loading && <ListStats total={listTotal} contacts={contacts} sms={sms} hasFilters={filterActive} />}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end sm:gap-x-3 sm:gap-y-2">
              <div className="sm:col-span-3 min-w-0">
                <label htmlFor="list-search" className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Search
                </label>
                <input
                  id="list-search"
                  type="search"
                  enterKeyHint="search"
                  placeholder="Name, email, or external ref…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="mt-0.5 w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400/80 focus:outline-none focus:ring-2 focus:ring-brand-400/25"
                />
              </div>
              <ContactListStoreFilter
                className="sm:col-span-3 min-w-0"
                id="list-store"
                locations={locations}
                value={listStoreId}
                onChange={(v) => {
                  setListStoreId(v);
                  setListPage(1);
                }}
                disabled={loading}
              />
              <div className="sm:col-span-2 min-w-0">
                <label
                  htmlFor="list-date-from"
                  className="text-[10px] font-medium uppercase tracking-wide text-slate-500"
                >
                  Ingested from
                </label>
                <input
                  id="list-date-from"
                  type="date"
                  value={createdFrom}
                  onChange={(e) => setCreatedFrom(e.target.value)}
                  className="mt-0.5 w-full h-9 min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-brand-400/80 focus:outline-none focus:ring-2 focus:ring-brand-400/25"
                />
              </div>
              <div className="sm:col-span-2 min-w-0">
                <label
                  htmlFor="list-date-to"
                  className="text-[10px] font-medium uppercase tracking-wide text-slate-500"
                >
                  to
                </label>
                <input
                  id="list-date-to"
                  type="date"
                  value={createdTo}
                  onChange={(e) => setCreatedTo(e.target.value)}
                  className="mt-0.5 w-full h-9 min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-brand-400/80 focus:outline-none focus:ring-2 focus:ring-brand-400/25"
                />
              </div>
              <div className="sm:col-span-3 min-w-0">
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
                    className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                    disabled={!ingestPresets}
                    onClick={() => {
                      if (!ingestPresets) return;
                      setCreatedFrom(ingestPresets.today);
                      setCreatedTo(ingestPresets.today);
                      setListPage(1);
                    }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                    disabled={!ingestPresets}
                    onClick={() => {
                      if (!ingestPresets) return;
                      setCreatedFrom(ingestPresets.yesterday);
                      setCreatedTo(ingestPresets.yesterday);
                      setListPage(1);
                    }}
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                    disabled={!ingestPresets}
                    onClick={() => {
                      if (!ingestPresets) return;
                      setCreatedFrom(ingestPresets.last7_from);
                      setCreatedTo(ingestPresets.last7_to);
                      setListPage(1);
                    }}
                  >
                    Last 7 days
                  </button>
                </div>
              </div>
              {filterActive && (
                <div className="sm:col-span-12 flex">
                  <button
                    type="button"
                    className="h-9 px-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                    onClick={() => {
                      setSearchInput("");
                      setSearchQ("");
                      setCreatedFrom("");
                      setCreatedTo("");
                      setListStoreId("");
                      setListPage(1);
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
            {activeSequences.length > 0 && !loading && contacts.length > 0 && (
              <div className="mt-2 rounded-xl border border-brand-200/60 bg-brand-50/30 px-3 py-2.5 sm:px-4 sm:flex sm:flex-wrap sm:items-end sm:gap-3 sm:gap-y-2">
                <div className="flex items-start gap-1 w-full sm:w-auto min-w-0 sm:flex-1 mb-2 sm:mb-0">
                  <p className="text-[11px] sm:text-xs text-slate-600 min-w-0 line-clamp-2">
                    <span className="font-medium text-slate-800">{rowSelected.size} selected</span> — pick a campaign, then
                    add. Up to {listTotal.toLocaleString()} match this filter.
                  </p>
                  <InfoTip label="Bulk add to a campaign" size="md">
                    <p>
                      The checkbox list carries across pages. <strong>All on page</strong> takes or clears the current
                      page. <strong>All matching</strong> loads every id that fits search and dates, then you pick a
                      campaign. Enrollment runs in batches, so very large sets may need a few seconds.
                    </p>
                  </InfoTip>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    className="h-8 px-2.5 text-xs font-medium text-brand-800 border border-brand-200/80 rounded-lg bg-white hover:bg-brand-50/80"
                    onClick={onToggleAllOnPage}
                    disabled={enrollBulkBusy || enrollAllMatchingBusy}
                  >
                    All on page
                  </button>
                  <button
                    type="button"
                    className="h-8 px-2.5 text-xs font-semibold text-brand-900 border border-brand-300/90 rounded-lg bg-brand-50/50 hover:bg-brand-50"
                    onClick={() => void selectAllMatchingFilters()}
                    disabled={enrollBulkBusy || enrollAllMatchingBusy || listTotal === 0}
                    title="Select every contact that matches the current search and date filters (all pages)"
                  >
                    {enrollAllMatchingBusy ? "Loading…" : "All matching"}
                  </button>
                  <button
                    type="button"
                    className="h-8 px-2.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                    onClick={clearRowSelection}
                    disabled={enrollBulkBusy || rowSelected.size === 0}
                  >
                    Clear
                  </button>
                  <label className="sr-only" htmlFor="bulk-campaign-pick">
                    Campaign
                  </label>
                  <select
                    id="bulk-campaign-pick"
                    className="h-8 min-w-0 sm:min-w-[11rem] rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800"
                    value={enrollTargetId}
                    onChange={(e) => {
                      setEnrollTargetId(e.target.value);
                      setEnrollBulkHint("");
                    }}
                    disabled={enrollBulkBusy || enrollAllMatchingBusy}
                  >
                    <option value="">Choose campaign…</option>
                    {activeSequences.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.step_count ? ` (${s.step_count} step${s.step_count === 1 ? "" : "s"})` : ""}
                      </option>
                    ))}
                  </select>
                  {locations.length > 1 && (
                    <>
                      <label className="sr-only" htmlFor="bulk-store-pick">
                        Store
                      </label>
                      <select
                        id="bulk-store-pick"
                        className="h-8 min-w-0 sm:min-w-[9rem] rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800"
                        value={enrollStoreId}
                        onChange={(e) => {
                          setEnrollStoreId(e.target.value);
                          setEnrollBulkHint("");
                        }}
                        disabled={enrollBulkBusy || enrollAllMatchingBusy}
                        title="Which store's review links to use for the first message"
                      >
                        <option value="">
                          {biz?.default_location_id
                            ? `Default (${locations.find((l) => l.id === biz.default_location_id)?.name || "default store"})`
                            : "Default store"}
                        </option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                  <button
                    type="button"
                    className="h-8 px-3 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                    onClick={() => void addSelectionToCampaign()}
                    disabled={enrollBulkBusy || enrollAllMatchingBusy || !enrollTargetId || rowSelected.size === 0}
                  >
                    {enrollBulkBusy ? (
                      <>
                        <ButtonSpinner />
                        Adding…
                      </>
                    ) : (
                      "Add to campaign"
                    )}
                  </button>
                </div>
                {enrollBulkHint ? (
                  <p className="w-full text-[11px] text-slate-700 sm:pl-0 mt-1 sm:mt-0 basis-full" role="status">
                    {enrollBulkHint}
                  </p>
                ) : null}
              </div>
            )}
            {activeSequences.length === 0 && !loading && sequences.length > 0 && contacts.length > 0 && (
              <p className="mt-2 text-[11px] text-amber-900/90 bg-amber-50/80 border border-amber-200/60 rounded-lg px-3 py-2">
                All your campaigns are paused.{" "}
                <Link className="font-medium text-brand-600 hover:underline" href="/dashboard/campaigns">
                  Activate a campaign
                </Link>{" "}
                to add people in bulk, or un-pause in Edit.
              </p>
            )}
            {activeSequences.length === 0 && !loading && sequences.length === 0 && contacts.length > 0 && (
              <p className="mt-2 text-[11px] text-slate-600">
                <Link className="font-medium text-brand-600 hover:underline" href="/dashboard/campaigns">
                  Create a campaign
                </Link>{" "}
                to add many people to a follow-up flow at once.
              </p>
            )}
          </div>

          <ContactsTable
            contacts={contacts}
            listTotal={listTotal}
            filterActive={filterActive}
            listPage={listPage}
            listPageSize={listPageSize}
            listHasNext={listHasNext}
            onPageChange={setListPage}
            onPageSizeChange={setListPageSize}
            loading={loading}
            onChanged={load}
            timeZoneIana={displayTimeZone}
            sms={sms}
            rowSelection={
              activeSequences.length
                ? {
                    selected: rowSelected,
                    onToggle: onToggleRow,
                    onToggleAllOnPage: onToggleAllOnPage,
                  }
                : undefined
            }
          />
        </section>
      )}

      {isSendsTab && (
        <section
          className="rounded-xl border border-slate-200/80 bg-white p-3 sm:p-4 overflow-hidden"
          id="tabpanel-sends"
          role="tabpanel"
          aria-labelledby="tab-sends"
        >
          <SendsLogPanel />
        </section>
      )}

      <AddPeopleDialog
        open={addPeopleOpen}
        onOpenChange={setAddPeopleOpen}
        campaigns={campaigns}
        emailTemplateId={emailTemplateId}
        smsTemplateId={smsTemplateId}
        onEmailTemplateChange={setEmailTemplateId}
        onSmsTemplateChange={setSmsTemplateId}
        sms={sms}
        defaultSendDelayMinutes={biz?.default_send_delay_minutes ?? 60}
        onRefresh={load}
        locations={locations}
        defaultLocationId={biz?.default_location_id ?? null}
      />
    </div>
  );
}
