"use client";

import { useEffect, useState } from "react";

/**
 * Hero flow visual: a stylised phone playing through the GoodWord customer journey.
 *
 *   1. An email/SMS arrives ("Mind a quick review?")
 *   2. Customer taps "Leave a review"
 *   3. Star rating pops (5 stars)
 *   4. Routes to the Google review page (logo + "Open in Google")
 *
 * The stages cycle every ~5s. Pure CSS animations + an interval-driven state — no
 * external libs. Honors prefers-reduced-motion: the cycling stops and we sit on
 * stage 2 (the rating) so the screenshot reads correctly.
 */
type Stage = 0 | 1 | 2 | 3;

const CYCLE_MS = 5200;

export default function HeroFlowVisual() {
  const [stage, setStage] = useState<Stage>(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setStage(2);
      return;
    }
    const id = window.setInterval(() => {
      setStage((s) => (((s + 1) % 4) as Stage));
    }, CYCLE_MS / 4);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[26rem] select-none" aria-hidden>
      {/* Soft glow halo */}
      <div className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-gradient-to-tr from-warm-200/40 via-warm-100/30 to-brand-100/35 blur-3xl" />

      {/* Floating chip — incoming send */}
      <div
        className={[
          "absolute -left-3 sm:-left-6 top-2 z-20 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-card transition-all duration-500",
          stage === 0 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-70",
        ].join(" ")}
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-700">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 6h16v12H4z" strokeLinejoin="round" />
            <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="text-left leading-tight">
          <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-slate-400">Email sent</p>
          <p className="text-xs font-semibold text-slate-800">to Maya · 2:14 pm</p>
        </div>
        {stage === 0 && (
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-warm-500">
            <span className="absolute inset-0 rounded-full bg-warm-500 animate-pulse-ring" />
          </span>
        )}
      </div>

      {/* Floating chip — private feedback (always visible, soft) */}
      <div className="absolute -right-3 sm:-right-6 top-12 z-20 hidden xs:flex sm:flex w-[10.5rem] items-start gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-card animate-hero-bubble">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-warm-50 text-warm-700">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 5h16v11H8l-4 3V5z" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </span>
        <div className="text-left">
          <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-slate-400">Private note</p>
          <p className="text-xs font-medium text-slate-700 leading-snug">
            “Coffee was a little cold today.”
          </p>
        </div>
      </div>

      {/* Phone */}
      <div className="relative z-10 mx-auto mt-10 max-w-[18rem] rounded-[2.4rem] border border-slate-300/80 bg-slate-900 p-[0.45rem] shadow-card-hover animate-hero-bob">
        {/* Notch */}
        <div className="absolute left-1/2 top-[0.45rem] z-20 h-4 w-20 -translate-x-1/2 rounded-b-2xl bg-slate-900" />

        <div
          className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-white to-slate-50"
          style={{ minHeight: "26rem" }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-2.5 pb-1.5 text-[10px] font-semibold text-slate-500">
            <span className="tabular-nums">9:41</span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-3 rounded-sm bg-slate-400" />
              <span className="h-2 w-1 rounded-sm bg-slate-400" />
            </div>
          </div>

          {/* Stage layers */}
          <div className="relative mt-1 px-4">
            {/* Stage 0 + 1: review-request screen */}
            <div
              className={[
                "absolute inset-0 px-4 transition-all duration-500",
                stage <= 1 ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
              ].join(" ")}
            >
              <ReviewRequestScreen highlightCta={stage === 1} />
            </div>

            {/* Stage 2: stars rated */}
            <div
              className={[
                "absolute inset-0 px-4 transition-all duration-500",
                stage === 2
                  ? "translate-y-0 opacity-100"
                  : stage > 2
                    ? "-translate-y-4 opacity-0"
                    : "translate-y-4 opacity-0",
              ].join(" ")}
            >
              <RatingScreen active={stage === 2} />
            </div>

            {/* Stage 3: Google review screen */}
            <div
              className={[
                "absolute inset-0 px-4 transition-all duration-500",
                stage === 3 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
              ].join(" ")}
            >
              <GoogleReviewScreen />
            </div>

            {/* Spacer to keep the phone tall */}
            <div className="invisible">
              <ReviewRequestScreen />
            </div>
          </div>

          {/* Stage indicator dots */}
          <div className="absolute left-1/2 bottom-3 -translate-x-1/2 flex items-center gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={[
                  "block h-1 rounded-full transition-all",
                  stage === i ? "w-5 bg-slate-700" : "w-1.5 bg-slate-300",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating chip — new review counter at the bottom */}
      <div className="absolute -left-2 sm:-left-4 -bottom-2 z-20 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-white px-3 py-2 shadow-card animate-hero-bubble">
        <span className="relative grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-700">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 6.2H21l-5 3.8 1.9 6L12 15.8 5.1 18l1.9-6-5-3.8h6.6L12 2z" />
          </svg>
        </span>
        <div className="text-left leading-tight">
          <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-emerald-700">New review</p>
          <p className="text-xs font-semibold text-slate-800">+1 on Google · just now</p>
        </div>
      </div>
    </div>
  );
}

