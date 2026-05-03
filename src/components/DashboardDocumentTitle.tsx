"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { dashboardPageTitleFromPathname } from "@/lib/dashboardNav";

/**
 * Sets `document.title` to match the current dashboard section and important query tabs.
 */
function DashboardDocumentTitleInner() {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof document === "undefined" || !pathname.startsWith("/dashboard")) return;
    let label = dashboardPageTitleFromPathname(pathname);
    const p = pathname.replace(/\/$/, "") || "/";
    if (p === "/dashboard/contacts" && searchParams.get("tab") === "sends") {
      label = "Sends";
    }
    document.title = `${label} · GoodWord`;
  }, [pathname, searchParams]);

  return null;
}

export default function DashboardDocumentTitle() {
  return (
    <Suspense fallback={null}>
      <DashboardDocumentTitleInner />
    </Suspense>
  );
}
