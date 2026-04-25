"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getRoutingLink, recordClickGoogle, recordClickOutbound, submitFeedback } from "@/lib/api";
import { publicReviewPageDestinations } from "@/lib/reviewPlatformsFromLocations";
import type { RoutingBusinessInfo } from "@/types";
import PageLoader from "@/components/PageLoader";
import ReviewPlatformIcon from "@/components/ReviewPlatformIcon";

export default function RoutingPage() {
  const { token } = useParams<{ token: string }>();
  const [biz, setBiz] = useState<RoutingBusinessInfo | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!token) return;
    getRoutingLink(token)
      .then((r) => setBiz(r.business))
      .catch((e) => setError(e?.message || "This link isn't valid."));
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("form") === "1" || sp.get("feedback") === "1") {
      setShowFeedback(true);
    }
  }, [token]);

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
          <div className="mx-auto mb-3 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: accent + "22", color: accent }}>
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-1">Thanks for letting us know</h1>
          <p className="text-sm text-slate-600">Someone from {biz.name} will read your feedback shortly.</p>
        </div>
      </Wrap>
    );
  }

  return (
    <Wrap accent={accent}>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">How did we do?</h1>
        <p className="text-sm text-slate-600 mt-1">{biz.name} thanks you for your visit.</p>
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
                onClick={() =>
                  (isGoogle
                    ? recordClickGoogle(String(token))
                    : recordClickOutbound(String(token), d.id)
                  ).catch(() => {})
                }
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
        Opens the review site in a new tab. Google is the primary link when multiple sites are set up.
      </p>

      <div className="border-t border-slate-200 pt-5">
        {!showFeedback ? (
          <button
            onClick={() => setShowFeedback(true)}
            className="w-full text-center py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition"
          >
            Or tell us privately first
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
            className="space-y-3"
          >
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-700 mb-2">How would you rate your visit?</div>
              <div className="flex items-center justify-center gap-1.5 text-3xl">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`Rate ${n} stars`}
                    onClick={() => setRating(n)}
                    className={`transition transform active:scale-110 ${n <= rating ? "" : "grayscale opacity-30"}`}
                    style={{ color: n <= rating ? accent : "#94a3b8" }}
                  >
                    ★
                  </button>
                ))}
              </div>
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
              className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50"
              style={{ background: accent }}
            >
              {submitting ? "Sending…" : "Send privately"}
            </button>
          </form>
        )}
      </div>

      <p className="text-[10px] text-slate-400 text-center mt-6">
        ReviewLoop never blocks anyone from leaving a public review. Your business chooses which links to show
        (configured in the dashboard).
      </p>
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
