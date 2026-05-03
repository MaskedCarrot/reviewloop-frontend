"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Final value to count to. */
  to: number;
  /** Optional starting value (default 0). */
  from?: number;
  /** Animation duration in ms (default 1100). */
  duration?: number;
  /** Decimal places to display (default 0). */
  decimals?: number;
  /** Prefix or suffix wrapping the number (e.g. "$", "%", "+", "x"). */
  prefix?: string;
  suffix?: string;
  className?: string;
};

/**
 * KPI-style number counter that ticks up the first time the element enters the viewport.
 *
 * Uses `requestAnimationFrame` for a smooth ease-out and disables animation entirely
 * when the user prefers reduced motion (the final value is rendered immediately).
 */
export default function AnimatedCounter({
  to,
  from = 0,
  duration = 1100,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [val, setVal] = useState<number>(from);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      setVal(to);
      return;
    }

    let started = false;
    let raf = 0;
    const obs = new IntersectionObserver(
      (entries) => {
        if (started) return;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          started = true;
          obs.disconnect();
          const startTime = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - startTime) / duration);
            // ease-out cubic — feels right for KPIs.
            const eased = 1 - Math.pow(1 - t, 3);
            const next = from + (to - from) * eased;
            setVal(next);
            if (t < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
          break;
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [to, from, duration]);

  const formatted = val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
