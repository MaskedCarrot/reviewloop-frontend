import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import LegalShell, { type LegalSection } from "@/components/marketing/LegalShell";
import { getPublicConfig } from "@/lib/api/goodwordApi";

export const metadata = {
  title: "Privacy · GoodWord",
  description:
    "How GoodWord collects, stores, and processes the data you and your customers entrust to us — and the choices you have over it.",
  robots: { index: true, follow: true },
};

export default async function PrivacyPage() {
  const config = await getPublicConfig().catch(() => null);
  const showSms = config?.sms_public_preview === true;

  const sections: LegalSection[] = [
    {
      id: "what-we-collect",
      title: "What we collect",
      body: (
        <ul>
          <li>
            <strong>Business owner data:</strong> Google sign-in email/name, business name,
            Google Business Profile review URL, country, timezone, message templates, and
            credit-balance metadata.
          </li>
          <li>
            <strong>Customer contact data:</strong> Names, emails, and phone numbers you (or
            your integrations) upload, along with the source of that data and whether the
            customer opted out.
          </li>
          <li>
            <strong>Usage telemetry:</strong> When customers open a review-routing link we log
            the event, an IP hash, and the user-agent so you can see funnel performance.
          </li>
        </ul>
      ),
    },
    {
      id: "how-we-use-it",
      title: "How we use it",
      body: (
        <ul>
          <li>To send the review-request {showSms ? "emails and SMS messages" : "emails"} you schedule.</li>
          <li>To show you analytics about how many customers opened, clicked, or replied.</li>
          <li>To bill you correctly for credits used (we never share contact data with anyone else).</li>
        </ul>
      ),
    },
    {
      id: "sub-processors",
      title: "Sub-processors",
      body: (
        <ul>
          <li><strong>Supabase</strong> — primary data storage.</li>
          <li><strong>Polar.sh</strong> — billing, subscriptions, and one-off top-ups.</li>
          {showSms && (
            <li><strong>Twilio</strong> — SMS delivery (only when you choose the SMS channel).</li>
          )}
          <li><strong>Vercel / Fly.io</strong> — hosting.</li>
          <li><strong>SendGrid / SMTP provider</strong> — email delivery.</li>
        </ul>
      ),
    },
    {
      id: "your-rights",
      title: "Your rights (GDPR & equivalents)",
      body: (
        <>
          <p>From your dashboard you can:</p>
          <ul>
            <li>Export every record we hold for your business.</li>
            <li>Permanently delete your business and all associated data.</li>
          </ul>
          <p>
            Customers who receive your messages can opt out at any time using the
            unsubscribe link
            {showSms ? " (email) or by replying STOP (SMS)" : " in every email"}.
          </p>
        </>
      ),
    },
    {
      id: "contact",
      title: "Contact",
      body: (
        <p>
          Email{" "}
          <a href="mailto:support-goodword@maskedcarrotlabs.com">
            support-goodword@maskedcarrotlabs.com
          </a>{" "}
          and we will respond within 5 working days.
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
      <LegalShell title="Privacy policy" lastUpdated="April 2026" sections={sections} />
      <MarketingFooter />
    </div>
  );
}
