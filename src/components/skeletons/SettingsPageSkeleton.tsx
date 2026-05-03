import { ShimmerBlock } from "@/components/skeletons/Skeleton";

/**
 * Shimmer for Settings: nav pills and stacked section cards while bootstrap loads.
 */
export default function SettingsPageSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-6" aria-busy="true" aria-label="Loading settings">
      <p className="sr-only">Loading business and preferences</p>

      <div className="flex flex-wrap gap-1.5 sm:gap-2 -mt-2" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <ShimmerBlock key={i} className="h-7 w-20 sm:w-24 rounded-full" />
        ))}
      </div>

      {[0, 1, 2].map((section) => (
        <section
          key={section}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)]"
        >
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50/95 via-white to-slate-50/30">
            <div className="flex gap-3.5 px-4 py-3.5 sm:px-6 sm:py-4">
              <ShimmerBlock className="h-10 w-10 rounded-xl shrink-0" />
              <div className="min-w-0 pt-0.5 flex-1">
                <ShimmerBlock className="h-5 w-40 max-w-[80%] mb-2" />
                <ShimmerBlock className="h-3.5 w-full max-w-md" />
                <ShimmerBlock className="h-3 w-2/3 max-w-sm mt-1.5" />
              </div>
            </div>
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <ShimmerBlock className="h-2.5 w-24 mb-2" />
                <ShimmerBlock className="h-10 w-full rounded-lg" />
              </div>
              <div>
                <ShimmerBlock className="h-2.5 w-20 mb-2" />
                <ShimmerBlock className="h-10 w-full rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <ShimmerBlock className="h-2.5 w-28 mb-2" />
                <ShimmerBlock className="h-10 w-full rounded-lg" />
              </div>
              <div>
                <ShimmerBlock className="h-2.5 w-24 mb-2" />
                <ShimmerBlock className="h-10 w-full rounded-lg" />
              </div>
            </div>
            <div>
              <ShimmerBlock className="h-2.5 w-20 mb-2" />
              <ShimmerBlock className="h-9 w-28 rounded-md" />
            </div>
          </div>
        </section>
      ))}

      <div className="overflow-hidden rounded-2xl border border-rose-200/50 bg-rose-50/20 p-4 sm:p-5">
        <div className="flex gap-2 mb-2">
          <ShimmerBlock className="h-3 w-28" />
        </div>
        <ShimmerBlock className="h-9 w-36 rounded-lg" />
      </div>
    </div>
  );
}
