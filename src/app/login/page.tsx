"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID, googleAuth, SHOW_MARKETING_TRY_DEMO, startLocalDemoSession } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import MarketingHeader from "@/components/MarketingHeader";
import Logo from "@/components/Logo";

const hasGoogleClientId = !!GOOGLE_CLIENT_ID;

console.log("GOOGLE_CLIENT_ID", GOOGLE_CLIENT_ID);

function LoginIntro() {
  const sp = useSearchParams();
  const isGetStarted = sp.get("new") === "1";
  if (isGetStarted) {
    return (
      <>
        <h1 className="app-title mb-1">Get started</h1>
        <p className="app-subtitle text-slate-600 mb-6">Create your account with Google — the same sign-in works when you return.</p>
      </>
    );
  }
  return (
    <>
      <h1 className="app-title mb-1">Sign in</h1>
      <p className="app-subtitle text-slate-600 mb-6">Back to your dashboard and campaigns.</p>
    </>
  );
}

function useWantsAutoDemo() {
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("demo") === "1" || q.get("demo") === "true") setAuto(true);
  }, []);
  return auto;
}

export default function LoginPage() {
  const { user, login, loading: authLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const wantsAutoDemo = useWantsAutoDemo();
  const autoTried = useRef(false);

  const runDemo = useCallback(() => {
    if (!SHOW_MARKETING_TRY_DEMO) return;
    const u = startLocalDemoSession();
    login(u);
    router.replace("/dashboard");
  }, [login, router]);

  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!wantsAutoDemo || !SHOW_MARKETING_TRY_DEMO || autoTried.current) return;
    if (user || authLoading) return;
    autoTried.current = true;
    runDemo();
  }, [wantsAutoDemo, user, authLoading, runDemo]);

  return (
    <div className="marketing-root">
      <MarketingHeader />
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 sm:py-14">
        <div className="w-full max-w-sm card p-7 sm:p-8 bg-white/95 shadow-card animate-fade-in">
          <div className="flex justify-center mb-6">
            <Logo href="/" />
          </div>
          <Suspense
            fallback={
              <>
                <h1 className="app-title mb-1">Sign in</h1>
                <p className="app-subtitle text-slate-600 mb-6">Back to your dashboard and campaigns.</p>
              </>
            }
          >
            <LoginIntro />
          </Suspense>

          {hasGoogleClientId ? (
            <GoogleButton
              onSuccess={async (code) => {
                setBusy(true);
                setError("");
                try {
                  const { user: u } = await googleAuth(code);
                  login(u);
                  router.push("/dashboard");
                } catch (e: unknown) {
                  setError(e instanceof Error ? e.message : "Login failed. Please try again.");
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
            />
          ) : (
            <div className="text-sm text-amber-900 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
              Set <code className="text-xs">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in{" "}
              <code className="text-xs">.env.local</code> to enable Google sign-in.
            </div>
          )}

          {error && (
            <div className="mt-4 text-sm text-red-700 px-4 py-3 rounded-xl bg-red-50 border border-red-200">{error}</div>
          )}

          <p className="mt-8 text-xs text-slate-500 text-center">
            By continuing you agree to our{" "}
            <Link href="/terms" className="text-brand-700 hover:underline">Terms</Link> and{" "}
            <Link href="/privacy" className="text-brand-700 hover:underline">Privacy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleButton({ onSuccess, disabled }: { onSuccess: (code: string) => void; disabled?: boolean }) {
  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: ({ code }) => onSuccess(code),
  });
  return (
    <button
      onClick={() => googleLogin()}
      disabled={disabled}
      className="w-full h-12 flex items-center justify-center gap-2.5 bg-white border border-slate-300 hover:border-slate-400 rounded-full text-sm font-semibold text-slate-800 shadow-sm hover:shadow transition disabled:opacity-50"
    >
      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
    </button>
  );
}
