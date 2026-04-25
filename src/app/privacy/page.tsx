import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata = { title: "Privacy · ReviewLoop" };

export default function PrivacyPage() {
  return (
    <div className="marketing-root">
      <MarketingHeader />
      <main className="flex-1 marketing-section py-10 sm:py-12">
        <article className="max-w-3xl mx-auto card p-6 sm:p-9 shadow-soft">
          <Link href="/" className="text-sm text-brand-600 font-medium hover:underline">
            ← Home
          </Link>
          <h1 className="app-title mt-4">Privacy policy</h1>
          <p className="app-subtitle mt-1">Last updated: April 2026</p>

          <div className="legal-doc">
            <h2>What we collect</h2>
            <ul>
              <li>
                <strong>Business owner data:</strong> Google sign-in email/name, business name, Google Business Profile review URL, country, timezone, message templates, and credit-balance metadata.
              </li>
              <li>
                <strong>Customer contact data:</strong> Names, emails, and phone numbers you (or your integrations) upload, along with the source of that data and whether the customer opted out.
              </li>
              <li>
                <strong>Usage telemetry:</strong> When customers open a review-routing link we log the event, an IP hash, and the user-agent so you can see funnel performance.
              </li>
            </ul>

            <h2>How we use it</h2>
            <ul>
              <li>To send the review-request emails and SMS messages you schedule.</li>
              <li>To show you analytics about how many customers opened, clicked, or replied.</li>
              <li>To bill you correctly for credits used (we never share contact data with anyone else).</li>
            </ul>

            <h2>Sub-processors</h2>
            <ul>
              <li>
                <strong>Supabase</strong> — primary data storage.
              </li>
              <li>
                <strong>Polar.sh</strong> — billing, subscriptions, and one-off top-ups.
              </li>
              <li>
                <strong>Twilio</strong> — SMS delivery (only when you choose the SMS channel).
              </li>
              <li>
                <strong>Vercel / Fly.io</strong> — hosting.
              </li>
              <li>
                <strong>SMTP provider (e.g. Resend)</strong> — email delivery.
              </li>
            </ul>

            <h2>Your rights (GDPR / UK GDPR)</h2>
            <p>From your dashboard you can:</p>
            <ul>
              <li>Export every record we hold for your business.</li>
              <li>Permanently delete your business and all associated data.</li>
            </ul>
            <p>Customers who receive your messages can opt out at any time using the unsubscribe link (email) or by replying STOP (SMS).</p>

            <h2>Contact</h2>
            <p>
              Email{" "}
              <a href="mailto:support-reviewloop@maskedcarrotlabs.com">support-reviewloop@maskedcarrotlabs.com</a> and we will respond
              within 5 working days.
            </p>
          </div>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
