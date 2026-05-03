import Link from "next/link";
import Logo from "@/components/Logo";

/**
 * Shared marketing footer.
 * Three-column on desktop: brand + tagline · Product · Resources · Legal.
 * Collapses to a stacked layout on mobile.
 */
const PRODUCT_LINKS: { href: string; label: string }[] = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/pricing", label: "Pricing" },
  { href: "/login?new=1", label: "Get started" },
];

const RESOURCE_LINKS: { href: string; label: string }[] = [
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Help & contact" },
  { href: "mailto:hello@maskedcarrotlabs.com", label: "Email us" },
];

const LEGAL_LINKS: { href: string; label: string }[] = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/compliance", label: "Compliance" },
];

export default function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto shrink-0 w-full border-t border-slate-200/80 bg-white/70 backdrop-blur">
      <div className="max-w-7xl mx-auto px-5 sm:px-10 pt-12 pb-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand + tagline */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-slate-900 transition-colors w-fit"
            >
              <Logo size="sm" href="/" iconOnly />
              <span className="text-base font-semibold tracking-tight">GoodWord</span>
            </Link>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-sm">
              More 5-star reviews for your local business — without the awkward till-side
              ask. Made by{" "}
              <a
                href="https://maskedcarrotlabs.com"
                className="font-medium text-slate-900 underline underline-offset-4 decoration-slate-300 hover:decoration-slate-700"
              >
                Masked Carrot Labs
              </a>
              .
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-[0.7rem] font-semibold text-emerald-800">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-pulse-ring" />
                <span className="relative inline-block h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              All systems normal
            </div>
          </div>

          <FooterCol heading="Product" links={PRODUCT_LINKS} />
          <FooterCol heading="Resources" links={RESOURCE_LINKS} />
          <FooterCol heading="Legal" links={LEGAL_LINKS} />
        </div>

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            © {year} Masked Carrot Labs. GoodWord is a product, not a marketing agency —
            you own all your data and reviews.
          </p>
          <p className="text-xs text-slate-500">
            <a
              href="mailto:hello@maskedcarrotlabs.com"
              className="hover:text-slate-700 transition-colors"
            >
              hello@maskedcarrotlabs.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-label={heading}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {heading}
      </p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-slate-700 hover:text-slate-900 transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
