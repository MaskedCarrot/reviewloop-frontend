import type {
  Business,
  Template,
  Campaign,
  CampaignRecipient,
  CampaignStats,
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
import { LOCAL_DEMO_FLAG, TEST_USER_ID } from "@/lib/testMode/ids";
import { runTestModeCsvUpload } from "@/lib/testMode/dispatch";
import { getTestModeQrPngBlob, getTestModeQrSvgBlob } from "@/lib/testMode/qrImage";
import { API_BASE } from "./config";
import { request, useClientMockDispatch, authHeaderForUserId } from "./client";

export async function googleAuth(code: string) {
  return request<{ user: User }>(
    "/api/auth/google",
    {
      method: "POST",
      body: JSON.stringify({ code, product: "goodword" }),
    },
    { auth: false },
  );
}

export async function getMe() {
  return request<User>("/api/goodword/me");
}

export async function getPublicConfig() {
  return request<PublicConfig>("/api/goodword/config", {}, { auth: false });
}

export async function getPublicSendRatesByCountry() {
  return request<PublicSendRatesResponse>("/api/goodword/config/send-rates", {}, { auth: false });
}

/** Pro tiers + notes for a market (e.g. visitor `country` from IP). Unauthenticated. */
export async function getPublicMembershipPreview(countryCode: string | null) {
  const q =
    countryCode && /^[A-Za-z]{2}$/.test(countryCode) ? `?country=${encodeURIComponent(countryCode.toUpperCase())}` : "";
  return request<MembershipOffers>(`/api/goodword/config/membership-preview${q}`, {}, { auth: false });
}

export async function getMyCreditRates() {
  return request<MyCreditRates>("/api/goodword/me/credit-rates");
}

export async function getMembershipOffers() {
  return request<MembershipOffers>("/api/goodword/me/membership-offers");
}

export async function devBootstrapSession() {
  return request<{ user: User; seed?: { seeded?: boolean; error?: string } }>(
    "/api/goodword/dev/bootstrap",
    { method: "POST" },
    { auth: false },
  );
}

export async function getSessionBootstrap() {
  return request<SessionBootstrap>("/api/goodword/me/bootstrap");
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

export function startLocalDemoSession(): User {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_DEMO_FLAG, "1");
    localStorage.setItem("user_id", TEST_USER_ID);
  }
  return { id: TEST_USER_ID, email: "demo@goodword.app", name: "Demo user", picture_url: null };
}

export async function getMyBusiness() {
  return request<{ business: Business | null }>("/api/goodword/me/business");
}

