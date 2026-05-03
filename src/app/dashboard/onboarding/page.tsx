"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPublicConfig,
  listMyLocations,
  putMyLocationPlatformLinks,
  saveMyBusiness,
  SHOW_SENDER_FIELDS,
} from "@/lib/api";
import { ALL_COUNTRIES } from "@/lib/countryUi";
import {
  getDefaultTimezoneForCountry,
  guessCountryFromTimezone,
  timezoneBelongsToCountry,
} from "@/lib/countryTimezones";
import type { PublicConfig, ReviewPlatformInfo } from "@/types";
import CountrySelect from "@/components/CountrySelect";
import TimezoneCombobox from "@/components/TimezoneCombobox";
import StyledSelect from "@/components/StyledSelect";
import ReviewPlatformIcon from "@/components/ReviewPlatformIcon";
import { ButtonSpinner, useAppToast } from "@/components/ToastProvider";
import PageLoader from "@/components/PageLoader";
import { useDashboardBootstrap } from "@/app/dashboard/DashboardBootstrapProvider";

type ReviewLinkRow = {
  /** Stable id so React doesn't reuse inputs across rows. */
  key: string;
  /** Platform id from public config (e.g. "google", "yelp"). Empty string = unselected. */
  platformId: string;
  /** Public review URL the user pasted. */
  url: string;
};

