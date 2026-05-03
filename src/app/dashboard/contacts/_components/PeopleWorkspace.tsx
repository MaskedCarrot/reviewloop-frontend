"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  listContacts,
  listTemplates,
} from "@/lib/api";
import { isSmsEnabledForBusiness } from "@/lib/countryUi";
import { useBrowserLocalMockApp } from "@/lib/useBrowserLocalMockApp";
import { useAppToast } from "@/components/ToastProvider";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import InfoTip from "@/components/InfoTip";
import Tabs from "@/components/Tabs";
import type { Business, BusinessLocation, Contact, IngestPresets, PublicConfig, Template } from "@/types";
import SendsLogPanel from "@/components/SendsLogPanel";
import AddPeopleDialog from "./AddPeopleDialog";
import { ContactListStoreFilter } from "./ContactStoreSelects";
import ContactsTable from "./ContactsTable";
import ListStats from "./ListStats";
import { useDashboardBootstrap } from "../../DashboardBootstrapProvider";

const DEFAULT_PAGE_SIZE = 25;

export default function PeopleWorkspace() {
  const { bootstrap: sharedBootstrap, refreshBootstrap } = useDashboardBootstrap();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isSendsTab = searchParams.get("tab") === "sends";
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [addPeopleOpen, setAddPeopleOpen] = useState(false);

  const isLocalMock = useBrowserLocalMockApp();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [listHasNext, setListHasNext] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [listStoreId, setListStoreId] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [biz, setBiz] = useState<Business | null>(null);
  // Public config kept in state so future sub-features can read it without an extra fetch.
  const [, setCfg] = useState<PublicConfig | null>(null);
  const [ingestPresets, setIngestPresets] = useState<IngestPresets | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | undefined>(undefined);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const toast = useAppToast();

  // SMS is gated by the admin-controlled per-business sms_enabled flag. Local mock
  // sessions still treat SMS as available so the dev demo flow works end-to-end.
  const sms = isSmsEnabledForBusiness(biz) || (isLocalMock && !!biz);

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
    setLoadError(null);
    try {
      const [c, boot, m] = await Promise.all([
        listContacts({
          q: searchQ.trim() || undefined,
          createdFrom: createdFrom || undefined,
          createdTo: createdTo || undefined,
          locationId: listStoreId || undefined,
          page: listPage,
          pageSize: listPageSize,
        }),
        sharedBootstrap ? Promise.resolve(sharedBootstrap) : refreshBootstrap(),
        listTemplates(),
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
      setTemplates(m.templates);
    } catch (err) {
      // Without this, a failed fetch left the UI showing whatever stale state
      // it had + an empty `loading` flag, which read as "no contacts".
      const msg = err instanceof Error ? err.message : "Could not load contacts.";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
    // toast is stable; intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQ, createdFrom, createdTo, listPage, listPageSize, listStoreId, sharedBootstrap, refreshBootstrap]);

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
                    Row actions send a <strong>single</strong> {sms ? "email or SMS" : "email"} using your defaults. Use{" "}
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

      <Tabs
        items={[
          { value: "list" as const, label: "List", badge: !isSendsTab && listTotal > 0 ? listTotal : undefined },
          { value: "sends" as const, label: "Sends" },
        ]}
        value={isSendsTab ? "sends" : "list"}
        onChange={(v) => goTab(v)}
        ariaLabel="People views"
        className="max-w-md"
      />

      {!isSendsTab && (
        <section
          className="rounded-2xl border border-slate-200/85 bg-white overflow-visible shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-28px_rgba(15,23,42,0.16)]"
          id="tabpanel-people"
          role="tabpanel"
          aria-labelledby="tab-list"
        >
          <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-slate-200/80 bg-gradient-to-br from-warm-50/50 to-white">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="section-heading">Your list</h2>
                  <InfoTip size="md" label="List actions and filters">
                    <p>
                      {sms ? (
                        <><strong>Email</strong> or <strong>SMS</strong> on a row sends a single message.</>
                      ) : (
                        <><strong>Email</strong> on a row sends a single message.</>
                      )}{" "}
                      Search and dates cover the full list, not just one page. We skip opted-out people. Use{" "}
                      <a className="link" href="/dashboard/campaigns">Campaigns</a>{" "}
                      to enroll people in multi-step follow-ups.
                    </p>
                  </InfoTip>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2 max-w-2xl">
                  {ingestPresets?.timezone
                    ? `Search and ingested-on dates use your business time zone (${ingestPresets.timezone}).`
                    : "Search and ingested-on dates use your business time zone from Settings."}{" "}
                  One-off {sms ? "email or SMS" : "email"} on each row.
                </p>
              </div>
              {!loading && <ListStats total={listTotal} contacts={contacts} sms={sms} hasFilters={filterActive} />}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end sm:gap-x-3 sm:gap-y-2">
              <div className="sm:col-span-5 min-w-0">
                <label htmlFor="list-search" className="label">
                  Search
                </label>
                <input
                  id="list-search"
                  type="search"
                  enterKeyHint="search"
                  placeholder="Name, email, phone, or external ref…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input h-10 text-sm"
                />
              </div>
              <ContactListStoreFilter
                className="sm:col-span-5 min-w-0"
                id="list-store"
                locations={locations}
                value={listStoreId}
                onChange={(v) => {
                  setListStoreId(v);
                  setListPage(1);
                }}
                disabled={loading}
              />
              <div className="sm:col-span-2 min-w-0 flex items-end">
                <button
                  type="button"
                  className={[
                    "h-10 px-3 text-xs font-semibold rounded-lg border transition w-full",
                    (showMoreFilters || createdFrom || createdTo)
                      ? "border-warm-300 bg-warm-50 text-warm-800"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400",
                  ].join(" ")}
                  onClick={() => setShowMoreFilters((v) => !v)}
                >
                  {(createdFrom || createdTo) ? "Filters ✓" : "Filters"}
                </button>
              </div>
              {(showMoreFilters || createdFrom || createdTo) && (
                <>
                  <div className="sm:col-span-3 min-w-0">
                    <label htmlFor="list-date-from" className="label">
                      Ingested from
                    </label>
                    <input
                      id="list-date-from"
                      type="date"
                      value={createdFrom}
                      onChange={(e) => setCreatedFrom(e.target.value)}
                      className="input h-10 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-3 min-w-0">
                    <label htmlFor="list-date-to" className="label">
                      To
                    </label>
                    <input
                      id="list-date-to"
                      type="date"
                      value={createdTo}
                      onChange={(e) => setCreatedTo(e.target.value)}
                      className="input h-10 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-6 min-w-0">
                    <div className="label">
                      Quick
                      {ingestPresets?.timezone ? (
                        <span className="ml-1 font-normal normal-case text-slate-600" title="Business time zone (Settings)">
                          ({ingestPresets.timezone})
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        className="h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 disabled:opacity-50 transition-colors"
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
                        className="h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 disabled:opacity-50 transition-colors"
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
                        className="h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 disabled:opacity-50 transition-colors"
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
                </>
              )}
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
          </div>

          {loadError && !loading ? (
            <div
              role="alert"
              className="card mt-3 border-red-200 bg-red-50/70 p-4 text-sm text-red-900"
            >
              <div className="font-semibold">Could not load contacts</div>
              <div className="mt-1 opacity-80">{loadError}</div>
              <button
                type="button"
                onClick={() => void load()}
                className="btn btn-secondary mt-3 px-3 py-1.5 text-xs"
              >
                Try again
              </button>
            </div>
          ) : null}

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
            sms={sms}
            templates={templates}
            locations={locations}
            defaultLocationId={sharedBootstrap?.locations?.default_location_id ?? null}
          />
        </section>
      )}

      {isSendsTab && (
        <section
          className="rounded-2xl border border-slate-200/85 bg-white p-4 sm:p-5 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-28px_rgba(15,23,42,0.16)]"
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
        onRefresh={load}
        locations={locations}
        defaultLocationId={sharedBootstrap?.locations?.default_location_id ?? null}
      />
    </div>
  );
}
