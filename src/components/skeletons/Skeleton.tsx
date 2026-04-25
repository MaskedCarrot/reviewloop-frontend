import type { HTMLAttributes } from "react";

/**
 * Shimmer surface — pass Tailwind size classes, e.g. `h-4 w-24` or `h-full min-h-[200px]`.
 * Uses global `.skeleton` from `globals.css`.
 */
export function ShimmerBlock({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`skeleton ${className}`.trim()} aria-hidden {...rest} />;
}
