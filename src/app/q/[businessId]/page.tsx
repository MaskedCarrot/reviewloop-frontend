"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getQrPublicBusiness, submitQrOptIn } from "@/lib/api";
import { publicReviewPageDestinations } from "@/lib/reviewPlatformsFromLocations";
import type { RoutingBusinessInfo } from "@/types";
import PageLoader from "@/components/PageLoader";
import ReviewPlatformIcon from "@/components/ReviewPlatformIcon";

export default function QrOptInPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const searchParams = useSearchParams();
  const locationIdFromQuery = (searchParams.get("l") || "").trim() || null;
  const [biz, setBiz] = useState<RoutingBusinessInfo | null>(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    consent: true,
    channel: "auto" as "auto" | "email" | "sms",
  });

  useEffect(() => {
    if (!businessId) return;
    getQrPublicBusiness(businessId, { locationId: locationIdFromQuery })
      .then((r) => setBiz(r.business))
      .catch((e) => setError(e?.message || "Could not load"));
  }, [businessId, locationIdFromQuery]);

  if (error) {
    return (
      <Wrap accent="#475569">
        <h1 className="text-xl font-bold mb-2 text-center">Link not available</h1>
        <p className="text-sm text-slate-600 text-center">{error}</p>
      </Wrap>
    );
  }
  if (!biz) {
    return (
      <Wrap accent="#94a3b8">
        <div className="flex min-h-[200px] items-center justify-center">
          <PageLoader message="Loading" size="md" />
        </div>
      </Wrap>
    );
  }

  const accent = biz.branding_color || "#2563eb";
  const destinations = publicReviewPageDestinations(biz);

  if (submitted) {
    return (
      <Wrap accent={accent}>
        <div className="text-center">
          <div
            className="mx-auto mb-3 w-12 h-12 rounded-full flex items-center justify-center animate-fade-in"
            style={{ background: accent + "22", color: accent }}
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Thanks</h1>
          <p className="text-sm text-slate-600">
            {biz.name} can reach you using the details you shared. You can still leave a public review anytime using the
            same links.
          </p>
        </div>
      </Wrap>
    );
  }

  return (
    <Wrap accent={accent}>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">How was your visit?</h1>
        <p className="text-sm text-slate-600 mt-1">{biz.name} thanks you — leave a public review in seconds.</p>
      </div>

      <div className="space-y-2.5 mb-2">
        {destinations
          .filter((d) => d.url)
          .map((d) => {
            const isGoogle = d.id === "google";
            return (
              <a
                key={d.id}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex w-full items-center justify-center gap-2.5 text-center py-3.5 rounded-2xl font-semibold shadow-md active:scale-[0.99] transition ${
                  isGoogle
                    ? "text-white"
                    : "text-slate-800 bg-white border-2 border-slate-200 hover:border-slate-300"
                }`}
                style={isGoogle ? { background: accent } : undefined}
              >
                <ReviewPlatformIcon platformId={d.id} size="md" />
                <span>{isGoogle ? "Leave a Google review" : `Review on ${d.label}`}</span>
              </a>
            );
          })}
      </div>
      <p className="text-xs text-slate-500 text-center mb-6">
        Opens in a new tab — you don't need to wait for a follow-up from us to leave a public review.
      </p>

      <div className="border-t border-slate-200 pt-5">
        <p className="text-sm font-semibold text-slate-800 mb-1">Want a follow-up from {biz.name}?</p>
        <p className="text-xs text-slate-500 mb-4">
          The buttons above are for your public review—you can use those and stop there. If you add email or phone
          here, the team can thank you, send a gentle review reminder, or get back to you if something
          didn&apos;t go as expected. Optional; only for messages you&apos;ve asked for.
        </p>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const emailTrimmed = form.email.trim();
            const phoneTrimmed = form.phone.trim();
            if (!emailTrimmed && !phoneTrimmed) {
              setError("Add an email or phone to continue, or use the review links above if you only want a public review.");
              return;
            }
            if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrimmed)) {
              setError("Please enter a valid email address.");
              return;
            }
            if (phoneTrimmed && !/^\+[1-9]\d{6,14}$/.test(phoneTrimmed)) {
              setError("Please enter phone in international format, e.g. +447700900123.");
              return;
            }
            if (!form.consent) {
              setError("Please tick the consent box to share your contact details.");
              return;
            }
            setBusy(true);
            setError("");
            try {
              await submitQrOptIn(businessId, {
                name: form.name.trim() || undefined,
                email: emailTrimmed || undefined,
                phone: phoneTrimmed || undefined,
                consent: form.consent,
                channel: form.channel,
                location_id: locationIdFromQuery ?? undefined,
              });
              setSubmitted(true);
            } catch (e: unknown) {
              setError(e instanceof Error ? e.message : "Could not submit. Please try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <input
            className="input"
            placeholder="Your name (optional)"
            value={form.name}
            onChange={(e) => {
              setError("");
              setForm({ ...form, name: e.target.value });
            }}
            maxLength={120}
          />
          <input
            className="input"
            type="email"
            placeholder="Email (optional for follow-up)"
            value={form.email}
            onChange={(e) => {
              setError("");
              setForm({ ...form, email: e.target.value });
            }}
            maxLength={320}
          />
          <input
            className="input"
            placeholder="Phone, e.g. +447700900123 (optional)"
            value={form.phone}
            onChange={(e) => {
              setError("");
              setForm({ ...form, phone: e.target.value });
            }}
            maxLength={24}
          />
          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => setForm({ ...form, consent: e.target.checked })}
              className="mt-0.5"
            />
            <span>
              {biz.name} may use these details to contact me about this visit and review reminders (as allowed by
              law).
            </span>
          </label>
          {error && <div className="text-sm text-red-700 px-3 py-2 rounded-lg bg-red-50 border border-red-200">{error}</div>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm border border-slate-200/80 disabled:opacity-50"
          >
            {busy ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-slate-400/40 border-t-slate-700 rounded-full animate-spin" />
                Submitting…
              </span>
            ) : (
              "Send my contact details (optional)"
            )}
          </button>
        </form>
      </div>
    </Wrap>
  );
}

function Wrap({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: `linear-gradient(180deg, ${accent}10 0%, white 60%)` }}
    >
      <div className="w-full max-w-md card p-6 sm:p-8 animate-fade-in">{children}</div>
    </div>
  );
}
