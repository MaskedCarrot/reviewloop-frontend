// Public per-business sign-up + private feedback page. The URL itself is
// shared on posters and QR codes, so it's reasonable for crawlers to discover
// it — but the page is just a single business's opt-in form, not content we
// want surfaced in search. Keep it noindex/nofollow.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leave feedback",
  description: "Quick rating and optional private feedback for this business.",
  robots: { index: false, follow: false },
};

export default function QrPublicLayout({ children }: { children: React.ReactNode }) {
  return children;
}
