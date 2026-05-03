export interface User {
  id: string;
  email: string;
  name: string | null;
  picture_url: string | null;
}

export interface Business {
  id: string;
  user_id: string;
  name: string;
  country_code: string;
  timezone: string;
  from_name: string;
  from_email: string | null;
  sms_sender_id: string | null;
  branding_color: string;
  /** True for dev / Try demo workspace: UI shows sample data, sends are not delivered externally. */
  is_sandbox?: boolean;
  /** Admin-controlled gate. When false, every SMS UI is hidden and SMS sends are blocked. */
  sms_enabled?: boolean;
  /** When true, sends scheduled inside [quiet_hours_start, quiet_hours_end) (in business tz)
   *  are deferred to the moment the window closes. */
  quiet_hours_enabled?: boolean;
  /** "HH:MM" 24h, business-local. Inclusive start of the no-send window. */
  quiet_hours_start?: string | null;
  /** "HH:MM" 24h, business-local. Exclusive end of the no-send window. May wrap past midnight. */
  quiet_hours_end?: string | null;
  onboarding_completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  business_id: string;
  name: string | null;
  email: string | null;
  phone_e164: string | null;
  review_token?: string;
  source: "manual" | "csv" | "qr" | "webhook";
  consent_attested_at: string | null;
  unsubscribed_at: string | null;
  last_message_at: string | null;
  external_ref: string | null;
  created_at: string;
  location_id?: string | null;
}

export interface BulkSendResult {
  scheduled: number;
  failed: { contact_id: string; error: string }[];
}

