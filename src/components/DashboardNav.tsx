"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { DASHBOARD_NAV_SECTIONS } from "@/lib/dashboardNav";
import { useDashboardNavigation } from "@/components/DashboardNavigationContext";
import Logo from "./Logo";

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { navigate, pendingPath } = useDashboardNavigation();

  const onSignOut = () => {
    logout();
    router.push("/login");
  };

  return (
    // Sticky, viewport-tall on md so the aside is not stretch-tall with main; otherwise mt-auto sign-out sits at the bottom of the full page
    <aside
      className="w-full md:w-52 md:shrink-0 print:hidden border-b md:border-b-0 md:border-r border-slate-200/50 bg-white flex flex-col md:sticky md:top-0 md:h-screen md:overflow-hidden"
    >
      {/* Mobile: logo + sign out */}
      <div className="flex md:hidden items-center justify-between gap-3 px-3 py-2.5 border-b border-slate-200/50 shrink-0">
        <Logo size="sm" />
        <button
          type="button"
          onClick={onSignOut}
          className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200"
        >
          Sign out
        </button>
      </div>

      <div className="flex w-full min-w-0 flex-1 min-h-0 flex-col py-1 md:py-5 px-0 md:px-3">
        <div className="hidden md:block px-1 pb-3 md:pb-4 shrink-0">
          <Logo />
        </div>
        <nav
          className="flex flex-row flex-wrap md:flex-col gap-1 md:gap-0
            px-2 md:px-0.5 pt-1 pb-1.5 md:pt-0 md:pb-0
            content-start shrink-0"
          aria-label="App"
        >
          {DASHBOARD_NAV_SECTIONS.map((section, sectionIdx) => (
            <div
              key={section.heading}
              className={[
                "flex flex-row flex-wrap md:flex-col gap-0.5 w-full min-w-[min(100%,8rem)]",
                sectionIdx > 0 && "pt-1.5 mt-0.5 border-t border-slate-100/90 md:pt-0 md:mt-3 md:border-0",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div
                className="hidden md:block w-full text-[10px] font-semibold uppercase tracking-wider text-slate-400
                  pl-0.5 mb-0.5"
                aria-hidden
              >
                {section.heading}
              </div>
              {section.items.map((item) => {
                const routeActive = pendingPath
                  ? pendingPath === item.href
                  : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.button !== 0) {
                        return;
                      }
                      const isCurrent =
                        pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                      if (isCurrent) return;
                      e.preventDefault();
                      navigate(item.href);
                    }}
                    className={[
                      "px-2.5 py-1.5 rounded-md text-sm transition-colors",
                      "whitespace-nowrap",
                      "w-auto md:w-full",
                      routeActive
                        ? "text-slate-900 bg-slate-100 font-medium"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                      pendingPath === item.href ? "ring-1 ring-slate-200/80" : "",
                    ].join(" ")}
                    aria-current={routeActive ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="hidden md:flex flex-col gap-1 mt-auto pt-4 border-t border-slate-100 px-1 shrink-0">
          <div className="text-[11px] text-slate-400 truncate" title={user?.email || undefined}>
            {user?.email}
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="text-left text-xs text-slate-500 hover:text-slate-800 py-0.5 w-fit"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
