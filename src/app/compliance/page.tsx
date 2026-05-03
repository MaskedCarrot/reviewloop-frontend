import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import LegalShell, { type LegalSection } from "@/components/marketing/LegalShell";
import { getPublicConfig } from "@/lib/api/goodwordApi";

export const metadata = {
  title: "Compliance · GoodWord",
  description:
    "How GoodWord helps you stay on the right side of GDPR, CAN-SPAM, CASL, and SMS rules — including consent, opt-out, and data export.",
  robots: { index: true, follow: true },
};

export default async function CompliancePage() {
  const config = await getPublicConfig().catch(() => null);
  const showSms = config?.sms_public_preview === true;

  const sections: LegalSection[] = [
    {
      id: "no-review-gating",
      title: "No review gating",
      body: (
        <>
          <p>
            Google&apos;s review policies forbid <em>review gating</em> — the practice of selectively
            asking only happy customers to leave public reviews. GoodWord is built so this is
            impossible:
          </p>
          <ul>
            <li>Every routing page shows the public Google review CTA prominently.</li>
            <li>The internal feedback form is presented as a sibling, not as a gate. A customer can always reach Google in one tap.</li>
            <li>We log this in event analytics so you can prove compliance.</li>
          </ul>
        </>
      ),
    },
    {
      id: "consent-capture",
      title: "Consent capture",
      body: (
        <ul>
          <li>The dashboard asks you to attest that each customer (or every row in a CSV) consented to receive a follow-up.</li>
          <li>Webhook payloads must include <code>&quot;consent&quot;: true</code> — we reject events that don&apos;t.</li>
          <li>Public QR opt-ins are explicitly opt-in; the customer ticks the consent box on a form addressed to your business.</li>
        </ul>
      ),
    },
    {
      id: "unsubscribe",
      title: "Unsubscribe handling",
      body: (
        <ul>
          <li>Every email includes a one-click unsubscribe link.</li>
          {showSms && (
            <li>Replying STOP, UNSUBSCRIBE, CANCEL, QUIT, or END to an SMS unsubscribes that phone immediately and cancels any pending sends.</li>
          )}
          <li>Unsubscribes are permanent unless the customer explicitly opts back in.</li>
        </ul>
      ),
    },
    {
      id: "quiet-hours",
      title: "Quiet hours",
      body: (
        <p>
          We never send between your configured quiet hours, computed in your business&apos;s
          local timezone. Defaults are 21:00 → 09:00.
        </p>
      ),
    },
    ...(showSms
      ? [
          {
            id: "sms-scope",
            title: "SMS regulatory scope",
            body: (
              <p>
                We currently operate using <strong>Alphanumeric Sender IDs in non-US/Canada countries</strong> only.
                US A2P 10DLC and Canadian short-code support are explicitly out of scope for v1
                to keep our pricing accessible to small businesses.
              </p>
            ),
          },
        ]
      : []),
    {
      id: "data-retention",
      title: "Data retention",
      body: (
        <p>
          Contact data is kept until you delete it. Routing events are kept for 365 days for
          analytics. On account deletion all your business data and credits ledger are removed
          permanently.
        </p>
      ),
    },
  ];

  return (
    <div className="marketing-root" id="top">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 right-[-15%] h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-warm-200/45 via-warm-100/25 to-transparent blur-3xl" />
      </div>
      <MarketingHeader />
      <LegalShell title="Compliance & policies" lastUpdated="April 2026" sections={sections} />
      <MarketingFooter />
    </div>
  );
}
