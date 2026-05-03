import { ShimmerBlock } from "@/components/skeletons/Skeleton";

/**
 * Shimmer layout for the analytics dashboard (charts, stats, tables) while data loads.
 */
export default function AnalyticsPageSkeleton() {
  return (
    <div className="w-full min-w-0 space-y-8 pb-10" aria-busy="true" aria-label="Loading analytics">
      <p className="sr-only">Loading report data</p>
      <ShimmerBlock className="h-3 w-48 max-w-sm rounded" />

      <div className="card p-5">
        <ShimmerBlock className="h-4 w-32 mb-1" />
        <ShimmerBlock className="h-2.5 w-56 max-w-sm mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <ShimmerBlock className="h-2.5 w-20 mb-2" />
              <ShimmerBlock className="h-7 w-14" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5 sm:p-6 min-h-[280px]">
          <ShimmerBlock className="h-4 w-44 mb-1" />
          <ShimmerBlock className="h-2.5 w-64 max-w-full mb-4" />
          <ShimmerBlock className="h-56 w-full min-h-[14rem] rounded-lg" />
        </div>
        <div className="card p-5 sm:p-6 min-h-[280px]">
          <ShimmerBlock className="h-4 w-48 mb-1" />
          <ShimmerBlock className="h-2.5 w-60 max-w-full mb-4" />
          <ShimmerBlock className="h-56 w-full min-h-[14rem] rounded-lg" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5 sm:p-6 min-h-[240px]">
          <ShimmerBlock className="h-4 w-40 mb-1" />
          <ShimmerBlock className="h-2.5 w-52 mb-4" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between gap-3 border-b border-slate-100 pb-2.5 last:border-0">
                <ShimmerBlock className="h-3.5 w-40" />
                <ShimmerBlock className="h-3.5 w-10" />
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5 sm:p-6 min-h-[240px]">
          <ShimmerBlock className="h-4 w-40 mb-1" />
          <ShimmerBlock className="h-2.5 w-56 mb-4" />
          <ShimmerBlock className="h-44 w-full rounded-lg" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5 sm:p-6 min-h-[200px]">
          <ShimmerBlock className="h-4 w-52 mb-1" />
          <ShimmerBlock className="h-2.5 w-72 max-w-full mb-3" />
          <ShimmerBlock className="h-40 w-full rounded-full max-w-[200px] mx-auto aspect-square" />
        </div>
        <div className="card p-5 sm:p-6 min-h-[200px]">
          <ShimmerBlock className="h-4 w-48 mb-1" />
          <ShimmerBlock className="h-2.5 w-64 max-w-full mb-3" />
          <ShimmerBlock className="h-40 w-full rounded-full max-w-[200px] mx-auto aspect-square" />
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <ShimmerBlock className="h-4 w-40 mb-1" />
        <ShimmerBlock className="h-2.5 w-48 mb-3" />
        <div className="space-y-2 max-w-sm">
          <div className="flex justify-between gap-2">
            <ShimmerBlock className="h-3 w-44" />
            <ShimmerBlock className="h-3 w-8" />
          </div>
          <div className="flex justify-between gap-2">
            <ShimmerBlock className="h-3 w-36" />
            <ShimmerBlock className="h-3 w-8" />
          </div>
        </div>
        <ShimmerBlock className="h-2.5 w-80 max-w-full mt-4" />
      </div>
    </div>
  );
}
