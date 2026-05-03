"use client";

import { useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

/** Branded route-level error. Catches uncaught exceptions in any subtree
 * (the Next.js error boundary wraps every page). Logs to the console so
 * Sentry/whatever else can pick it up; the user gets a friendly retry. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to console so any browser-side telemetry (e.g. Sentry) picks
    // it up. We keep this minimal so we don't introduce new deps here.

    console.error("[goodword] route error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-warm-50/60 via-white to-white px-6 py-16 flex items-center">
      <div className="mx-auto max-w-lg text-center">
        <div className="flex justify-center mb-6">
          <Logo size="md" href="/" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-700">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-display font-medium text-slate-900 leading-tight">
          That didn&apos;t go as planned.
        </h1>
        <p className="mt-3 text-base text-slate-700 leading-relaxed">
          A glitch on our side stopped this page from loading. Try again — and
          if it keeps happening,{" "}
          <a className="link" href="mailto:hello@maskedcarrotlabs.com">
            email us
          </a>
          .
        </p>
        {error.digest ? (
          <p className="mt-2 text-[11px] text-slate-500 tabular-nums">
            ref: {error.digest}
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="cta-warm h-11 px-5 text-sm"
          >
            Try again
          </button>
          <Link href="/dashboard" className="btn-secondary h-11 px-5 text-sm">
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
