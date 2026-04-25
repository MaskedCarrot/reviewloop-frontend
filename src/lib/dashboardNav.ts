type NavItem = { href: string; label: string };

export type DashboardNavSection = { heading: string; items: NavItem[] };

/** Grouped for the sidebar; flattened for document title + route matching. */
export const DASHBOARD_NAV_SECTIONS: DashboardNavSection[] = [
  {
    heading: "View",
    items: [
      { href: "/dashboard", label: "Overview" },
      { href: "/dashboard/analytics", label: "Analytics" },
    ],
  },
  {
    heading: "Reach",
    items: [
      { href: "/dashboard/templates", label: "Templates" },
      { href: "/dashboard/campaigns", label: "Campaigns" },
      { href: "/dashboard/contacts", label: "People" },
      { href: "/dashboard/qr", label: "Connect" },
      { href: "/dashboard/feedback", label: "Inbox" },
    ],
  },
  {
    heading: "Account",
    items: [
      { href: "/dashboard/billing", label: "Credits" },
      { href: "/dashboard/settings", label: "Settings" },
    ],
  },
];

/** Flat list — same order as the sidebar, for `document.title` and path→label. */
export const DASHBOARD_NAV: NavItem[] = DASHBOARD_NAV_SECTIONS.flatMap((s) => s.items);

/**
 * Picks the nav label for a pathname. Longer paths (e.g. /dashboard/qr/print) match
 * the most specific registered prefix. Unknown routes (e.g. /dashboard/onboarding) get "Dashboard".
 */
export function dashboardPageTitleFromPathname(pathname: string): string {
  const p = pathname.replace(/\/$/, "") || "/";
  if (p === "/dashboard") return "Overview";
  const rest = DASHBOARD_NAV.filter((i) => i.href !== "/dashboard").sort(
    (a, b) => b.href.length - a.href.length,
  );
  for (const item of rest) {
    if (p === item.href || p.startsWith(item.href + "/")) return item.label;
  }
  return "Dashboard";
}
