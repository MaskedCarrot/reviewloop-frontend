"use client";

import PageLoader from "./PageLoader";

/** @deprecated Prefer `PageLoader` — kept for imports. Ring spinner, same as `PageLoader`. */
export default function LoadingSpinner({
  className = "",
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return <PageLoader message={label} size="lg" className={`min-h-[4.5rem] ${className}`} />;
}
