"use client";

import { useEffect, useRef, useState } from "react";
import { deleteContact, resubscribeContact, unsubscribeContact } from "@/lib/api";
import type { BusinessLocation, Contact, Template } from "@/types";
import ContactMoreMenu from "@/components/ContactMoreMenu";
import ConfirmDialog from "@/components/ConfirmDialog";
import InfoTip from "@/components/InfoTip";
import PageLoader from "@/components/PageLoader";
import { useAppToast } from "@/components/ToastProvider";
import EditContactDialog from "./EditContactDialog";
import SendContactDialog from "./SendContactDialog";
import { contactInitial, shortDate, SOURCE_PILL, SOURCE_LABEL } from "./contactFormat";

const PAGE_SIZES = [10, 25, 50, 100] as const;

export default function ContactsTable({
  contacts,
  listTotal,
  filterActive,
  listPage,
  listPageSize,
  listHasNext,
  onPageChange,
  onPageSizeChange,
  loading,
  onChanged,
  timeZoneIana = "UTC",
  sms,
  templates,
  locations,
  defaultLocationId,
  rowSelection,
}: {
  contacts: Contact[];
  listTotal: number;
  filterActive: boolean;
  listPage: number;
  listPageSize: number;
  listHasNext: boolean;
  onPageChange: (n: number) => void;
  onPageSizeChange: (n: number) => void;
  loading: boolean;
  onChanged: () => void;
  /** IANA zone from business settings — ingest times render in this zone, not the browser's. */
  timeZoneIana?: string;
  sms: boolean;
  templates: Template[];
  locations: BusinessLocation[];
  defaultLocationId: string | null;
  /** When set, each row has a checkbox for "add to campaign" bulk flow. */
  rowSelection?: {
    selected: Set<string>;
    onToggle: (id: string) => void;
    onToggleAllOnPage: () => void;
  };
}) {
  const toast = useAppToast();
  const [consentDialog, setConsentDialog] = useState<{ name: string } | null>(null);
  const [sendTarget, setSendTarget] = useState<Contact | null>(null);
  const [editTarget, setEditTarget] = useState<Contact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageIds = rowSelection ? contacts.map((c) => c.id) : [];
  const allOnPageSelected = rowSelection
    ? pageIds.length > 0 && pageIds.every((id) => rowSelection.selected.has(id))
    : false;
  const someOnPageSelected = rowSelection
    ? !allOnPageSelected && pageIds.some((id) => rowSelection.selected.has(id))
    : false;
  const pageSelectHeaderRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const el = pageSelectHeaderRef.current;
    if (!el || !rowSelection) return;
    el.indeterminate = someOnPageSelected;
  }, [rowSelection, someOnPageSelected, allOnPageSelected, contacts.length]);

  if (loading) {
    return (
      <div className="px-3 py-12 flex flex-col items-center justify-center">
        <PageLoader message="Loading your list" size="md" />
      </div>
    );
  }
  if (!contacts.length) {
    const noMatches = filterActive && listTotal === 0;
    return (
      <div className="px-4 py-12 text-center sm:px-6">
        <div className="flex items-center justify-center gap-1.5 max-w-md mx-auto">
          <h3 className="text-sm font-medium text-slate-900 text-center">
            {noMatches ? "No matching people" : "No one in your list yet"}
          </h3>
          {!noMatches && (
            <InfoTip size="md" label="How to grow your list">
              <p>
                Use <strong>Add people</strong> for a single contact or CSV, or open{" "}
                <a className="font-medium text-brand-600 hover:underline" href="/dashboard/qr">
                  Connect
                </a>{" "}
                so customers can join themselves. For follow-up sequences, use{" "}
                <a className="font-medium text-brand-600 hover:underline" href="/dashboard/campaigns">Campaigns</a>.
              </p>
            </InfoTip>
          )}
        </div>
        {noMatches ? (
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto text-center line-clamp-2">Try a different search or clear filters.</p>
        ) : (
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto text-center line-clamp-2">Use Add people, CSV, or Connect for sign-ups.</p>
        )}
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(listTotal / listPageSize) || 1);
  return (
    <div>
      <div className="p-0 sm:px-0">
        {listTotal > 0 && (
          <div className="border-b border-slate-100 px-3 py-2 sm:px-4 flex flex-col gap-2 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between min-[400px]:gap-3 text-xs text-slate-600">
            <p className="text-[11px] order-2 min-[400px]:order-1">
              Showing{" "}
              <span className="font-medium text-slate-800 tabular-nums">
                {(listPage - 1) * listPageSize + 1}–{(listPage - 1) * listPageSize + contacts.length}
              </span>{" "}
              of <span className="font-medium text-slate-800 tabular-nums">{listTotal}</span>
            </p>
            <div className="flex flex-wrap items-center justify-end gap-1.5 order-1 min-[400px]:order-2">
              <label className="sr-only" htmlFor="contacts-page-size">
                Per page
              </label>
              <select
                id="contacts-page-size"
                value={listPageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value) || 25)}
                className="rounded border border-slate-200 bg-white py-1 pl-2 pr-6 text-xs text-slate-800"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  className="btn-ghost h-7 px-2 text-xs"
                  disabled={listPage <= 1}
                  onClick={() => onPageChange(listPage - 1)}
                >
                  Previous
                </button>
                <span className="tabular-nums text-[11px] text-slate-600 px-1" aria-current="page">
                  {listPage} / {totalPages}
                </span>
                <button
                  type="button"
                  className="btn-ghost h-7 px-2 text-xs"
                  disabled={!listHasNext}
                  onClick={() => onPageChange(listPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {rowSelection && contacts.length > 0 && (
          <div className="px-3 py-2 sm:px-4 flex items-center gap-2 border-b border-slate-200 bg-slate-50">
            <input
              ref={pageSelectHeaderRef}
              type="checkbox"
              className="rounded text-brand-600 shrink-0"
              checked={allOnPageSelected}
              onChange={rowSelection.onToggleAllOnPage}
              title="Select or clear all on this page"
            />
            <span className="text-[11px] text-slate-600">Page selection (for multi-step campaign)</span>
          </div>
        )}
        <ul className="divide-y divide-slate-100" role="list">
          {contacts.map((c) => {
            const canEmail = Boolean(c.email) && !c.unsubscribed_at;
            const canSms = Boolean(c.phone_e164) && sms && !c.unsubscribed_at;
            const canSend = !c.unsubscribed_at && (canEmail || canSms);
            const isOptedOut = Boolean(c.unsubscribed_at);
            const sourcePill = SOURCE_PILL[c.source] ?? "bg-slate-100 text-slate-700";
            const sourceLabel = SOURCE_LABEL[c.source] ?? c.source;
            return (
              <li key={c.id} role="listitem">
                <article className="px-3 py-2.5 sm:px-4 sm:py-3 transition-colors hover:bg-slate-50">
                  <div className="flex flex-col gap-2.5 min-[520px]:flex-row min-[520px]:items-center min-[520px]:gap-3">
                    {rowSelection && (
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded text-brand-600 h-4 w-4 shrink-0 self-start min-[520px]:self-center"
                        checked={rowSelection.selected.has(c.id)}
                        onChange={() => rowSelection.onToggle(c.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${c.name || "contact"}`}
                      />
                    )}
                    <div className="flex min-w-0 flex-1 items-start gap-2.5">
                      <div
                        className={[
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
                          isOptedOut ? "bg-slate-200/80 text-slate-600" : "bg-brand-100/90 text-brand-900",
                        ].join(" ")}
                        aria-hidden
                      >
                        {contactInitial(c)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-sm font-medium leading-snug text-slate-900">
                            {c.name || c.email || c.phone_e164}
                          </h3>
                          <span
                            className={`inline-flex rounded border px-1.5 py-0 text-[10px] font-medium ${sourcePill}`}
                          >
                            {sourceLabel}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] break-words text-slate-600">
                          {[c.email, c.phone_e164].filter(Boolean).join(" · ") || "—"}
                        </p>
                        {c.external_ref && (
                          <p className="mt-0.5 text-[11px] break-all text-slate-600" title="External ref">
                            <span className="text-slate-500">Ref</span> {c.external_ref}
                          </p>
                        )}
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          Ingested {c.created_at ? shortDate(c.created_at, timeZoneIana) : "—"}
                        </p>
                        {isOptedOut && (
                          <span className="mt-1 inline-flex w-fit text-[10px] font-medium text-slate-500">Opted out</span>
                        )}
                        <p
                          className="mt-0.5 text-[10px] text-slate-500 min-[520px]:hidden"
                          title={c.last_message_at ? `Last message ${shortDate(c.last_message_at)}` : undefined}
                        >
                          <span className="text-slate-600">Last send:</span> {c.last_message_at ? shortDate(c.last_message_at) : "—"}
                        </p>
                      </div>
                    </div>

                    <p
                      className="hidden shrink-0 text-[11px] tabular-nums text-slate-500 min-[520px]:block min-[520px]:w-36 min-[520px]:text-right"
                      title="Last time a review request was sent (or scheduled)"
                    >
                      <span className="block text-[9px] uppercase tracking-wide text-slate-500">Last send</span>
                      {c.last_message_at ? shortDate(c.last_message_at) : "—"}
                    </p>

                    <div className="flex flex-col items-stretch gap-1.5 border-t border-slate-200 pt-2 min-[520px]:flex-row min-[520px]:items-center min-[520px]:border-t-0 min-[520px]:pt-0 min-[520px]:shrink-0 min-[520px]:justify-end sm:min-w-0">
                      {canSend && (
                        <button
                          type="button"
                          onClick={() => setSendTarget(c)}
                          className="inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-md border border-warm-200 bg-warm-50 px-3 text-xs font-semibold text-warm-900 transition hover:border-warm-300 hover:bg-warm-100"
                          aria-label="Send a review request"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M22 2 15 22l-4-9-9-4 20-7Z" strokeLinejoin="round" />
                          </svg>
                          Send
                        </button>
                      )}

                      <ContactMoreMenu
                        canEdit
                        onEdit={() => setEditTarget(c)}
                        canOptOut={!isOptedOut}
                        onOptOut={async () => {
                          try {
                            await unsubscribeContact(c.id);
                            onChanged();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Could not unsubscribe");
                          }
                        }}
                        canOptIn={isOptedOut}
                        onOptIn={async () => {
                          try {
                            await resubscribeContact(c.id);
                            onChanged();
                            setConsentDialog({ name: c.name || c.email || c.phone_e164 || "this person" });
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Could not resubscribe");
                          }
                        }}
                        onRemove={() => setDeleteTarget(c)}
                      />
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
      <SendContactDialog
        open={sendTarget !== null}
        contact={sendTarget}
        templates={templates}
        sms={sms}
        onClose={() => setSendTarget(null)}
        // No full list reload after send — the toast confirms it's queued. The Sends
        // tab is the source of truth for outgoing messages, and reloading the whole
        // list here just causes a visible spinner flash with no real benefit.
        onSent={() => undefined}
      />

      <EditContactDialog
        open={editTarget !== null}
        contact={editTarget}
        locations={locations}
        defaultLocationId={defaultLocationId}
        onClose={() => setEditTarget(null)}
        onSaved={onChanged}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove this contact?"
        body={
          <p>
            This permanently deletes{" "}
            <strong className="text-slate-900">
              {deleteTarget?.name || deleteTarget?.email || deleteTarget?.phone_e164 || "this contact"}
            </strong>{" "}
            and any scheduled messages for them. This cannot be undone.
          </p>
        }
        confirmLabel="Remove contact"
        tone="danger"
        busy={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeleting(true);
          try {
            await deleteContact(deleteTarget.id);
            toast.success("Contact removed");
            onChanged();
            setDeleteTarget(null);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not remove contact");
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {consentDialog && (
        <div
          className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-3 bg-black/40"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="consent-dlg-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <h2 id="consent-dlg-title" className="text-base font-semibold text-slate-900">
              Consent recorded
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              You've confirmed that {consentDialog.name} has consented to receive review requests from your business
              again. Their consent timestamp was updated in your list.
            </p>
            <button
              type="button"
              className="mt-4 w-full btn-primary py-2.5"
              onClick={() => setConsentDialog(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
