/**
 * Pricing display constants used by the marketing pricing page and the
 * dashboard meters. These mirror the *server* truth (see
 * `shared-backend/modules/goodword/data/goodword_pricing.yaml` and
 * `shared-backend/modules/goodword/plans.py`). The server is authoritative —
 * these constants exist so we can render a sensible fallback before the
 * backend reply has loaded, not as a second source of truth.
 */

export const CREDIT_RATES = { email: 1, sms: 5 } as const;

/** Single Pro tier. Older builds shipped a `pro_500` variant — gone now.
 * `monthlyCredits` is the configurable monthly grant; default is 200 (the
 * server may report a different number — prefer `usage.pro_monthly_credits`
 * from the bootstrap when available). */
export const PRO_PLAN = {
  priceUsd: 10,
  monthlyCredits: 200,
} as const;

/**
 * Free-plan caps. Mirrors the env-driven defaults in `shared-backend/modules/goodword/config.py`.
 * Source of truth lives server-side; treat these as fallback display values.
 *
 * Polar will not let you create a $0 product, so Free is purely virtual on the
 * server (`pricing_config._free_tier`). There is no checkout / product id for it.
 */
export const FREE_PLAN = {
  /** Free has NO monthly grant — users must buy credits to send. */
  monthlyGrant: 0,
  /** Max credits a Free user may purchase per UTC calendar month. */
  monthlyPurchaseCap: 100,
  monthlyCampaigns: 5,
  locations: 1,
} as const;

/**
 * One-time top-up packs. Free users are subject to `monthlyPurchaseCap` per
 * UTC calendar month (only the 100-credit pack fits); Pro is unlimited.
 * Credits never expire and roll over. Keys mirror the server (pricing_config.py).
 */
export const TOPUP_PACKS = [
  { key: "topup_100", credits: 100, priceUsd: 10 },
  { key: "topup_200", credits: 200, priceUsd: 18 },
  { key: "topup_500", credits: 500, priceUsd: 40 },
  { key: "topup_2000", credits: 2_000, priceUsd: 140 },
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