let rowCounter = 0;
function makeRowKey() {
  rowCounter += 1;
  return `r${Date.now().toString(36)}-${rowCounter}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { bootstrap, refreshBootstrap, mutateBootstrap } = useDashboardBootstrap();
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [form, setForm] = useState({
    name: "",
    // Country/timezone are detected from the visitor's browser on mount (see effect below).
    // We start blank so the user must explicitly confirm their market — no UK fallback.
    country_code: "",
    timezone: "",
    sms_sender_id: "",
    from_name: "",
  });
  const [reviewLinks, setReviewLinks] = useState<ReviewLinkRow[]>(() => [
    { key: makeRowKey(), platformId: "", url: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useAppToast();

  // Onboarding never assumes SMS is available — it is gated by an admin-controlled
  // sms_enabled flag on the business that doesn't exist yet at this point. We just
  // collect the country and let admin enable SMS later via /admin.
  const sms = false;
  const platforms: ReviewPlatformInfo[] = useMemo(
    () => (config?.review_platforms || []).slice().sort((a, b) => a.sort - b.sort),
    [config?.review_platforms],
  );

  useEffect(() => {
    getPublicConfig().then(setConfig).catch(() => {});
  }, []);

  // Seed country/timezone from the browser on first mount. We never overwrite a value
  // the user has already touched; this is purely a smarter default than a hardcoded
  // "GB / Europe/London" that would otherwise force every visitor through a UK lens.
  useEffect(() => {
    setForm((f) => {
      if (f.country_code || f.timezone) return f;
      let detectedTz = "";
      try {
        detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      } catch {
        detectedTz = "";
      }
      const detectedCountry = guessCountryFromTimezone(detectedTz) || "";
      const tz =
        detectedTz ||
        (detectedCountry ? getDefaultTimezoneForCountry(detectedCountry) || "" : "");
      return { ...f, country_code: detectedCountry, timezone: tz };
    });
  }, []);

  useEffect(() => {
    if (bootstrap?.business && !busy) {
      router.replace("/dashboard?welcome=1");
    }
  }, [bootstrap?.business, busy, router]);

  function handleCountryChange(code: string) {
    const hint = (config?.timezone_hints?.[code] ?? "").trim();
    setForm((f) => {
      // Pick a timezone that's actually valid for the chosen country. Order of priority:
      //   1) Backend-provided hint (when the country is in the small curated list).
      //   2) The current timezone, but only if it's already in the country's IANA zones.
      //   3) The most populous / canonical zone for that country.
      //   4) Whatever the user already had (last resort, keeps the form usable).
      const fromHint = hint;
      const currentBelongs = timezoneBelongsToCountry(f.timezone, code);
      const fromCountry = getDefaultTimezoneForCountry(code) || "";
      const nextTz =
        fromHint || (currentBelongs ? f.timezone : fromCountry) || f.timezone;
      return { ...f, country_code: code, timezone: nextTz };
    });
  }

  const countryName =
    ALL_COUNTRIES.find((c) => c.code === form.country_code)?.name || form.country_code;

  function updateRow(key: string, patch: Partial<ReviewLinkRow>) {
    setReviewLinks((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRow(key: string) {
    setReviewLinks((rows) => {
      const next = rows.filter((r) => r.key !== key);
      return next.length === 0 ? [{ key: makeRowKey(), platformId: "", url: "" }] : next;
    });
  }

  function addRow() {
    setReviewLinks((rows) => [...rows, { key: makeRowKey(), platformId: "", url: "" }]);
  }

  /** Platforms still available to pick in a brand-new row (one link per platform). */
  const usedPlatformIds = useMemo(
    () => new Set(reviewLinks.map((r) => r.platformId).filter(Boolean)),
    [reviewLinks],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const nameTrimmed = form.name.trim();
    if (!nameTrimmed) {
      setError("Business name is required.");
      return;
    }
    if (!form.timezone) {
      setError("Please select a timezone.");
      return;
    }

    // Validate review-link rows: any row with a URL must have a platform; URLs must look like http(s).
    const linkPayload: Record<string, string> = {};
    for (const r of reviewLinks) {
      const url = r.url.trim();
      if (!url && !r.platformId) continue;
      if (url && !r.platformId) {
        setError("Pick a review site for each link you add.");
        return;
      }
      if (r.platformId && !url) {
        // Platform selected with no URL — skip silently, treat as not added.
        continue;
      }
      if (!/^https?:\/\//i.test(url)) {
        setError("Review links must start with http:// or https://");
        return;
      }
      if (linkPayload[r.platformId]) {
        setError("Each review site can only be added once.");
        return;
      }
      linkPayload[r.platformId] = url;
    }

    setBusy(true);
    try {
      const saved = await saveMyBusiness({
        name: nameTrimmed,
        country_code: form.country_code,
        timezone: form.timezone,
        sms_sender_id: sms ? form.sms_sender_id.trim() || undefined : undefined,
        from_name: form.from_name.trim() || nameTrimmed,
      });

      // Save review links onto the auto-created default location, if any were entered.
      if (Object.keys(linkPayload).length > 0) {
        try {
          const locs = await listMyLocations();
          const defaultId =
            locs.default_location_id || (locs.locations[0] && locs.locations[0].id) || null;
          if (defaultId) {
            await putMyLocationPlatformLinks(defaultId, linkPayload);
          }
        } catch (linkErr) {
          // Don't block onboarding if link save fails — surface a soft warning instead.
          toast.error(
            linkErr instanceof Error
              ? `Saved business, but couldn't save review links: ${linkErr.message}`
              : "Saved business, but couldn't save review links.",
          );
        }
      }

      try {
        await refreshBootstrap({ force: true });
      } catch {
        mutateBootstrap((prev) => (prev ? { ...prev, business: saved.business } : prev));
      }
      toast.success("Business saved");
      router.push("/dashboard?welcome=1");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!config) {
    return (
      <div className="max-w-xl mx-auto pt-16 flex justify-center min-h-[40vh]">
        <PageLoader message="Loading" size="md" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pt-2 relative">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-8 h-44 w-44 rounded-full bg-gradient-to-br from-warm-200/55 via-warm-100/30 to-transparent blur-2xl"
      />
      <p className="app-eyebrow relative">
        <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
        Welcome to GoodWord
      </p>
      <h1 className="display-title-lg mt-3 mb-3 text-slate-900 relative">Set up your business</h1>
      <p className="text-base text-slate-700 mb-7 leading-relaxed relative max-w-md">
        Tell us where you are, what you're called, and where reviews live. The whole thing
        takes about two minutes — you can change anything later.
      </p>

      <form onSubmit={submit} className="rounded-3xl border border-slate-200/85 bg-white p-6 sm:p-7 space-y-6 shadow-card relative">
        <div>
          <label className="label" htmlFor="onboarding-country">
            Country or region
          </label>
          <CountrySelect
            id="onboarding-country"
            value={form.country_code}
            onChange={handleCountryChange}
            options={ALL_COUNTRIES}
          />
          <p className="text-xs font-medium text-slate-700 mt-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 leading-relaxed">
            GoodWord sends review requests by email. You can request SMS access from
            Settings after you finish setup.
          </p>
        </div>

        <div>
          <label className="label">Business name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            maxLength={120}
            placeholder="The Bean Cafe"
          />
        </div>

        <div>
          <label className="label" htmlFor="onboarding-timezone">
            Timezone
          </label>
          <TimezoneCombobox
            id="onboarding-timezone"
            className="mt-1.5"
            value={form.timezone}
            onChange={(timezone) => setForm({ ...form, timezone })}
            disabled={busy}
            countryCode={form.country_code}
            countryLabel={countryName}
          />
          <p className="text-xs text-slate-600 mt-2">Used to display dates and times in the dashboard.</p>
        </div>

        {SHOW_SENDER_FIELDS && sms && (
          <div>
            <label className="label">SMS sender label (optional)</label>
            <input
              className="input"
              value={form.sms_sender_id}
              onChange={(e) => setForm({ ...form, sms_sender_id: e.target.value })}
              maxLength={11}
              placeholder="BeanCafe"
            />
            <p className="text-xs text-slate-600 mt-2">Up to 11 characters, letters and numbers.</p>
          </div>
        )}

        {SHOW_SENDER_FIELDS && (
          <div>
            <label className="label">Email &ldquo;from&rdquo; name (optional)</label>
            <input
              className="input"
              value={form.from_name}
              onChange={(e) => setForm({ ...form, from_name: e.target.value })}
              maxLength={120}
              placeholder="The Bean Cafe team"
            />
          </div>
        )}

        {platforms.length > 0 && (
          <fieldset className="rounded-2xl border border-warm-200/70 bg-gradient-to-br from-warm-50/40 to-white p-4 space-y-3">
            <legend className="px-1 text-sm font-semibold text-slate-800">
              Review links <span className="font-normal text-slate-500">(optional)</span>
            </legend>
            <p className="text-xs text-slate-600 leading-relaxed -mt-1">
              Add one or more public review pages — Google, Yelp, TripAdvisor, Facebook, etc. We&rsquo;ll send customers
              to these from your campaigns. You can add more or change them later in Settings.
            </p>

            <div className="space-y-2.5">
              {reviewLinks.map((row, idx) => {
                const selectedPlatform = platforms.find((p) => p.id === row.platformId);
                const availableForRow = platforms.filter(
                  (p) => p.id === row.platformId || !usedPlatformIds.has(p.id),
                );
                return (
                  <div
                    key={row.key}
                    className="rounded-xl border border-slate-200 bg-white p-2.5 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                        {row.platformId ? (
                          <ReviewPlatformIcon platformId={row.platformId} size="md" />
                        ) : (
                          <span className="text-xs font-medium text-slate-400">{idx + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <StyledSelect
                          aria-label={`Review site ${idx + 1}`}
                          value={row.platformId}
                          disabled={busy}
                          onChange={(e) => updateRow(row.key, { platformId: e.target.value })}
                          className="!h-10 !min-h-0 text-sm"
                        >
                          <option value="">Select a review site…</option>
                          {availableForRow.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.label}
                            </option>
                          ))}
                        </StyledSelect>
                      </div>
                      {reviewLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(row.key)}
                          disabled={busy}
                          aria-label={`Remove review site ${idx + 1}`}
                          className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="M4 7h16M10 11v6M14 11v6M6 7l1-2h10l1 2M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <input
                      className="input text-sm w-full"
                      type="url"
                      inputMode="url"
                      placeholder={
                        selectedPlatform
                          ? `https://… (your ${selectedPlatform.label} review link)`
                          : "https://… (public review URL)"
                      }
                      value={row.url}
                      disabled={busy}
                      onChange={(e) => updateRow(row.key, { url: e.target.value })}
                    />
                    {selectedPlatform?.description && (
                      <p className="text-xs text-slate-500 leading-snug">{selectedPlatform.description}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {usedPlatformIds.size < platforms.length && (
              <button
                type="button"
                onClick={addRow}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                Add another review site
              </button>
            )}
          </fieldset>
        )}

        {error && (
          <div className="text-sm text-red-700 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-300" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-warm w-full h-12 text-base font-semibold"
        >
          {busy && <ButtonSpinner />}
          {busy ? "Saving…" : "Save and continue"}
        </button>
      </form>
    </div>
  );
}
