"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAccount,
  getDataExportBundle,
  getMySmsAccessRequest,
  requestSmsAccess,
  saveMyBusiness,
  SHOW_SENDER_FIELDS,
  type SmsAccessRequestRow,
} from "@/lib/api";
import { useBrowserLocalMockApp } from "@/lib/useBrowserLocalMockApp";
import { useAuth } from "@/lib/auth";
import { ALL_COUNTRIES } from "@/lib/countryUi";
import {
  getDefaultTimezoneForCountry,
  timezoneBelongsToCountry,
} from "@/lib/countryTimezones";
import type { Business, PublicConfig } from "@/types";
import CountrySelect from "@/components/CountrySelect";
import TimezoneCombobox from "@/components/TimezoneCombobox";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import { ButtonSpinner, useAppToast } from "@/components/ToastProvider";
import ConfirmDialog from "@/components/ConfirmDialog";
import SettingsPageSkeleton from "@/components/skeletons/SettingsPageSkeleton";
import LocationSettingsBlock from "./LocationSettingsBlock";
import Tabs from "@/components/Tabs";
import { useDashboardBootstrap } from "../DashboardBootstrapProvider";

type SettingsTab = "profile" | "stores" | "account";

function SettingsPanel({
  id,
  title,
  subtitle,
  icon,
  children,
  tone = "default",
}: {
  id?: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  /** `danger` uses a light rose header strip. */
  tone?: "default" | "danger";
}) {
  return (
    <section
      id={id}
      className="overflow-hidden rounded-2xl border border-slate-200/85 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-28px_rgba(15,23,42,0.16)]"
    >
      <div
        className={
          tone === "danger"
            ? "border-b border-rose-200/80 bg-gradient-to-br from-rose-50 to-white"
            : "border-b border-slate-200/70 bg-gradient-to-br from-warm-50/40 via-white to-white"
        }
      >
        <div className="flex gap-3.5 px-5 py-4 sm:px-6 sm:py-5">
          <div
            className={
              tone === "danger"
                ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-700 shadow-soft"
                : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-warm-200 bg-white text-warm-700 shadow-soft"
            }
          >
            {icon}
          </div>
          <div className="min-w-0 pt-0.5">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function IconBusiness() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
      <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 4v10m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19h16" strokeLinecap="round" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 9v4m0 3h.01" strokeLinecap="round" />
      <path d="M10.3 4.1 2.8 17a1.5 1.5 0 0 0 1.3 2.2h16.2a1.5 1.5 0 0 0 1.3-2.2L13.7 4.1a1.5 1.5 0 0 0-2.6 0Z" strokeLinejoin="round" />
    </svg>
  );
}
function IconMoon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function SettingsPage() {
  const { bootstrap, refreshBootstrap, mutateBootstrap } = useDashboardBootstrap();
  const isLocalMock = useBrowserLocalMockApp();
  const { logout } = useAuth();
  const router = useRouter();
  const [biz, setBiz] = useState<Business | null>(null);
  const [cfg, setCfg] = useState<PublicConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useAppToast();
  const [creditBalance, setCreditBalance] = useState<number | undefined>(undefined);
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (!bootstrap) {
      void refreshBootstrap();
      return;
    }
    setBiz(bootstrap.business);
    setCfg(bootstrap.config);
    setCreditBalance(bootstrap.credits?.balance);
  }, [bootstrap, refreshBootstrap]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!biz) return;

    const nameTrimmed = biz.name.trim();
    if (!nameTrimmed) {
      setError("Business name is required.");
      return;
    }
    const timezoneTrimmed = (biz.timezone || "").trim();
    if (!timezoneTrimmed) {
      setError("Please select a timezone.");
      return;
    }
    const qhEnabled = !!biz.quiet_hours_enabled;
    const qhStart = (biz.quiet_hours_start || "").trim();
    const qhEnd = (biz.quiet_hours_end || "").trim();
    const hhmm = /^([01]?\d|2[0-3]):[0-5]\d$/;
    if (qhEnabled) {
      if (qhStart && !hhmm.test(qhStart)) {
        setError("Quiet hours start must look like 21:00.");
        return;
      }
      if (qhEnd && !hhmm.test(qhEnd)) {
        setError("Quiet hours end must look like 08:00.");
        return;
      }
    }
    setBusy(true);
    setError("");
    try {
      const res = await saveMyBusiness({
        name: nameTrimmed,
        country_code: biz.country_code,
        timezone: timezoneTrimmed,
        from_name: (biz.from_name || "").trim() || nameTrimmed,
        branding_color: biz.branding_color,
        quiet_hours_enabled: qhEnabled,
        quiet_hours_start: qhEnabled ? qhStart || null : null,
        quiet_hours_end: qhEnabled ? qhEnd || null : null,
      });
      setBiz(res.business);
      mutateBootstrap((prev) => (prev ? { ...prev, business: res.business } : prev));
      toast.success("Settings saved");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-page relative z-0 max-w-4xl w-full sm:max-w-4xl">
      <div
        className="pointer-events-none absolute inset-x-0 -top-1 -z-10 mx-auto h-40 max-w-4xl bg-gradient-to-b from-slate-200/30 via-slate-100/10 to-transparent"
        aria-hidden
      />

      <DashboardPageHeader
        title="Settings"
        credits={creditBalance}
        description="Your business profile, stores, and account options."
      />

      {!(biz && cfg) && <SettingsPageSkeleton />}

      {biz && cfg && (
        <>
      <Tabs
        items={[
          { value: "profile" as const, label: "Profile" },
          { value: "stores" as const, label: "Stores" },
          { value: "account" as const, label: "Account" },
        ]}
        value={tab}
        onChange={setTab}
        ariaLabel="Settings sections"
        className="max-w-md"
      />

      {tab === "profile" ? (
      <form onSubmit={save} className="space-y-6 sm:space-y-7">
        <SettingsPanel
          id="business"
          title="Business profile"
          subtitle="The name your customers see on every email. Review links live in Stores."
          icon={<IconBusiness />}
        >
          <div className="space-y-5 sm:space-y-6">
            <Field label="Business name">
              <input
                className="input w-full"
                value={biz.name}
                onChange={(e) => setBiz({ ...biz, name: e.target.value })}
                autoComplete="organization"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <Field label="Country">
                <CountrySelect
                  id="settings-country"
                  value={biz.country_code}
                  options={ALL_COUNTRIES}
                  onChange={(code) =>
                    setBiz((b) => {
                      if (!b) return b;
                      // Keep the time zone in sync with the country: only auto-snap when
                      // the current zone clearly doesn't belong to the new country.
                      const currentBelongs = timezoneBelongsToCountry(b.timezone, code);
                      const fallback = getDefaultTimezoneForCountry(code) || b.timezone;
                      const nextTz = currentBelongs ? b.timezone : fallback;
                      return { ...b, country_code: code, timezone: nextTz };
                    })
                  }
                />
              </Field>
              <Field label="Time zone">
                <TimezoneCombobox
                  className="w-full"
                  value={biz.timezone || "UTC"}
                  onChange={(timezone) => setBiz({ ...biz, timezone })}
                  disabled={busy}
                  countryCode={biz.country_code}
                  countryLabel={
                    ALL_COUNTRIES.find((c) => c.code === biz.country_code)?.name ||
                    biz.country_code
                  }
                />
              </Field>
            </div>

            {SHOW_SENDER_FIELDS ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                <Field label="From name (email)">
                  <input
                    className="input w-full"
                    value={biz.from_name}
                    onChange={(e) => setBiz({ ...biz, from_name: e.target.value })}
                  />
                </Field>
              </div>
            ) : null}

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="label mb-0">Brand colour</span>
                <span className="text-xs font-mono font-semibold text-slate-700 tabular-nums">
                  {(biz.branding_color || "#2563eb").toUpperCase()}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  className="h-12 w-20 cursor-pointer rounded-xl border border-slate-300 bg-white p-1 shadow-soft"
                  type="color"
                  value={biz.branding_color || "#2563eb"}
                  onChange={(e) => setBiz({ ...biz, branding_color: e.target.value })}
                  title="Choose brand colour"
                />
                <p className="min-w-0 text-xs leading-relaxed text-slate-700 sm:max-w-sm">
                  Used in customer-facing review links and emails. Pick something close to your brand.
                </p>
              </div>
            </div>
          </div>
        </SettingsPanel>

        <SmsAccessPanel biz={biz} onChange={(updated) => setBiz(updated)} />

        <SettingsPanel
          title="Quiet hours"
          subtitle="Pause review-request emails and SMS during set hours — anything we'd otherwise send during the window is held until it's over."
          icon={<IconMoon />}
        >
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-warm-600 focus:ring-warm-500"
                checked={!!biz.quiet_hours_enabled}
                onChange={(e) =>
                  setBiz({
                    ...biz,
                    quiet_hours_enabled: e.target.checked,
                    quiet_hours_start:
                      biz.quiet_hours_start || (e.target.checked ? "21:00" : biz.quiet_hours_start),
                    quiet_hours_end:
                      biz.quiet_hours_end || (e.target.checked ? "08:00" : biz.quiet_hours_end),
                  })
                }
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  Don&apos;t send during quiet hours
                </p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Times are in your business timezone (
                  <span className="font-medium">{biz.timezone || "UTC"}</span>). The
                  window can wrap past midnight — e.g. 21:00 → 08:00.
                </p>
              </div>
            </label>

            <div
              className={`grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 transition-opacity ${
                biz.quiet_hours_enabled ? "opacity-100" : "opacity-50 pointer-events-none"
              }`}
              aria-disabled={!biz.quiet_hours_enabled}
            >
              <Field label="From">
                <input
                  type="time"
                  className="input w-full"
                  value={biz.quiet_hours_start || ""}
                  onChange={(e) => setBiz({ ...biz, quiet_hours_start: e.target.value })}
                />
              </Field>
              <Field label="Until">
                <input
                  type="time"
                  className="input w-full"
                  value={biz.quiet_hours_end || ""}
                  onChange={(e) => setBiz({ ...biz, quiet_hours_end: e.target.value })}
                />
              </Field>
            </div>

            {biz.quiet_hours_enabled &&
            biz.quiet_hours_start &&
            biz.quiet_hours_end &&
            biz.quiet_hours_start !== biz.quiet_hours_end ? (
              <p className="text-xs text-slate-600 leading-relaxed">
                We won&apos;t send between{" "}
                <span className="font-semibold text-slate-900">
                  {biz.quiet_hours_start}
                </span>{" "}
                and{" "}
                <span className="font-semibold text-slate-900">
                  {biz.quiet_hours_end}
                </span>{" "}
                {biz.quiet_hours_end < biz.quiet_hours_start
                  ? "(window crosses midnight)"
                  : ""}
                . Anything queued during that time goes out the moment it ends — your
                customer still gets a polished email, just not at 3am.
              </p>
            ) : null}
          </div>
        </SettingsPanel>

        {error && (
          <div
            className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-soft"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="sm:sticky sm:bottom-4 z-10">
          <div className="overflow-hidden rounded-2xl border border-warm-200/70 bg-white/95 shadow-card-hover backdrop-blur supports-[backdrop-filter]:bg-white/85">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
              <p className="min-w-0 text-sm text-slate-700">
                Profile changes save together when you press Save changes.
              </p>
              <button
                type="submit"
                disabled={busy}
                className="btn-primary h-11 shrink-0 px-6 w-full sm:w-auto font-semibold"
              >
                {busy ? (
                  <>
                    <ButtonSpinner />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
      ) : null}

      {tab === "stores" ? (
        <LocationSettingsBlock
          publicConfig={cfg}
          usage={bootstrap?.usage ?? null}
          onBusinessRefresh={(r) => {
            setBiz(r.business);
            mutateBootstrap((prev) => (prev ? { ...prev, business: r.business } : prev));
          }}
        />
      ) : null}

      {tab === "account" ? (
        <div className="space-y-6">
          <SettingsPanel
            title="Data export"
            subtitle="A single JSON with your business profile, contacts, messages, and related records — for backup or analysis."
            icon={<IconDownload />}
          >
            {isLocalMock && (
              <p className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                In local preview, this file is generated from the in-browser test dataset — not production data.
              </p>
            )}
            <button
              type="button"
              className="btn-secondary w-full h-10 justify-center sm:w-auto sm:min-w-[10rem]"
              onClick={async () => {
                const j = await getDataExportBundle();
                const blob = new Blob([JSON.stringify(j, null, 2)], { type: "application/json" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "goodword-export.json";
                a.click();
                URL.revokeObjectURL(a.href);
              }}
            >
              {isLocalMock ? "Download test data (JSON)" : "Download data export"}
            </button>
          </SettingsPanel>

          <SettingsPanel
            tone="danger"
            title="Delete account"
            subtitle="Permanently remove your business, people, and message history. This cannot be undone."
            icon={<IconAlert />}
          >
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="btn-danger-outline w-full h-10 justify-center sm:w-auto"
            >
              Delete my account
            </button>
          </SettingsPanel>
        </div>
      ) : null}
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Permanently delete your account?"
        body={
          <p>
            This removes your business profile, all contacts, all messages, and any history we have
            for this account. <strong>This cannot be undone.</strong>
          </p>
        }
        confirmLabel="Delete my account"
        tone="danger"
        busy={deletingAccount}
        onConfirm={async () => {
          setDeletingAccount(true);
          try {
            await deleteAccount();
            logout();
            router.push("/");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not delete account.");
          } finally {
            setDeletingAccount(false);
            setConfirmDelete(false);
          }
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function SmsAccessPanel({
  biz,
  onChange,
}: {
  biz: Business | null;
  onChange: (b: Business) => void;
}) {
  const isLocalMock = useBrowserLocalMockApp();
  const [request, setRequest] = useState<SmsAccessRequestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState("");
  const toast = useAppToast();

  // In a local-mock / trial session we don't talk to the real backend, so we treat
  // SMS as already available to keep the demo flow continuous. Real users still need
  // admin approval via the request form below.
  const trialHasSms = isLocalMock;
  const smsEffectivelyEnabled = !!biz?.sms_enabled || trialHasSms;

  useEffect(() => {
    let cancelled = false;
    if (!biz) {
      setLoading(false);
      return;
    }
    if (smsEffectivelyEnabled) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const r = await getMySmsAccessRequest();
        if (!cancelled) setRequest(r.request);
      } catch {
        // Non-fatal — the user can still submit a fresh request.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [biz, smsEffectivelyEnabled]);

  if (!biz) return null;

  if (smsEffectivelyEnabled) {
    return (
      <SettingsPanel
        title="SMS sending"
        subtitle={
          trialHasSms && !biz.sms_enabled
            ? "SMS is available in this trial workspace."
            : "SMS is enabled on your account."
        }
        icon={<IconSms />}
      >
        <p className="text-sm text-slate-700 leading-relaxed">
          You can pick the SMS channel anywhere GoodWord sends a message — Templates,
          People, and Campaigns. We&apos;ll bill SMS in credits at the rate shown on your
          Billing page.
        </p>
      </SettingsPanel>
    );
  }

  const submit = async () => {
    setSubmitting(true);
    try {
      const r = await requestSmsAccess(note);
      if (r.already_enabled) {
        toast.success("SMS is already enabled — refresh to see the new options.");
        onChange({ ...biz, sms_enabled: true });
      } else if (r.status === "approved") {
        toast.success("SMS access approved.");
        onChange({ ...biz, sms_enabled: true });
      } else {
        toast.success("Request received — we'll be in touch by email.");
        setRequest({
          id: "pending",
          status: "pending",
          requested_at: new Date().toISOString(),
          decided_at: null,
          note: note || null,
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send the request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SettingsPanel
      title="SMS sending"
      subtitle="Add SMS as a sending channel for your campaigns and one-off review requests."
      icon={<IconSms />}
    >
      {loading ? (
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
      ) : request && request.status === "pending" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Request pending review</p>
          <p className="mt-1 leading-relaxed">
            Submitted on {new Date(request.requested_at).toLocaleDateString()}. We&apos;ll
            email you when it&apos;s approved — usually within a working day.
          </p>
        </div>
      ) : request && request.status === "denied" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-semibold">Previous request was declined</p>
          <p className="mt-1 leading-relaxed">
            We&apos;ll have sent you an email with the reason. You can submit a new
            request below if your situation has changed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-700 leading-relaxed">
            GoodWord sends review requests by email by default. SMS is gated to keep
            sender quality high — once approved you&apos;ll be able to pick SMS in
            Templates, People, and Campaigns. Tell us how you plan to use it and we&apos;ll
            review:
          </p>
          <textarea
            className="input min-h-[5.5rem] resize-y"
            placeholder="e.g. We're a salon in Manchester and currently send ~80 review requests a month by email. We'd like to add SMS for clients who never opened our emails."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={submitting}
            maxLength={500}
          />
          <div>
            <button
              type="button"
              className="btn-primary h-10 px-5 font-semibold"
              onClick={() => void submit()}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <ButtonSpinner />
                  Sending…
                </>
              ) : (
                "Request SMS access"
              )}
            </button>
          </div>
        </div>
      )}
    </SettingsPanel>
  );
}

function IconSms() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
      <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11h.01M12 11h.01M16 11h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-2 mb-1.5">
        <label className="label mb-0">{label}</label>
        {hint ? <span className="text-xs font-normal text-slate-500">({hint})</span> : null}
      </div>
      {children}
    </div>
  );
}
