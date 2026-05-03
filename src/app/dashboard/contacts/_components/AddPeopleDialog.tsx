"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createContact, uploadContactCsv } from "@/lib/api";
import { ButtonSpinner, useAppToast } from "@/components/ToastProvider";
import type { BusinessLocation } from "@/types";
import { ContactAssignStoreField } from "./ContactStoreSelects";

const CSV_SAMPLE = `name,email,phone
Jane Smith,jane@example.com,+447700900123
Alex Lee,alex@example.com,
Sam Jones,,+447700900456`;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  locations: BusinessLocation[];
  defaultLocationId: string | null;
};

export default function AddPeopleDialog({
  open,
  onOpenChange,
  onRefresh,
  locations,
  defaultLocationId,
}: Props) {
  const dlg = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const fid = (s: string) => `${uid}${s}`;
  const toast = useAppToast();

  // Single contact
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // CSV
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvDragOver, setCsvDragOver] = useState(false);

  // Shared
  const [storeId, setStoreId] = useState("");
  const [consent, setConsent] = useState(false);

  // Status
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const hasCsv = !!csvFile;
  const hasSingle = !hasCsv && !!(email.trim() || phone.trim());

  useEffect(() => {
    const el = dlg.current;
    if (!el) return;
    if (open) { if (!el.open) el.showModal(); }
    else { if (el.open) el.close(); }
  }, [open]);

  // Reset when opened
  useEffect(() => {
    if (!open) return;
    setName(""); setEmail(""); setPhone("");
    setCsvFile(null); setCsvDragOver(false);
    setStoreId("");
    setConsent(false);
    setError(""); setSuccessMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open]);

  function close() { onOpenChange(false); }

  function pickCsvFile(file: File | null) {
    setCsvFile(file);
    if (file) { setName(""); setEmail(""); setPhone(""); }
    if (fileInputRef.current && !file) fileInputRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccessMsg("");

    if (!consent) {
      setError("Consent is required before contacting anyone.");
      return;
    }

    setBusy(true);
    try {
      if (hasCsv) {
        const out = await uploadContactCsv(csvFile!, {
          consent,
          channel: "auto",
          enqueue: false,
          locationId: storeId.trim() || undefined,
        });
        const msg = `Imported ${out.imported} of ${out.rows} rows`;
        toast.success(msg);
        setSuccessMsg(msg + (out.errors.length ? ` · ${out.errors.length} row(s) skipped` : ""));
        pickCsvFile(null);
        onRefresh();
      } else {
        const emailTrimmed = email.trim();
        const phoneTrimmed = phone.trim();
        if (!emailTrimmed && !phoneTrimmed) {
          setError("Enter an email or phone, or pick a CSV file.");
          return;
        }
        if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrimmed)) {
          setError("Enter a valid email address (e.g. sam@example.com).");
          return;
        }
        if (phoneTrimmed && !/^\+[1-9]\d{6,14}$/.test(phoneTrimmed)) {
          setError("Phone must be in E.164 format starting with + (e.g. +447700900123).");
          return;
        }
        await createContact({
          name: name.trim() || undefined,
          email: emailTrimmed || undefined,
          phone: phoneTrimmed || undefined,
          consent,
          send_now: false,
          location_id: storeId.trim() || undefined,
        });
        toast.success("Contact added");
        close();
        onRefresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const submitLabel = hasCsv ? "Import CSV" : "Add contact";

  return (
    <dialog
      ref={dlg}
      aria-modal="true"
      aria-labelledby="add-people-title"
      onClose={close}
      className="w-[min(96vw,58rem)] max-h-[92vh] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-900/40"
    >
      {/* Header */}
      <div className="border-b border-slate-100 bg-white px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
        <h2 id="add-people-title" className="text-base font-semibold text-slate-900">Add people</h2>
        <button type="button" onClick={close} className="rounded-md p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100" aria-label="Close">
          <span aria-hidden className="text-lg leading-none">×</span>
        </button>
      </div>

      <form onSubmit={submit} className="flex flex-col" style={{ maxHeight: "calc(92vh - 57px)" }}>
        <div className="flex-1 overflow-y-auto">

          {/* Two-panel input area */}
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">

            {/* Left: one person */}
            <div className={["px-5 py-5 space-y-3 transition-opacity", hasCsv ? "opacity-40 pointer-events-none select-none" : ""].join(" ")}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Add one person</p>
              <div>
                <label className="label" htmlFor={fid("name")}>Name <span className="font-normal text-slate-500">(optional)</span></label>
                <input id={fid("name")} className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sam" autoComplete="name" />
              </div>
              <div>
                <label className="label" htmlFor={fid("email")}>Email</label>
                <input id={fid("email")} className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sam@example.com" autoComplete="email" />
              </div>
              <div>
                <label className="label" htmlFor={fid("phone")}>Phone <span className="font-normal text-slate-500">(E.164)</span></label>
                <input id={fid("phone")} className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+447700900123" autoComplete="tel" />
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">Needs at least email or phone.</p>
            </div>

            {/* Right: CSV */}
            <div className={["px-5 py-5 space-y-3 transition-opacity", hasSingle ? "opacity-40 pointer-events-none select-none" : ""].join(" ")}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Or import CSV</p>

              {/* Drop zone */}
              <div
                role="button"
                tabIndex={hasSingle ? -1 : 0}
                aria-label="Drop a CSV file here or click to browse"
                onDragOver={(e) => { e.preventDefault(); setCsvDragOver(true); }}
                onDragLeave={() => setCsvDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setCsvDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) pickCsvFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
                className={[
                  "rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition min-h-[8rem]",
                  csvDragOver ? "border-brand-400 bg-brand-50/60"
                  : csvFile ? "border-emerald-400 bg-emerald-50/60"
                  : "border-slate-200 hover:border-brand-300 hover:bg-slate-50",
                ].join(" ")}
              >
                {csvFile ? (
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-emerald-700">{csvFile.name}</p>
                    <button
                      type="button"
                      className="text-xs text-slate-500 hover:text-red-600 underline"
                      onClick={(e) => { e.stopPropagation(); pickCsvFile(null); }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-600">Drop CSV here</p>
                  <p className="text-xs text-slate-500 mt-0.5">or click to browse · .csv · UTF-8 · header row required</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => pickCsvFile(e.target.files?.[0] ?? null)} />

              <details className="text-xs text-slate-600">
                <summary className="cursor-pointer select-none font-medium text-slate-600 hover:text-slate-800">Show CSV format</summary>
                <pre className="mt-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre text-slate-700">
                  {CSV_SAMPLE}
                </pre>
                <p className="mt-1.5 leading-snug">
                  Each row needs <strong>email</strong> or <strong>phone</strong>. Aliases like{" "}
                  <code className="rounded bg-slate-100 px-1">customer_name</code>,{" "}
                  <code className="rounded bg-slate-100 px-1">phone_number</code>,{" "}
                  <code className="rounded bg-slate-100 px-1">order_id</code> work too.
                  If your CSV has a <code className="rounded bg-slate-100 px-1">store</code> column it overrides the store below.
                </p>
              </details>
            </div>
          </div>

          {/* Shared section */}
          <div className="border-t border-slate-100 px-5 py-5 space-y-4">
            {locations.length > 0 && (
              <ContactAssignStoreField
                id={fid("store")}
                locations={locations}
                defaultLocationId={defaultLocationId}
                value={storeId}
                onChange={setStoreId}
                compact
              />
            )}

            <p className="text-xs text-slate-500 leading-relaxed">
              Adding a person just adds them to your list. To send a review request, use{" "}
              <strong className="text-slate-700">Send</strong> on the row, or enrol them in a{" "}
              <strong className="text-slate-700">Campaign</strong>.
            </p>

            <label className="flex items-start gap-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>
                {hasCsv
                  ? "All contacts in this file have consented to receive a review request from my business."
                  : "This person has consented to receive a review request from my business."
                }{" "}
                <span className="text-slate-500">(required)</span>
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-3.5 flex flex-col gap-2 shrink-0 bg-white">
          {error && (
            <p className="text-sm text-red-700 px-3 py-2 rounded-lg bg-red-50 border border-red-200">{error}</p>
          )}
          {successMsg && (
            <p className="text-sm text-emerald-800 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">{successMsg}</p>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn-ghost" onClick={close} disabled={busy}>Cancel</button>
            <button
              type="submit"
              disabled={busy || !consent}
              className="btn-primary h-10 px-5 inline-flex items-center gap-2"
            >
              {busy ? <><ButtonSpinner /> Working…</> : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
