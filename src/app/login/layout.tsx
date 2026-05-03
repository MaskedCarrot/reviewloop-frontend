// Server-side layout wrapper that exists solely to give the (client) login
// page real <title>/<meta description> values. Without this, Next falls back
// to the root layout's defaults, which marketing crawlers don't love.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in · GoodWord",
  description:
    "Sign in to GoodWord to send review requests, manage campaigns, and watch your private feedback inbox.",
  // Keep it indexable so users searching "GoodWord login" land here, but
  // don't have crawlers follow into the dashboard.
  robots: { index: true, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
