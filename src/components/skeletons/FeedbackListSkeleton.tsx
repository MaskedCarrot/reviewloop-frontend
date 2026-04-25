import { ShimmerBlock } from "./Skeleton";

/**
 * Reserves the same space as a few feedback cards to avoid layout jump.
 */
export default function FeedbackListSkeleton() {
  return (
    <ul className="space-y-2" aria-busy="true" aria-label="Loading feedback">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="card p-4 min-h-[5.5rem]">
          <div className="flex items-center justify-between gap-3">
            <ShimmerBlock className="h-6 w-12 rounded-lg" />
            <ShimmerBlock className="h-3 w-36" />
          </div>
          <ShimmerBlock className="h-3 w-full mt-3" />
          <ShimmerBlock className="h-3 w-[80%] mt-1.5" />
        </li>
      ))}
    </ul>
  );
}
