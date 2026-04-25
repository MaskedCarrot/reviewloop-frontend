"use client";

import { useDashboardNavigation } from "@/components/DashboardNavigationContext";

/**
 * Indeterminate top bar while a sidebar navigation transition is in flight.
 * Fixed, pointer-events none — does not block the rest of the UI.
 */
export default function DashboardNavProgress() {
  const { isPending } = useDashboardNavigation();
  if (!isPending) return null;

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 right-0 z-[100] h-0.5 overflow-hidden bg-slate-200/90"
      aria-hidden
    >
      <div className="h-full w-[40%] rounded-r-full bg-slate-800/50 animate-dashboard-nav-progress" />
    </div>
  );
}
