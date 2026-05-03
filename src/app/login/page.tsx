"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import {
  GOOGLE_CLIENT_ID,
  googleAuth,
  SHOW_MARKETING_TRY_DEMO,
  startLocalDemoSession,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";

const hasGoogleClientId = !!GOOGLE_CLIENT_ID;

/**
 * /login — bridges marketing → dashboard. Marketing-leaning hero with a focused
 * sign-in card on the right. Uses Suspense around the bits that depend on
 * `useSearchParams` so the rest of the page can render server-side.
 */
export default function LoginPage() {
  const { user, login, loading: authLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // ?demo=1 auto-launches the local mock session.
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
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 right-[-15%] h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-warm-200/55 via-warm-100/30 to-transparent blur-3xl animate-float-blob" />
        <div className="absolute bottom-[-10rem] left-[-15%] h-[22rem] w-[22rem] rounded-full bg-gradient-to-tr from-brand-100/40 to-sky-100/30 blur-3xl animate-float-blob-2" />
      </div>

      <MarketingHeader />

      <main className="marketing-section flex-1 py-10 sm:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* Left — hero */}
          <Suspense fallback={<HeroFallback />}>
            <LoginHero />
          </Suspense>

          {/* Right — sign-in card */}
          <div className="lg:pl-4">
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-warm-100/50 to-brand-100/40 blur-2xl" aria-hidden />
              <div className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-card-hover animate-fade-in">
                <Suspense fallback={<CardIntroFallback />}>
                  <CardIntro />
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
                  <div
                    className="mt-4 text-sm text-red-800 px-4 py-3 rounded-xl bg-red-50 border border-red-200"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <div className="mt-6 grid gap-2 text-xs text-slate-600">
                  {[
                    "No card needed to start",
                    "Set up in under 10 minutes",
                    "Cancel any time, two clicks",
                  ].map((line) => (
                    <p key={line} className="flex items-center gap-2">
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{line}</span>
                    </p>
                  ))}
                </div>

                <p className="mt-6 text-[11px] text-slate-500 text-center leading-relaxed">
                  By continuing you agree to our{" "}
                  <Link href="/terms" className="link">Terms</Link> and{" "}
                  <Link href="/privacy" className="link">Privacy</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}

/* ---------- subcomponents ---------- */

function useWantsAutoDemo() {
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("demo") === "1" || q.get("demo") === "true") setAuto(true);
  }, []);
  return auto;
}

function LoginHero() {
  const sp = useSearchParams();
  const isGetStarted = sp.get("new") === "1";
  return (
    <div className="space-y-5 animate-home-in">
      <span className="marketing-eyebrow">
        <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
        {isGetStarted ? "Welcome — let's get you set up" : "Welcome back"}
      </span>
      <h1 className="display-title-xl text-slate-900">
        {isGetStarted ? (
          <>
            More 5-star <em>reviews</em>,
            <br className="hidden sm:block" />
            without the awkward ask.
          </>
        ) : (
          <>
            Sign in to your <em>review loop</em>.
          </>
        )}
      </h1>
      <p className="text-base sm:text-lg text-slate-700 max-w-md leading-relaxed">
        {isGetStarted
          ? "Sign in with Google and you'll be sending your first review request in under ten minutes."
          : "Pick up where you left off — your campaigns, templates and contacts are waiting."}
      </p>

      <ul className="grid gap-2.5 max-w-md">
        {[
          "Routes to Google · Yelp · Facebook · custom",
          "Authenticated sender so emails reach the inbox",
          "Private feedback form catches unhappy ratings before they hit Google",
        ].map((line) => (
          <li key={line} className="flex items-start gap-2.5 text-sm text-slate-700">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3 pt-2">
        <div className="flex -space-x-2">
          {["bg-warm-200", "bg-brand-200", "bg-emerald-200", "bg-rose-200"].map((b, i) => (
            <span
              key={i}
              className={`h-8 w-8 rounded-full ${b} ring-2 ring-white grid place-items-center text-[11px] font-bold text-slate-700`}
            >
              {"MJSP"[i]}
            </span>
          ))}
        </div>
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-slate-900">200+</span> small businesses building
          their review loop.
        </p>
      </div>
    </div>
  );
}

function HeroFallback() {
  return (
    <div className="space-y-5 animate-home-in">
      <span className="marketing-eyebrow">
        <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
        Welcome back
      </span>
      <h1 className="display-title-xl text-slate-900">
        Sign in to your <em>review loop</em>.
      </h1>
    </div>
  );
}

function CardIntro() {
  const sp = useSearchParams();
  const isGetStarted = sp.get("new") === "1";
  return (
    <div className="text-center mb-6">
      <h2 className="display-title text-2xl sm:text-[1.6rem] text-slate-900">
        {isGetStarted ? "Create your account" : "Sign in"}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {isGetStarted
          ? "One tap with Google — same one-tap sign-in next time."
          : "Continue to your dashboard."}
      </p>
    </div>
  );
}

function CardIntroFallback() {
  return (
    <div className="text-center mb-6">
      <h2 className="display-title text-2xl text-slate-900">Sign in</h2>
      <p className="mt-2 text-sm text-slate-600">Continue to your dashboard.</p>
    </div>
  );
}

function GoogleButton({
  onSuccess,
  disabled,
}: {
  onSuccess: (code: string) => void;
  disabled?: boolean;
}) {
  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: ({ code }) => onSuccess(code),
  });
  return (
    <button
      onClick={() => googleLogin()}
      disabled={disabled}
      className="w-full h-13 min-h-12 flex items-center justify-center gap-3 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 active:scale-[0.99] rounded-2xl text-base font-semibold text-slate-900 shadow-sm hover:shadow-card transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-400/30 focus-visible:ring-offset-2"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Continue with Google
    </button>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <path d="M5 12l5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
