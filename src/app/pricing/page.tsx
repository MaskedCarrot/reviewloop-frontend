import { getPublicConfig, getPublicMembershipPreview, getPublicSendRatesByCountry } from "@/lib/api/goodwordApi";
import { CREDIT_RATES } from "@/lib/pricingDisplay";
import { getVisitorCountryCodeFromHeaders } from "@/lib/visitorCountry";
import PricingView from "./PricingView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pricing · GoodWord",
  description:
    "Free to start, $10/mo for Pro with 200 credits. Top-up packs from $10 (100 credits) up to $140 (2000 credits). No subscription required to send your first review request.",
  robots: { index: true, follow: true },
};

function countryFromQuery(raw: string | string[] | undefined): string | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const o = (v || "").trim().toUpperCase();
  if (o.length === 2 && /^[A-Z]{2}$/.test(o)) return o;
  return null;
}

type SearchParams = Promise<{ country?: string | string[] }>;

export default async function PricingPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const fromQuery = countryFromQuery(sp?.country);
  const fromHeaders = await getVisitorCountryCodeFromHeaders();
  const visitorCountry = fromQuery ?? fromHeaders;

  const [config, sendRates, membership] = await Promise.all([
    getPublicConfig().catch(() => null),
    getPublicSendRatesByCountry().catch(() => null),
    getPublicMembershipPreview(visitorCountry).catch(() => null),
  ]);

  const showSms = config?.sms_public_preview === true;
  const defEmail = config?.email_credits ?? CREDIT_RATES.email;
  // When SMS is hidden in public preview, the API returns sms_credits=null. Fall back
  // to a sane number purely so we can pass a defined prop down — the view ignores it
  // anyway when ``showSms`` is false.
  const defSms = config?.sms_credits ?? CREDIT_RATES.sms;

  let marketName: string | null = null;
  let emailPerSend = defEmail;
  let smsPerSeg = defSms;
  if (visitorCountry && sendRates?.countries?.length) {
    const row = sendRates.countries.find((c) => c.country_code === visitorCountry);
    if (row) {
      marketName = row.name;
      emailPerSend = row.email_credits;
      smsPerSeg = row.sms_credits_per_segment;
    }
  }

  const usedFallback = !sendRates && !membership;

  return (
    <PricingView
      visitorCountry={visitorCountry}
      marketName={marketName}
      emailPerSend={emailPerSend}
      smsPerSegment={smsPerSeg}
      showSms={showSms}
      sendRates={sendRates}
      membership={membership}
      usedFallback={usedFallback}
    />
  );
}
