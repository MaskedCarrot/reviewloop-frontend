"use client";

type Size = "sm" | "md" | "lg";

const ring: Record<Size, string> = {
  sm: "h-5 w-5 border-[1.5px]",
  md: "h-8 w-8 border-2",
  lg: "h-10 w-10 border-[2.5px]",
};

/**
 * Minimal indeterminate ring: soft track + single accent stroke (no dot bounce, no heavy SVG).
 */
export default function PageLoader({
  message,
  size = "md",
  className = "",
}: {
  message?: string;
  size?: Size;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} role="status" aria-live="polite">
      <div
        className={`rounded-full border-slate-200 border-t-slate-700/85 border-r-slate-400/25 border-b-slate-200/50 border-l-slate-200/50 animate-spin ${ring[size]}`}
        style={{ animationDuration: "1.05s" }}
        aria-hidden
      />
      {message ? <p className="text-sm text-slate-600 font-medium text-center max-w-xs leading-snug">{message}</p> : null}
    </div>
  );
}
