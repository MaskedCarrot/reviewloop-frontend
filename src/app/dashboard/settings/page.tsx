"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteAccount,
  getDataExportBundle,
  saveMyBusiness,
} from "@/lib/api";
import { useBrowserLocalMockApp } from "@/lib/useBrowserLocalMockApp";
import { useAuth } from "@/lib/auth";
import { ALL_COUNTRIES, countrySupportsSms, getSmsSupportedList } from "@/lib/countryUi";
import type { Business, PublicConfig } from "@/types";
import CountrySelect from "@/components/CountrySelect";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import InfoTip from "@/components/InfoTip";
import { ButtonSpinner, useAppToast } from "@/components/ToastProvider";
import SettingsPageSkeleton from "@/components/skeletons/SettingsPageSkeleton";
import LocationSettingsBlock from "./LocationSettingsBlock";
import { useDashboardBootstrap } from "../DashboardBootstrapProvider";

const NAV = [
  { id: "business", label: "Profile" },
  { id: "timing", label: "Timing" },
  { id: "store-locations", label: "Stores" },
  { id: "data-export", label: "Export" },
] as const;

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
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)]"
    >
      <div
        className={
          tone === "danger"
            ? "border-b border-rose-100/90 bg-gradient-to-r from-rose-50/95 via-rose-50/40 to-white"
            : "border-b border-slate-100/90 bg-gradient-to-r from-slate-50/95 via-white to-slate-50/30"
        }
      >
        <div className="flex gap-3.5 px-4 py-3.5 sm:px-6 sm:py-4">
          <div
            className={
              tone === "danger"
                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-200/60 bg-white/80 text-rose-700"
                : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-50/80 text-slate-600"
            }
          >
            {icon}
          </div>
          <div className="min-w-0 pt-0.5">
            <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{subtitle}</p>
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
function IconClock() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
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
    if (!timezoneTrimmed || !timezoneTrimmed.includes("/")) {
      setError("Enter a valid IANA timezone (e.g. Europe/London, America/New_York).");
      return;
    }
    const fromEmailTrimmed = (biz.from_email || "").trim();
    if (fromEmailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fromEmailTrimmed)) {
      setError("Enter a valid reply-to email address or leave it blank.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await saveMyBusiness({
        name: nameTrimmed,
        gmb_review_url: (biz.gmb_review_url || "").trim() || undefined,
        country_code: biz.country_code,
        timezone: timezoneTrimmed,
        from_name: biz.from_name,
        from_email: fromEmailTrimmed || undefined,
        sms_sender_id: biz.sms_sender_id || undefined,
        default_send_delay_minutes: biz.default_send_delay_minutes,
        quiet_hours_start: biz.quiet_hours_start,
        quiet_hours_end: biz.quiet_hours_end,
        branding_color: biz.branding_color,
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

  const sms = biz && cfg ? countrySupportsSms(biz.country_code, getSmsSupportedList(cfg)) : false;

  return (
    <div className="app-page relative z-0 max-w-4xl w-full sm:max-w-4xl">
      <div
        className="pointer-events-none absolute inset-x-0 -top-1 -z-10 mx-auto h-40 max-w-4xl bg-gradient-to-b from-slate-200/30 via-slate-100/10 to-transparent"
        aria-hidden
      />

      <DashboardPageHeader
        title="Settings"
        credits={creditBalance}
        description={
          <p className="line-clamp-2">
            Your business profile, send timing, store review links, data export, and account options.
          </p>
        }
        info={{
          label: "What you can change here",
          size: "md",
          children: (
            <p>
              Name, country, time zone, sender and reply, SMS label where supported, quiet hours, brand colour,{" "}
              <strong>per-store public review links</strong>, and exporting or deleting your data.
            </p>
          ),
        }}
      />

      {!(biz && cfg) && <SettingsPageSkeleton />}

      {biz && cfg && (
        <>
      <nav
        className="flex flex-wrap gap-1.5 sm:gap-2 -mt-2"
        aria-label="Jump to section"
      >
        {NAV.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            {item.label}
          </a>
        ))}
        <a
          href="#danger"
          className="inline-flex items-center rounded-full border border-rose-200/60 bg-rose-50/50 px-3 py-1 text-xs font-medium text-rose-800/90 transition hover:border-rose-300 hover:bg-rose-50"
        >
          Account
        </a>
      </nav>

      <form onSubmit={save} className="space-y-6 sm:space-y-7">
        <SettingsPanel
          id="business"
          title="Business & sender"
          subtitle="How you appear in email and SMS. Public review page links are managed per store below."
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

            <div className="flex gap-3 rounded-xl border border-amber-200/70 bg-amber-50/40 p-3.5 text-sm text-amber-950/90 sm:items-start">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-100/80 text-amber-800">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
              </div>
              <p>
                <span className="font-medium">Review links live in Store locations</span> — one HTTPS link per review site
                per store. The{" "}
                <a className="font-medium text-amber-900/95 underline decoration-amber-400/80 hover:decoration-amber-600" href="#store-locations">
                  Stores
                </a>{" "}
                section is where you add Google, Yelp, and more.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <Field label="Country">
                <CountrySelect
                  id="settings-country"
                  value={biz.country_code}
                  options={ALL_COUNTRIES}
                  onChange={(code) => {
                    setBiz((b) =>
                      b
                        ? {
                            ...b,
                            country_code: code,
                            sms_sender_id: countrySupportsSms(code, getSmsSupportedList(cfg)) ? b.sms_sender_id : null,
                          }
                        : b,
                    );
                  }}
                />
                {cfg && !sms && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    SMS isn&apos;t available in this market. Email and the rest of ReviewLoop work as usual.
                  </p>
                )}
              </Field>
              <Field label="Time zone" hint="IANA name, e.g. Europe/London">
                <input
                  className="input w-full font-mono text-sm"
                  value={biz.timezone}
                  onChange={(e) => setBiz({ ...biz, timezone: e.target.value })}
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <Field label="From name (email)">
                <input
                  className="input w-full"
                  value={biz.from_name}
                  onChange={(e) => setBiz({ ...biz, from_name: e.target.value })}
                />
              </Field>
              <Field label="Reply-to email" hint="Optional">
                <input
                  className="input w-full"
                  type="email"
                  value={biz.from_email || ""}
                  onChange={(e) => setBiz({ ...biz, from_email: e.target.value })}
                  autoComplete="email"
                />
              </Field>
            </div>

            {sms && (
              <Field label="SMS sender label" hint="Up to 11 characters — can appear in some regions">
                <input
                  className="input w-full sm:max-w-xs"
                  maxLength={11}
                  value={biz.sms_sender_id || ""}
                  onChange={(e) => setBiz({ ...biz, sms_sender_id: e.target.value })}
                />
              </Field>
            )}

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-800">Brand colour</span>
                <span className="text-xs text-slate-500 tabular-nums">
                  {(biz.branding_color || "#2563eb").toUpperCase()}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  className="h-12 w-20 cursor-pointer rounded-xl border border-slate-200/80 bg-white p-1 shadow-inner"
                  type="color"
                  value={biz.branding_color || "#2563eb"}
                  onChange={(e) => setBiz({ ...biz, branding_color: e.target.value })}
                  title="Choose brand colour"
                />
                <p className="min-w-0 text-xs leading-relaxed text-slate-500 sm:max-w-sm">
                  Used in customer-facing review links and emails. Pick something close to your brand.
                </p>
              </div>
            </div>
          </div>
        </SettingsPanel>

        <SettingsPanel
          id="timing"
          title="Timing & quiet hours"
          subtitle="Default wait before a queued send, and the overnight window we avoid in each contact's local time."
          icon={<IconClock />}
        >
          <div className="space-y-5 sm:space-y-6">
            <div>
              <div className="flex items-center gap-1.5">
                <label className="label mb-0" htmlFor="default-send-delay">
                  Default send delay (minutes)
                </label>
                <InfoTip size="md" label="What default send delay does">
                  <p>
                    Wait time after you queue a request before we try to send (People, import, webhooks, etc.).{" "}
                    <strong>0</strong> means the next run; quiet hours still block overnight. Business-wide default;
                    individual templates can override.
                  </p>
                </InfoTip>
              </div>
              <div className="mt-1.5 flex flex-wrap items-end gap-3">
                <input
                  id="default-send-delay"
                  className="input w-32 tabular-nums"
                  type="number"
                  min={0}
                  max={10080}
                  value={biz.default_send_delay_minutes}
                  onChange={(e) => setBiz({ ...biz, default_send_delay_minutes: Number(e.target.value) })}
                />
                <p className="min-w-0 text-xs text-slate-500">
                  0 = send on the next scheduler run. Templates can set their own delay.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <Field
                label="Quiet hours start"
                hint="Hour 0–23, contact's local time"
              >
                <input
                  className="input w-full tabular-nums"
                  type="number"
                  min={0}
                  max={23}
                  value={biz.quiet_hours_start}
                  onChange={(e) => setBiz({ ...biz, quiet_hours_start: Number(e.target.value) })}
                />
              </Field>
              <Field label="Quiet hours end" hint="When sending can resume (same day rules apply)">
                <input
                  className="input w-full tabular-nums"
                  type="number"
                  min={0}
                  max={23}
                  value={biz.quiet_hours_end}
                  onChange={(e) => setBiz({ ...biz, quiet_hours_end: Number(e.target.value) })}
                />
              </Field>
            </div>
          </div>
        </SettingsPanel>

        {error && (
          <div
            className="rounded-2xl border border-red-200/70 bg-red-50/50 px-4 py-3 text-sm text-red-800 shadow-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        <LocationSettingsBlock
          publicConfig={cfg}
          onBusinessRefresh={(r) => {
            setBiz(r.business);
            mutateBootstrap((prev) => (prev ? { ...prev, business: r.business } : prev));
          }}
        />

        <div className="sm:sticky sm:bottom-4 z-10">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-[0_-8px_32px_-12px_rgba(15,23,42,0.12),0_1px_0_rgba(15,23,42,0.04)] backdrop-blur supports-[backdrop-filter]:bg-white/70">
            <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
              <p className="min-w-0 text-xs sm:text-sm text-slate-500 sm:max-w-md sm:leading-relaxed">
                <span className="font-medium text-slate-700">Save</span> below updates profile, timing, and brand colour
                in this form. <span className="font-medium">Stores</span> use the same one-field save when you leave an
                input. Export and account are separate.
              </p>
              <button
                type="submit"
                disabled={busy}
                className="btn-primary h-10 shrink-0 px-6 inline-flex w-full min-h-10 items-center justify-center gap-2 sm:w-auto"
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

      <div id="data-export" className="scroll-mt-4">
        <SettingsPanel
          title="Data export"
          subtitle="A single JSON with your business profile, contacts, messages, and related records for backup or analysis."
          icon={<IconDownload />}
        >
          {isLocalMock && (
            <p className="mb-3 rounded-lg border border-slate-200/80 bg-slate-50/90 px-3 py-2 text-xs text-slate-600">
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
              a.download = "reviewloop-export.json";
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            {isLocalMock ? "Download test data (JSON)" : "Download data export"}
          </button>
        </SettingsPanel>
      </div>

      <div id="danger" className="scroll-mt-4">
        <SettingsPanel
          tone="danger"
          title="Delete account"
          subtitle="Permanently remove your business, people, and message history. This action cannot be undone."
          icon={<IconAlert />}
        >
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Permanently delete all ReviewLoop data? This cannot be undone.")) return;
              await deleteAccount();
              logout();
              router.push("/");
            }}
            className="btn-danger-outline w-full h-10 justify-center sm:w-auto"
          >
            Delete my account
          </button>
        </SettingsPanel>
      </div>
        </>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-2">
        <label className="label mb-0">{label}</label>
        {hint ? <span className="text-xs font-normal text-slate-400">({hint})</span> : null}
      </div>
      {children}
    </div>
  );
}
