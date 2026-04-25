import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata = { title: "Terms · ReviewLoop" };

export default function TermsPage() {
  return (
    <div className="marketing-root">
      <MarketingHeader />
      <main className="flex-1 marketing-section py-10 sm:py-12">
        <article className="max-w-3xl mx-auto card p-6 sm:p-9 shadow-soft">
          <Link href="/" className="text-sm text-brand-600 font-medium hover:underline">
            ← Home
          </Link>
          <h1 className="app-title mt-4">Terms of service</h1>
          <p className="app-subtitle mt-1">Last updated: April 2026</p>

          <div className="legal-doc">
            <h2>The deal</h2>
            <p>ReviewLoop is operated by MaskedCarrot Labs (&quot;we&quot;, &quot;us&quot;). By creating an account you agree to use the service responsibly and to comply with the rules below.</p>

            <h2>Your responsibilities</h2>
            <ul>
              <li>You will only upload contact information for customers who have agreed to receive a review request from you.</li>
              <li>You will honour every unsubscribe request immediately (we automate this on your behalf).</li>
              <li>You will not use ReviewLoop to incentivise reviews, intercept negative feedback before customers can reach Google, or otherwise breach Google&apos;s review policies.</li>
              <li>You will not use the service to send spam, marketing offers, or any non-review-related messaging.</li>
            </ul>

            <h2>Billing</h2>
            <p>
              Subscriptions and top-ups are processed by <a href="https://polar.sh">Polar.sh</a>. Sends are paused automatically when your credit
              balance reaches zero. Refunds are evaluated case-by-case for genuine service failures.
            </p>

            <h2>Service availability</h2>
            <p>
              We aim for 99% uptime but do not guarantee it. Scheduled maintenance and provider outages may occur. We will not be liable for
              revenue lost while the service is unavailable.
            </p>

            <h2>Termination</h2>
            <p>
              You can delete your account from Settings at any time. We may suspend accounts that breach these terms, especially where consent
              has not been obtained.
            </p>

            <h2>Contact</h2>
            <p>
              Email <a href="mailto:support-reviewloop@maskedcarrotlabs.com">support-reviewloop@maskedcarrotlabs.com</a> for any questions.
            </p>
          </div>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
