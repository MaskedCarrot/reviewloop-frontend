"use client";

import { useLayoutEffect, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useBrowserLocalMockApp } from "@/lib/useBrowserLocalMockApp";
import DashboardDocumentTitle from "@/components/DashboardDocumentTitle";
import DashboardNav from "@/components/DashboardNav";
import { DashboardNavigationProvider, useDashboardNavigation } from "@/components/DashboardNavigationContext";
import DashboardNavProgress from "@/components/DashboardNavProgress";
import PageLoader from "@/components/PageLoader";
import DashboardRouteLoadingSkeleton from "@/components/skeletons/DashboardRouteLoadingSkeleton";
import { DashboardBootstrapProvider, useDashboardBootstrap } from "./DashboardBootstrapProvider";

const ONBOARDING_PATH = "/dashboard/onboarding";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardBootstrapProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardBootstrapProvider>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const isLocalMock = useBrowserLocalMockApp();
  const { user, loading: authLoading } = useAuth();
  const { bootstrap, loading: bootstrapLoading } = useDashboardBootstrap();
  const router = useRouter();
  const pathname = usePathname();

  // Client navigations (same layout) keep the window scroll position — reset so each dashboard page starts at the top.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  const business = bootstrap?.business ?? null;

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (bootstrapLoading || !user) return;
    const isOnboarding = pathname === ONBOARDING_PATH;
    if (!business && !isOnboarding) {
      router.replace(ONBOARDING_PATH);
    }
  }, [bootstrapLoading, business, user, pathname, router]);

  if (authLoading || !user) {
    return (
      <div className="dashboard-shell min-h-screen flex items-center justify-center">
        <DashboardDocumentTitle />
        <PageLoader size="lg" message="Just a moment" />
      </div>
    );
  }

  if (bootstrapLoading) {
    return (
      <div className="dashboard-shell min-h-screen flex items-center justify-center">
        <DashboardDocumentTitle />
        <PageLoader size="lg" message="Loading your workspace" />
      </div>
    );
  }

  if (!business && pathname !== ONBOARDING_PATH) {
    return <DashboardDocumentTitle />;
  }

  return (
    <DashboardNavigationProvider>
      <div className="dashboard-shell min-h-screen flex flex-col md:flex-row print:!bg-white">
        <DashboardNavProgress />
        <DashboardDocumentTitle />
        <DashboardNav />
        <main className="flex-1 w-full min-w-0 max-w-6xl mx-auto px-4 sm:px-8 py-6 md:py-10 print:max-w-none print:px-0 print:py-0 md:rounded-tl-[28px] md:bg-white md:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_64px_-32px_rgba(15,23,42,0.10)] md:min-h-screen md:ring-1 md:ring-slate-200/80">
        {isLocalMock && pathname !== ONBOARDING_PATH && (
          <div
            className="mb-5 rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3.5 sm:px-5 text-sm text-sky-950 shadow-soft"
            role="status"
          >
            <p className="font-semibold">Testing environment</p>
            <p className="text-sky-900 mt-0.5 leading-relaxed">
              This session runs in a testing environment in your browser. No emails or SMS will be sent—sends are
              simulated for preview. Sample data, Pro, and credits are local only. CSV, QR, webhooks, and billing also
              update this preview only, with no real charges. Sign in with Google for a live workspace.
            </p>
          </div>
        )}
        {!isLocalMock && business?.is_sandbox && pathname !== ONBOARDING_PATH && (
          <div
            className="mb-5 rounded-2xl border border-violet-200 bg-violet-50/80 px-4 py-3.5 sm:px-5 text-sm text-violet-950 shadow-soft"
            role="status"
          >
            <p className="font-semibold">Demo workspace</p>
            <p className="text-violet-900 mt-0.5 leading-relaxed">
              Sample data and a healthy credit balance are included so you can explore the product. No real emails or
              texts are sent from this workspace; scheduled sends are recorded only (sandbox).
            </p>
          </div>
        )}
        <div className="print:!animate-none">
          <PendingContent>{children}</PendingContent>
        </div>
        </main>
      </div>
    </DashboardNavigationProvider>
  );
}

function PendingContent({ children }: { children: React.ReactNode }) {
  const { isPending } = useDashboardNavigation();
  if (isPending) return <DashboardRouteLoadingSkeleton />;
  return <>{children}</>;
}
