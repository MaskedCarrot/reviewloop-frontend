"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShimmerBlock } from "@/components/skeletons/Skeleton";

/** Send rates now live on Credits; keep old URL for bookmarks. */
export default function CreditRatesRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/billing#rates");
  }, [router]);
  return (
    <div
      className="min-h-[30vh] flex flex-col items-center justify-center gap-3"
      role="status"
      aria-label="Redirecting to credits"
    >
      <ShimmerBlock className="h-4 w-40 rounded-md" />
      <ShimmerBlock className="h-3 w-32 rounded-md" />
    </div>
  );
}
