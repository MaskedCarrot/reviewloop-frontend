"use client";

import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getMyBusiness } from "@/lib/api";
import { useBrowserLocalMockApp } from "@/lib/useBrowserLocalMockApp";
import DashboardDocumentTitle from "@/components/DashboardDocumentTitle";
import DashboardNav from "@/components/DashboardNav";
import { DashboardNavigationProvider } from "@/components/DashboardNavigationContext";
import DashboardNavProgress from "@/components/DashboardNavProgress";
import PageLoader from "@/components/PageLoader";
import type { Business } from "@/types";

const ONBOARDING_PATH = "/dashboard/onboarding";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isLocalMock = useBrowserLocalMockApp();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Client navigations (same layout) keep the window scroll position — reset so each dashboard page starts at the top.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  const [bizState, setBizState] = useState<{ loading: boolean; business: Business | null }>({
    loading: true,
    business: null,
  });
  const lastUserIdRef = useRef<string | undefined>(undefined);
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  // Initial load when user id is known (does not re-run on every tab change).
  useEffect(() => {
    if (!user) {
      lastUserIdRef.current = undefined;
      return;
    }
    if (lastUserIdRef.current === user.id) return;
    lastUserIdRef.current = user.id;

    let active = true;
    setBizState({ loading: true, business: null });
    getMyBusiness()
      .then((res) => {
        if (!active) return;
        setBizState({ loading: false, business: res.business });
      })
      .catch(() => {
        if (!active) return;
        setBizState({ loading: false, business: null });
      });
    return () => {
      active = false;
      // Remounts (e.g. React Strict Mode) can run again; allow a fresh fetch.
      lastUserIdRef.current = undefined;
    };
  }, [user?.id]);

  // When leaving the onboarding URL after save, refetch business once. Tab switches do not touch this.
  useEffect(() => {
    if (!user) return;
    const from = prevPathRef.current;
    const to = pathname;
    prevPathRef.current = to;
    if (from == null) return;
    if (from !== ONBOARDING_PATH || to === ONBOARDING_PATH) return;

    let active = true;
    setBizState((s) => ({ ...s, loading: true }));
    getMyBusiness()
      .then((res) => {
        if (!active) return;
        setBizState({ loading: false, business: res.business });
      })
      .catch(() => {
        if (!active) return;
        setBizState((s) => ({ ...s, loading: false }));
      });
    return () => {
      active = false;
    };
  }, [pathname, user?.id]);

  useEffect(() => {
    if (bizState.loading || !user) return;
    const isOnboarding = pathname === ONBOARDING_PATH;
    if (!bizState.business && !isOnboarding) {
      router.replace(ONBOARDING_PATH);
    }
  }, [bizState, user, pathname, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <DashboardDocumentTitle />
        <PageLoader size="lg" message="Just a moment" />
      </div>
    );
  }

  if (bizState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <DashboardDocumentTitle />
        <PageLoader size="lg" message="Loading your workspace" />
      </div>
    );
  }

  if (!bizState.business && pathname !== ONBOARDING_PATH) {
    return <DashboardDocumentTitle />;
  }

  return (
    <DashboardNavigationProvider>
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-100/80 print:!bg-white">
        <DashboardNavProgress />
        <DashboardDocumentTitle />
        <DashboardNav />
        <main className="flex-1 w-full min-w-0 max-w-6xl mx-auto px-4 sm:px-8 py-6 md:py-10 print:max-w-none print:px-0 print:py-0 md:rounded-tl-2xl md:bg-white/95 md:shadow-sm md:min-h-screen md:ring-1 md:ring-slate-200/50">
        {isLocalMock && pathname !== ONBOARDING_PATH && (
          <div
            className="mb-5 rounded-xl border border-sky-200/80 bg-sky-50/90 px-4 py-3.5 sm:px-5 text-sm text-sky-950"
            role="status"
          >
            <p className="font-medium">Testing environment</p>
            <p className="text-sky-900/85 mt-0.5">
              This session runs in a testing environment in your browser. No emails or SMS will be sent—sends are
              simulated for preview. Sample data, Pro, and credits are local only. CSV, QR, webhooks, and billing also
              update this preview only, with no real charges. Sign in with Google for a live workspace.
            </p>
          </div>
        )}
        {!isLocalMock && bizState.business?.is_sandbox && pathname !== ONBOARDING_PATH && (
          <div
            className="mb-5 rounded-xl border border-violet-200/80 bg-violet-50/90 px-4 py-3.5 sm:px-5 text-sm text-violet-950"
            role="status"
          >
            <p className="font-medium">Demo workspace</p>
            <p className="text-violet-900/85 mt-0.5">
              Sample data and a healthy credit balance are included so you can explore the product. No real emails or
              texts are sent from this workspace; scheduled sends are recorded only (sandbox).
            </p>
          </div>
        )}
        <div className="print:!animate-none">{children}</div>
        </main>
      </div>
    </DashboardNavigationProvider>
  );
}