function ReviewRequestScreen({ highlightCta = false }: { highlightCta?: boolean }) {
  return (
    <div className="pt-3 pb-10">
      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-slate-400">From Bluebird Coffee</p>
      <p className="mt-1 text-base font-display font-medium text-slate-900 leading-snug">
        Hey Maya — thanks for stopping by today.
      </p>
      <p className="mt-2 text-xs text-slate-700 leading-relaxed">
        If you have 20 seconds, would you share how it went? It really helps a small shop like ours.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <span
          className={[
            "relative inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition-all overflow-hidden",
            "bg-slate-900",
            highlightCta ? "ring-4 ring-warm-200" : "ring-0",
          ].join(" ")}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 6.2H21l-5 3.8 1.9 6L12 15.8 5.1 18l1.9-6-5-3.8h6.6L12 2z" />
          </svg>
          Leave a review
          {/* Shine sweep on the button when stage hits 1 */}
          {highlightCta && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -inset-x-2 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine"
            />
          )}
        </span>
        <span className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-[0.7rem] font-medium text-slate-600">
          Send private feedback instead
        </span>
      </div>
      <p className="mt-3 text-[0.6rem] text-slate-400">Powered by GoodWord · Unsubscribe</p>
    </div>
  );
}

function RatingScreen({ active }: { active: boolean }) {
  return (
    <div className="pt-3 pb-10">
      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-slate-400">How was it?</p>
      <p className="mt-1 text-base font-display font-medium text-slate-900 leading-snug">
        Tap a star
      </p>
      <div className="mt-5 flex items-center justify-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={[
              "transition-transform",
              active ? "" : "",
            ].join(" ")}
            style={{
              animation: active ? `stars-pop 0.5s ${i * 110}ms cubic-bezier(0.22,1,0.36,1) both` : "none",
            }}
          >
            <svg className="h-9 w-9 text-warm-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 6.2H21l-5 3.8 1.9 6L12 15.8 5.1 18l1.9-6-5-3.8h6.6L12 2z" />
            </svg>
          </span>
        ))}
      </div>
      <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-700">5 / 5 — wonderful!</p>
        <p className="mt-1 text-xs text-emerald-900 leading-relaxed">
          Sending you to Google to share the love…
        </p>
      </div>
    </div>
  );
}

function GoogleReviewScreen() {
  return (
    <div className="pt-3 pb-10">
      <div className="flex items-center justify-between">
        <p className="text-[0.7rem] font-semibold text-slate-700">google.com</p>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide text-emerald-700">
          Secure
        </span>
      </div>
      <div className="mt-3 flex items-start gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-base font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
          B
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">Bluebird Coffee</p>
          <p className="truncate text-[0.7rem] text-slate-500">Café · 0.2 mi</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-warm-500">
        {[0, 1, 2, 3, 4].map((i) => (
          <svg key={i} className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 6.2H21l-5 3.8 1.9 6L12 15.8 5.1 18l1.9-6-5-3.8h6.6L12 2z" />
          </svg>
        ))}
        <span className="ml-1.5 text-[0.65rem] font-semibold text-slate-700">5.0</span>
      </div>
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">Your review</p>
        <p className="mt-1 text-xs text-slate-700 leading-snug">
          The flat white is the best in town and Maya behind the counter remembered my name on visit two. Will be back.
        </p>
      </div>
      <div className="mt-3 inline-flex items-center justify-center rounded-xl bg-warm-600 px-3 py-2 text-xs font-semibold text-white shadow-sm">
        Post review
      </div>
    </div>
  );
}
