// Per-recipient routing page. The token in the URL is unique to one customer,
// so this surface should never be indexed.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How was your visit?",
  description: "Personalized review link for one customer — leave a public review or send private feedback.",
  robots: { index: false, follow: false, nocache: true },
};

export default function RoutingPublicLayout({ children }: { children: React.ReactNode }) {
  return children;
}