export async function saveMyBusiness(payload: Partial<Business>) {
  return request<{ business: Business }>("/api/goodword/me/business", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listMyLocations() {
  return request<{ locations: BusinessLocation[]; default_location_id: string | null }>("/api/goodword/me/locations");
}

export async function createMyLocation(payload: {
  name: string;
  platform_links?: Record<string, string>;
  sort_index?: number;
  is_default?: boolean;
}) {
  return request<{ location: BusinessLocation }>("/api/goodword/me/locations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function patchMyLocation(
  locationId: string,
  payload: {
    name?: string;
    sort_index?: number;
    is_default?: boolean;
  },
) {
  return request<{ location: BusinessLocation }>(`/api/goodword/me/locations/${locationId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function putMyLocationPlatformLinks(locationId: string, links: Record<string, string>) {
  return request<{ location_id: string; platform_links: Record<string, string> }>(
    `/api/goodword/me/locations/${locationId}/platform-links`,
    { method: "PUT", body: JSON.stringify({ links }) },
  );
}

export async function deleteMyLocation(locationId: string) {
  return request<{ ok: boolean }>(`/api/goodword/me/locations/${locationId}`, { method: "DELETE" });
}

export type ListContactsParams = {
  q?: string;
  createdFrom?: string;
  createdTo?: string;
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
  return request<IngestPresets>("/api/goodword/contacts/ingest-presets");
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
  return request<ListContactsResult>(`/api/goodword/contacts${qs ? `?${qs}` : ""}`);
}

/** Load contacts by id (e.g. for message logs) without loading the full paginated list. */
export async function lookupContactsByIds(ids: string[]) {
  return request<{ contacts: Contact[] }>("/api/goodword/contacts/lookup", {
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
  email_template_id?: string;
  sms_template_id?: string;
  location_id?: string | null;
}) {
  return request<{
    contact: Contact;
    message: ScheduledMessage | null;
    /** True when the email/phone already belonged to an existing contact and we
     * updated it in place instead of inserting a new row. */
    matched_existing?: boolean;
  }>("/api/goodword/contacts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function unsubscribeContact(contactId: string) {
  return request<{ ok: boolean }>("/api/goodword/contacts/unsubscribe", {
    method: "POST",
    body: JSON.stringify({ contact_id: contactId }),
  });
}

export async function resubscribeContact(contactId: string) {
  return request<{ ok: boolean }>("/api/goodword/contacts/resubscribe", {
    method: "POST",
    body: JSON.stringify({ contact_id: contactId }),
  });
}

export async function sendContactReviewRequest(
  contactId: string,
  opts: { channel?: "email" | "sms"; templateId?: string } = {},
) {
  const { channel, templateId } = opts;
  return request<{ message: unknown }>(`/api/goodword/contacts/${contactId}/send`, {
    method: "POST",
    body: JSON.stringify({
      ...(channel ? { channel } : {}),
      ...(templateId ? { template_id: templateId } : {}),
    }),
  });
}

export async function bulkSendContactReviewRequests(payload: {
  contactIds: string[];
  channel?: "email" | "sms";
  emailTemplateId?: string;
  smsTemplateId?: string;
}) {
  return request<BulkSendResult>("/api/goodword/contacts/bulk-send", {
    method: "POST",
    body: JSON.stringify({
      contact_ids: payload.contactIds,
      ...(payload.channel ? { channel: payload.channel } : {}),
      ...(payload.emailTemplateId ? { email_template_id: payload.emailTemplateId } : {}),
      ...(payload.smsTemplateId ? { sms_template_id: payload.smsTemplateId } : {}),
    }),
  });
}

export async function deleteContact(contactId: string) {
  return request<{ ok: boolean }>(`/api/goodword/contacts/${contactId}`, { method: "DELETE" });
}

/** Patch a contact's editable fields. Pass `null` to clear email or phone (one is still required). */
export async function updateContact(
  contactId: string,
  payload: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    location_id?: string | null;
    external_ref?: string | null;
  },
) {
  return request<{ contact: Contact }>(`/api/goodword/contacts/${contactId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function uploadContactCsv(
  file: File,
  opts: {
    consent: boolean;
    channel: "auto" | "email" | "sms";
    enqueue: boolean;
    emailTemplateId?: string;
    smsTemplateId?: string;
    locationId?: string;
  },
) {
  if (useClientMockDispatch()) {
    return runTestModeCsvUpload(file, opts as Parameters<typeof runTestModeCsvUpload>[1]);
  }
  const userId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
  const form = new FormData();
  form.append("file", file);
  form.append("consent", String(opts.consent));
  form.append("channel", opts.channel);
  form.append("enqueue", String(opts.enqueue));
  if (opts.emailTemplateId) form.append("email_template_id", opts.emailTemplateId);
  if (opts.smsTemplateId) form.append("sms_template_id", opts.smsTemplateId);
  if (opts.locationId) form.append("location_id", opts.locationId);
  const res = await fetch(`${API_BASE}/api/goodword/contacts/csv-upload`, {
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

/* ── Templates ── */

export async function listTemplates() {
  return request<{ templates: Template[] }>("/api/goodword/templates");
}

export async function saveTemplate(
  id: string | null,
  payload: {
    name: string;
    channel: "email" | "sms";
    subject?: string | null;
    body: string;
    is_default?: boolean;
  },
) {
  if (id) {
    return request<{ template: Template }>(`/api/goodword/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }
  return request<{ template: Template }>("/api/goodword/templates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteTemplate(id: string) {
  return request<{ ok: boolean }>(`/api/goodword/templates/${id}`, { method: "DELETE" });
}

/* ── Campaigns ── */

export type ListCampaignsParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: "all" | "scheduled" | "running" | "paused" | "finished";
  from?: string;
  to?: string;
};

export async function listCampaigns(params?: ListCampaignsParams) {
  const p = new URLSearchParams();
  if (params?.page != null) p.set("page", String(params.page));
  if (params?.pageSize != null) p.set("page_size", String(params.pageSize));
  if (params?.q?.trim()) p.set("q", params.q.trim());
  if (params?.status) p.set("status", params.status);
  if (params?.from) p.set("from", params.from);
  if (params?.to) p.set("to", params.to);
  const qs = p.toString();
  return request<{ campaigns: Campaign[]; total: number; page: number; page_size: number }>(
    `/api/goodword/campaigns${qs ? `?${qs}` : ""}`,
  );
}

export async function getCampaign(id: string) {
  return request<Campaign>(`/api/goodword/campaigns/${id}`);
}

export async function createCampaign(body: {
  name: string;
  location_id?: string | null;
  steps: { template_id: string; delay_minutes: number }[];
  contact_ids?: string[];
  scheduled_at?: string | null;
}) {
  return request<Campaign>("/api/goodword/campaigns", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function activateCampaign(id: string) {
  return request<Campaign>(`/api/goodword/campaigns/${id}/activate`, { method: "POST" });
}

export async function pauseCampaign(id: string) {
  return request<Campaign>(`/api/goodword/campaigns/${id}/pause`, { method: "POST" });
}

export async function resumeCampaign(id: string) {
  return request<Campaign>(`/api/goodword/campaigns/${id}/resume`, { method: "POST" });
}

export async function cloneCampaign(id: string, opts: { with_recipients?: boolean; name?: string } = {}) {
  return request<Campaign>(`/api/goodword/campaigns/${id}/clone`, {
    method: "POST",
    body: JSON.stringify(opts),
  });
}

export async function addCampaignRecipients(campaignId: string, contactIds: string[]) {
  return request<{ added: string[]; errors: { contact_id: string; error: string }[] }>(
    `/api/goodword/campaigns/${campaignId}/recipients`,
    { method: "POST", body: JSON.stringify({ contact_ids: contactIds }) },
  );
}

export async function listCampaignRecipients(
  campaignId: string,
  opts: { page?: number; pageSize?: number } = {},
) {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 25;
  return request<{ recipients: CampaignRecipient[]; total: number }>(
    `/api/goodword/campaigns/${campaignId}/recipients?page=${page}&page_size=${pageSize}`,
  );
}

export async function getCampaignStats(campaignId: string) {
  return request<CampaignStats>(`/api/goodword/campaigns/${campaignId}/stats`);
}

export async function stopCampaignRecipient(campaignId: string, recipientId: string) {
  return request<{ ok: boolean; stopped: boolean }>(
    `/api/goodword/campaigns/${campaignId}/recipients/${recipientId}/stop`,
    { method: "POST" },
  );
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

export async function getCredits() {
  return request<CreditState>("/api/goodword/me/credits");
}

export async function startTopUp(packKey: string, successUrl?: string) {
  return request<{ url: string }>("/api/goodword/me/credits/topup", {
    method: "POST",
    body: JSON.stringify({ pack_key: packKey, success_url: successUrl }),
  });
}

export async function startSubscriptionCheckout(successUrl: string, tierKey = "pro") {
  return request<{ url: string }>("/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ app_name: "goodword", tier_key: tierKey, success_url: successUrl }),
  });
}

export async function patchCreditSettings(threshold: number) {
  return request<{ low_balance_threshold: number }>("/api/goodword/me/credits/settings", {
    method: "PATCH",
    body: JSON.stringify({ low_balance_threshold: threshold }),
  });
}

export async function getDashboardStats(days = 30) {
  return request<DashboardStats>(`/api/goodword/me/dashboard?days=${days}`);
}

export async function listFeedback(opts: { only_negative?: boolean; days?: number } = {}) {
  const params = new URLSearchParams();
  if (opts.days) params.set("days", String(opts.days));
  if (opts.only_negative) params.set("only_negative", "true");
  return request<{ feedback: FeedbackEntry[] }>(`/api/goodword/me/feedback?${params}`);
}

const DEFAULT_MESSAGE_LOG_DAYS = 30;

export async function listMessages(limit = 100, opts: { days?: number } = {}) {
  const days = opts.days ?? DEFAULT_MESSAGE_LOG_DAYS;
  return request<{ messages: ScheduledMessage[] }>(
    `/api/goodword/me/messages?limit=${encodeURIComponent(String(limit))}&days=${encodeURIComponent(String(days))}`,
  );
}

/** Stable review page URL for the most recently created contact (for dashboard preview). */
export async function getPreviewRouting() {
  return request<{ token: string; url: string }>("/api/goodword/me/preview-routing");
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
  }>(`/api/goodword/me/qr${q ? `?${q}` : ""}`);
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
    `${API_BASE}/api/goodword/me/qr/png${q ? `?${q}` : ""}`,
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
    `${API_BASE}/api/goodword/me/qr/svg${q ? `?${q}` : ""}`,
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
  return request<{ keys: WebhookKeyRecord[] }>("/api/goodword/webhook-keys");
}

export async function createWebhookKey(label: string) {
  return request<{ key: string; record: WebhookKeyRecord }>("/api/goodword/webhook-keys", {
    method: "POST",
    body: JSON.stringify({ label }),
  });
}

export async function revokeWebhookKey(id: string) {
  return request<{ ok: boolean }>(`/api/goodword/webhook-keys/${id}`, { method: "DELETE" });
}

export async function deleteAccount() {
  return request<{ ok: boolean }>("/api/goodword/me/account", { method: "DELETE" });
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
  }>("/api/goodword/me/data-export");
}

/* ── Public (no-auth) routing endpoints ── */

export async function getRoutingLink(token: string) {
  return request<{ business: RoutingBusinessInfo }>(`/api/goodword/public/r/${token}`, {}, { auth: false });
}

/** Record a platform click and get the redirect URL. */
export async function recordPlatformClick(token: string, platform: string) {
  return request<{ ok: boolean; redirect_url: string }>(`/api/goodword/public/r/${token}/click`, {
    method: "POST",
    body: JSON.stringify({ platform }),
  }, { auth: false });
}

export async function submitFeedback(token: string, rating: number, comment?: string) {
  return request<{ ok: boolean }>(`/api/goodword/public/r/${token}/feedback`, {
    method: "POST",
    body: JSON.stringify({ rating, comment }),
  }, { auth: false });
}

/** Web-based unsubscribe — called from the public review page or email footer. No auth required. */
export async function webUnsubscribe(token: string) {
  return request<{ ok: boolean }>(`/api/goodword/public/r/${token}/unsubscribe`, {
    method: "POST",
  }, { auth: false });
}

export async function getQrPublicBusiness(
  businessId: string,
  opts: { locationId?: string | null; signal?: AbortSignal } = {}
) {
  const p = new URLSearchParams();
  if (opts.locationId && String(opts.locationId).trim()) {
    p.set("l", String(opts.locationId).trim());
  }
  const q = p.toString();
  return request<{ business: RoutingBusinessInfo }>(
    `/api/goodword/public/q/${encodeURIComponent(businessId)}${q ? `?${q}` : ""}`,
    { signal: opts.signal },
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
  return request<{ ok: boolean }>(`/api/goodword/public/q/${encodeURIComponent(businessId)}/optin`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, { auth: false });
}

/** Walk-in / QR-scan private feedback. No recipient token needed — works for
 * anyone who scans the QR. The optional contact details, when provided, link
 * the feedback to a contact (and let the business follow up). */
export async function submitQrFeedback(
  businessId: string,
  payload: {
    rating: number;
    comment?: string;
    name?: string;
    email?: string;
    phone?: string;
    location_id?: string | null;
  },
) {
  return request<{ ok: boolean }>(
    `/api/goodword/public/q/${encodeURIComponent(businessId)}/feedback`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { auth: false },
  );
}

// ─── SMS access requests (user-facing) ──────────────────────────────────────

export type SmsAccessRequestStatus = "pending" | "approved" | "denied";

export interface SmsAccessRequestRow {
  id: string;
  status: SmsAccessRequestStatus;
  requested_at: string;
  decided_at: string | null;
  note: string | null;
}

export async function getMySmsAccessRequest() {
  return request<{ request: SmsAccessRequestRow | null }>(
    "/api/goodword/me/sms-access-request",
  );
}

export async function requestSmsAccess(note?: string) {
  return request<{ status: SmsAccessRequestStatus; already_pending?: boolean; already_enabled?: boolean }>(
    "/api/goodword/me/sms-access-request",
    {
      method: "POST",
      body: JSON.stringify({ note: note?.trim() || null }),
    },
  );
}

// ─── Admin endpoints ────────────────────────────────────────────────────────

export interface AdminUserRow {
  user_id: string;
  email: string;
  user_name: string | null;
  signup_at: string;
  business_id: string | null;
  business_name: string | null;
  country_code: string | null;
  sms_enabled: boolean;
  is_sandbox: boolean;
  credit_balance: number;
  contact_count: number;
  campaign_count: number;
  sms_sent_total: number;
  email_sent_total: number;
  last_send_at: string | null;
  pending_sms_request: number;
}

export interface AdminStats {
  users_total: number;
  users_last_7d: number;
  sms_enabled_businesses: number;
  pending_sms_requests: number;
  sms_sent_24h: number;
  sms_sent_7d: number;
  email_sent_24h: number;
  email_sent_7d: number;
  force_sandbox: boolean;
  sms_public_preview: boolean;
}

export interface AdminSmsAccessRequest {
  id: string;
  user_id: string;
  business_id: string | null;
  status: SmsAccessRequestStatus;
  note: string | null;
  requested_at: string;
  decided_at: string | null;
  email: string;
  user_name: string | null;
  business_name: string | null;
  country_code: string | null;
}

export async function adminListUsers(params: {
  q?: string;
  smsEnabled?: "true" | "false" | "all";
  limit?: number;
  offset?: number;
} = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.smsEnabled) search.set("sms_enabled", params.smsEnabled);
  if (params.limit) search.set("limit", String(params.limit));
  if (params.offset) search.set("offset", String(params.offset));
  const qs = search.toString();
  return request<{ users: AdminUserRow[]; total: number }>(
    `/api/goodword/admin/users${qs ? `?${qs}` : ""}`,
  );
}

export async function adminSetSmsEnabled(userId: string, enabled: boolean, note?: string) {
  return request<{ ok: boolean; sms_enabled: boolean }>(
    `/api/goodword/admin/users/${encodeURIComponent(userId)}/sms-enabled`,
    {
      method: "POST",
      body: JSON.stringify({ enabled, note: note?.trim() || null }),
    },
  );
}

export async function adminListSmsAccessRequests(status: "pending" | "approved" | "denied" | "all" = "pending") {
  const qs = status === "pending" ? "" : `?status=${encodeURIComponent(status)}`;
  return request<{ requests: AdminSmsAccessRequest[] }>(
    `/api/goodword/admin/sms-access-requests${qs}`,
  );
}

export async function adminGetStats() {
  return request<AdminStats>("/api/goodword/admin/stats");
}
