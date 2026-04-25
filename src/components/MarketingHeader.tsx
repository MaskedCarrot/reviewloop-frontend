"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TryDemoButton from "./TryDemoButton";
import Logo from "./Logo";

function navItem(active: boolean) {
  return [
    "inline-flex items-center rounded-lg px-2.5 sm:px-3 py-1.5 text-sm font-medium transition-colors",
    active
      ? "bg-brand-50 text-brand-900 ring-1 ring-brand-200/80"
      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80",
  ].join(" ");
}

export default function MarketingHeader() {
  const pathname = usePathname() ?? "";
  const isHome = pathname === "/";
  const isHow = pathname === "/how-it-works" || pathname.startsWith("/how-it-works/");
  const isPricing = pathname === "/pricing";
  const isSupport = pathname === "/support";
  const isLogin = pathname === "/login" || pathname.startsWith("/login");

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/50 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="marketing-section flex items-center justify-between gap-4 py-3.5 sm:py-4">
        <Link
          href="/"
          className={[
            "flex items-center gap-2 min-w-0 rounded-xl -ml-0.5 pl-0.5 pr-1.5 -my-0.5 transition-opacity",
            isHome ? "ring-1 ring-slate-200/50 bg-slate-50/80" : "hover:opacity-90",
          ].join(" ")}
          aria-current={isHome ? "page" : undefined}
        >
          <Logo iconOnly />
          <span className="font-semibold text-slate-900 text-lg tracking-tight">ReviewLoop</span>
        </Link>
        <nav
          className="flex items-center gap-0.5 sm:gap-1 shrink-0 flex-wrap justify-end"
          aria-label="Primary"
        >
          {!isHome && <TryDemoButton variant="header" label="Try demo" />}
          <Link
            href="/how-it-works"
            className={navItem(isHow)}
            aria-current={isHow ? "page" : undefined}
          >
            How it works
          </Link>
          <Link
            href="/pricing"
            className={navItem(isPricing)}
            aria-current={isPricing ? "page" : undefined}
          >
            Pricing
          </Link>
          <Link
            href="/support"
            className={navItem(isSupport)}
            aria-current={isSupport ? "page" : undefined}
          >
            Support
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center btn-primary text-sm sm:text-base px-3.5 sm:px-5 py-1.5 sm:py-2 shadow-sm"
            aria-current={isLogin ? "page" : undefined}
          >
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}
