"use client";

import { ToastProvider } from "@/components/ToastProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
