import { getPublicConfig, getPublicMembershipPreview, getPublicSendRatesByCountry } from "@/lib/api/reviewloopApi";
import { CREDIT_RATES } from "@/lib/pricingDisplay";
import { getVisitorCountryCodeFromHeaders } from "@/lib/visitorCountry";
import PricingView from "./PricingView";

export const dynamic = "force-dynamic";

function countryFromQuery(raw: string | string[] | undefined): string | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const o = (v || "").trim().toUpperCase();
  if (o.length === 2 && /^[A-Z]{2}$/.test(o)) return o;
  return null;
}

type SearchParams = { country?: string | string[] };

export default async function PricingPage({ searchParams }: { searchParams: SearchParams }) {
  const fromQuery = countryFromQuery(searchParams?.country);
  const fromHeaders = await getVisitorCountryCodeFromHeaders();
  const visitorCountry = fromQuery ?? fromHeaders;

  const [config, sendRates, membership] = await Promise.all([
    getPublicConfig().catch(() => null),
    getPublicSendRatesByCountry().catch(() => null),
    getPublicMembershipPreview(visitorCountry).catch(() => null),
  ]);

  const defEmail = config?.email_credits ?? CREDIT_RATES.email;
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
      sendRates={sendRates}
      membership={membership}
      usedFallback={usedFallback}
    />
  );
}
