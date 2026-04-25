import { ShimmerBlock } from "@/components/skeletons/Skeleton";

/**
 * Generic dashboard body placeholder for `app/dashboard/loading.tsx` while
 * a route segment streams in (matches the padded main column feel).
 */
export default function DashboardRouteLoadingSkeleton() {
  return (
    <div className="space-y-6 pb-10" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <ShimmerBlock className="h-6 w-48" />
        <ShimmerBlock className="h-3 w-72 max-w-full" />
      </div>
      <div className="card p-5 border-slate-200/80 ring-1 ring-slate-100 min-h-[220px]">
        <ShimmerBlock className="h-4 w-40 mb-5" />
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <ShimmerBlock className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="flex-1 min-w-0 space-y-2">
                <ShimmerBlock className="h-3.5 w-2/3" />
                <ShimmerBlock className="h-2.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
