import { ShimmerBlock } from "@/components/skeletons/Skeleton";

const sectionClass = "app-section";

/**
 * Shimmer placeholders for balance, market rates, Pro, and low-balance row while credits bootstrap loads.
 */
export default function BillingPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading credits">
      <section className={sectionClass}>
        <p className="sr-only">Loading current credit balance</p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <ShimmerBlock className="h-2.5 w-16" />
            <div className="mt-1 flex items-baseline gap-2">
              <ShimmerBlock className="h-14 w-32 sm:h-[4.25rem] sm:w-36" />
              <ShimmerBlock className="h-3 w-12 pb-1.5" />
            </div>
            <div className="mt-2">
              <ShimmerBlock className="h-2.5 w-44" />
            </div>
          </div>
          <div className="sm:max-w-xs w-full sm:text-right border-t border-slate-100/90 pt-3 sm:border-0 sm:pt-0 space-y-1.5">
            <ShimmerBlock className="h-2 w-24 sm:ml-auto" />
            <ShimmerBlock className="h-3.5 w-48 sm:ml-auto" />
            <ShimmerBlock className="h-2.5 w-40 sm:ml-auto" />
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className="mb-3 flex items-center gap-2">
          <ShimmerBlock className="h-4 w-10" />
          <ShimmerBlock className="h-5 w-5 rounded-full" />
        </div>
        <ShimmerBlock className="h-2.5 w-full max-w-sm mb-4" />
        <ul className="space-y-0">
          {[0, 1].map((i) => (
            <li
              key={i}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-slate-100/80 last:border-0 first:pt-0"
            >
              <div className="space-y-1.5 flex-1 min-w-0 max-w-md">
                <ShimmerBlock className="h-3.5 w-full max-w-[12rem]" />
                <ShimmerBlock className="h-2.5 w-56" />
              </div>
              <ShimmerBlock className="h-9 w-[7.5rem] shrink-0 rounded-lg" />
            </li>
          ))}
        </ul>
      </section>

      <section className={sectionClass}>
        <ShimmerBlock className="h-3 w-14" />
        <ShimmerBlock className="h-2.5 w-40 mt-1 mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <ShimmerBlock key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </section>

      <div className={`${sectionClass} space-y-2`} aria-hidden>
        <ShimmerBlock className="h-3 w-32" />
        <ShimmerBlock className="h-2.5 w-64 max-w-full" />
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <ShimmerBlock className="h-9 w-28 rounded-lg" />
          <ShimmerBlock className="h-9 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
