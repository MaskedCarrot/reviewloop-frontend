import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Page not found",
};

/** Branded 404. Renders for any route Next.js can't match. Kept simple,
 * friendly, and on-brand — same warm gradient + star as the rest of the app. */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-warm-50/60 via-white to-white px-6 py-16 flex items-center">
      <div className="mx-auto max-w-lg text-center">
        <div className="flex justify-center mb-6">
          <Logo size="md" href="/" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-warm-700">
          404 · Page not found
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-display font-medium text-slate-900 leading-tight">
          We couldn&apos;t find that page.
        </h1>
        <p className="mt-3 text-base text-slate-700 leading-relaxed">
          The link may be broken, or the page may have moved. Try the dashboard
          or head back home.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="cta-warm h-11 px-5 text-sm">
            Go to dashboard
          </Link>
          <Link href="/" className="btn-secondary h-11 px-5 text-sm">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
