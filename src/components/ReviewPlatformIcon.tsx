import type { ReactNode } from "react";

type Size = "sm" | "md";

const wrap = (size: Size, children: ReactNode) => (
  <span
    className={[
      "inline-flex shrink-0 items-center justify-center rounded-md bg-slate-100/90 text-slate-800 ring-1 ring-slate-200/60",
      size === "md" ? "h-8 w-8" : "h-6 w-6",
    ].join(" ")}
    aria-hidden
  >
    {children}
  </span>
);

/** Small brand-style marks (not official logos) for review destinations in app UI. */
export default function ReviewPlatformIcon({ platformId, size = "sm" }: { platformId: string; size?: Size }) {
  const id = (platformId || "").toLowerCase();
  if (id === "google") {
    return wrap(
      size,
      <svg viewBox="0 0 24 24" className={size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"} fill="currentColor" aria-hidden>
        <path d="M12 10.2v3.6h5.1c-.2 1.3-1.5 3.8-5.1 3.8-3.1 0-5.6-2.5-5.6-5.6S8.9 6.4 12 6.4c1.8 0 2.9.7 3.6 1.3l2.4-2.3C16.3 3.7 14.3 2.6 12 2.6 6.8 2.6 2.6 6.5 2.6 12s4.2 9.4 9.4 9.4c5.4 0 9-3.8 9-9.1 0-.6-.1-1.1-.2-1.6H12z" />
      </svg>,
    );
  }
  if (id === "yelp") {
    return wrap(
      size,
      <span className={size === "md" ? "text-sm font-extrabold" : "text-xs font-extrabold"} style={{ color: "#af0606" }}>
        Y
      </span>,
    );
  }
  if (id === "facebook" || id === "fb") {
    return wrap(
      size,
      <span className={size === "md" ? "text-sm font-bold" : "text-xs font-bold"} style={{ color: "#1877F2" }}>
        f
      </span>,
    );
  }
  if (id === "tripadvisor" || id === "trip_advisor") {
    return wrap(
      size,
      <span className={size === "md" ? "text-[10px] font-bold" : "text-[8px] font-bold leading-tight text-center text-emerald-800"}>
        TA
      </span>,
    );
  }
  return wrap(
    size,
    <span className={size === "md" ? "text-xs font-bold" : "text-[10px] font-bold"}>★</span>,
  );
}
