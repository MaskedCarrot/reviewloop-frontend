import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import GoogleProvider from "@/components/GoogleProvider";
import { AppProviders } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

// Display serif for marketing hero titles and oversized callouts.
// Variable axis tuned for warm, slightly editorial feel without going retro.
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "GoodWord — Turn happy visits into Google reviews",
    template: "%s · GoodWord",
  },
  description:
    "GoodWord turns happy visits into Google reviews. Send a friendly request after the visit, route customers to your review page in one tap, and keep unhappy feedback private.",
  applicationName: "GoodWord",
  authors: [{ name: "Masked Carrot Labs" }],
  creator: "Masked Carrot Labs",
  publisher: "Masked Carrot Labs",
  // icon.svg + apple-icon.tsx in this folder are auto-discovered; we still
  // declare them explicitly so server-rendered <head> always wins over any
  // bundler quirks.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "GoodWord",
    title: "GoodWord — Turn happy visits into Google reviews",
    description:
      "Turn happy visits into Google reviews. One friendly request. One tap. Unhappy feedback stays private.",
  },
  twitter: {
    card: "summary",
    title: "GoodWord",
    description:
      "Turn happy visits into Google reviews. One friendly request. One tap.",
  },
};

export const viewport = {
  themeColor: "#e57224",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className={`min-h-screen ${inter.className}`}>
        <GoogleProvider>
          <AppProviders>
            <AuthProvider>{children}</AuthProvider>
          </AppProviders>
        </GoogleProvider>
      </body>
    </html>
  );
}
