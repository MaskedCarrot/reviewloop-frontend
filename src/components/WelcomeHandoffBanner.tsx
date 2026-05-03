"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const STORAGE = "goodword_welcome_dismissed";

export default function WelcomeHandoffBanner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("welcome") !== "1") return;
    if (typeof window !== "undefined" && sessionStorage.getItem(STORAGE)) return;
    setVisible(true);
  }, [searchParams]);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (typeof window !== "undefined") sessionStorage.setItem(STORAGE, "1");
    router.replace("/dashboard");
  }, [router]);

  if (!visible) return null;

  return (
    <div className="rounded-xl border border-brand-200/80 bg-brand-50/80 px-4 py-3 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p className="text-sm text-slate-800">
        <span className="font-medium">Setup is complete.</span> Open People to add your first contact, or Templates to
        adjust the text customers receive.
      </p>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Link href="/dashboard/contacts" className="btn-primary text-sm py-2 px-3">
          People
        </Link>
        <Link href="/dashboard/templates" className="btn-secondary text-sm py-2 px-3">
          Templates
        </Link>
        <button type="button" onClick={dismiss} className="text-sm text-slate-600 hover:text-slate-900 py-2 px-2">
          Dismiss
        </button>
      </div>
    </div>
  );
}
