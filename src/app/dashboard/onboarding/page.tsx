"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyBusiness, getPublicConfig, saveMyBusiness } from "@/lib/api";
import { ALL_COUNTRIES, countrySupportsSms, getSmsSupportedList } from "@/lib/countryUi";
import type { PublicConfig } from "@/types";
import CountrySelect from "@/components/CountrySelect";
import { ButtonSpinner, useAppToast } from "@/components/ToastProvider";
import PageLoader from "@/components/PageLoader";

const TZ_HINT: Record<string, string> = {
  GB: "Europe/London",
  US: "America/New_York",
  CA: "America/Toronto",
  DE: "Europe/Berlin",
  AU: "Australia/Sydney",
  FR: "Europe/Paris",
  IE: "Europe/Dublin",
  NZ: "Pacific/Auckland",
  NL: "Europe/Amsterdam",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [form, setForm] = useState({
    name: "",
    gmb_review_url: "",
    country_code: "GB",
    timezone: "",
    sms_sender_id: "",
    from_name: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useAppToast();

  const sms = countrySupportsSms(form.country_code, getSmsSupportedList(config));

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMyBusiness(), getPublicConfig()])
      .then(([biz, cfg]) => {
        if (cancelled) return;
        setConfig(cfg);
        if (biz.business) router.replace("/dashboard");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function isGoogleReviewUrl(url: string): boolean {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return (
        host === "g.page" ||
        host === "maps.app.goo.gl" ||
        host.endsWith(".google.com") ||
        host === "goo.gl"
      );
    } catch {
      return false;
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const nameTrimmed = form.name.trim();
    const gmbUrl = form.gmb_review_url.trim();
    if (!nameTrimmed) {
      setError("Business name is required.");
      return;
    }
    if (!gmbUrl) {
      setError("Google review link is required.");
      return;
    }
    if (!isGoogleReviewUrl(gmbUrl)) {
      setError("That doesn't look like a Google review link. Copy it from your Google Business Profile.");
      return;
    }
    setBusy(true);
    try {
      await saveMyBusiness({
        name: nameTrimmed,
        gmb_review_url: gmbUrl,
        country_code: form.country_code,
        timezone: form.timezone.trim() || undefined,
        sms_sender_id: sms ? (form.sms_sender_id.trim() || undefined) : undefined,
        from_name: form.from_name.trim() || nameTrimmed,
      });
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
    <div className="max-w-xl mx-auto pt-2">
      <h1 className="app-title mb-1">Set up your business</h1>
      <p className="app-subtitle text-slate-600 mb-6">
        Start with your country. We use it to decide whether SMS campaigns are available for your business.
        Email always works.
      </p>

      <form onSubmit={submit} className="card p-6 space-y-5">
        <div>
          <label className="label" htmlFor="onboarding-country">
            Country or region
          </label>
          <CountrySelect
            id="onboarding-country"
            value={form.country_code}
            onChange={(code) => {
              setForm((f) => ({
                ...f,
                country_code: code,
                timezone: TZ_HINT[code] || f.timezone,
              }));
            }}
            options={ALL_COUNTRIES}
          />
          {sms ? (
            <p className="text-xs text-emerald-800 mt-1.5 rounded-lg bg-emerald-50 border border-emerald-100/80 px-2.5 py-1.5">
              SMS is available in your market for review requests. You can set a sender name below.
            </p>
          ) : (
            <p className="text-xs text-slate-600 mt-1.5 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1.5">
              We don't send SMS in this country from ReviewLoop (carrier rules). You can use email and all other
              features.
            </p>
          )}
        </div>

        <div>
          <label className="label">Business name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={120} placeholder="The Bean Cafe" />
        </div>

        <div>
          <label className="label">Google review link</label>
          <input
            className="input"
            value={form.gmb_review_url}
            onChange={(e) => setForm({ ...form, gmb_review_url: e.target.value })}
            required
            type="url"
            placeholder="https://g.page/r/..."
          />
          <p className="text-xs text-slate-500 mt-1.5">Google Business Profile → Get more reviews → share review form</p>
        </div>

        <div>
          <label className="label">Timezone (optional)</label>
          <input
            className="input"
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            placeholder="Europe/London"
          />
        </div>

        {sms && (
          <div>
            <label className="label">SMS sender label (optional)</label>
            <input
              className="input"
              value={form.sms_sender_id}
              onChange={(e) => setForm({ ...form, sms_sender_id: e.target.value })}
              maxLength={11}
              placeholder="BeanCafe"
            />
            <p className="text-xs text-slate-500 mt-1.5">Up to 11 characters, letters and numbers.</p>
          </div>
        )}

        <div>
          <label className="label">Email "from" name (optional)</label>
          <input
            className="input"
            value={form.from_name}
            onChange={(e) => setForm({ ...form, from_name: e.target.value })}
            maxLength={120}
            placeholder="The Bean Cafe team"
          />
        </div>

        {error && <div className="text-sm text-red-700 px-3 py-2 rounded-lg bg-red-50 border border-red-200">{error}</div>}

        <button type="submit" disabled={busy} className="btn-primary w-full h-12 inline-flex items-center justify-center gap-2">
          {busy && <ButtonSpinner />}
          {busy ? "Saving…" : "Save and continue"}
        </button>
      </form>
    </div>
  );
}
