"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { uploadContactCsv } from "@/lib/api";
import { ButtonSpinner, useAppToast } from "@/components/ToastProvider";
import StyledSelect from "@/components/StyledSelect";
import type { BusinessLocation } from "@/types";
import { ContactAssignStoreField } from "./ContactStoreSelects";
import { delayLabel } from "./contactFormat";

const CSV_SAMPLE = `name,email,phone,external_ref
Jane Smith,jane@example.com,+447700900123,order_1001
Alex Lee,alex@example.com,,pos_receipt_42
Sam Jones,,+447700900456,walkin_7`;

export default function CsvUploadForm({
  onCompleted,
  sms,
  defaultSendDelayMinutes,
  emailCampaignId,
  smsCampaignId,
  locations = [],
  defaultLocationId = null,
  variant = "default",
}: {
  onCompleted: () => void;
  sms: boolean;
  defaultSendDelayMinutes: number;
  emailCampaignId: string;
  smsCampaignId: string;
  locations?: BusinessLocation[];
  defaultLocationId?: string | null;
  variant?: "default" | "dialog";
}) {
  const [consent, setConsent] = useState(false);
  const [channel, setChannel] = useState<"auto" | "email" | "sms">("auto");
  const [enqueue, setEnqueue] = useState(true);
  const [assignStoreId, setAssignStoreId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ rows: number; imported: number; queued: number; errors: string[] } | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useAppToast();

  useEffect(() => {
    if (!sms && channel === "sms") setChannel("auto");
  }, [sms, channel]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a CSV file first");
      return;
    }
    setBusy(true);
    try {
      const out = await uploadContactCsv(file, {
        consent,
        channel,
        enqueue,
        emailCampaignId: emailCampaignId || undefined,
        smsCampaignId: smsCampaignId || undefined,
        locationId: assignStoreId.trim() || undefined,
      });
      setResult(out);
      if (fileRef.current) fileRef.current.value = "";
      onCompleted();
      toast.success(
        out.imported
          ? `Imported ${out.imported} contact${out.imported === 1 ? "" : "s"}${out.queued ? `, ${out.queued} queued` : ""}`
          : "Upload processed",
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className={
        variant === "dialog" ? "space-y-3" : "card p-5 space-y-3 max-w-2xl"
      }
    >
      <p className="text-xs text-slate-500">
        UTF-8 <code className="text-[11px] rounded bg-slate-100 px-1 py-0.5">.csv</code> with a header row. Each row
        needs{" "}
        <strong className="font-medium text-slate-600">email</strong> or <strong className="font-medium text-slate-600">phone</strong>{" "}
        (E.164, e.g. <code className="text-[11px]">+447…</code>).
      </p>
      <figure className="rounded-lg border border-slate-200/90 bg-slate-50/80 overflow-hidden">
        <figcaption className="px-2.5 py-1.5 border-b border-slate-200/80 bg-slate-100/60 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Sample CSV
        </figcaption>
        <pre className="px-3 py-2.5 m-0 text-[11px] leading-relaxed font-mono text-slate-800 overflow-x-auto whitespace-pre">
          {CSV_SAMPLE}
        </pre>
        <p className="px-3 pb-2.5 m-0 text-[10px] text-slate-500 leading-snug">
          Aliases work too: <span className="text-slate-600">customer_name</span>,{" "}
          <span className="text-slate-600">email_address</span>, <span className="text-slate-600">phone_number</span>,{" "}
          <span className="text-slate-600">order_id</span> — matching the same fields.
        </p>
      </figure>
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="text-sm block w-full file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm" />
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="csv-ch">
            Channel
          </label>
          <StyledSelect
            id="csv-ch"
            value={channel}
            onChange={(e) => setChannel(e.target.value as "auto" | "email" | "sms")}
          >
            <option value="auto">Auto</option>
            <option value="email">Email</option>
            {sms && <option value="sms">SMS</option>}
          </StyledSelect>
        </div>
        <label className="flex flex-col gap-0.5 sm:pt-7 sm:max-w-sm">
          <span className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={enqueue} onChange={(e) => setEnqueue(e.target.checked)} className="rounded border-slate-300" />
            Schedule messages after import
          </span>
          {enqueue && (
            <span className="text-[11px] text-slate-500 pl-6 sm:pl-0 leading-snug">
              Each send uses your default delay ({delayLabel(defaultSendDelayMinutes)}); change it in{" "}
              <Link href="/dashboard/settings" className="font-medium text-brand-600 hover:text-brand-800">
                Settings
              </Link>
              .
            </span>
          )}
        </label>
      </div>
      {locations.length > 0 && (
        <ContactAssignStoreField
          id="csv-store"
          locations={locations}
          defaultLocationId={defaultLocationId}
          value={assignStoreId}
          onChange={setAssignStoreId}
          compact
        />
      )}
      <label className="flex items-start gap-2.5 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 rounded border-slate-300"
        />
        <span>All rows in this file consented to a review request from my business.</span>
      </label>
      {error && <div className="text-sm text-red-700 px-3 py-2 rounded-lg bg-red-50 border border-red-200">{error}</div>}
      {result && (
        <div className="text-sm px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
          Imported {result.imported} / {result.rows} rows · Queued {result.queued} at {delayLabel(defaultSendDelayMinutes)} each
          (default delay;{" "}
          <Link href="/dashboard/settings" className="font-medium text-brand-600 hover:text-brand-800">
            change in Settings
          </Link>
          )
          {result.errors.length > 0 && (
            <details className="mt-2 text-amber-800">
              <summary className="cursor-pointer">{result.errors.length} warnings</summary>
              <ul className="mt-1 list-disc list-inside text-xs">
                {result.errors.slice(0, 10).map((er, i) => (
                  <li key={i}>{er}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
      <button
        type="submit"
        disabled={busy}
        className="btn-primary w-full h-11 inline-flex items-center justify-center gap-2"
      >
        {busy ? (
          <>
            <ButtonSpinner />
            Uploading…
          </>
        ) : (
          "Upload CSV"
        )}
      </button>
    </form>
  );
}
