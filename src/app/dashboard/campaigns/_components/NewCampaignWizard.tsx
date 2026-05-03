"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createCampaign, fetchAllContactIdsMatching, listContacts, listTemplates } from "@/lib/api";
import { useDashboardBootstrap } from "../../DashboardBootstrapProvider";
import { isSmsEnabledForBusiness } from "@/lib/countryUi";
import { ButtonSpinner, useAppToast } from "@/components/ToastProvider";
import StyledSelect from "@/components/StyledSelect";
import type { Contact, Template } from "@/types";

type DelayUnit = "minutes" | "hours" | "days";
type WizardStep = { template_id: string; delay_value: number; delay_unit: DelayUnit };
/**
 * Campaigns always go live immediately on create. The backend resolves the
 * initial status from the wizard's choice:
 *   - "now"      → POST /campaigns with no scheduled_at → status `running`,
 *                  step 0 enqueued for every recipient.
 *   - "schedule" → POST /campaigns with future scheduled_at → status `scheduled`,
 *                  dispatcher picks it up at the chosen time.
 *
 * We removed the legacy "draft" mode (and the explicit /activate call that paired
 * with it) because there was no UX to add more recipients to a draft after
 * creation, so saving one as a draft was a dead-end.
 */
type StartMode = "now" | "schedule";

export type CampaignPrefill = {
  name?: string;
  location_id?: string | null;
  steps?: WizardStep[];
  contact_ids?: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called with the new campaign's id after creation. */
  onCreated: (campaignId: string) => void;
  prefill?: CampaignPrefill;
};

function toMinutes(value: number, unit: DelayUnit) {
  if (unit === "days") return value * 1440;
  if (unit === "hours") return value * 60;
  return value;
}

function defaultScheduledAt() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  // datetime-local format: YYYY-MM-DDTHH:mm
  return d.toISOString().slice(0, 16);
}

const STEPS = ["Basics", "People", "Steps"] as const;

