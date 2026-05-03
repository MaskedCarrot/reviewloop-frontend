"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getQrPublicBusiness, submitQrFeedback, submitQrOptIn } from "@/lib/api";
import { publicReviewPageDestinations } from "@/lib/reviewPlatformsFromLocations";
import type { RoutingBusinessInfo } from "@/types";
import PageLoader from "@/components/PageLoader";
import ReviewPlatformIcon from "@/components/ReviewPlatformIcon";
import CustomerWrap from "@/components/customer/CustomerWrap";

function QrOptInPageInner() {
  const { businessId } = useParams<{ businessId: string }>();
  const searchParams = useSearchParams();
  const locationIdFromQuery = (searchParams.get("l") || "").trim() || null;

  const [biz, setBiz] = useState<RoutingBusinessInfo | null>(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    consent: true,
  });

  // Private feedback flow. Hidden behind a "Tell us privately" link that
  // expands the rating + comment form so it doesn't crowd the public-review
  // CTAs above. Mirrors the post-recipient flow at /r/[token].
  const [showPrivate, setShowPrivate] = useState(false);
  const [privateRating, setPrivateRating] = useState(0);
  const [privateComment, setPrivateComment] = useState("");
  const [privateBusy, setPrivateBusy] = useState(false);
  const [privateSubmitted, setPrivateSubmitted] = useState(false);
  const [privateError, setPrivateError] = useState("");

  useEffect(() => {
    if (!businessId) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    getQrPublicBusiness(businessId, { locationId: locationIdFromQuery, signal: controller.signal })
      .then((r) => setBiz(r.business))
      .catch((e) => {
        if (e?.name === "AbortError") {
          setError("Request timed out. Please check your connection and try again.");
        } else {
          setError(e?.message || "Could not load");
        }
      })
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [businessId, locationIdFromQuery]);

  if (error) {
    return (
      <CustomerWrap accent="#475569">
        <h1 className="display-title text-2xl text-slate-900 text-center">Link not available</h1>
        <p className="mt-2 text-sm text-slate-600 text-center">{error}</p>
      </CustomerWrap>
    );
  }

  if (!biz) {
    return (
      <CustomerWrap accent="#94a3b8">
        <div className="flex min-h-[200px] items-center justify-center">
          <PageLoader message="Loading" size="md" />
        </div>
      </CustomerWrap>
    );
  }

  const accent = biz.branding_color || "#e57224"; // fall back to GoodWord warm
  const destinations = publicReviewPageDestinations(biz).filter((d) => d.url);

  if (submitted) {
    return (
      <CustomerWrap accent={accent}>
        <div className="text-center">
          <div
            className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl animate-fade-in"
            style={{ background: accent + "26", color: accent }}
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="display-title text-2xl text-slate-900">Thanks — we've got your details.</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
            <span className="font-semibold text-slate-900">{biz.name}</span> can reach you using
            the details you shared. You can still leave a public review anytime — just scan the QR
            again.
          </p>
        </div>
      </CustomerWrap>
    );
  }

  return (
    <CustomerWrap accent={accent}>
      <div className="text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-soft">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
          Quick review
        </p>
        <h1 className="display-title-lg mt-4 text-slate-900">How was your visit?</h1>
        <p className="mt-3 text-sm text-slate-700 leading-relaxed">
          <span className="font-semibold text-slate-900">{biz.name}</span> would love a quick word —
          pick the option that suits you.
        </p>
      </div>

      {/* 1) Public review buttons */}
      {destinations.length > 0 && (
        <section className="mt-6 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 px-1">
            Leave a public review
          </p>
          <div className="space-y-2">
            {destinations.map((d, i) => {
              const isPrimary = i === 0;
              return (
                <a
                  key={d.id}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[
                    "group flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-base font-semibold transition-all active:scale-[0.99]",
                    isPrimary
                      ? "text-white shadow-[0_10px_30px_-12px_var(--btn-shadow)]"
                      : "text-slate-900 bg-white border-2 border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-card",
                  ].join(" ")}
                  style={
                    isPrimary
                      ? ({
                          background: accent,
                          ["--btn-shadow" as string]: accent,
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  <span className="flex items-center gap-3">
                    <ReviewPlatformIcon platformId={d.id} size="md" />
                    <span>
                      {isPrimary ? `Review on ${d.label}` : `Or review on ${d.label}`}
                    </span>
                  </span>
                  <svg
                    className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 transition-transform"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    aria-hidden
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 text-center pt-1">Opens in a new tab.</p>
        </section>
      )}

      {/* 2) Share contact for follow-up */}
      <section className="mt-7 border-t border-slate-200 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 mb-3">
          Want a follow-up?
        </p>
        {submitted ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
            Got your details — {biz.name} can reach out using what you shared.
          </div>
        ) : (
          <form
            className="space-y-2.5"
            onSubmit={async (e) => {
              e.preventDefault();
              const emailTrimmed = contactForm.email.trim();
              const phoneTrimmed = contactForm.phone.trim();
              if (!emailTrimmed && !phoneTrimmed) {
                setError("Add an email or phone to get a follow-up.");
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
              if (!contactForm.consent) {
                setError("Please tick consent to share your contact details.");
                return;
              }
              setBusy(true);
              setError("");
              try {
                await submitQrOptIn(businessId, {
                  name: contactForm.name.trim() || undefined,
                  email: emailTrimmed || undefined,
                  phone: phoneTrimmed || undefined,
                  consent: contactForm.consent,
                  channel: "auto",
                  location_id: locationIdFromQuery ?? undefined,
                });
                setSubmitted(true);
              } catch (err: unknown) {
                setError(
                  err instanceof Error ? err.message : "Could not submit. Please try again.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <input
              className="input"
              placeholder="Your name (optional)"
              value={contactForm.name}
              onChange={(e) => {
                setError("");
                setContactForm({ ...contactForm, name: e.target.value });
              }}
              maxLength={120}
            />
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={contactForm.email}
              onChange={(e) => {
                setError("");
                setContactForm({ ...contactForm, email: e.target.value });
              }}
              maxLength={320}
            />
            <input
              className="input"
              placeholder="Phone, e.g. +447700900123"
              value={contactForm.phone}
              onChange={(e) => {
                setError("");
                setContactForm({ ...contactForm, phone: e.target.value });
              }}
              maxLength={24}
            />
            <label className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
              <input
                type="checkbox"
                checked={contactForm.consent}
                onChange={(e) =>
                  setContactForm({ ...contactForm, consent: e.target.checked })
                }
                className="mt-0.5 accent-warm-500"
              />
              <span>
                <span className="font-medium text-slate-900">{biz.name}</span> may use these
                details to contact me about my visit and review reminders.
              </span>
            </label>
            {error && (
              <div
                className="text-sm text-red-800 px-3 py-2 rounded-xl bg-red-50 border border-red-200"
                role="alert"
              >
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-xl text-white font-semibold text-sm shadow-sm disabled:opacity-50 transition-colors active:scale-[0.99]"
              style={{ background: accent }}
            >
              {busy ? "Submitting…" : "Share my contact details"}
            </button>
          </form>
        )}
      </section>

      {/* 3) Private feedback — collapsed link that expands a rating + comment form.
            Lets walk-ins or QR-scanners share private feedback without an email
            recipient token, so the only way "in" was previously the contact-share
            section above. */}
      <section className="mt-7 border-t border-slate-200 pt-5">
        {privateSubmitted ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
            Thanks — {biz.name} will read your feedback shortly.
          </div>
        ) : !showPrivate ? (
          <button
            type="button"
            onClick={() => setShowPrivate(true)}
            className="group w-full flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-3.5 text-left transition-colors hover:bg-white"
          >
            <span>
              <p className="text-sm font-semibold text-slate-900">Or tell us privately</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Anything we should fix? We&apos;d rather hear it now than on Google.
              </p>
            </span>
            <svg
              className="h-5 w-5 text-slate-400 group-hover:text-slate-700 transition-colors"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden
            >
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!privateRating) {
                setPrivateError("Please pick a star rating.");
                return;
              }
              setPrivateBusy(true);
              setPrivateError("");
              try {
                await submitQrFeedback(businessId, {
                  rating: privateRating,
                  comment: privateComment.trim() || undefined,
                  location_id: locationIdFromQuery ?? undefined,
                });
                setPrivateSubmitted(true);
              } catch (err: unknown) {
                setPrivateError(
                  err instanceof Error ? err.message : "Could not send. Please try again.",
                );
              } finally {
                setPrivateBusy(false);
              }
            }}
            className="space-y-4"
          >
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-900 mb-3">
                How would you rate your visit?
              </p>
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => {
                  const isLit = n <= privateRating;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
                      onClick={() => setPrivateRating(n)}
                      className="p-1 transition-transform active:scale-110 hover:scale-105"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className={`h-10 w-10 transition-all ${isLit ? "" : "opacity-30"}`}
                        fill="currentColor"
                        style={{ color: isLit ? accent : "#94a3b8" }}
                        aria-hidden
                      >
                        <path d="M12 2l2.4 6.2H21l-5 3.8 1.9 6L12 15.8 5.1 18l1.9-6-5-3.8h6.6L12 2z" />
                      </svg>
                    </button>
                  );
                })}
              </div>
              {privateRating > 0 ? (
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  {privateRating === 5
                    ? "Thank you! 5 stars."
                    : privateRating === 4
                      ? "Glad it went well."
                      : privateRating <= 2
                        ? "Sorry to hear that — what went wrong?"
                        : "Tell us what could've been better"}
                </p>
              ) : null}
            </div>
            <textarea
              className="input min-h-[100px]"
              placeholder="Anything we should know? (optional)"
              maxLength={4000}
              value={privateComment}
              onChange={(e) => setPrivateComment(e.target.value)}
            />
            {privateError && (
              <div
                className="text-sm text-red-800 px-3 py-2 rounded-xl bg-red-50 border border-red-200"
                role="alert"
              >
                {privateError}
              </div>
            )}
            <button
              type="submit"
              disabled={!privateRating || privateBusy}
              className="w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-sm disabled:opacity-50 transition active:scale-[0.99]"
              style={{ background: accent }}
            >
              {privateBusy ? "Sending…" : "Send privately"}
            </button>
          </form>
        )}
      </section>
    </CustomerWrap>
  );
}

export default function QrOptInPage() {
  return (
    <Suspense
      fallback={
        <CustomerWrap accent="#94a3b8">
          <div className="flex min-h-[200px] items-center justify-center">
            <PageLoader message="Loading" size="md" />
          </div>
        </CustomerWrap>
      }
    >
      <QrOptInPageInner />
    </Suspense>
  );
}
