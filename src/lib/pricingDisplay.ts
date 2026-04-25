export const CREDIT_RATES = { email: 1, sms: 5 } as const;

export const PRO_PLAN = {
  priceUsd: 7,
  credits: 200,
} as const;

export const TOPUP_PACKS = [
  { credits: 500, priceUsd: 5 },
  { credits: 2_000, priceUsd: 15 },
  { credits: 5_000, priceUsd: 30 },
] as const;

export function upToReviewEmails(credits: number): number {
  if (credits <= 0) return 0;
  return Math.floor(credits / CREDIT_RATES.email);
}

export function upToSms(credits: number): number {
  if (credits <= 0) return 0;
  return Math.floor(credits / CREDIT_RATES.sms);
}

export function usd(n: number): string {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}
