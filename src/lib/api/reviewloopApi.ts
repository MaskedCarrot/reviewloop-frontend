import type {
  Business,
  Campaign,
  ListSequencesResponse,
  ReviewSequence,
  ReviewSequenceEnrollment,
  ReviewSequenceLinkStyle,
  ReviewSequenceStats,
  ReviewSequenceStep,
  BulkSendResult,
  BusinessLocation,
  Contact,
  CreditLedgerEntry,
  CreditState,
  DashboardStats,
  FeedbackEntry,
  IngestPresets,
  MembershipOffers,
  MyCreditRates,
  PublicConfig,
  PublicSendRatesResponse,
  RoutingBusinessInfo,
  ScheduledMessage,
  SessionBootstrap,
  User,
  WebhookKeyRecord,
} from "@/types";
import { LOCAL_DEMO_FLAG } from "@/lib/testMode/ids";
import { runTestModeCsvUpload } from "@/lib/testMode/dispatch";
import { getTestModeQrPngBlob, getTestModeQrSvgBlob } from "@/lib/testMode/qrImage";
import { API_BASE } from "./config";
import { request, useClientMockDispatch, authHeaderForUserId } from "./client";

export async function googleAuth(code: string) {
  return request<{ user: User }>(
    "/api/auth/google",
    {
      method: "POST",
      body: JSON.stringify({ code }),
    },
    { auth: false },
  );
}

export async function getUser(userId: string) {
  return request<User>(`/api/users/${userId}`);
}

export async function getPublicConfig() {
  return request<PublicConfig>("/api/reviewloop/config", {}, { auth: false });
}

export async function getPublicSendRatesByCountry() {
  return request<PublicSendRatesResponse>("/api/reviewloop/config/send-rates", {}, { auth: false });
}

/** Pro tiers + notes for a market (e.g. visitor `country` from IP). Unauthenticated. */
export async function getPublicMembershipPreview(countryCode: string | null) {
  const q =
    countryCode && /^[A-Za-z]{2}$/.test(countryCode) ? `?country=${encodeURIComponent(countryCode.toUpperCase())}` : "";
  return request<MembershipOffers>(`/api/reviewloop/config/membership-preview${q}`, {}, { auth: false });
}

export async function getMyCreditRates() {
  return request<MyCreditRates>("/api/reviewloop/me/credit-rates");
}

export async function getMembershipOffers() {
  return request<MembershipOffers>("/api/reviewloop/me/membership-offers");
}

export async function devBootstrapSession() {
  return request<{ user: User; seed?: { seeded?: boolean; error?: string } }>(
    "/api/reviewloop/dev/bootstrap",
    { method: "POST" },
    { auth: false },
  );
}

export async function getSessionBootstrap() {
  return request<SessionBootstrap>("/api/reviewloop/me/bootstrap");
}

export async function startServerSandboxSession(): Promise<User> {
  const r = await devBootstrapSession();
  if (!r.user?.id) {
    throw new Error(
      "Could not start sandbox. Run shared-backend with DEV=1 and a valid database, and point the app to the same API (NEXT_PUBLIC_API_URL).",
    );
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOCAL_DEMO_FLAG);
    localStorage.setItem("user_id", r.user.id);
  }
  return r.user;
}

export async function getMyBusiness() {
  return request<{ business: Business | null }>("/api/reviewloop/me/business");
}

