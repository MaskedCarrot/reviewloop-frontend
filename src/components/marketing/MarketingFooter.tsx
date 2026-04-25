import Link from "next/link";
import Logo from "@/components/Logo";

/**
 * Shared marketing footer: home, pricing, how-it-works, legal.
 */
export default function MarketingFooter() {
  return (
    <footer className="mt-auto shrink-0 w-full border-t border-slate-200/50 bg-white/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-5 sm:px-10 py-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5 text-slate-600 hover:text-slate-900 transition-colors w-fit">
          <Logo size="sm" href="/" iconOnly />
          <span className="text-sm font-semibold text-slate-800">ReviewLoop</span>
        </Link>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500" aria-label="Footer">
          <Link href="/how-it-works" className="hover:text-slate-900">
            How it works
          </Link>
          <Link href="/pricing" className="hover:text-slate-900">
            Pricing
          </Link>
          <Link href="/privacy" className="hover:text-slate-900">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-slate-900">
            Terms
          </Link>
          <Link href="/compliance" className="hover:text-slate-900">
            Compliance
          </Link>
          <Link href="/support" className="text-brand-600 font-medium hover:text-brand-800">
            Support
          </Link>
          <a
            href="mailto:hello@maskedcarrotlabs.com"
            className="hover:text-slate-900"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
