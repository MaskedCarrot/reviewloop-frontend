"use client";

import { useEffect, useState } from "react";
import { getCredits, listFeedback } from "@/lib/api";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import PreviewCustomerPageLinks from "@/components/PreviewCustomerPageLinks";
import FeedbackListSkeleton from "@/components/skeletons/FeedbackListSkeleton";
import type { FeedbackEntry } from "@/types";

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackEntry[]>([]);
  const [onlyNeg, setOnlyNeg] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creditBalance, setCreditBalance] = useState<number | undefined>(undefined);

  useEffect(() => {
    setLoading(true);
    getCredits()
      .then((cr) => setCreditBalance(typeof cr.balance === "number" ? cr.balance : undefined))
      .catch(() => setCreditBalance(undefined));
  }, []);

  useEffect(() => {
    setLoading(true);
    listFeedback({ only_negative: onlyNeg, days: 90 })
      .then((r) => setItems(r.feedback))
      .finally(() => setLoading(false));
  }, [onlyNeg]);

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        eyebrow="Private feedback"
        title="Inbox"
        credits={creditBalance}
        description={
          <div className="space-y-2 max-w-2xl">
            <p>
              Direct feedback from the private form on your routing page — not the same as Google reviews.
            </p>
            <PreviewCustomerPageLinks />
          </div>
        }
        end={
          <label className="flex items-center gap-2 text-sm text-slate-700 shrink-0 w-full sm:w-fit min-h-10 sm:min-h-0 sm:pt-0.5">
            <input type="checkbox" checked={onlyNeg} onChange={(e) => setOnlyNeg(e.target.checked)} />
            Only 1–3 star
          </label>
        }
      />

      {loading ? (
        <FeedbackListSkeleton />
      ) : items.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          {onlyNeg ? "No negative feedback in the last 90 days." : "No feedback yet."}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((f) => (
            <li key={f.id} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-bold text-slate-900">{f.rating ?? "—"}★</span>
                <span className="text-xs text-slate-500">{new Date(f.created_at).toLocaleString()}</span>
              </div>
              {f.comment && <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{f.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
