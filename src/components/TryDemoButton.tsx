"use client";

import { useRouter } from "next/navigation";
import { SHOW_MARKETING_TRY_DEMO, startLocalDemoSession } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Variant = "primary" | "secondary" | "outline" | "link" | "header";

export default function TryDemoButton({
  variant = "secondary",
  className = "",
  children,
  label = "Try demo (no sign-in)",
}: {
  variant?: Variant;
  className?: string;
  children?: React.ReactNode;
  label?: string;
  loadingLabel?: string;
}) {
  const { login } = useAuth();
  const router = useRouter();

  if (!SHOW_MARKETING_TRY_DEMO) return null;

  const v =
    variant === "primary"
      ? "btn-primary"
      : variant === "secondary"
        ? "btn-secondary"
        : variant === "header"
          ? "btn-ghost text-sm sm:text-base px-2 sm:px-3 text-brand-800 font-medium border border-brand-200/80 bg-brand-50/50 h-9 sm:min-h-[2.5rem] inline-flex items-center justify-center gap-2"
        : variant === "outline"
          ? "w-full h-12 rounded-full border-2 border-brand-300 bg-white text-brand-800 font-semibold text-sm hover:bg-brand-50 transition"
          : "text-sm font-semibold text-brand-700 hover:text-brand-900 hover:underline";

  function run() {
    const u = startLocalDemoSession();
    login(u);
    router.push("/dashboard");
  }

  return (
    <button
      type="button"
      onClick={run}
      className={`${v} ${className}`.trim()}
    >
      {children ?? label}
    </button>
  );
}
