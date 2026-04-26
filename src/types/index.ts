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
  gmb_review_url: string;
  country_code: string;
  timezone: string;
  default_send_delay_minutes: number;
  quiet_hours_start: number;
  quiet_hours_end: number;
  from_name: string;
  from_email: string | null;
  sms_sender_id: string | null;
  branding_color: string;
  /** True for dev / Try demo workspace: UI shows sample data, sends are not delivered externally. */
  is_sandbox?: boolean;
  onboarding_completed_at?: string | null;
  created_at: string;
  updated_at: string;
  default_location_id?: string | null;
}

export interface Contact {
  id: string;
  business_id: string;
  name: string | null;
  email: string | null;
  phone_e164: string | null;
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

export interface Campaign {
  id: string;
  business_id: string;
  name: string;
  channel: "email" | "sms";
  template_subject: string | null;
  template_body: string;
  delay_minutes: number;
  is_default: boolean;
  /** When set, sends with this template use that store's public review links; otherwise the contact or default store applies. */
  location_id?: string | null;
  created_at: string;
  updated_at: string;
}

/** Multi-step follow-up; each step reuses a Campaign (template) row. */
export type ReviewSequenceLinkStyle = "hosted" | "direct_google" | "direct_yelp";

export type ReviewSequenceListStatus = "running" | "paused" | "completed";

export interface ReviewSequence {
  id: string;
  name: string;
  is_active: boolean;
  step_count: number;
  active_enrollments: number;
  list_status?: ReviewSequenceListStatus;
  /** If set, all steps use this store's review URLs; overrides template/people defaults. */
  location_id?: string | null;
  /** How `{link}` is built; use `{link_google}` / `{link_yelp}` for other tracked one-tap options. */
  review_link_style?: ReviewSequenceLinkStyle;
  created_at: string;
  updated_at: string;
}

export type ListSequencesResponse = {
  sequences: ReviewSequence[];
  total: number;
  page: number;
  page_size: number;
};

export interface ReviewSequenceStep {
  id: string;
  sequence_id: string;
  step_index: number;
  campaign_id: string;
  delay_after_previous_minutes: number;
  campaign?: Pick<Campaign, "id" | "name" | "channel" | "template_subject" | "delay_minutes"> | null;
  created_at?: string;
}

/** Aggregated metrics for a follow-up sequence (from GET /sequences/{id}/stats). */
export interface ReviewSequenceStats {
  sequence_id: string;
  step_count: number;
  enrollments: {
    active: number;
    completed: number;
    stopped_replied: number;
    cancelled: number;
    total: number;
  };
  messages_sent: number;
  /** Total sequence-step messages that have been sent (equals messages_sent for sequence traffic). */
  step_sends_count?: number;
  /** People who received every step (all steps done for this run). */
  finished_all_steps_count?: number;
  /** Messages still scheduled (will send even if the campaign is stopped). */
  scheduled_messages_pending?: number;
}

/** One person in a follow-up (from GET /sequences/{id}/enrollments). */
export interface ReviewSequenceEnrollment {
  enrollment_id: string;
  contact: { id: string; name: string; email: string | null; phone_e164: string | null };
  status: "active" | "completed" | "stopped_replied" | "cancelled" | string;
  created_at: string;
  updated_at: string;
  step_count: number;
  last_sent_step_index: number | null;
  messages_sent: number;
  next_scheduled: { send_at: string; step_index: number } | null;
}

export interface ScheduledMessage {
  id: string;
  business_id: string;
  contact_id: string;
  campaign_id: string | null;
  channel: "email" | "sms";
  send_at: string;
  status: "scheduled" | "sending" | "sent" | "failed" | "skipped" | "cancelled";
  provider_id: string | null;
  error: string | null;
  cost_credits: number;
  sent_at: string | null;
  created_at: string;
  /** When set, routing/review links use this store's destinations. */
  location_id?: string | null;
  /** Public review page token — small ref; no body stored. The customer page is the same as what we sent. */
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
}

/** When present, the business has more than one store/location. Message rows with no `location_id` are "Unassigned", not the default. */
export interface StorePerformanceRow {
  location_id: string;
  name: string;
  /** Message rows in the window (any status) attributed to this store. */
  messages_total: number;
  sends: number;
  credits_used: number;
  view: number;
  click_google: number;
  click_outbound: number;
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
    click_google: number;
    click_outbound: number;
    submit_feedback: number;
  };
  /** e.g. { yelp: 3 } for third-party review links */
  outbound_clicks_by_platform?: Record<string, number>;
  rating_distribution: Record<string, number>;
  /** Omitted on older APIs; one row per store (plus unassigned) when the business has locations. */
  store_performance?: StorePerformanceRow[];
  /** True if two or more locations exist; affects attribution of rows without `location_id`. */
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
  /** List of countries where SMS is available (alphanumeric sender, etc.) */
  country_allowlist: string[];
  sms_supported_countries?: string[];
  /** Default from server rate table (unauthenticated; use getMyCreditRates for your business). */
  email_credits: number;
  /** Default credits per SMS segment (same as sms_credits_per_segment on /me/credit-rates). */
  sms_credits: number;
  /** Optional blurb from the host's rate file (e.g. how segments work). */
  credit_rate_notes?: string | null;
  review_platforms?: ReviewPlatformInfo[];
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
  gmb_review_url: string;
  sort_index: number;
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
  gmb_review_url: string;
  branding_color: string;
  review_destinations?: ReviewDestination[];
  /** Set when the page is scoped to a store (`/q/…?l=`); review buttons use that store's links. */
  location_id?: string | null;
}
