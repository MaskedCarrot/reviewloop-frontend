import type { ReactNode } from "react";

/**
 * Wrap for customer-facing pages (the QR landing + the review-routing page).
 *
 * Tinted backdrop pulls accent colour from the merchant; the card itself stays neutral
 * and high-contrast so the action is unmistakeable. Optimised for mobile — most of the
 * traffic lands here on a phone, in a moment of "did I really get a 5-star?"
 */
export default function CustomerWrap({
  accent,
  children,
  poweredBy = true,
}: {
  accent: string;
  children: ReactNode;
  poweredBy?: boolean;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-8 relative overflow-hidden"
      style={{
        background: `radial-gradient(800px 360px at 90% -10%, ${accent}1f, transparent 60%),
                     radial-gradient(700px 320px at -10% 110%, ${accent}14, transparent 60%),
                     linear-gradient(180deg, #fdfcfa 0%, #f6f3ee 60%, #f4f3f0 100%)`,
      }}
    >
      <div className="relative w-full max-w-md">
        <div
          className="pointer-events-none absolute -inset-3 -z-10 rounded-[2.4rem] blur-2xl opacity-60"
          aria-hidden
          style={{
            background: `linear-gradient(135deg, ${accent}33, transparent 60%)`,
          }}
        />
        <div className="rounded-3xl border border-slate-200/80 bg-white px-6 py-7 sm:px-8 sm:py-9 shadow-[0_2px_4px_rgba(15,23,42,0.04),0_30px_64px_-32px_rgba(15,23,42,0.22)] animate-fade-in">
          {children}
        </div>
        {poweredBy ? (
          <p className="mt-4 text-center text-[11px] text-slate-500">
            powered by{" "}
            <a
              href="https://goodword.maskedcarrotlabs.com"
              className="font-semibold text-slate-700 hover:text-slate-900"
            >
              GoodWord
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