/** Message template used in campaigns and standalone sends. */
export interface Template {
  id: string;
  business_id: string;
  name: string;
  channel: "email" | "sms";
  subject: string | null;
  body: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/** Campaign step links a template to a campaign at a specific delay. */
export interface CampaignStep {
  id: string;
  campaign_id: string;
  step_index: number;
  template_id: string;
  delay_minutes: number;
  /** Joined template details when loaded via GET /campaigns/{id}. */
  goodword_templates?: Pick<Template, "id" | "name" | "channel" | "subject"> | null;
}

export interface CampaignProgress {
  total_steps: number;
  total_recipients: number;
  active_recipients: number;
  completed_recipients: number;
  /** Seconds the campaign has been actively running (excludes paused time). */
  active_seconds: number;
  /** ISO datetime of the next scheduled message send, if any. */
  next_scheduled_at: string | null;
}

export type CampaignStatus = "scheduled" | "running" | "paused" | "finished";

export interface Campaign {
  id: string;
  business_id: string;
  location_id?: string | null;
  name: string;
  status: CampaignStatus;
  scheduled_at?: string | null;
  started_at?: string | null;
  paused_at?: string | null;
  finished_at?: string | null;
  total_paused_seconds: number;
  /** Computed by backend on list/get. */
  active_seconds?: number;
  step_count?: number;
  recipient_count?: number;
  steps?: CampaignStep[];
  progress?: CampaignProgress;
  created_at: string;
  updated_at: string;
}

export interface CampaignRecipient {
  recipient_id: string;
  contact: { id: string; name: string | null; email: string | null; phone_e164: string | null };
  status: "pending" | "active" | "completed" | "stopped" | string;
  current_step: number;
  step_count: number;
  enrolled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  next_scheduled: { send_at: string; step_index: number } | null;
}

export interface CampaignStats {
  campaign_id: string;
  status: CampaignStatus;
  total_steps: number;
  total_recipients: number;
  active_recipients: number;
  completed_recipients: number;
  active_seconds: number;
  next_scheduled_at: string | null;
  messages_sent: number;
  messages_scheduled: number;
}

export interface ScheduledMessage {
  id: string;
  business_id: string;
  contact_id: string;
  template_id: string | null;
  campaign_id: string | null;
  campaign_step_index: number | null;
  channel: "email" | "sms";
  send_at: string;
  status: "scheduled" | "paused" | "sending" | "sent" | "failed" | "cancelled";
  provider_id: string | null;
  error_detail: string | null;
  cost_credits: number;
  sent_at: string | null;
  created_at: string;
  location_id?: string | null;
  /** Joined by the list messages endpoint — not stored on the message row itself. */
  routing_token?: string | null;
}

export interface CreditLedgerEntry {
  delta: number;
  reason: string;
  ref_id: string | null;
  balance_after: number;
  created_at: string;
}

export interface CreditState {
  balance: number;
  low_balance_threshold: number;
  auto_topup_enabled: boolean;
  low_balance_notified_at: string | null;
  ledger: CreditLedgerEntry[];
}

export interface FeedbackEntry {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
  contact_id?: string | null;
}

/** Per-store breakdown in dashboard stats. */
export interface StorePerformanceRow {
  location_id: string;
  name: string;
  messages_total: number;
  sends: number;
  credits_used: number;
  view: number;
  click_platform: number;
  submit_feedback: number;
}

export interface DashboardStats {
  window_days: number;
  messages_total: number;
  messages_by_status: Record<string, number>;
  messages_by_channel: Record<string, number>;
  messages_by_channel_sent: Record<string, number>;
  credits_used: number;
  funnel: {
    sent: number;
    view: number;
    click_platform: number;
    submit_feedback: number;
  };
  clicks_by_platform?: Record<string, number>;
  rating_distribution: Record<string, number>;
  store_performance?: StorePerformanceRow[];
  multi_location?: boolean;
}

export interface WebhookKeyRecord {
  id: string;
  key_prefix: string;
  label: string;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

export interface PublicConfig {
  country_allowlist: string[];
  sms_supported_countries?: string[];
  email_credits: number;
  /** Null when the public-preview gate is off (SMS feature hidden on marketing pages). */
  sms_credits: number | null;
  /** When false, marketing pages must hide every SMS reference (price, copy, CTA). */
  sms_public_preview?: boolean;
  credit_rate_notes?: string | null;
  review_platforms?: ReviewPlatformInfo[];
  /** Country → primary IANA timezone hint for the onboarding timezone dropdown. */
  timezone_hints?: Record<string, string>;
}

/** Server-resolved send costs for the current workspace. */
export interface MyCreditRates {
  country_code: string | null;
  email_credits: number;
  sms_credits_per_segment: number;
  source: "country" | "default" | "env_fallback";
  notes: string | null;
}

/** Unauthenticated: full send-rate table from GET /config/send-rates */
export interface PublicSendRateCountry {
  country_code: string;
  name: string;
  email_credits: number;
  sms_credits_per_segment: number;
  source: "country" | "default" | "env_fallback";
}

export interface PublicSendRatesResponse {
  send_rate_notes: string | null;
  countries: PublicSendRateCountry[];
}

/** GET /contacts/ingest-presets — quick filter dates in business IANA zone */
export interface IngestPresets {
  timezone: string;
  today: string;
  yesterday: string;
  last7_from: string;
  last7_to: string;
}

/** GET /me/bootstrap — one round-trip for initial dashboard / settings. */
export interface SessionBootstrap {
  business: Business | null;
  config: PublicConfig;
  credits: CreditState;
  locations: { locations: BusinessLocation[]; default_location_id: string | null };
  ingest_presets: IngestPresets;
  /** IANA name for display; matches business profile timezone. */
  display_timezone: string;
  /** Server-resolved send costs for the current business; null before a business is created. */
  credit_rates: MyCreditRates | null;
  /** Plan + monthly usage meters. Backend always returns this; null fields under
   * `limits` mean unlimited (Pro plan). */
  usage: PlanUsage;
}

/**
 * Server-side resolution of the user's tier + their current usage against the
 * Free-plan caps. Pro users see all `limits.*` as `null` (unlimited).
 *
 * The frontend should treat this as the authoritative source for "can the
 * user create another campaign / location / send another email" — never
 * compute it from `credits.balance` alone. The server enforces the caps too,
 * so attempting an action when locked will surface a clean 402 with copy.
 */
export interface PlanUsage {
  plan: "free" | "pro" | string;
  limits: {
    /** Max campaigns the user may CREATE in the current UTC month. */
    campaigns_per_month: number | null;
    /** Max stores / locations on the business. */
    locations: number | null;
    /** Max credits the user may PURCHASE in the current UTC month (Free only).
     * Pro is unlimited (`null`). Spend is never capped. */
    credits_purchase_per_month: number | null;
  };
  used: {
    campaigns_this_month: number;
    locations_total: number;
    credits_purchased_this_month: number;
  };
  /** Pro monthly grant that lands on every renewal (server-configured via
   * GOODWORD_PRO_MONTHLY_CREDITS). Surfaces in the pricing card. */
  pro_monthly_credits: number;
}

export interface ReviewPlatformInfo {
  id: string;
  label: string;
  description: string;
  link_source: string;
  sort: number;
}

export interface ReviewDestination {
  id: string;
  label: string;
  url: string;
}

export interface BusinessLocation {
  id: string;
  business_id: string;
  name: string;
  address?: string | null;
  sort_index?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  platform_links: Record<string, string>;
}

export interface MembershipOffer {
  key: string;
  display_name: string;
  display_price: string;
  monthly_credits: number;
  /** False until Polar product id is set in pricing YAML. */
  polar_configured: boolean;
}

export interface MembershipOffers {
  country_code: string | null;
  tiers: MembershipOffer[];
  notes: string | null;
}

export interface RoutingBusinessInfo {
  id: string;
  name: string;
  from_name: string | null;
  branding_color: string;
  review_destinations?: ReviewDestination[];
  /** Set when the page is scoped to a store (`/q/…?l=`). */
  location_id?: string | null;
}
