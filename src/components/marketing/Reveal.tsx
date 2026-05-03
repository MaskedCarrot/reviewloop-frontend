"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Delay in ms before the reveal animation starts. Useful for staggered groups. */
  delay?: number;
  /** Tag to render — defaults to a div so it inherits layout. */
  as?: "div" | "section" | "li" | "article" | "header";
  /** Extra classes to merge with the .reveal base class. */
  className?: string;
};

/**
 * Reveal-on-scroll wrapper.
 *
 * Adds the `.reveal` base class (defined in globals.css) and toggles `.is-visible`
 * the first time the element intersects the viewport. After it has been revealed
 * the observer disconnects so we don't re-fire on scroll-back.
 *
 * Honors `prefers-reduced-motion` automatically — globals.css resets the transform
 * and opacity to their final state for those users so they see the content
 * immediately without animation.
 */
export default function Reveal({ children, delay = 0, as = "div", className }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // SSR / older browsers without IntersectionObserver: just show immediately.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const merged = ["reveal", shown ? "is-visible" : "", className].filter(Boolean).join(" ");
  const style = delay ? { transitionDelay: `${delay}ms` } : undefined;

  // Type-narrow the polymorphic tag — these are all valid HTML element keys.
  const Tag = as as "div";
  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={merged} style={style}>
      {children}
    </Tag>
  );
}
