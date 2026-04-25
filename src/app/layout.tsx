import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import GoogleProvider from "@/components/GoogleProvider";
import { AppProviders } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ReviewLoop — Frictionless Google reviews for small businesses",
  description: "Automate Google review requests by SMS and email. No spam, no review gating, just more 5-star reviews.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
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
