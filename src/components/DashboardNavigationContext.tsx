"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { DASHBOARD_NAV } from "@/lib/dashboardNav";

type Ctx = {
  navigate: (href: string) => void;
  isPending: boolean;
  /** Target of an in-flight client nav — use for optimistic highlight. */
  pendingPath: string | null;
};

const DashboardNavigationContext = createContext<Ctx | null>(null);

export function DashboardNavigationProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname) return;
      setPendingPath(href);
      startTransition(() => {
        router.push(href);
      });
    },
    [pathname, router],
  );

  useEffect(() => {
    if (pendingPath && pathname === pendingPath) {
      setPendingPath(null);
    }
  }, [pathname, pendingPath]);

  useEffect(() => {
    for (const item of DASHBOARD_NAV) {
      router.prefetch(item.href);
    }
  }, [router]);

  return (
    <DashboardNavigationContext.Provider value={{ navigate, isPending, pendingPath }}>
      {children}
    </DashboardNavigationContext.Provider>
  );
}

export function useDashboardNavigation() {
  const ctx = useContext(DashboardNavigationContext);
  if (!ctx) {
    throw new Error("useDashboardNavigation must be used within DashboardNavigationProvider");
  }
  return ctx;
}