export default function NewCampaignWizard({ open, onClose, onCreated, prefill }: Props) {
  const uid = useId();
  const fid = (s: string) => `${uid}${s}`;
  const dlg = useRef<HTMLDialogElement>(null);
  const toast = useAppToast();

  const { bootstrap, refreshBootstrap } = useDashboardBootstrap();
  const [biz, setBiz] = useState(bootstrap?.business ?? null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [locations, setLocations] = useState(bootstrap?.locations?.locations ?? []);
  // We keep config in state for any downstream UI that may surface country flags.
  const [, setCfg] = useState(bootstrap?.config ?? null);

  // Step tracker
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 – Basics
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState("");
  const [startMode, setStartMode] = useState<StartMode>("now");
  const [scheduledAt, setScheduledAt] = useState(defaultScheduledAt());

  // Step 2 – People
  const [contactIds, setContactIds] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQ, setPickerQ] = useState("");
  const [pickerQDeb, setPickerQDeb] = useState("");
  const [pickerRows, setPickerRows] = useState<Contact[]>([]);
  const [pickerTotal, setPickerTotal] = useState(0);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerAllBusy, setPickerAllBusy] = useState(false);

  // Step 3 – Steps
  const [campaignSteps, setCampaignSteps] = useState<WizardStep[]>([
    { template_id: "", delay_value: 60, delay_unit: "minutes" },
  ]);

  // Status
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load bootstrap data if not yet available
  useEffect(() => {
    if (bootstrap) {
      setBiz(bootstrap.business);
      setLocations(bootstrap.locations?.locations ?? []);
      setCfg(bootstrap.config);
    } else {
      refreshBootstrap().then((b) => {
        if (!b) return;
        setBiz(b.business);
        setLocations(b.locations?.locations ?? []);
        setCfg(b.config);
      });
    }
    listTemplates().then((r) => setTemplates(r.templates)).catch(() => {});
  }, [bootstrap, refreshBootstrap]);

  // Open / close native dialog
  useEffect(() => {
    const el = dlg.current;
    if (!el) return;
    if (open) { if (!el.open) el.showModal(); }
    else { if (el.open) el.close(); }
  }, [open]);

  // Reset + apply prefill when opened
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setError("");
    setPickerOpen(false);
    setPickerQ(""); setPickerQDeb("");
    setPickerRows([]); setPickerTotal(0);

    if (prefill) {
      setName(prefill.name ?? "");
      setLocationId(prefill.location_id ?? "");
      setStartMode("now");
      setScheduledAt(defaultScheduledAt());
      setContactIds(new Set(prefill.contact_ids ?? []));
      setCampaignSteps(
        prefill.steps && prefill.steps.length > 0
          ? prefill.steps
          : [{ template_id: "", delay_value: 60, delay_unit: "minutes" }],
      );
    } else {
      setName("");
      setLocationId("");
      setStartMode("now");
      setScheduledAt(defaultScheduledAt());
      setContactIds(new Set());
      setCampaignSteps(
        templates.length > 0
          ? [{ template_id: templates[0].id, delay_value: 60, delay_unit: "minutes" }]
          : [{ template_id: "", delay_value: 60, delay_unit: "minutes" }],
      );
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Picker debounce
  useEffect(() => {
    const t = setTimeout(() => setPickerQDeb(pickerQ.trim()), 250);
    return () => clearTimeout(t);
  }, [pickerQ]);

  useEffect(() => {
    if (!pickerOpen) return;
    setPickerLoading(true);
    listContacts({ q: pickerQDeb || undefined, page: 1, pageSize: 100 })
      .then((r) => { setPickerRows(r.contacts); setPickerTotal(r.total); })
      .catch(() => { setPickerRows([]); setPickerTotal(0); })
      .finally(() => setPickerLoading(false));
  }, [pickerOpen, pickerQDeb]);

  // Bootstrap-derived values
  const sms = isSmsEnabledForBusiness(biz);
  const emailTemplates = templates.filter((t: Template) => t.channel === "email");
  const smsTemplates = templates.filter((t: Template) => t.channel === "sms" && sms);
  const allTemplates = [...emailTemplates, ...smsTemplates];

  function validateStep1() {
    if (!name.trim()) { setError("Campaign name is required."); return false; }
    if (startMode === "schedule" && !scheduledAt) { setError("Pick a date and time to schedule."); return false; }
    setError(""); return true;
  }

  function validateStep2() {
    if (contactIds.size === 0) {
      setError("Add at least one contact — campaigns can't run without recipients.");
      return false;
    }
    setError(""); return true;
  }

  function validateStep3() {
    if (campaignSteps.length === 0) { setError("Add at least one step."); return false; }
    for (const s of campaignSteps) {
      if (!s.template_id) { setError("Pick a template for every step."); return false; }
    }
    setError(""); return true;
  }

  async function create() {
    if (!validateStep3()) return;
    setSaving(true);
    setError("");
    try {
      const scheduledIso =
        startMode === "schedule" && scheduledAt
          ? new Date(scheduledAt).toISOString()
          : null;

      const campaign = await createCampaign({
        name: name.trim(),
        location_id: locationId.trim() || null,
        steps: campaignSteps.map((s) => ({
          template_id: s.template_id,
          delay_minutes: toMinutes(s.delay_value, s.delay_unit),
        })),
        contact_ids: Array.from(contactIds),
        scheduled_at: scheduledIso,
      });

      toast.success(
        startMode === "now" ? "Campaign created and started" : "Campaign scheduled",
      );
      onCreated(campaign.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create campaign");
    } finally {
      setSaving(false);
    }
  }

  const noTemplates = allTemplates.length === 0;

  return (
    <dialog
      ref={dlg}
      aria-modal="true"
      aria-labelledby="ncw-title"
      onClose={onClose}
      className="w-[min(96vw,42rem)] max-h-[92vh] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-900/40"
    >
      {/* Header + step indicator */}
      <div className="border-b border-slate-100 shrink-0">
        <div className="px-5 py-3.5 flex items-center justify-between gap-3">
          <h2 id="ncw-title" className="text-base font-semibold text-slate-900">New campaign</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <span aria-hidden className="text-lg leading-none">×</span>
          </button>
        </div>
        {/* Step indicator */}
        <div className="px-5 pb-3 flex items-center gap-0">
          {STEPS.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3;
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex items-center" style={{ flex: n < 3 ? "1" : undefined }}>
                <div className={["flex items-center gap-1.5 text-xs font-medium shrink-0", active ? "text-brand-700" : done ? "text-emerald-600" : "text-slate-500"].join(" ")}>
                  <span className={["w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0", active ? "bg-brand-600 text-white" : done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"].join(" ")}>
                    {done ? "✓" : n}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {n < 3 && <div className={["flex-1 h-px mx-2", done ? "bg-emerald-300" : "bg-slate-200"].join(" ")} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4" style={{ maxHeight: "calc(92vh - 180px)" }}>

        {/* ── Step 1: Basics ── */}
        {step === 1 && (
          <>
            <div>
              <label className="label" htmlFor={fid("name")}>Campaign name</label>
              <input
                id={fid("name")}
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Post-visit review request"
                autoFocus
              />
            </div>

            {locations.length > 0 && (
              <div>
                <label className="label" htmlFor={fid("loc")}>Store</label>
                <p className="text-xs text-slate-600 mb-1">Review links in messages use this store's URLs.</p>
                <StyledSelect id={fid("loc")} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                  <option value="">Auto (contact's store, then default)</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </StyledSelect>
              </div>
            )}

            <div className="space-y-2.5">
              <p className="label">When to start</p>
              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input type="radio" name={fid("start")} value="now" checked={startMode === "now"} onChange={() => setStartMode("now")} className="text-brand-600 focus:ring-brand-500" />
                <span>
                  <strong className="font-medium">Start now</strong>
                  <span className="text-slate-500 ml-1.5 font-normal">— activate immediately after creating</span>
                </span>
              </label>
              <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input type="radio" name={fid("start")} value="schedule" checked={startMode === "schedule"} onChange={() => setStartMode("schedule")} className="text-brand-600 focus:ring-brand-500 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">Schedule</span>
                  <span className="text-slate-500 ml-1.5 font-normal">— start at a specific date and time</span>
                  {startMode === "schedule" && (
                    <div className="mt-2">
                      <input
                        type="datetime-local"
                        className="input h-9 text-sm w-full"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          </>
        )}

        {/* ── Step 2: People ── */}
        {step === 2 && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Who should receive this campaign?</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Required — pick at least one contact. You can edit recipients later, but a campaign
                can&apos;t run without anyone enrolled.
              </p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600">
                {contactIds.size > 0 ? `${contactIds.size.toLocaleString()} selected` : "No one selected yet"}
              </span>
              <button
                type="button"
                className="btn-secondary text-sm h-8 px-3"
                onClick={() => setPickerOpen((v) => !v)}
              >
                {pickerOpen ? "Done" : contactIds.size > 0 ? `Edit (${contactIds.size})` : "Browse contacts"}
              </button>
            </div>

            {pickerOpen && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <input
                  className="input w-full h-9 text-sm"
                  placeholder="Search by name, email, or phone…"
                  value={pickerQ}
                  onChange={(e) => setPickerQ(e.target.value)}
                  autoFocus
                />
                <div className="flex flex-wrap gap-1.5 items-center text-xs text-slate-600">
                  <span aria-live="polite">{pickerLoading ? "…" : `${pickerTotal.toLocaleString()} match${pickerTotal === 1 ? "" : "es"}`}</span>
                  <button
                    type="button" className="btn-ghost h-7 px-2 text-xs"
                    disabled={pickerLoading || pickerRows.length === 0}
                    onClick={() => setContactIds((s) => { const n = new Set(s); pickerRows.forEach((c) => n.add(c.id)); return n; })}
                  >All shown</button>
                  {pickerTotal > 100 && (
                    <button
                      type="button" className="btn-ghost h-7 px-2 text-xs font-semibold text-brand-800"
                      disabled={pickerLoading || pickerAllBusy}
                      onClick={async () => {
                        setPickerAllBusy(true);
                        try {
                          const { ids } = await fetchAllContactIdsMatching({ q: pickerQDeb || undefined });
                          setContactIds(new Set(ids));
                        } finally { setPickerAllBusy(false); }
                      }}
                    >
                      {pickerAllBusy ? "Loading…" : `All ${pickerTotal.toLocaleString()}`}
                    </button>
                  )}
                  {contactIds.size > 0 && (
                    <button type="button" className="btn-ghost h-7 px-2 text-xs text-red-600" onClick={() => setContactIds(new Set())}>
                      Clear ({contactIds.size})
                    </button>
                  )}
                </div>
                <ul className="max-h-52 overflow-y-auto space-y-0.5 pr-0.5">
                  {pickerRows.map((c) => (
                    <li key={c.id}>
                      <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          className="rounded shrink-0"
                          checked={contactIds.has(c.id)}
                          onChange={() => setContactIds((s) => { const n = new Set(s); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })}
                        />
                        <span className="truncate text-slate-800">
                          {c.name || c.email || c.phone_e164 || c.id}
                          {c.email && c.name && <span className="text-slate-500 ml-1.5 text-xs">{c.email}</span>}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                {pickerTotal > 100 && (
                  <p className="text-[11px] text-slate-500">Showing first 100. Use "All {pickerTotal.toLocaleString()}" to select everyone.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Steps ── */}
        {step === 3 && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Message steps</p>
              <p className="text-xs text-slate-600 mt-0.5">Define the order and timing of messages. Steps are fixed after you create the campaign.</p>
            </div>

            {noTemplates && (
              <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2.5 text-xs text-amber-900">
                No templates yet.{" "}
                <Link href="/dashboard/templates" className="font-medium underline">Create one first</Link>
                {" "}— defaults will be used until then.
              </div>
            )}

            {campaignSteps.map((s, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-end rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex-1 min-w-0">
                  <label className="text-xs text-slate-600 mb-1 block">Step {i + 1}</label>
                  <StyledSelect
                    value={s.template_id}
                    onChange={(e) => setCampaignSteps((prev) => { const n = [...prev]; n[i] = { ...n[i], template_id: e.target.value }; return n; })}
                  >
                    <option value="" disabled>Select template…</option>
                    {emailTemplates.map((t) => <option key={t.id} value={t.id}>✉ {t.name}{t.is_default ? " — default" : ""}</option>)}
                    {smsTemplates.map((t) => <option key={t.id} value={t.id}>💬 {t.name}{t.is_default ? " — default" : ""}</option>)}
                  </StyledSelect>
                </div>
                <div className="flex gap-1.5 items-end shrink-0">
                  <div className="w-16">
                    <label className="text-xs text-slate-600 mb-1 block">{i === 0 ? "Send after" : "Wait"}</label>
                    <input
                      type="number"
                      className="input h-9"
                      min={0}
                      max={365}
                      value={s.delay_value}
                      onChange={(e) => setCampaignSteps((prev) => { const n = [...prev]; n[i] = { ...n[i], delay_value: Number(e.target.value) || 0 }; return n; })}
                    />
                  </div>
                  <StyledSelect
                    value={s.delay_unit}
                    onChange={(e) => setCampaignSteps((prev) => { const n = [...prev]; n[i] = { ...n[i], delay_unit: e.target.value as DelayUnit }; return n; })}
                    className="h-9 w-20"
                  >
                    <option value="minutes">min</option>
                    <option value="hours">hours</option>
                    <option value="days">days</option>
                  </StyledSelect>
                  {campaignSteps.length > 1 && (
                    <button
                      type="button"
                      className="h-9 px-2 text-xs text-red-500 hover:text-red-700"
                      onClick={() => setCampaignSteps((prev) => prev.filter((_, j) => j !== i))}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}

            {campaignSteps.length < 8 && (
              <button
                type="button"
                className="text-sm text-brand-700 font-medium hover:underline"
                onClick={() => setCampaignSteps((p) => [...p, { template_id: "", delay_value: 1, delay_unit: "days" }])}
              >
                + Add follow-up step
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-5 py-3.5 flex items-center justify-between gap-2 shrink-0 bg-white">
        <div>
          {step > 1 && (
            <button
              type="button"
              className="btn-secondary h-10 px-4 text-sm"
              onClick={() => { setError(""); setStep((s) => (s - 1) as 1 | 2 | 3); }}
              disabled={saving}
            >
              ← Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost h-10 px-4 text-sm" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          {step < 3 ? (
            <button
              type="button"
              className="btn-primary h-10 px-5 text-sm"
              onClick={() => {
                if (step === 1 && !validateStep1()) return;
                if (step === 2 && !validateStep2()) return;
                setError("");
                setStep((s) => (s + 1) as 2 | 3);
              }}
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary h-10 px-5 text-sm inline-flex items-center gap-2"
              disabled={saving || noTemplates || contactIds.size === 0}
              title={contactIds.size === 0 ? "Add at least one contact in step 2." : undefined}
              onClick={create}
            >
              {saving ? <><ButtonSpinner /> Creating…</> : "Create campaign"}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
