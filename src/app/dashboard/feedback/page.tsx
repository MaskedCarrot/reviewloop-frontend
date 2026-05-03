"use client";

import { useEffect, useState } from "react";
import { getCredits, listFeedback } from "@/lib/api";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import PreviewCustomerPageLinks from "@/components/PreviewCustomerPageLinks";
import Disclosure from "@/components/Disclosure";
import EmptyState from "@/components/EmptyState";
import FeedbackListSkeleton from "@/components/skeletons/FeedbackListSkeleton";
import { useAppToast } from "@/components/ToastProvider";
import type { FeedbackEntry } from "@/types";

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackEntry[]>([]);
  const [onlyNeg, setOnlyNeg] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | undefined>(undefined);
  const toast = useAppToast();

  useEffect(() => {
    setLoading(true);
    getCredits()
      .then((cr) => setCreditBalance(typeof cr.balance === "number" ? cr.balance : undefined))
      .catch(() => setCreditBalance(undefined));
  }, []);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    listFeedback({ only_negative: onlyNeg, days: 90 })
      .then((r) => setItems(r.feedback))
      .catch((e: unknown) => {
        // Surface the failure instead of letting the inbox look empty.
        const msg = e instanceof Error ? e.message : "Could not load feedback.";
        setLoadError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
    // toast is stable; intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyNeg]);

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        eyebrow="Private feedback"
        title="Inbox"
        credits={creditBalance}
        description="Direct feedback from the private form on your routing page — not Google reviews."
        end={
          <label className="flex items-center gap-2 text-sm text-slate-700 shrink-0 w-full sm:w-fit min-h-10 sm:min-h-0 sm:pt-0.5">
            <input type="checkbox" checked={onlyNeg} onChange={(e) => setOnlyNeg(e.target.checked)} />
            Only 1–3 star
          </label>
        }
      />

      <Disclosure label="Test the customer-facing review link" hint="Send yourself a real request to see what customers experience">
        <PreviewCustomerPageLinks compact />
      </Disclosure>

      {loadError && !loading ? (
        <div role="alert" className="card border-red-200 bg-red-50/70 p-4 text-sm text-red-900">
          <div className="font-semibold">Could not load feedback</div>
          <div className="mt-1 opacity-80">{loadError}</div>
        </div>
      ) : null}

      {loading ? (
        <FeedbackListSkeleton />
      ) : items.length === 0 && !loadError ? (
        <EmptyState
          tone={onlyNeg ? "neutral" : "warm"}
          icon={
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 8.25c0-1.65 1.35-3 3-3h10.5c1.65 0 3 1.35 3 3v7.5c0 1.65-1.35 3-3 3H10.5l-4.5 3v-3H6.75c-1.65 0-3-1.35-3-3v-7.5z" />
            </svg>
          }
          title={onlyNeg ? "No 1–3 star feedback" : "No feedback yet"}
          body={
            onlyNeg
              ? "Nothing came in below 4 stars in the last 90 days. Nice."
              : "Customers' private notes will show up here as they come in. Send a request to start the loop."
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((f) => {
            const rating = f.rating ?? 0;
            const isLow = rating > 0 && rating <= 3;
            return (
              <li key={f.id} className="card p-5">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`pill ${
                      isLow
                        ? "bg-amber-100 text-amber-900"
                        : rating >= 4
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {rating > 0 ? `${rating} ★` : "No rating"}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {new Date(f.created_at).toLocaleString()}
                  </span>
                </div>
                {f.comment && (
                  <p className="mt-3 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{f.comment}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
