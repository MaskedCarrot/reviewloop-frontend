import MarketingHeader from "@/components/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import LegalShell, { type LegalSection } from "@/components/marketing/LegalShell";

export const metadata = {
  title: "Terms · GoodWord",
  description:
    "The plain-English rules for using GoodWord: what we promise, what you agree to, billing, and how either side can walk away.",
  robots: { index: true, follow: true },
};

const SECTIONS: LegalSection[] = [
  {
    id: "the-deal",
    title: "The deal",
    body: (
      <p>
        GoodWord is operated by MaskedCarrot Labs (&quot;we&quot;, &quot;us&quot;). By creating an account
        you agree to use the service responsibly and to comply with the rules below.
      </p>
    ),
  },
  {
    id: "your-responsibilities",
    title: "Your responsibilities",
    body: (
      <ul>
        <li>You will only upload contact information for customers who have agreed to receive a review request from you.</li>
        <li>You will honour every unsubscribe request immediately (we automate this on your behalf).</li>
        <li>You will not use GoodWord to incentivise reviews, intercept negative feedback before customers can reach Google, or otherwise breach Google&apos;s review policies.</li>
        <li>You will not use the service to send spam, marketing offers, or any non-review-related messaging.</li>
      </ul>
    ),
  },
  {
    id: "billing",
    title: "Billing",
    body: (
      <p>
        Subscriptions and top-ups are processed by <a href="https://polar.sh">Polar.sh</a>. Sends
        are paused automatically when your credit balance reaches zero. Refunds are evaluated
        case-by-case for genuine service failures.
      </p>
    ),
  },
  {
    id: "service-availability",
    title: "Service availability",
    body: (
      <p>
        We aim for 99% uptime but do not guarantee it. Scheduled maintenance and provider
        outages may occur. We will not be liable for revenue lost while the service is
        unavailable.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    body: (
      <p>
        You can delete your account from Settings at any time. We may suspend accounts that
        breach these terms, especially where consent has not been obtained.
      </p>
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
        for any questions.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="marketing-root" id="top">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 right-[-15%] h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-warm-200/45 via-warm-100/25 to-transparent blur-3xl" />
      </div>
      <MarketingHeader />
      <LegalShell title="Terms of service" lastUpdated="April 2026" sections={SECTIONS} />
      <MarketingFooter />
    </div>
  );
}
