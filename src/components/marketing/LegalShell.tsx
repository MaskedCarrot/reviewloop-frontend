"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

export type LegalSection = {
  /** Stable URL slug for #anchor links. */
  id: string;
  /** Heading text shown in the table of contents. */
  title: string;
  /** Section body. */
  body: ReactNode;
};

/**
 * Shared chrome for /privacy, /terms, /compliance.
 * Provides:
 * - A title + last-updated badge + back-to-home link
 * - A sticky table of contents on lg+ that highlights the section currently in view
 * - Anchor-friendly headings (h2 with id={section.id} and a hover # marker)
 * - "Back to top" affordance at the bottom
 *
 * Receives the page-specific sections array. Content stays in the per-page file.
 */
export default function LegalShell({
  eyebrow = "Legal",
  title,
  lastUpdated,
  intro,
  sections,
}: {
  eyebrow?: string;
  title: string;
  lastUpdated: string;
  intro?: ReactNode;
  sections: LegalSection[];
}) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");

  // Highlight the section closest to the top of the viewport.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const ids = sections.map((s) => s.id);
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = (visible[0].target as HTMLElement).id;
          if (ids.includes(id)) setActiveId(id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 1] },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [sections]);

  return (
    <main className="flex-1 marketing-section py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
        {/* TOC — sticky on lg, inline accordion on mobile */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Link href="/" className="link text-sm inline-flex items-center gap-1">
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to home
          </Link>
          <p className="marketing-eyebrow mt-5">
            <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
            On this page
          </p>
          <ol className="mt-3 space-y-1">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={[
                    "block rounded-lg px-3 py-1.5 text-sm transition-colors",
                    activeId === s.id
                      ? "bg-white text-slate-900 font-semibold ring-1 ring-warm-200/80 shadow-soft"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/70",
                  ].join(" ")}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        {/* Body */}
        <article className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-10 shadow-card max-w-none">
          <p className="marketing-eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
            {eyebrow}
          </p>
          <h1 className="display-title-lg mt-3 text-slate-900">{title}</h1>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
              <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            Last updated {lastUpdated}
          </p>

          {intro ? (
            <div className="mt-6 text-base text-slate-700 leading-relaxed [&>a]:text-warm-700 [&>a]:font-medium">
              {intro}
            </div>
          ) : null}

          <div className="legal-doc mt-2 [&>section]:scroll-mt-28">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="group">
                <h2 className="!mt-10 first:!mt-8">
                  <a
                    href={`#${s.id}`}
                    className="no-underline hover:underline underline-offset-4 decoration-warm-300"
                  >
                    {s.title}
                  </a>
                  <a
                    href={`#${s.id}`}
                    aria-label="Anchor link"
                    className="ml-2 align-middle text-warm-500 opacity-0 group-hover:opacity-100 transition-opacity text-base"
                  >
                    #
                  </a>
                </h2>
                {s.body}
              </section>
            ))}
          </div>

          <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6">
            <a
              href="#top"
              className="cta-ghost"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              ↑ Back to top
            </a>
            <Link href="/support" className="text-sm font-semibold text-warm-700 hover:text-warm-900">
              Question? Contact us →
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
