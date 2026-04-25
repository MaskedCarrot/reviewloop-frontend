"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listMessages, lookupContactsByIds, PUBLIC_SITE_ORIGIN } from "@/lib/api";
import PageLoader from "@/components/PageLoader";
import type { Contact, ScheduledMessage } from "@/types";

function shortDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

const STATUS_PILL: Record<ScheduledMessage["status"], string> = {
  scheduled: "bg-amber-50 text-amber-900 border-amber-200/80",
  sending: "bg-sky-50 text-sky-900 border-sky-200/80",
  sent: "bg-emerald-50 text-emerald-900 border-emerald-200/80",
  failed: "bg-red-50 text-red-900 border-red-200/80",
  skipped: "bg-slate-100 text-slate-700 border-slate-200/80",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200/80",
};

function contactLine(c: Contact | undefined): { title: string; sub: string } {
  if (!c) return { title: "Unknown contact", sub: "—" };
  const name = c.name?.trim() || "—";
  const bits: string[] = [];
  if (c.email) bits.push(c.email);
  if (c.phone_e164) bits.push(c.phone_e164);
  return { title: name, sub: bits.join(" · ") || "—" };
}

/**
 * Outbound log (last 30 days) — also embedded on People → Sends.
 */
export default function SendsLogPanel() {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [contactsById, setContactsById] = useState<Record<string, Contact>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterCh, setFilterCh] = useState<"all" | "email" | "sms">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "sent" | "scheduled" | "other">("all");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const m = await listMessages(500, { days: 30 });
      setMessages(m.messages);
      const contactIds = Array.from(new Set(m.messages.map((x) => x.contact_id).filter(Boolean))) as string[];
      const c =
        contactIds.length > 0
          ? await lookupContactsByIds(contactIds)
          : { contacts: [] as Contact[] };
      const map: Record<string, Contact> = {};
      for (const x of c.contacts) map[x.id] = x;
      setContactsById(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    return messages.filter((m) => {
      if (filterCh !== "all" && m.channel !== filterCh) return false;
      if (filterStatus === "all") return true;
      if (filterStatus === "sent") return m.status === "sent";
      if (filterStatus === "scheduled") return m.status === "scheduled";
      return m.status !== "sent" && m.status !== "scheduled";
    });
  }, [messages, filterCh, filterStatus]);

  return (
    <div className="max-w-5xl space-y-5">
      <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
        Last <strong>30 days</strong> of email & SMS review requests. We don't store full message bodies; each row can
        open the <strong>same public review page</strong> the customer used (link below).
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 mr-1">Channel</span>
        {(
          [
            ["all", "All"],
            ["email", "Email"],
            ["sms", "SMS"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setFilterCh(v)}
            className={[
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              filterCh === v
                ? "border-brand-400 bg-brand-50 text-brand-900"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
        <span className="text-xs font-medium text-slate-500 ml-2 mr-1">Status</span>
        {(
          [
            ["all", "All"],
            ["sent", "Sent"],
            ["scheduled", "Scheduled"],
            ["other", "Other"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setFilterStatus(v)}
            className={[
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              filterStatus === v
                ? "border-slate-700 bg-slate-100 text-slate-900"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => load()}
          className="ml-auto text-xs font-medium text-brand-600 hover:text-brand-800"
        >
          Refresh
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      {loading ? (
        <div className="card p-12">
          <PageLoader message="Loading sends" size="md" />
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center">
          <h2 className="text-sm font-medium text-slate-900">No messages match</h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            {messages.length === 0
              ? "Queue a review request from the List tab, or import a CSV — your log will show up here."
              : "Try a different filter, or clear filters to see everything."}
          </p>
          <Link
            href="/dashboard/contacts"
            className="inline-flex mt-4 text-sm font-semibold text-brand-600 hover:text-brand-800"
          >
            Go to List →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/90 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2.5 sm:px-4">Channel</th>
                  <th className="px-3 py-2.5 sm:px-4">To</th>
                  <th className="px-3 py-2.5 sm:px-4">Review page</th>
                  <th className="px-3 py-2.5 sm:px-4">Status</th>
                  <th className="px-3 py-2.5 sm:px-4">Send at</th>
                  <th className="px-3 py-2.5 sm:px-4">Sent at</th>
                  <th className="px-3 py-2.5 sm:px-4 text-right">Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((m) => {
                  const c = contactsById[m.contact_id];
                  const line = contactLine(c);
                  const origin = PUBLIC_SITE_ORIGIN.replace(/\/$/, "");
                  const reviewPageUrl = m.routing_token ? `${origin}/r/${m.routing_token}` : null;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-3 sm:px-4 align-top">
                        <span
                          className={[
                            "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
                            m.channel === "email" ? "border-sky-200/90 bg-sky-50/90 text-sky-950" : "border-violet-200/90 bg-violet-50/90 text-violet-950",
                          ].join(" ")}
                        >
                          {m.channel === "email" ? "Email" : "SMS"}
                        </span>
                      </td>
                      <td className="px-3 py-3 sm:px-4 align-top min-w-0 max-w-xs">
                        <div className="font-medium text-slate-900 truncate" title={line.title}>
                          {line.title}
                        </div>
                        <div className="text-xs text-slate-500 break-words">{line.sub}</div>
                      </td>
                      <td className="px-3 py-3 sm:px-4 align-top max-w-[10rem]">
                        {reviewPageUrl ? (
                          <a
                            href={reviewPageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-brand-600 hover:text-brand-800 break-all underline-offset-2 hover:underline"
                            title="Opens the same public review page your customer used — no full body stored on our side."
                          >
                            /r/…{m.routing_token?.slice(-6) ?? ""}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 sm:px-4 align-top">
                        <span
                          className={[
                            "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
                            STATUS_PILL[m.status] || "bg-slate-50 text-slate-800 border-slate-200",
                          ].join(" ")}
                        >
                          {m.status}
                        </span>
                        {m.error && m.status === "failed" && (
                          <p className="text-[11px] text-red-600 mt-1 max-w-xs">{m.error}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 sm:px-4 align-top text-slate-600 tabular-nums text-xs">
                        {shortDate(m.send_at)}
                      </td>
                      <td className="px-3 py-3 sm:px-4 align-top text-slate-600 tabular-nums text-xs">
                        {m.sent_at ? shortDate(m.sent_at) : "—"}
                      </td>
                      <td className="px-3 py-3 sm:px-4 align-top text-right tabular-nums text-slate-800">
                        {m.cost_credits}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
