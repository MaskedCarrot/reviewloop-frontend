"use client";

import { Suspense } from "react";
import PageLoader from "@/components/PageLoader";
import { PeopleWorkspace } from "./_components";

export default function ContactsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <PageLoader message="Loading People" size="md" />
        </div>
      }
    >
      <PeopleWorkspace />
    </Suspense>
  );
}
