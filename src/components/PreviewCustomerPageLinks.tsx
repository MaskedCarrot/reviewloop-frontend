"use client";

import { useEffect, useState } from "react";
import { getPreviewRouting } from "@/lib/api";
import { ShimmerBlock } from "@/components/skeletons/Skeleton";

/**
 * Dashboard links to open the live customer routing page and the private feedback form (?form=1).
 * Requires at least one sent/queued message so a routing token exists.
 */
export default function PreviewCustomerPageLinks({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [data, setData] = useState<{ url: string } | null>(null);
  const [missing, setMissing] = useState(false);
  const [err, setErr] = useState(false);

  useEffect(() => {
    getPreviewRouting()
      .then((r) => setData(r))
      .catch((e: unknown) => {
        const m = e instanceof Error ? e.message : "";
        if (m.includes("No review links") || m.includes("send a test") || m.toLowerCase().includes("not found")) {
          setMissing(true);
        } else {
          setErr(true);
        }
      });
  }, []);

  if (err) {
    return (
      <p className={`text-xs text-slate-500 ${className}`}>Could not load preview links. Try again later.</p>
    );
  }
  if (missing) {
    return (
      <p className={`text-xs text-slate-500 leading-relaxed ${className}`}>
        {compact
          ? "Send a test from People to create a preview link."
          : "To preview what customers see, send yourself a test request from People first. That creates the /r/… page and this link will appear."}
      </p>
    );
  }
  if (!data) {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`} aria-hidden>
        <ShimmerBlock className="h-4 w-28" />
        <span className="text-slate-300">·</span>
        <ShimmerBlock className="h-4 w-36" />
      </div>
    );
  }
  const formUrl = `${data.url}${data.url.includes("?") ? "&" : "?"}form=1`;
  return (
    <p className={`text-sm text-slate-600 ${className}`}>
      <span className="text-slate-500">{compact ? "Preview: " : "See the live page: "}</span>
      <a href={data.url} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
        Full page
      </a>
      <span className="text-slate-400 mx-1.5">·</span>
      <a href={formUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
        Private form only
      </a>
    </p>
  );
}
