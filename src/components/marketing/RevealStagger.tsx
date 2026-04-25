"use client";

import {
  Children,
  type HTMLAttributes,
  type ReactNode,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Ms between each child fade-in. */
  staggerMs?: number;
  /** If true, animates on mount. If false, when row scrolls into view. */
  when?: "mount" | "inview";
} & HTMLAttributes<HTMLDivElement>;

/**
 * Staggered fade-up for few, short children — pairs animation with scannable text.
 */
export function RevealStagger({ children, className = "", staggerMs = 100, when = "inview", ...divProps }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (when === "mount") {
      const id = requestAnimationFrame(() => setOn(true));
      return () => cancelAnimationFrame(id);
    }
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [when]);

  const items = Children.toArray(children);
  return (
    <div ref={rootRef} className={className} {...divProps}>
      {items.map((ch, i) => {
        if (!isValidElement(ch)) {
          return <span key={i}>{ch}</span>;
        }
        return (
          <div
            key={i}
            className={
              "transition-[opacity,transform] duration-500 ease-out motion-reduce:opacity-100 motion-reduce:translate-y-0 " +
              (on ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")
            }
            style={{ transitionDelay: on ? `${i * staggerMs}ms` : "0ms" }}
          >
            {ch}
          </div>
        );
      })}
    </div>
  );
}
