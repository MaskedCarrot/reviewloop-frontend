"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { isAdminUser } from "@/lib/api";

/**
 * Admin layout. Redirects non-admins to /dashboard. The backend independently enforces
 * the same gate via GOODWORD_ADMIN_EMAIL — this layout exists purely so non-admins
 * never see admin UI rendered, and to avoid surfacing the route in the dashboard nav.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isAdminUser(user.email)) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="dashboard-shell min-h-screen grid place-items-center">
        <p className="text-sm text-slate-500">Checking access…</p>
      </div>
    );
  }

  if (!isAdminUser(user.email)) {
    return (
      <div className="dashboard-shell min-h-screen grid place-items-center">
        <p className="text-sm text-slate-500">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="dashboard-shell min-h-screen">
      <header className="border-b border-slate-200/70 bg-white/85 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-xs font-bold text-white shadow-sm">
              RL
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-warm-700">GoodWord</p>
              <p className="display-title text-base text-slate-900 leading-tight">Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Back to dashboard →
            </Link>
            <span
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-warm-50 border border-warm-200 px-2.5 py-1 text-[11px] font-semibold text-warm-800"
              title={user.email}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
              {user.email}
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">{children}</main>
    </div>
  );
}