export async function saveMyBusiness(payload: Partial<Business>) {
  return request<{ business: Business }>("/api/reviewloop/me/business", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listMyLocations() {
  return request<{ locations: BusinessLocation[]; default_location_id: string | null }>("/api/reviewloop/me/locations");
}

export async function createMyLocation(payload: {
  name: string;
  gmb_review_url?: string;
  platform_links?: Record<string, string>;
  sort_index?: number;
  is_default?: boolean;
}) {
  return request<{ location: BusinessLocation }>("/api/reviewloop/me/locations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function patchMyLocation(
  locationId: string,
  payload: {
    name?: string;
    gmb_review_url?: string;
    sort_index?: number;
    is_default?: boolean;
  },
) {
  return request<{ location: BusinessLocation }>(`/api/reviewloop/me/locations/${locationId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function putMyLocationPlatformLinks(locationId: string, links: Record<string, string>) {
  return request<{ location_id: string; platform_links: Record<string, string> }>(
    `/api/reviewloop/me/locations/${locationId}/platform-links`,
    { method: "PUT", body: JSON.stringify({ links }) },
  );
}

export async function deleteMyLocation(locationId: string) {
  return request<{ ok: boolean }>(`/api/reviewloop/me/locations/${locationId}`, { method: "DELETE" });
}

export type ListContactsParams = {
  /** Search name, email, or external ref (server-side) */
  q?: string;
  /**
   * Inclusive YYYY-MM-DD on ingestion time (`created_at`). Server interprets each day in the
   * business IANA timezone (from Settings), then queries in UTC.
   */
  createdFrom?: string;
  createdTo?: string;
  /** `unassigned` = no store on the contact; else a `BusinessLocation` id. */
  locationId?: string;
  page?: number;
  pageSize?: number;
};

export type ListContactsResult = {
  contacts: Contact[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
};

export async function getIngestPresets() {
  return request<IngestPresets>("/api/reviewloop/contacts/ingest-presets");
}

export async function listContacts(params: ListContactsParams = {}): Promise<ListContactsResult> {
  const p = new URLSearchParams();
  if (params.q) p.set("q", params.q);
  if (params.createdFrom) p.set("created_from", params.createdFrom);
  if (params.createdTo) p.set("created_to", params.createdTo);
  if (params.locationId) p.set("location_id", params.locationId);
  if (params.page != null) p.set("page", String(params.page));
  if (params.pageSize != null) p.set("page_size", String(params.pageSize));
  const qs = p.toString();
  return request<ListContactsResult>(`/api/reviewloop/contacts${qs ? `?${qs}` : ""}`);
}

/** Load contacts by id (e.g. for message logs) without loading the full paginated list. */
export async function lookupContactsByIds(ids: string[]) {
  return request<{ contacts: Contact[] }>("/api/reviewloop/contacts/lookup", {
    method: "POST",
    body: JSON.stringify({ ids: Array.from(new Set(ids)).filter(Boolean) }),
  });
}

export async function createContact(payload: {
  name?: string;
  email?: string;
  phone?: string;
  consent: boolean;
  external_ref?: string;
  send_now?: boolean;
  channel?: "email" | "sms";
  email_campaign_id?: string;
  sms_campaign_id?: string;
  location_id?: string | null;
}) {
  return request<{ contact: Contact; message: ScheduledMessage | null }>("/api/reviewloop/contacts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function unsubscribeContact(contactId: string) {
  return request<{ ok: boolean }>("/api/reviewloop/contacts/unsubscribe", {
    method: "POST",
    body: JSON.stringify({ contact_id: contactId }),
  });
}

export async function resubscribeContact(contactId: string) {
  return request<{ ok: boolean }>("/api/reviewloop/contacts/resubscribe", {
    method: "POST",
    body: JSON.stringify({ contact_id: contactId }),
  });
}

export async function sendContactReviewRequest(
  contactId: string,
  opts: { channel?: "email" | "sms"; campaignId?: string } = {},
) {
  const { channel, campaignId } = opts;
  return request<{ message: unknown }>(`/api/reviewloop/contacts/${contactId}/send`, {
    method: "POST",
    body: JSON.stringify({
      ...(channel ? { channel } : {}),
      ...(campaignId ? { campaign_id: campaignId } : {}),
    }),
  });
}

export async function bulkSendContactReviewRequests(payload: {
  contactIds: string[];
  channel?: "email" | "sms";
  emailCampaignId?: string;
  smsCampaignId?: string;
}) {
  return request<BulkSendResult>("/api/reviewloop/contacts/bulk-send", {
    method: "POST",
    body: JSON.stringify({
      contact_ids: payload.contactIds,
      ...(payload.channel ? { channel: payload.channel } : {}),
      ...(payload.emailCampaignId ? { email_campaign_id: payload.emailCampaignId } : {}),
      ...(payload.smsCampaignId ? { sms_campaign_id: payload.smsCampaignId } : {}),
    }),
  });
}

export async function deleteContact(contactId: string) {
  return request<{ ok: boolean }>(`/api/reviewloop/contacts/${contactId}`, { method: "DELETE" });
}

export async function uploadContactCsv(
  file: File,
  opts: {
    consent: boolean;
    channel: "auto" | "email" | "sms";
    enqueue: boolean;
    emailCampaignId?: string;
    smsCampaignId?: string;
    locationId?: string;
  },
) {
  if (useClientMockDispatch()) {
    return runTestModeCsvUpload(file, opts);
  }
  const userId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
  const form = new FormData();
  form.append("file", file);
  form.append("consent", String(opts.consent));
  form.append("channel", opts.channel);
  form.append("enqueue", String(opts.enqueue));
  if (opts.emailCampaignId) form.append("email_campaign_id", opts.emailCampaignId);
  if (opts.smsCampaignId) form.append("sms_campaign_id", opts.smsCampaignId);
  if (opts.locationId) form.append("location_id", opts.locationId);
  const res = await fetch(`${API_BASE}/api/reviewloop/contacts/csv-upload`, {
    method: "POST",
    headers: { ...(userId ? { "X-User-Id": userId } : {}) },
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail || `Upload failed (${res.status})`);
  }
  return res.json() as Promise<{ rows: number; imported: number; queued: number; errors: string[] }>;
}

export async function listCampaigns() {
  return request<{ campaigns: Campaign[] }>("/api/reviewloop/campaigns");
}

export type ListSequencesParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: "all" | "running" | "paused" | "completed";
  /** Inclusive calendar dates in the business IANA time zone; the server maps them to a UTC range for `created_at`. */
  from?: string;
  to?: string;
};

export async function listSequences(params?: ListSequencesParams): Promise<ListSequencesResponse> {
  const p = new URLSearchParams();
  if (params?.page != null) p.set("page", String(params.page));
  if (params?.pageSize != null) p.set("page_size", String(params.pageSize));
  if (params?.q && params.q.trim()) p.set("q", params.q.trim());
  if (params?.status) p.set("status", params.status);
  if (params?.from) p.set("from", params.from);
  if (params?.to) p.set("to", params.to);
  const qs = p.toString();
  return request<ListSequencesResponse>(`/api/reviewloop/sequences${qs ? `?${qs}` : ""}`);
}

export async function getSequenceStats(sequenceId: string) {
  return request<ReviewSequenceStats>(`/api/reviewloop/sequences/${sequenceId}/stats`);
}

export async function getSequenceEnrollments(sequenceId: string, limit = 200) {
  return request<{ enrollments: ReviewSequenceEnrollment[] }>(
    `/api/reviewloop/sequences/${sequenceId}/enrollments?limit=${encodeURIComponent(String(limit))}`,
  );
}

export async function stopSequenceEnrollment(sequenceId: string, enrollmentId: string) {
  return request<{ ok: boolean; stopped: boolean }>(
    `/api/reviewloop/sequences/${sequenceId}/enrollments/${enrollmentId}/stop`,
    { method: "POST" },
  );
}

export async function stopAllActiveInSequence(sequenceId: string) {
  return request<{ ok: boolean; stopped: number }>(
    `/api/reviewloop/sequences/${sequenceId}/stop-active`,
    { method: "POST" },
  );
}

/** Pause (UI): no new people and no new follow-up steps; already-scheduled messages still send. */
export async function stopSequenceCampaign(sequenceId: string) {
  return request<{ ok: boolean; is_active: boolean }>(
    `/api/reviewloop/sequences/${sequenceId}/stop`,
    { method: "POST" },
  );
}

export async function resumeSequenceCampaign(sequenceId: string) {
  return request<{ ok: boolean; is_active: boolean }>(
    `/api/reviewloop/sequences/${sequenceId}/resume`,
    { method: "POST" },
  );
}

export async function getSequence(id: string) {
  return request<ReviewSequence & { steps: ReviewSequenceStep[] }>(`/api/reviewloop/sequences/${id}`);
}

/** Create a new follow-up campaign. Existing campaigns can't be edited (API returns 400 on PUT). */
export async function createSequence(body: {
  name: string;
  is_active: boolean;
  location_id: string | null;
  review_link_style: ReviewSequenceLinkStyle;
  steps: { campaign_id: string; delay_after_previous_minutes: number }[];
}) {
  return request<Record<string, unknown>>(
    "/api/reviewloop/sequences",
    { method: "POST", body: JSON.stringify(body) },
  ) as Promise<Record<string, unknown>>;
}

export async function deleteSequence(id: string) {
  return request<{ ok: boolean }>(`/api/reviewloop/sequences/${id}`, { method: "DELETE" });
}

export const ENROLL_MAX_PER_REQUEST = 200;

export async function enrollInSequence(
  sequenceId: string,
  contactIds: string[],
  options?: { locationId?: string | null },
) {
  const payload: { contact_ids: string[]; location_id?: string } = { contact_ids: contactIds };
  const lid = options?.locationId && String(options.locationId).trim();
  if (lid) {
    payload.location_id = lid;
  }
  return request<{ enrolled: string[]; errors: { contact_id: string; error: string }[] }>(
    `/api/reviewloop/sequences/${sequenceId}/enroll`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function enrollInSequenceBatched(
  sequenceId: string,
  contactIds: string[],
  options?: { locationId?: string | null },
): Promise<{ enrolled: string[]; errors: { contact_id: string; error: string }[] }> {
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const id of contactIds) {
    const s = String(id).trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    deduped.push(s);
  }
  const enrolled: string[] = [];
  const errors: { contact_id: string; error: string }[] = [];
  for (let i = 0; i < deduped.length; i += ENROLL_MAX_PER_REQUEST) {
    const chunk = deduped.slice(i, i + ENROLL_MAX_PER_REQUEST);
    const r = await enrollInSequence(sequenceId, chunk, options);
    enrolled.push(...r.enrolled);
    errors.push(...r.errors);
  }
  return { enrolled, errors };
}

const FETCH_IDS_PAGE_SIZE = 100;
const FETCH_IDS_MAX = 10_000;

export type FetchAllContactIdsResult = { ids: string[]; total: number; truncated: boolean };

export async function fetchAllContactIdsMatching(params: {
  q?: string;
  createdFrom?: string;
  createdTo?: string;
  locationId?: string;
}): Promise<FetchAllContactIdsResult> {
  const ids: string[] = [];
  let page = 1;
  let total = 0;
  let hasNext = true;
  let truncated = false;
  while (hasNext && ids.length < FETCH_IDS_MAX) {
    const c = await listContacts({
      q: params.q,
      createdFrom: params.createdFrom,
      createdTo: params.createdTo,
      locationId: params.locationId,
      page,
      pageSize: FETCH_IDS_PAGE_SIZE,
    });
    if (page === 1) total = c.total;
    for (const row of c.contacts) {
      if (ids.length < FETCH_IDS_MAX) ids.push(row.id);
    }
    if (ids.length >= FETCH_IDS_MAX && c.has_next) {
      truncated = true;
      break;
    }
    hasNext = c.has_next;
    page += 1;
    if (c.contacts.length === 0) break;
  }
  return { ids, total, truncated };
}

export async function saveCampaign(
  id: string | null,
  payload: {
    name: string;
    channel: "email" | "sms";
    template_subject?: string | null;
    template_body: string;
    delay_minutes: number;
    is_default: boolean;
    /** Pin which store's review links the customer sees for this template; null = use contact, then business default. */
    location_id?: string | null;
  },
) {
  if (id) {
    return request<{ campaign: Campaign }>(`/api/reviewloop/campaigns/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }
  return request<{ campaign: Campaign }>("/api/reviewloop/campaigns", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteCampaign(id: string) {
  return request<{ ok: boolean }>(`/api/reviewloop/campaigns/${id}`, { method: "DELETE" });
}

export async function getCredits() {
  return request<CreditState>("/api/reviewloop/me/credits");
}

export async function startTopUp(packKey: string, successUrl?: string) {
  return request<{ url: string }>("/api/reviewloop/me/credits/topup", {
    method: "POST",
    body: JSON.stringify({ pack_key: packKey, success_url: successUrl }),
  });
}

export async function startSubscriptionCheckout(successUrl: string, tierKey = "pro") {
  return request<{ url: string }>("/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ app_name: "reviewloop", tier_key: tierKey, success_url: successUrl }),
  });
}

export async function patchCreditSettings(threshold: number) {
  return request<{ low_balance_threshold: number }>("/api/reviewloop/me/credits/settings", {
    method: "PATCH",
    body: JSON.stringify({ low_balance_threshold: threshold }),
  });
}

export async function getDashboardStats(days = 30) {
  return request<DashboardStats>(`/api/reviewloop/me/dashboard?days=${days}`);
}

export async function listFeedback(opts: { only_negative?: boolean; days?: number } = {}) {
  const params = new URLSearchParams();
  if (opts.days) params.set("days", String(opts.days));
  if (opts.only_negative) params.set("only_negative", "true");
  return request<{ feedback: FeedbackEntry[] }>(`/api/reviewloop/me/feedback?${params}`);
}

const DEFAULT_MESSAGE_LOG_DAYS = 30;

export async function listMessages(limit = 100, opts: { days?: number } = {}) {
  const days = opts.days ?? DEFAULT_MESSAGE_LOG_DAYS;
  return request<{ messages: ScheduledMessage[] }>(
    `/api/reviewloop/me/messages?limit=${encodeURIComponent(String(limit))}&days=${encodeURIComponent(String(days))}`,
  );
}

/** Latest non-expired /r/{token} for this business (404 if none yet). */
export async function getPreviewRouting() {
  return request<{ token: string; url: string }>("/api/reviewloop/me/preview-routing");
}

export type QrStyleId = "classic" | "dots" | "rounded";
export type QrStyleMeta = { id: QrStyleId; label: string; description: string };

export async function getQrInfo(opts: { locationId?: string | null } = {}) {
  const p = new URLSearchParams();
  if (opts.locationId && String(opts.locationId).trim()) {
    p.set("l", String(opts.locationId).trim());
  }
  const q = p.toString();
  return request<{
    url: string;
    location_id: string | null;
    png_endpoint: string;
    svg_endpoint: string;
    styles: QrStyleMeta[];
  }>(`/api/reviewloop/me/qr${q ? `?${q}` : ""}`);
}

export async function fetchMyQrPng(
  style: QrStyleId = "classic",
  locationId?: string | null
): Promise<Blob> {
  if (useClientMockDispatch()) {
    return getTestModeQrPngBlob(style, locationId);
  }
  const p = new URLSearchParams();
  if (style !== "classic") p.set("style", style);
  if (locationId && String(locationId).trim()) p.set("l", String(locationId).trim());
  const q = p.toString();
  const res = await fetch(
    `${API_BASE}/api/reviewloop/me/qr/png${q ? `?${q}` : ""}`,
    { headers: { ...authHeaderForUserId() } }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const d = (err as { detail?: string }).detail;
    throw new Error(
      (typeof d === "string" ? d : (err as { message?: string }).message) || `Request failed (${res.status})`,
    );
  }
  return res.blob();
}

export async function fetchMyQrSvg(locationId?: string | null): Promise<Blob> {
  if (useClientMockDispatch()) {
    return getTestModeQrSvgBlob(locationId);
  }
  const p = new URLSearchParams();
  if (locationId && String(locationId).trim()) p.set("l", String(locationId).trim());
  const q = p.toString();
  const res = await fetch(
    `${API_BASE}/api/reviewloop/me/qr/svg${q ? `?${q}` : ""}`,
    { headers: { ...authHeaderForUserId() } }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const d = (err as { detail?: string }).detail;
    throw new Error(
      (typeof d === "string" ? d : (err as { message?: string }).message) || `Request failed (${res.status})`,
    );
  }
  return res.blob();
}

export async function listWebhookKeys() {
  return request<{ keys: WebhookKeyRecord[] }>("/api/reviewloop/webhook-keys");
}

export async function createWebhookKey(label: string) {
  return request<{ key: string; record: WebhookKeyRecord }>("/api/reviewloop/webhook-keys", {
    method: "POST",
    body: JSON.stringify({ label }),
  });
}

export async function revokeWebhookKey(id: string) {
  return request<{ ok: boolean }>(`/api/reviewloop/webhook-keys/${id}`, { method: "DELETE" });
}

export async function deleteAccount() {
  return request<{ ok: boolean }>("/api/reviewloop/me/account", { method: "DELETE" });
}

/** Full data export (same response as the backend JSON payload). */
export async function getDataExportBundle() {
  return request<{
    business: Business | null;
    credits: unknown;
    contacts: Contact[];
    messages: ScheduledMessage[];
    events: unknown[];
    ledger: CreditLedgerEntry[];
  }>("/api/reviewloop/me/data-export");
}

/* ── Public (no-auth) routing endpoints ── */

export async function getRoutingLink(token: string) {
  return request<{ business: RoutingBusinessInfo }>(`/api/reviewloop/public/r/${token}`, {}, { auth: false });
}

export async function recordClickGoogle(token: string) {
  return request<{ ok: boolean; redirect_url: string }>(`/api/reviewloop/public/r/${token}/click-google`, {
    method: "POST",
    body: JSON.stringify({}),
  }, { auth: false });
}

export async function recordClickOutbound(token: string, platform: string) {
  return request<{ ok: boolean; redirect_url: string }>(`/api/reviewloop/public/r/${token}/outbound`, {
    method: "POST",
    body: JSON.stringify({ platform }),
  }, { auth: false });
}

export async function submitFeedback(token: string, rating: number, comment?: string) {
  return request<{ ok: boolean }>(`/api/reviewloop/public/r/${token}/feedback`, {
    method: "POST",
    body: JSON.stringify({ rating, comment }),
  }, { auth: false });
}

export async function getQrPublicBusiness(
  businessId: string,
  opts: { locationId?: string | null } = {}
) {
  const p = new URLSearchParams();
  if (opts.locationId && String(opts.locationId).trim()) {
    p.set("l", String(opts.locationId).trim());
  }
  const q = p.toString();
  return request<{ business: RoutingBusinessInfo }>(
    `/api/reviewloop/public/q/${encodeURIComponent(businessId)}${q ? `?${q}` : ""}`,
    {},
    { auth: false }
  );
}

export async function submitQrOptIn(
  businessId: string,
  payload: {
    name?: string;
    email?: string;
    phone?: string;
    consent: boolean;
    channel: "auto" | "email" | "sms";
    location_id?: string | null;
  },
) {
  return request<{ ok: boolean }>(`/api/reviewloop/public/q/${encodeURIComponent(businessId)}/optin`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, { auth: false });
}
