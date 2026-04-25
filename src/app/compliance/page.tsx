import Link from "next/link";
import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata = { title: "Compliance · ReviewLoop" };

export default function CompliancePage() {
  return (
    <div className="marketing-root">
      <MarketingHeader />
      <main className="flex-1 marketing-section py-10 sm:py-12">
        <article className="max-w-3xl mx-auto card p-6 sm:p-9 shadow-soft">
          <Link href="/" className="text-sm text-brand-600 font-medium hover:underline">
            ← Home
          </Link>
          <h1 className="app-title mt-4">Compliance & policies</h1>
          <p className="app-subtitle mt-1">Last updated: April 2026</p>

          <div className="legal-doc">
            <h2>No review gating</h2>
            <p>
              Google&apos;s review policies forbid <em>review gating</em> — the practice of selectively asking only happy customers to leave
              public reviews. ReviewLoop is built so this is impossible:
            </p>
            <ul>
              <li>Every routing page shows the public Google review CTA prominently.</li>
              <li>The internal feedback form is presented as a sibling, not as a gate. A customer can always reach Google in one tap.</li>
              <li>We log this in event analytics so you can prove compliance.</li>
            </ul>

            <h2>Consent capture</h2>
            <ul>
              <li>The dashboard asks you to attest that each customer (or every row in a CSV) consented to receive a follow-up.</li>
              <li>Webhook payloads must include <code>&quot;consent&quot;: true</code> — we reject events that don&apos;t.</li>
              <li>Public QR opt-ins are explicitly opt-in; the customer ticks the consent box on a form addressed to your business.</li>
            </ul>

            <h2>Unsubscribe handling</h2>
            <ul>
              <li>Every email includes a one-click unsubscribe link.</li>
              <li>Replying STOP, UNSUBSCRIBE, CANCEL, QUIT, or END to an SMS unsubscribes that phone immediately and cancels any pending sends.</li>
              <li>Unsubscribes are permanent unless the customer explicitly replies START.</li>
            </ul>

            <h2>Quiet hours</h2>
            <p>We never send between your configured quiet hours, computed in your business&apos;s local timezone. Defaults are 21:00 → 09:00.</p>

            <h2>SMS regulatory scope</h2>
            <p>
              We currently operate using <strong>Alphanumeric Sender IDs in non-US/Canada countries</strong> only. US A2P 10DLC and Canadian
              short-code support are explicitly out of scope for v1 to keep our pricing accessible to small businesses.
            </p>

            <h2>Data retention</h2>
            <p>
              Contact data is kept until you delete it. Routing events are kept for 365 days for analytics. On account deletion all your
              business data and credits ledger are removed permanently.
            </p>
          </div>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
