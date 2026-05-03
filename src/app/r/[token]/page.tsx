"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  getRoutingLink,
  recordPlatformClick,
  submitFeedback,
  webUnsubscribe,
} from "@/lib/api";
import { publicReviewPageDestinations } from "@/lib/reviewPlatformsFromLocations";
import type { RoutingBusinessInfo } from "@/types";
import PageLoader from "@/components/PageLoader";
import ReviewPlatformIcon from "@/components/ReviewPlatformIcon";
import CustomerWrap from "@/components/customer/CustomerWrap";

export default function RoutingPage() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const wantsUnsub = searchParams.get("unsub") === "1";

  const [biz, setBiz] = useState<RoutingBusinessInfo | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // Unsubscribe flow
  const [showUnsub, setShowUnsub] = useState(wantsUnsub);
  const [unsubDone, setUnsubDone] = useState(false);
  const [unsubbing, setUnsubbing] = useState(false);

  useEffect(() => {
    if (!token) return;
    getRoutingLink(token)
      .then((r) => setBiz(r.business))
      .catch((e) => setError(e?.message || "This link isn't valid."));
  }, [token]);

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

  const accent = biz.branding_color || "#e57224";
  const destinations = publicReviewPageDestinations(biz).filter((d) => d.url);

  if (unsubDone) {
    return (
      <CustomerWrap accent="#64748b">
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-700">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="display-title text-2xl text-slate-900">Unsubscribed</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
            You&apos;ve been removed from {biz.name}&apos;s review request list. You won&apos;t
            receive any more messages from them.
          </p>
        </div>
      </CustomerWrap>
    );
  }

  if (submitted) {
    return (
      <CustomerWrap accent={accent}>
        <div className="text-center">
          <div
            className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl"
            style={{ background: accent + "26", color: accent }}
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="display-title text-2xl text-slate-900">Thanks for letting us know</h1>
          <p className="mt-2 text-sm text-slate-600">
            Someone from {biz.name} will read your feedback shortly.
          </p>
        </div>
      </CustomerWrap>
    );
  }

  if (showUnsub) {
    return (
      <CustomerWrap accent="#64748b">
        <div className="text-center">
          <h1 className="display-title text-2xl text-slate-900">Unsubscribe?</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            You won&apos;t receive any more review request emails or texts from{" "}
            <strong className="text-slate-900">{biz.name}</strong>.
          </p>
        </div>
        <div className="mt-6 space-y-2.5">
          <button
            disabled={unsubbing}
            onClick={async () => {
              setUnsubbing(true);
              try {
                await webUnsubscribe(String(token));
                setUnsubDone(true);
              } finally {
                setUnsubbing(false);
              }
            }}
            className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm disabled:opacity-50 transition active:scale-[0.99]"
          >
            {unsubbing ? "Unsubscribing…" : "Yes, unsubscribe me"}
          </button>
          <button
            onClick={() => setShowUnsub(false)}
            className="w-full h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition active:scale-[0.99]"
          >
            Cancel — keep me subscribed
          </button>
        </div>
      </CustomerWrap>
    );
  }

  return (
    <CustomerWrap accent={accent}>
      <div className="text-center">
        <p
          className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-soft"
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
          Review · {biz.name}
        </p>
        <h1 className="display-title-lg mt-4 text-slate-900">How did we do?</h1>
        <p className="mt-3 text-sm sm:text-base text-slate-700 leading-relaxed">
          <span className="font-semibold text-slate-900">{biz.name}</span> thanks you for
          your visit.
        </p>
      </div>

      <div className="mt-7 space-y-2.5">
        {destinations.map((d, i) => {
          const isPrimary = i === 0;
          return (
            <a
              key={d.id}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => recordPlatformClick(String(token), d.id).catch(() => {})}
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
                <span>{d.label}</span>
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
      <p className="mt-3 text-[11px] text-slate-500 text-center">Opens the review site in a new tab.</p>

      <div className="mt-7 border-t border-slate-200 pt-5">
        {!showFeedback ? (
          <button
            onClick={() => setShowFeedback(true)}
            className="group w-full flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-3.5 text-left transition-colors hover:bg-white"
          >
            <span>
              <p className="text-sm font-semibold text-slate-900">Or tell us privately first</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Anything we should fix? We'd rather hear it now than on Google.
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
              if (!rating) return;
              setSubmitting(true);
              try {
                await submitFeedback(token, rating, comment || undefined);
                setSubmitted(true);
              } finally {
                setSubmitting(false);
              }
            }}
            className="space-y-4"
          >
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-900 mb-3">How would you rate your visit?</p>
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => {
                  const isLit = n <= rating;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
                      onClick={() => setRating(n)}
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
              {rating > 0 ? (
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  {rating === 5
                    ? "Thank you! 5 stars."
                    : rating === 4
                      ? "Glad it went well."
                      : rating <= 2
                        ? "Sorry to hear that — what went wrong?"
                        : "Tell us what could've been better"}
                </p>
              ) : null}
            </div>
            <textarea
              className="input min-h-[100px]"
              placeholder="Anything we should know? (optional)"
              maxLength={4000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              type="submit"
              disabled={!rating || submitting}
              className="w-full h-12 rounded-2xl text-white font-semibold text-sm shadow-sm disabled:opacity-50 transition active:scale-[0.99]"
              style={{ background: accent }}
            >
              {submitting ? "Sending…" : "Send privately"}
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 border-t border-slate-200 pt-4 text-center">
        <button
          onClick={() => setShowUnsub(true)}
          className="text-xs text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline font-medium"
        >
          Unsubscribe from review requests
        </button>
      </div>

      <p className="text-[10px] text-slate-500 text-center mt-3 leading-relaxed">
        GoodWord never blocks anyone from leaving a public review. Your business chooses
        which links to show.
      </p>
    </CustomerWrap>
  );
}
