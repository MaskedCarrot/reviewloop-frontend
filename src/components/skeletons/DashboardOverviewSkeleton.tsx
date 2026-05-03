import { ShimmerBlock } from "./Skeleton";

/**
 * Mirrors `/dashboard` overview structure so the page does not jump when data loads.
 */
export default function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-8 pb-10" aria-busy="true" aria-label="Loading dashboard">
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-violet-200/30 bg-gradient-to-br from-violet-50/50 to-white p-4 sm:p-5 min-h-[132px]">
          <ShimmerBlock className="h-3 w-32 mb-3" />
          <ShimmerBlock className="h-9 w-16 mb-2" />
          <ShimmerBlock className="h-2.5 w-full max-w-[14rem]" />
        </div>
        <div className="rounded-2xl border border-sky-200/30 bg-gradient-to-br from-sky-50/50 to-white p-4 sm:p-5 min-h-[132px]">
          <ShimmerBlock className="h-3 w-28 mb-3" />
          <ShimmerBlock className="h-9 w-16 mb-2" />
          <ShimmerBlock className="h-2.5 w-full max-w-[14rem]" />
        </div>
        <div className="rounded-2xl border border-emerald-200/30 bg-gradient-to-br from-emerald-50/40 to-white p-4 sm:p-5 min-h-[132px]">
          <ShimmerBlock className="h-3 w-36 mb-3" />
          <ShimmerBlock className="h-9 w-20 mb-2" />
          <ShimmerBlock className="h-2.5 w-full max-w-[14rem]" />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2 border-slate-200 ring-1 ring-slate-100 min-h-[280px]">
          <ShimmerBlock className="h-4 w-40 mb-1" />
          <ShimmerBlock className="h-2.5 w-52 mb-5" />
          <div className="space-y-0">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2 mb-0">
                <div className="flex flex-col items-center w-10 shrink-0">
                  <ShimmerBlock className="h-3 w-3 rounded-full" />
                  {i < 3 ? <div className="w-0.5 flex-1 min-h-[1.5rem] bg-slate-100 rounded" /> : null}
                </div>
                <div className="pb-3 flex-1">
                  <div className="flex justify-between gap-2 mb-1">
                    <ShimmerBlock className="h-4 w-32" />
                    <ShimmerBlock className="h-5 w-8" />
                  </div>
                  <ShimmerBlock className="h-2.5 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5 border-slate-200 ring-1 ring-slate-100 min-h-[200px]">
          <ShimmerBlock className="h-4 w-32 mb-4" />
          <ShimmerBlock className="h-9 w-24 mb-2" />
          <ShimmerBlock className="h-3 w-full mb-1" />
          <ShimmerBlock className="h-3 w-[80%] mb-1" />
          <ShimmerBlock className="h-3 w-28 mt-2" />
        </div>
      </div>

      <div className="card p-5 max-w-2xl border-slate-200 border-dashed bg-slate-50 min-h-[120px]">
        <ShimmerBlock className="h-4 w-44 mb-2" />
        <ShimmerBlock className="h-3 w-full max-w-md mb-3" />
        <ShimmerBlock className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}
