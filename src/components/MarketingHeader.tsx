"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import TryDemoButton from "./TryDemoButton";
import Logo from "./Logo";

const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Help" },
] as const;

function navItemClass(active: boolean) {
  return [
    "inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
    active
      ? "text-slate-900 bg-slate-100"
      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100",
  ].join(" ");
}

export default function MarketingHeader() {
  const pathname = usePathname() ?? "";
  const isHome = pathname === "/";
  const isLogin = pathname === "/login" || pathname.startsWith("/login");
  const [open, setOpen] = useState(false);

  // Close the mobile drawer on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock scroll when the drawer is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="marketing-section flex items-center justify-between gap-4 py-3.5 sm:py-4">
        <Link
          href="/"
          className={[
            "flex items-center gap-2 min-w-0 rounded-xl -ml-0.5 pl-0.5 pr-1.5 -my-0.5 transition-opacity",
            isHome ? "ring-1 ring-slate-200 bg-slate-50" : "hover:opacity-90",
          ].join(" ")}
          aria-current={isHome ? "page" : undefined}
        >
          <Logo iconOnly />
          <span className="font-semibold text-slate-900 text-lg tracking-tight">GoodWord</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 shrink-0" aria-label="Primary">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={navItemClass(active)}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
              </Link>
            );
          })}
          <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />
          <TryDemoButton variant="header" label="Try demo" />
          <Link
            href="/login"
            className="ml-1 inline-flex items-center cta-warm text-sm sm:text-[0.95rem] px-4 py-2 min-h-9 rounded-lg shadow-sm"
            aria-current={isLogin ? "page" : undefined}
          >
            Get started
          </Link>
        </nav>

        {/* Mobile: just a "menu" button on the right */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 h-9 text-slate-700 hover:bg-slate-50"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white shadow-card animate-fade-in">
          <nav className="marketing-section py-4 flex flex-col gap-1" aria-label="Primary mobile">
            {NAV_LINKS.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={[
                    "rounded-lg px-3 py-2.5 text-base font-medium transition-colors",
                    active
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")}
                  aria-current={active ? "page" : undefined}
                >
                  {l.label}
                </Link>
              );
            })}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <TryDemoButton variant="secondary" className="py-3" label="Try demo" />
              <Link
                href="/login"
                className="cta-warm py-3 text-sm justify-center"
              >
                Get started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
