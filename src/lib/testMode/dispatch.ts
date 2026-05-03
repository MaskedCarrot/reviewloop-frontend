import type { Business, BusinessLocation, Campaign, Contact, ReviewDestination, ScheduledMessage, Template } from "@/types";
import sendRatesIso from "@/data/iso3166-slim-2.json";
import { computeIngestPresetsForZone, ymdInZoneToUtcBoundsMs } from "@/lib/ingestDateBounds";
import { EMAIL_CREDIT, LOCAL_DEMO_FLAG, PRO_MONTHLY_CREDITS, SMS_CREDIT, TEST_USER_ID, TOPUP_BY_KEY } from "./ids";
import { getPublicOriginForClientLinks } from "./siteOrigin";
import type { TestModeState } from "./state";
import {
  applyOutboundLogRetentionInPlace,
  getTestState,
  getDashboardForDays,
  linkUrl,
  mutate,
  newId,
  newToken,
  OUTBOUND_LOG_RETENTION_DAYS,
  processDueSends,
  resetTestState,
} from "./state";

type MockCampaignRecipient = {
  recipient_id: string;
  campaign_id: string;
  contact_id: string;
  status: "pending" | "active" | "completed" | "stopped";
  current_step: number;
  enrolled_at: string;
  updated_at: string;
};
const mockCampaignRecipients: MockCampaignRecipient[] = [];

export function resetMockSessionStores() {
  mockCampaignRecipients.length = 0;
}

const SMS_OK = (cc: string) => ["GB", "IE", "US", "AU", "NZ", "DE", "FR", "ES", "IT", "NL"].includes((cc || "").toUpperCase());

const _TEST_PLATFORM_LABEL: Record<string, string> = {
  google: "Google",
  yelp: "Yelp",
  facebook: "Facebook",
  tripadvisor: "TripAdvisor",
  fb: "Facebook",
  trustpilot: "Trustpilot",
};

/** Mirrors backend `build_review_destinations` for the browser mock API. */
function testReviewDestinationsForLocation(loc: BusinessLocation | undefined): ReviewDestination[] {
  if (!loc) return [];
  const out: ReviewDestination[] = [];
  const pl = loc.platform_links || {};
  for (const [pid, url] of Object.entries(pl)) {
    const u = (url || "").trim();
    if (!u.toLowerCase().startsWith("https://")) continue;
    out.push({
      id: pid,
      label: _TEST_PLATFORM_LABEL[pid] || _TEST_PLATFORM_LABEL[pid.toLowerCase()] || pid,
      url: u,
    });
  }
  return out;
}

function requireUser(uid: string | null): void {
  if (!uid) throw new Error("Missing session");
}

function nowIso() {
  return new Date().toISOString();
}

function normEmail(v: string | null | undefined): string | null {
  if (!v) return null;
  const t = v.trim().toLowerCase();
  if (!t.includes("@")) return null;
  return t;
}
function normPhone(v: string | null | undefined): string | null {
  if (!v) return null;
  const t = ("" + v).replace(/[^\d+]/g, "");
  if (!t.startsWith("+") || t.length < 9) return null;
  return t;
}

/**
 * Find an existing contact in the same business by email (case-insensitive)
 * or phone (E.164). Mirrors the server's ``upsert_contact`` lookup so the
 * in-browser test fixture enforces the same uniqueness as the real DB.
 */
function findContactByEmailOrPhone(
  contacts: Contact[],
  businessId: string,
  email: string | null,
  phone: string | null,
): Contact | null {
  if (email) {
    const m = contacts.find(
      (c) =>
        c.business_id === businessId &&
        (c.email || "").toLowerCase() === email,
    );
    if (m) return m;
  }
  if (phone) {
    const m = contacts.find(
      (c) => c.business_id === businessId && (c.phone_e164 || "") === phone,
    );
    if (m) return m;
  }
  return null;
}

function pickTemplateForChannel(s: TestModeState, ch: "email" | "sms", templateId?: string | null): Template {
  const id = (templateId || "").trim();
  if (id) {
    const t = s.templates.find((x) => x.id === id);
    if (!t) throw new Error("Template not found");
    if (t.channel !== ch) throw new Error("Selected template is for a different channel than this send");
    return t;
  }
  const d = s.templates.find((t) => t.channel === ch && t.is_default) || s.templates.find((t) => t.channel === ch);
  if (!d) throw new Error("No template found for this channel");
  return d;
}

function resolveChannel(b: Business, c: Contact, prefer?: "auto" | "email" | "sms"): "email" | "sms" {
  if (prefer === "email") {
    if (!c.email) throw new Error("Contact has no email address");
    return "email";
  }
  if (prefer === "sms") {
    if (!SMS_OK(b.country_code)) throw new Error("SMS is not available for your business country");
    if (!c.phone_e164) throw new Error("Contact has no phone number");
    return "sms";
  }
  if (c.email) return "email";
  if (c.phone_e164 && SMS_OK(b.country_code)) return "sms";
  throw new Error("This contact needs an email, or a phone in an SMS-enabled country.");
}

function scheduleSendAt(b: Business, delayMin: number) {
  const baseMs = Date.now() + Math.max(0, delayMin) * 60e3;
  return applyQuietHours(new Date(baseMs), b).toISOString();
}

/** "HH:MM" → minutes since 00:00, or null for invalid input. */
function parseHHMMtoMinutes(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(s.trim());
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/** True iff `mins` (0..1440) falls in the half-open window [start, end), with wrap support. */
function inQuietWindow(mins: number, start: number, end: number): boolean {
  if (start === end) return false;
  return start < end ? mins >= start && mins < end : mins >= start || mins < end;
}

/** Mirrors shared-backend/modules/goodword/quiet_hours.py so test-mode behaviour matches prod. */
function applyQuietHours(sendAt: Date, biz: Business): Date {
  if (!biz?.quiet_hours_enabled) return sendAt;
  const startMin = parseHHMMtoMinutes(biz.quiet_hours_start ?? null);
  const endMin = parseHHMMtoMinutes(biz.quiet_hours_end ?? null);
  if (startMin == null || endMin == null || startMin === endMin) return sendAt;

  // Read the wall-clock time *as if* it were in the business timezone. The browser
  // doesn't ship a free zoneinfo lookup, so we use Intl to extract the local hh:mm
  // for the chosen tz at sendAt; that's enough to decide if we're inside the window.
  const tz = (biz.timezone || "UTC").trim() || "UTC";
  let hh = sendAt.getUTCHours();
  let mm = sendAt.getUTCMinutes();
  try {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const parts = fmt.formatToParts(sendAt);
    const h = parts.find((p) => p.type === "hour")?.value;
    const m = parts.find((p) => p.type === "minute")?.value;
    if (h && m) {
      hh = parseInt(h, 10);
      mm = parseInt(m, 10);
    }
  } catch {
    // unknown tz — fall back to UTC; better than swallowing every send
  }
  const localMin = hh * 60 + mm;
  if (!inQuietWindow(localMin, startMin, endMin)) return sendAt;

  // Push forward to the next moment when we exit the window. Compute in the
  // local tz frame, then convert back to a real instant. Edge case: when the
  // window wraps past midnight and we're in the post-midnight half, "end" is
  // still on the same calendar day.
  let minutesUntilEnd = endMin - localMin;
  if (minutesUntilEnd <= 0) minutesUntilEnd += 24 * 60;
  return new Date(sendAt.getTime() + minutesUntilEnd * 60_000);
}

function costFor(_s: TestModeState, _b: Business, ch: "email" | "sms") {
  return ch === "email" ? EMAIL_CREDIT : SMS_CREDIT;
}

function resolveTestLocationIdForSend(s: TestModeState, contact: Contact): string | null {
  if (contact.location_id) return contact.location_id;
  if (s.default_location_id) return s.default_location_id;
  return s.locations?.[0]?.id ?? null;
}

function enqueue(
  s: TestModeState,
  contact: Contact,
  ch: "email" | "sms",
  templateId?: string | null,
): { message: ScheduledMessage; routing_token: string } {
  const b = s.business;
  const templ = pickTemplateForChannel(s, ch, templateId);
  const locId = resolveTestLocationIdForSend(s, contact);
  const m: ScheduledMessage = {
    id: newId(),
    business_id: b.id,
    contact_id: contact.id,
    template_id: templ.id,
    campaign_id: null,
    campaign_step_index: null,
    channel: ch,
    send_at: scheduleSendAt(b, 60),
    status: "scheduled",
    provider_id: null,
    error_detail: null,
    cost_credits: costFor(s, b, ch),
    sent_at: null,
    created_at: nowIso(),
    location_id: locId ?? null,
  };
  s.messages.push(m);
  const tok = newToken();
  s.links.push({
    id: newId(),
    token: tok,
    message_id: m.id,
    business_id: b.id,
    expires_at: new Date(Date.now() + 90 * 864e5).toISOString(),
    created_at: nowIso(),
  });
  return { message: m, routing_token: tok };
}

export function dispatchTestMode(
  fullPath: string,
  method: string,
  body: unknown,
  userId: string | null,
  auth: boolean,
): unknown {
  const u = new URL(fullPath, "https://test.local");
  const path = u.pathname;
  const q = u.searchParams;

  const readBody = (b: unknown) => (b && typeof b === "object" ? (b as Record<string, unknown>) : {});

  // no auth
  if (method === "GET" && path === "/api/goodword/config") {
    return {
      country_allowlist: ["GB", "IE", "US", "AU", "NZ", "DE", "FR", "ES", "IT", "NL", "SE", "DK", "NO", "FI", "CH", "BE", "AT", "PT", "PL"],
      sms_supported_countries: ["GB", "IE", "US", "AU", "NZ", "DE", "FR", "ES", "IT", "NL", "SE", "DK", "NO", "FI", "CH", "BE", "AT", "PT", "PL"],
      email_credits: EMAIL_CREDIT,
      sms_credits: SMS_CREDIT,
      credit_rate_notes: "In-app preview: fixed test rates. Production uses your host's per-country file.",
      review_platforms: [
        { id: "google", label: "Google", description: "Link from your Google Business profile", link_source: "custom", sort: 0 },
        { id: "yelp", label: "Yelp", description: "Link to your business on Yelp", link_source: "custom", sort: 10 },
        { id: "facebook", label: "Facebook", description: "Page or review link on Facebook", link_source: "custom", sort: 20 },
        { id: "tripadvisor", label: "TripAdvisor", description: "Property link on TripAdvisor", link_source: "custom", sort: 30 },
        { id: "trustpilot", label: "Trustpilot", description: "Business profile on Trustpilot", link_source: "custom", sort: 40 },
      ],
    };
  }

  if (method === "GET" && path === "/api/goodword/config/send-rates") {
    const countries = (sendRatesIso as { code: string; name: string }[]).map((c) => {
      const code = c.code;
      return {
        country_code: code,
        name: c.name,
        email_credits: 1,
        sms_credits_per_segment: code === "US" ? 6 : 5,
        source: code === "US" ? ("country" as const) : ("default" as const),
      };
    });
    return {
      send_rate_notes:
        "In-app preview: example rates (higher US SMS in sample). Production values come from your host send_rates in goodword_pricing.yaml.",
      countries,
    };
  }

  if (method === "GET" && path === "/api/goodword/config/membership-preview") {
    const raw = (q.get("country") || "").trim();
    const cc = raw.length === 2 ? raw.toUpperCase() : null;
    return {
      country_code: cc,
      tiers: [
        { key: "pro", display_name: "Pro", display_price: "$9 / month", monthly_credits: 500, polar_configured: true },
      ],
      notes: "Test mode: single Pro tier. Live stack uses your pricing YAML and business country at checkout.",
    };
  }

  if (method === "GET" && path === "/api/goodword/me/credit-rates") {
    return {
      country_code: (getTestState().business?.country_code || "US").toUpperCase(),
      email_credits: EMAIL_CREDIT,
      sms_credits_per_segment: SMS_CREDIT,
      source: "default",
      notes: "Test mode: sample rates (see billing for copy).",
    };
  }

  if (method === "GET" && path === "/api/goodword/me/membership-offers") {
    return {
      country_code: (getTestState().business?.country_code || "US").toUpperCase(),
      tiers: [
        { key: "pro", display_name: "Pro", display_price: "$9 / month", monthly_credits: 500, polar_configured: true },
      ],
      notes: "Test mode: single Pro tier. Live stack uses your pricing YAML and Polar product ids.",
    };
  }

  // public routing
  {
    const rpub = path.match(/^\/api\/goodword\/public\/r\/([^/]+)$/);
    if (rpub && method === "GET") {
      let bizInfo: {
        id: string;
        name: string;
        from_name: string | null;
        branding_color: string;
        review_destinations: ReviewDestination[];
        location_id: string | null;
      };
      mutate((s) => {
        const link = s.links.find((l) => l.token === rpub[1]);
        if (!link) throw new Error("Link not found");
        const msg = s.messages.find((m) => m.id === link.message_id);
        const locs = s.locations || [];
        const loc = msg?.location_id
          ? locs.find((l) => l.id === msg.location_id)
          : locs.find((l) => l.is_default) || locs[0];
        const review_destinations = testReviewDestinationsForLocation(loc);
        s.routingEvents.push({
          id: newId(),
          link_id: link.id,
          business_id: link.business_id,
          event: "view",
          rating: null,
          comment: null,
          created_at: nowIso(),
        });
        bizInfo = {
          id: s.business.id,
          name: s.business.name,
          from_name: s.business.from_name,
          branding_color: s.business.branding_color,
          review_destinations,
          location_id: loc?.id ?? null,
        };
      });
      return { business: bizInfo! };
    }
  }
  {
    const rclick = path.match(/^\/api\/goodword\/public\/r\/([^/]+)\/click$/);
    if (rclick && method === "POST") {
      const p = readBody(body) as { platform?: string };
      const platform = String(p.platform || "").trim().toLowerCase();
      if (!platform) throw new Error("platform required");
      let redirect: string;
      mutate((s) => {
        const link = s.links.find((l) => l.token === rclick[1]);
        if (!link) throw new Error("Link not found");
        const msg = s.messages.find((m) => m.id === link.message_id);
        const locs = s.locations || [];
        const loc = msg?.location_id
          ? locs.find((l) => l.id === msg.location_id)
          : locs.find((l) => l.is_default) || locs[0];
        const dests = testReviewDestinationsForLocation(loc);
        const hit = dests.find((d) => d.id === platform);
        if (!hit) throw new Error("No URL configured for platform: " + platform);
        redirect = hit.url;
        s.routingEvents.push({
          id: newId(),
          link_id: link.id,
          business_id: link.business_id,
          event: "click_platform",
          rating: null,
          comment: null,
          created_at: nowIso(),
          outbound_platform: platform,
        });
      });
      return { ok: true, redirect_url: redirect! };
    }
  }
  {
    const rfb = path.match(/^\/api\/goodword\/public\/r\/([^/]+)\/feedback$/);
    if (rfb && method === "POST") {
      const p = readBody(body);
      mutate((s) => {
        const link = s.links.find((l) => l.token === rfb[1]);
        if (!link) throw new Error("Link not found");
        const r = Math.min(5, Math.max(1, Number(p.rating)));
        s.routingEvents.push({
          id: newId(),
          link_id: link.id,
          business_id: link.business_id,
          event: "submit_feedback",
          rating: r,
          comment: typeof p.comment === "string" ? p.comment.slice(0, 4000) : null,
          created_at: nowIso(),
        });
      });
      return { ok: true };
    }
  }
  {
    const runsub = path.match(/^\/api\/goodword\/public\/r\/([^/]+)\/unsubscribe$/);
    if (runsub && method === "POST") {
      mutate((s) => {
        const link = s.links.find((l) => l.token === runsub[1]);
        if (!link) return; // idempotent — no-op if token unknown
        const msg = s.messages.find((m) => m.id === link.message_id);
        if (!msg) return;
        const contact = s.contacts.find((c) => c.id === msg.contact_id);
        if (contact && !contact.unsubscribed_at) {
          contact.unsubscribed_at = nowIso();
          for (const m of s.messages) {
            if (m.contact_id === contact.id && m.status === "scheduled") m.status = "cancelled";
          }
        }
      });
      return { ok: true };
    }
  }
  {
    const mq = path.match(/^\/api\/goodword\/public\/q\/([^/]+)$/);
    if (mq && method === "GET") {
      const s = getTestState();
      if (s.business.id !== mq[1]) throw new Error("Business not found");
      const locs = s.locations || [];
      const lRaw = (q.get("l") || "").trim();
      let loc: BusinessLocation | undefined;
      let resolvedLocId: string | null = null;
      if (lRaw) {
        loc = locs.find((x) => x.id === lRaw);
        if (!loc) throw new Error("Store not found");
        resolvedLocId = loc.id;
      } else {
        loc = locs.find((l) => l.is_default) || locs[0];
        if (loc) resolvedLocId = loc.id;
      }
      const review_destinations = testReviewDestinationsForLocation(loc);
      return {
        business: {
          id: s.business.id,
          name: s.business.name,
          from_name: s.business.from_name,
          branding_color: s.business.branding_color,
          review_destinations,
          location_id: resolvedLocId,
        },
      };
    }
  }
  {
    const mq2 = path.match(/^\/api\/goodword\/public\/q\/([^/]+)\/optin$/);
    if (mq2 && method === "POST") {
      const p = readBody(body);
      if (!p.consent) throw new Error("Please tick the consent box to continue.");
      const em = normEmail(p.email as string) || null;
      const ph = normPhone(p.phone as string) || null;
      if (!em && !ph) throw new Error("Add an email or phone (E.164) to continue");
      mutate((s) => {
        if (s.business.id !== mq2[1]) throw new Error("Business not found");
        const locRaw = (p.location_id as string | undefined) && String(p.location_id).trim();
        const locOk = locRaw && s.locations?.some((l) => l.id === locRaw) ? locRaw : null;
        if (locRaw && !locOk) throw new Error("That store is not in this business");
        // Dedup against the QR scanner's previous opt-ins by email/phone.
        // Repeat scanners shouldn't produce a fresh contact every time.
        const existing = findContactByEmailOrPhone(s.contacts, s.business.id, em, ph);
        let contact: Contact;
        if (existing) {
          existing.name = (p.name as string) || existing.name;
          if (em) existing.email = em;
          if (ph) existing.phone_e164 = ph;
          existing.consent_attested_at = nowIso();
          if (locOk !== null) existing.location_id = locOk;
          contact = existing;
        } else {
          contact = {
            id: newId(),
            business_id: s.business.id,
            name: (p.name as string) || null,
            email: em,
            phone_e164: ph,
            source: "qr",
            consent_attested_at: nowIso(),
            unsubscribed_at: null,
            last_message_at: null,
            external_ref: null,
            created_at: nowIso(),
            location_id: locOk,
          };
          s.contacts = [contact, ...s.contacts];
        }
        const ch0 = (p.channel as "auto" | "email" | "sms" | undefined) || "auto";
        let cch: "email" | "sms";
        if (ch0 === "email") cch = "email";
        else if (ch0 === "sms") cch = "sms";
        else {
          if (em) cch = "email";
          else cch = "sms";
        }
        if (cch === "sms" && !SMS_OK(s.business.country_code)) cch = "email";
        if (cch === "email" && !contact.email) throw new Error("Add an email address (SMS is not available for this business country)");
        if (cch === "sms" && !contact.phone_e164) throw new Error("Add a phone in E.164 format (e.g. +447...)");
        enqueue(s, contact, cch);
      });
      return { ok: true };
    }
  }

  {
    const mqf = path.match(/^\/api\/goodword\/public\/q\/([^/]+)\/feedback$/);
    if (mqf && method === "POST") {
      const p = readBody(body) as {
        rating?: number;
        comment?: string;
        name?: string;
        email?: string;
        phone?: string;
        location_id?: string | null;
      };
      const rating = Number(p.rating) || 0;
      if (rating < 1 || rating > 5) throw new Error("Rating must be 1–5.");
      const s = getTestState();
      if (s.business.id !== mqf[1]) throw new Error("Business not found");
      // Local mock just acknowledges it — there's no routing-events log to write
      // to in the in-browser test fixture, and no email is dispatched for
      // private feedback. Real backend stores the row.
      void p;
      return { ok: true };
    }
  }

  if (method === "POST" && path === "/api/auth/google") {
    return { user: { ...getTestState().user } };
  }
  if (method === "POST" && path === "/api/goodword/dev/bootstrap") {
    return { user: { ...getTestState().user }, seed: { seeded: true, test_mode: true } };
  }
  if (method === "GET" && path === "/api/goodword/me") {
    return { ...getTestState().user };
  }
  if (method === "GET" && path.startsWith("/api/users/")) {
    return { ...getTestState().user };
  }

  if (auth) requireUser(userId);

  if (path === "/api/billing/checkout" && method === "POST") {
    const p = readBody(body) as { success_url?: string; tier_key?: string };
    void p;
    const grant = PRO_MONTHLY_CREDITS;
    mutate((s) => {
      s.subscriptionPro = true;
      s.credits.balance += grant;
      s.credits.ledger = [
        {
          delta: grant,
          reason: "subscription_grant",
          ref_id: "test_mode_checkout_" + (p.tier_key || "pro"),
          balance_after: s.credits.balance,
          created_at: nowIso(),
        },
        ...s.credits.ledger,
      ].slice(0, 40);
    });
    return { url: `${getPublicOriginForClientLinks()}/dashboard/billing?subscribed=ok&tier=${encodeURIComponent(p.tier_key || "pro")}` };
  }
  if (path === "/api/goodword/me/credits/topup" && method === "POST") {
    const p = readBody(body) as { pack_key: string; success_url?: string };
    const n = TOPUP_BY_KEY[p.pack_key];
    if (n == null) throw new Error("Unknown top-up");
    let url = "";
    mutate((s) => {
      s.credits.balance += n;
      s.credits.ledger = [
        { delta: n, reason: "topup", ref_id: "test_mode_" + p.pack_key, balance_after: s.credits.balance, created_at: nowIso() },
        ...s.credits.ledger,
      ].slice(0, 40);
      url = `${getPublicOriginForClientLinks()}/dashboard/billing?topup=ok`;
    });
    return { url };
  }
  if (path === "/api/goodword/me/credits" && method === "GET") {
    processDueSends();
    return { ...getTestState().credits, ledger: [...getTestState().credits.ledger] };
  }
  if (path === "/api/goodword/me/credits/settings" && method === "PATCH") {
    const p = readBody(body) as { low_balance_threshold: number };
    let out = 0;
    mutate((s) => {
      s.credits.low_balance_threshold = p.low_balance_threshold;
      out = s.credits.low_balance_threshold;
    });
    return { low_balance_threshold: out };
  }
  if (path === "/api/goodword/me/business" && method === "GET") {
    return { business: { ...getTestState().business } };
  }
  if (path === "/api/goodword/me/locations" && method === "GET") {
    const s = getTestState();
    const locs = s.locations ?? [];
    const withLinks = locs.map((loc) => ({ ...loc, platform_links: loc.platform_links || {} }));
    return {
      locations: withLinks,
      default_location_id: s.default_location_id ?? null,
    };
  }
  {
    const mPlPut = path.match(/^\/api\/goodword\/me\/locations\/([^/]+)\/platform-links$/);
    if (mPlPut && method === "PUT") {
      const lid = mPlPut[1]!;
      const p = readBody(body) as { links?: Record<string, string> };
      const plOut: Record<string, string> = {};
      mutate((s) => {
        const loc = s.locations?.find((l) => l.id === lid);
        if (!loc) throw new Error("Location not found");
        if (!loc.platform_links) loc.platform_links = {};
        for (const [k, raw] of Object.entries(p.links || {})) {
          const pid = String(k).trim();
          if (!pid) continue;
          const u = (raw || "").trim();
          if (!u) {
            delete loc.platform_links[pid];
            continue;
          }
          if (!u.startsWith("https://")) throw new Error("URL must use https");
          try {
            void new URL(u);
          } catch {
            throw new Error("Use a full https URL");
          }
          loc.platform_links[pid] = u;
        }
        Object.assign(plOut, loc.platform_links);
        loc.updated_at = nowIso();
      });
      return { location_id: lid, platform_links: { ...plOut } };
    }
  }
  // PATCH /api/goodword/me/locations/:id — rename, set default, reorder.
  // Mirrors `patchMyLocation` in the API layer so the in-browser demo flow
  // (Try mode) doesn't dead-end when a user edits a store.
  {
    const mPatch = path.match(/^\/api\/goodword\/me\/locations\/([^/]+)$/);
    if (mPatch && method === "PATCH") {
      const lid = mPatch[1]!;
      const p = readBody(body) as {
        name?: string;
        sort_index?: number;
        is_default?: boolean;
      };
      let updated: BusinessLocation | null = null;
      mutate((s) => {
        const loc = s.locations?.find((l) => l.id === lid);
        if (!loc) throw new Error("Store not found");
        if (typeof p.name === "string") {
          const n = p.name.trim();
          if (!n) throw new Error("Store name is required");
          loc.name = n;
        }
        if (typeof p.sort_index === "number" && Number.isFinite(p.sort_index)) {
          loc.sort_index = p.sort_index;
        }
        if (p.is_default === true) {
          for (const l of s.locations ?? []) l.is_default = false;
          loc.is_default = true;
          s.default_location_id = loc.id;
        }
        loc.updated_at = nowIso();
        updated = loc;
      });
      return {
        location: { ...updated!, platform_links: updated!.platform_links || {} },
      };
    }
  }

  // DELETE /api/goodword/me/locations/:id — remove a store. If it was the
  // default, promote the next remaining store (or null) so the demo doesn't
  // dangle on a stale default_location_id.
  {
    const mDel = path.match(/^\/api\/goodword\/me\/locations\/([^/]+)$/);
    if (mDel && method === "DELETE") {
      const lid = mDel[1]!;
      mutate((s) => {
        const before = s.locations ?? [];
        const target = before.find((l) => l.id === lid);
        if (!target) throw new Error("Store not found");
        s.locations = before.filter((l) => l.id !== lid);
        if (s.default_location_id === lid) {
          const fallback = s.locations[0] ?? null;
          if (fallback) {
            fallback.is_default = true;
            s.default_location_id = fallback.id;
          } else {
            s.default_location_id = null;
          }
        }
        s.business = { ...s.business, updated_at: nowIso() };
      });
      return { ok: true };
    }
  }

  if (path === "/api/goodword/me/locations" && method === "POST") {
    const p = readBody(body) as {
      name?: string;
      platform_links?: Record<string, string>;
      is_default?: boolean;
      sort_index?: number;
    };
    const name = (p.name || "").trim();
    if (!name) throw new Error("Store name is required");
    const fromPl: Record<string, string> = {};
    if (p.platform_links) {
      for (const [k, v] of Object.entries(p.platform_links)) {
        const pid = String(k).trim();
        if (!pid) continue;
        const u = String(v).trim();
        if (!u) continue;
        if (!u.startsWith("https://")) throw new Error("Platform links must be https:// URLs");
        try {
          void new URL(u);
        } catch {
          throw new Error("Use a full https URL");
        }
        fromPl[pid] = u;
      }
    }
    let created: BusinessLocation;
    mutate((s) => {
      if (!s.locations) s.locations = [];
      const t = nowIso();
      const isFirst = s.locations.length === 0;
      const makeDef = p.is_default === true || isFirst;
      if (makeDef) {
        for (const l of s.locations) l.is_default = false;
      }
      created = {
        id: newId(),
        business_id: s.business.id,
        name,
        sort_index: p.sort_index ?? 0,
        is_default: makeDef,
        created_at: t,
        updated_at: t,
        platform_links: { ...fromPl },
      };
      s.locations = [...s.locations, created];
      if (makeDef) {
        s.default_location_id = created.id;
        s.business = { ...s.business, updated_at: t };
      }
    });
    return { location: { ...created!, platform_links: created!.platform_links || {} } };
  }
  if (path === "/api/goodword/me/bootstrap" && method === "GET") {
    processDueSends();
    const s = getTestState();
    const tzn = (s.business?.timezone || "UTC").trim() || "UTC";
    const withLinks = (s.locations ?? []).map((loc) => ({ ...loc, platform_links: loc.platform_links || {} }));
    return {
      business: { ...s.business },
      config: dispatchTestMode("/api/goodword/config", "GET", null, null, false) as Record<string, unknown>,
      credits: { ...s.credits, ledger: [...s.credits.ledger] },
      locations: { locations: withLinks, default_location_id: s.default_location_id ?? null },
      ingest_presets: computeIngestPresetsForZone(tzn),
      display_timezone: tzn,
      credit_rates: {
        country_code: (s.business?.country_code || "US").toUpperCase(),
        email_credits: EMAIL_CREDIT,
        sms_credits_per_segment: SMS_CREDIT,
        source: "default",
        notes: null,
      },
      // Test mode pretends the user is on Pro so every screen renders without
      // Free-tier locks getting in the way of demos.
      usage: {
        plan: s.subscriptionPro ? "pro" : "free",
        limits: s.subscriptionPro
          ? {
              campaigns_per_month: null,
              locations: null,
              credits_purchase_per_month: null,
            }
          : {
              campaigns_per_month: 5,
              locations: 1,
              credits_purchase_per_month: 100,
            },
        used: {
          campaigns_this_month: (s.campaigns || []).length,
          locations_total: (s.locations || []).length,
          credits_purchased_this_month: Math.max(
            0,
            (s.credits.ledger || [])
              .filter((row) => row.reason === "topup" && (row.delta ?? 0) > 0)
              .reduce((acc, row) => acc + (row.delta ?? 0), 0),
          ),
        },
        pro_monthly_credits: 100,
      },
    } as const;
  }
  if (path === "/api/goodword/me/business" && method === "POST") {
    const p = readBody(body) as Record<string, unknown>;
    let out: Business;
    mutate((s) => {
      s.business = { ...s.business, ...p, updated_at: nowIso() } as Business;
      out = s.business;
    });
    return { business: { ...out! } };
  }

  // contacts
  if (path === "/api/goodword/contacts/lookup" && method === "POST") {
    processDueSends();
    const p = readBody(body) as { ids?: unknown[] };
    const want = new Set(
      (Array.isArray(p.ids) ? p.ids : [])
        .map((x) => String(x).trim())
        .filter(Boolean)
        .slice(0, 200),
    );
    const out = getTestState().contacts.filter((c) => want.has(c.id));
    return { contacts: out };
  }
  if (path === "/api/goodword/contacts/ingest-presets" && method === "GET") {
    return computeIngestPresetsForZone((getTestState().business?.timezone || "UTC").trim() || "UTC");
  }
  if (path === "/api/goodword/contacts" && method === "GET") {
    processDueSends();
    const textQ = (q.get("q") || "").trim().toLowerCase();
    const fromS = q.get("created_from") || "";
    const toS = q.get("created_to") || "";
    const locFilter = (q.get("location_id") || "").trim();
    const page = Math.max(1, parseInt(q.get("page") || "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(q.get("page_size") || "25", 10) || 25));
    const tz = (getTestState().business?.timezone || "UTC").trim() || "UTC";
    let list = [...getTestState().contacts].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    if (textQ) {
      // Mirror the server's search: name / email / external_ref / phone, with
      // a digit-only fallback for phone so "447700 900 123" still matches the
      // stored "+447700900123".
      const digitsOnly = textQ.replace(/\D+/g, "");
      list = list.filter((c) => {
        const n = (c.name || "").toLowerCase();
        const e = (c.email || "").toLowerCase();
        const r = (c.external_ref || "").toLowerCase();
        const p = (c.phone_e164 || "").toLowerCase();
        if (n.includes(textQ) || e.includes(textQ) || r.includes(textQ)) return true;
        if (p.includes(textQ)) return true;
        if (digitsOnly && digitsOnly !== textQ && p.includes(digitsOnly)) return true;
        return false;
      });
    }
    if (fromS && toS) {
      const { t0, t1 } = ymdInZoneToUtcBoundsMs(fromS, toS, tz);
      list = list.filter((c) => {
        const t = new Date(c.created_at).getTime();
        return t >= t0 && t <= t1;
      });
    } else if (fromS) {
      const { t0 } = ymdInZoneToUtcBoundsMs(fromS, fromS, tz);
      list = list.filter((c) => new Date(c.created_at).getTime() >= t0);
    } else if (toS) {
      const { t1 } = ymdInZoneToUtcBoundsMs(toS, toS, tz);
      list = list.filter((c) => new Date(c.created_at).getTime() <= t1);
    }
    if (locFilter) {
      if (locFilter.toLowerCase() === "unassigned") {
        list = list.filter((c) => !c.location_id);
      } else {
        list = list.filter((c) => c.location_id === locFilter);
      }
    }
    const total = list.length;
    const off = (page - 1) * pageSize;
    const slice = list.slice(off, off + pageSize);
    const has_next = off + slice.length < total;
    return { contacts: slice, total, page, page_size: pageSize, has_next };
  }
  if (path === "/api/goodword/contacts" && method === "POST") {
    const p = readBody(body) as Record<string, unknown>;
    if (!p.consent) throw new Error("You must confirm the customer has consented to receive a review request from your business.");
    const em = normEmail(p.email as string);
    const ph = normPhone(p.phone as string);
    if (!em && !ph) throw new Error("At least one of email or phone (E.164) is required");
    const sendNow = p.send_now !== false;
    const locId =
      p.location_id != null && String(p.location_id).trim() ? String(p.location_id).trim() : null;
    const out: { c: Contact; m: unknown | null; matchedExisting: boolean } = {
      c: {} as Contact,
      m: null,
      matchedExisting: false,
    };
    mutate((s) => {
      // Dedup by email or phone within this business (mirrors the server's
      // upsert_contact + the DB's unique indexes). Manually adding the same
      // person twice updates the existing record instead of creating a copy.
      const existing = findContactByEmailOrPhone(s.contacts, s.business.id, em, ph);
      let contact: Contact;
      if (existing) {
        existing.name = (p.name as string) || existing.name;
        if (em) existing.email = em;
        if (ph) existing.phone_e164 = ph;
        existing.consent_attested_at = nowIso();
        if (p.external_ref) existing.external_ref = String(p.external_ref);
        if (locId !== null) existing.location_id = locId;
        contact = existing;
        out.matchedExisting = true;
      } else {
        contact = {
          id: newId(),
          business_id: s.business.id,
          name: (p.name as string) || null,
          email: em,
          phone_e164: ph,
          source: "manual",
          consent_attested_at: nowIso(),
          unsubscribed_at: null,
          last_message_at: null,
          external_ref: p.external_ref ? String(p.external_ref) : null,
          created_at: nowIso(),
          location_id: locId,
        };
        s.contacts = [contact, ...s.contacts];
      }
      out.c = contact;
      if (sendNow) {
        const b = s.business;
        const ch = p.channel
          ? (p.channel as "email" | "sms")
          : resolveChannel(b, contact, "auto");
        const templId =
          ch === "email"
            ? (p.email_template_id as string | undefined) || null
            : (p.sms_template_id as string | undefined) || null;
        const r = enqueue(s, contact, ch, templId);
        out.m = { ...r.message, routing_token: r.routing_token, routing_link: { token: r.routing_token } };
      }
    });
    return { contact: out.c, message: out.m, matched_existing: out.matchedExisting };
  }
  if (path === "/api/goodword/contacts/unsubscribe" && method === "POST") {
    const p = readBody(body) as { contact_id: string };
    mutate((s) => {
      const c = s.contacts.find((x) => x.id === p.contact_id);
      if (c) c.unsubscribed_at = nowIso();
      for (const m of s.messages) {
        if (m.contact_id === p.contact_id && m.status === "scheduled") m.status = "cancelled";
      }
    });
    return { ok: true };
  }
  if (path === "/api/goodword/contacts/resubscribe" && method === "POST") {
    const p = readBody(body) as { contact_id: string };
    const t = nowIso();
    mutate((s) => {
      const c = s.contacts.find((x) => x.id === p.contact_id);
      if (!c) throw new Error("Contact not found");
      if (!c.unsubscribed_at) throw new Error("Contact is not opted out");
      c.unsubscribed_at = null;
      c.consent_attested_at = t;
    });
    return { ok: true };
  }
  // PATCH /api/goodword/contacts/:id — edit name/email/phone/store on an
  // existing contact. Required for parity with the real backend's
  // `updateContact`; without this the demo dies on the first edit.
  {
    const mPatch = path.match(/^\/api\/goodword\/contacts\/([^/]+)$/);
    if (mPatch && method === "PATCH") {
      const cid = mPatch[1]!;
      const p = readBody(body) as {
        name?: string | null;
        email?: string | null;
        phone?: string | null;
        external_ref?: string | null;
        location_id?: string | null;
      };
      let out: Contact | null = null;
      mutate((s) => {
        const c = s.contacts.find((x) => x.id === cid);
        if (!c) throw new Error("Contact not found");

        if ("name" in p) c.name = (p.name ?? "").trim() || null;
        if ("external_ref" in p) c.external_ref = (p.external_ref ?? "").trim() || null;

        if ("email" in p) {
          const raw = (p.email ?? "").trim();
          if (!raw) {
            c.email = null;
          } else {
            const ne = raw.toLowerCase();
            // Mirror the backend's per-business email uniqueness check.
            const dup = s.contacts.find((x) => x.id !== cid && (x.email ?? "").toLowerCase() === ne);
            if (dup) throw new Error("Another contact already uses that email.");
            c.email = ne;
          }
        }
        if ("phone" in p) {
          const raw = (p.phone ?? "").trim();
          if (!raw) {
            c.phone_e164 = null;
          } else {
            if (!raw.startsWith("+")) {
              throw new Error("Enter phone in E.164 format starting with + and country code.");
            }
            const dup = s.contacts.find((x) => x.id !== cid && x.phone_e164 === raw);
            if (dup) throw new Error("Another contact already uses that phone number.");
            c.phone_e164 = raw;
          }
        }
        if ("location_id" in p) {
          const lid = (p.location_id ?? "") as string | null;
          if (!lid) {
            c.location_id = null;
          } else {
            if (!s.locations?.some((l) => l.id === lid)) throw new Error("Store not found");
            c.location_id = lid;
          }
        }
        if (!c.email && !c.phone_e164) {
          throw new Error("A contact needs at least one of email or phone.");
        }
        out = c;
      });
      return { contact: { ...out! } };
    }
  }

  // DELETE /api/goodword/contacts/:id — remove a contact (mirrors backend).
  {
    const mDel = path.match(/^\/api\/goodword\/contacts\/([^/]+)$/);
    if (mDel && method === "DELETE") {
      const cid = mDel[1]!;
      mutate((s) => {
        s.contacts = s.contacts.filter((c) => c.id !== cid);
        // Drop any scheduled messages so the dispatcher loop doesn't strand
        // them after the contact is gone.
        s.messages = s.messages.filter(
          (m) => m.contact_id !== cid || m.status !== "scheduled",
        );
      });
      return { ok: true };
    }
  }

  {
    const ms = path.match(/\/api\/goodword\/contacts\/([^/]+)\/send$/);
    if (ms && method === "POST") {
      const p = readBody(body) as { channel?: "email" | "sms"; template_id?: string };
      const cid = ms[1]!;
      const res: { message: unknown } = { message: null as unknown };
      mutate((s) => {
        const c = s.contacts.find((x) => x.id === cid);
        if (!c) throw new Error("Contact not found");
        const b = s.business;
        const ch = p.channel
          ? resolveChannel(b, c, p.channel)
          : resolveChannel(b, c, "auto");
        const r = enqueue(s, c, ch, p.template_id);
        res.message = { ...r.message, routing_token: r.routing_token, routing_link: { token: r.routing_token } };
      });
      return { message: res.message };
    }
  }
  if (path === "/api/goodword/contacts/bulk-send" && method === "POST") {
    const p = readBody(body) as {
      contact_ids: string[];
      channel?: "email" | "sms";
      email_template_id?: string;
      sms_template_id?: string;
    };
    const res: { scheduled: number; failed: { contact_id: string; error: string }[] } = { scheduled: 0, failed: [] };
    mutate((s) => {
      for (const cid of p.contact_ids) {
        const c = s.contacts.find((x) => x.id === cid);
        if (!c) {
          res.failed.push({ contact_id: cid, error: "not found" });
          continue;
        }
        try {
          if (c.unsubscribed_at) {
            res.failed.push({ contact_id: cid, error: "unsub" });
            continue;
          }
          const ch = p.channel
            ? resolveChannel(s.business, c, p.channel)
            : resolveChannel(s.business, c, "auto");
          const templId = ch === "email" ? p.email_template_id : p.sms_template_id;
          enqueue(s, c, ch, templId);
          res.scheduled += 1;
        } catch (e) {
          res.failed.push({ contact_id: cid, error: e instanceof Error ? e.message : "err" });
        }
      }
    });
    return res;
  }
  if (path === "/api/goodword/contacts/csv-upload" && method === "POST") {
    throw new Error("Use testModePostCsv in api.ts (multipart) — this path is only for JSON dispatch");
  }
  if (path.match(/\/api\/goodword\/contacts\/[^/]+$/) && method === "DELETE") {
    const m = path.match(/\/api\/goodword\/contacts\/([^/]+)$/);
    const id = m?.[1];
    mutate((s) => {
      s.contacts = s.contacts.filter((c) => c.id !== id);
    });
    return { ok: true };
  }

  // templates CRUD
  if (path === "/api/goodword/templates" && method === "GET") {
    return { templates: getTestState().templates };
  }
  if (path === "/api/goodword/templates" && method === "POST") {
    const p = readBody(body) as { name?: string; channel?: string; subject?: string | null; body?: string; is_default?: boolean };
    const name = (p.name || "").trim();
    if (!name) throw new Error("Template name is required");
    const channel = p.channel === "sms" ? "sms" : ("email" as "email" | "sms");
    const bodyText = (p.body || "").trim();
    if (!bodyText) throw new Error("Template body is required");
    if (channel === "sms" && !/{business}/.test(bodyText)) {
      throw new Error("SMS templates must include {business} so recipients know who is contacting them. This is required for telecom compliance.");
    }
    let created: Template;
    mutate((s) => {
      const t = nowIso();
      const makeDefault = Boolean(p.is_default);
      if (makeDefault) {
        for (const tmpl of s.templates) {
          if (tmpl.channel === channel) tmpl.is_default = false;
        }
      }
      created = {
        id: newId(),
        business_id: s.business.id,
        name,
        channel,
        subject: channel === "email" ? (p.subject || null) : null,
        body: bodyText,
        is_default: makeDefault,
        created_at: t,
        updated_at: t,
      };
      s.templates.push(created);
    });
    return { template: created! };
  }
  {
    const tMatch = path.match(/^\/api\/goodword\/templates\/([^/]+)$/);
    if (tMatch && method === "PUT") {
      const id = tMatch[1]!;
      const p = readBody(body) as { name?: string; subject?: string | null; body?: string; is_default?: boolean };
      let updated: Template | undefined;
      mutate((s) => {
        const i = s.templates.findIndex((t) => t.id === id);
        if (i < 0) throw new Error("Template not found");
        const existing = s.templates[i]!;
        const newBody = p.body !== undefined ? (p.body || "").trim() : existing.body;
        if (existing.channel === "sms" && !/{business}/.test(newBody)) {
          throw new Error("SMS templates must include {business} so recipients know who is contacting them. This is required for telecom compliance.");
        }
        if (p.is_default && !existing.is_default) {
          for (const tmpl of s.templates) {
            if (tmpl.channel === existing.channel) tmpl.is_default = false;
          }
        }
        const next: Template = {
          ...existing,
          ...(p.name !== undefined ? { name: (p.name || "").trim() } : {}),
          ...(p.subject !== undefined ? { subject: existing.channel === "email" ? p.subject : null } : {}),
          ...(p.body !== undefined ? { body: (p.body || "").trim() } : {}),
          ...(p.is_default !== undefined ? { is_default: Boolean(p.is_default) } : {}),
          updated_at: nowIso(),
        };
        s.templates[i] = next;
        updated = next;
      });
      return { template: updated! };
    }
    if (tMatch && method === "DELETE") {
      const id = tMatch[1]!;
      mutate((s) => {
        s.templates = s.templates.filter((t) => t.id !== id);
      });
      return { ok: true };
    }
  }

  // campaigns
  if (path === "/api/goodword/campaigns" && method === "GET") {
    const page = Math.max(1, parseInt(q.get("page") || "1", 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(q.get("page_size") || "20", 10) || 20));
    const nameQ = (q.get("q") || "").trim().toLowerCase();
    const statusFilter = (q.get("status") || "").trim().toLowerCase();
    const fromD = (q.get("from") || "").trim();
    const toD = (q.get("to") || "").trim();
    let rows: Campaign[] = [...getTestState().campaigns].map((c) => ({
      ...c,
      step_count: c.steps?.length ?? c.step_count ?? 0,
      recipient_count: mockCampaignRecipients.filter((r) => r.campaign_id === c.id).length,
    }));
    if (nameQ) rows = rows.filter((c) => (c.name || "").toLowerCase().includes(nameQ));
    if (statusFilter && statusFilter !== "all") rows = rows.filter((c) => c.status === statusFilter);
    if (fromD) rows = rows.filter((c) => (c.created_at || "").slice(0, 10) >= fromD.slice(0, 10));
    if (toD) rows = rows.filter((c) => (c.created_at || "").slice(0, 10) <= toD.slice(0, 10));
    rows = rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const total = rows.length;
    const start = (page - 1) * pageSize;
    return { campaigns: rows.slice(start, start + pageSize), total, page, page_size: pageSize };
  }
  if (path === "/api/goodword/campaigns" && method === "POST") {
    const p = readBody(body) as {
      name?: string;
      location_id?: string | null;
      steps?: { template_id: string; delay_minutes: number }[];
      contact_ids?: string[];
      scheduled_at?: string | null;
    };
    const name = (p.name || "").trim();
    if (!name) throw new Error("Campaign name is required");
    if (!p.contact_ids?.length) {
      throw new Error("Add at least one recipient before creating the campaign.");
    }
    const stepsIn = p.steps || [];
    // Mirror the server: future scheduled_at → "scheduled", otherwise "running"
    // with recipients flipped active. No more "draft" intermediate state.
    const scheduledAt =
      p.scheduled_at && new Date(p.scheduled_at).getTime() > Date.now()
        ? p.scheduled_at
        : null;
    const initialStatus: Campaign["status"] = scheduledAt ? "scheduled" : "running";
    let created: Campaign;
    mutate((s) => {
      const id = newId();
      const t = nowIso();
      const steps = stepsIn.map((step, i) => ({
        id: newId(),
        campaign_id: id,
        step_index: i,
        template_id: step.template_id,
        delay_minutes: Number(step.delay_minutes) || 60,
      }));
      created = {
        id,
        business_id: s.business.id,
        name,
        location_id: p.location_id ?? null,
        status: initialStatus,
        scheduled_at: scheduledAt,
        started_at: initialStatus === "running" ? t : null,
        total_paused_seconds: 0,
        step_count: steps.length,
        recipient_count: p.contact_ids!.length,
        steps,
        created_at: t,
        updated_at: t,
      };
      s.campaigns.push(created);
      const recipStatus = initialStatus === "running" ? "active" : "pending";
      for (const cid of p.contact_ids!) {
        mockCampaignRecipients.push({
          recipient_id: newId(),
          campaign_id: id,
          contact_id: cid,
          status: recipStatus,
          current_step: 0,
          enrolled_at: t,
          updated_at: t,
        });
      }
    });
    return { campaign: created! };
  }
  {
    // campaign sub-routes — must be matched before the bare /{id} route
    const campActivate = path.match(/^\/api\/goodword\/campaigns\/([^/]+)\/activate$/);
    if (campActivate && method === "POST") {
      const id = campActivate[1]!;
      mutate((s) => {
        const c = s.campaigns.find((x) => x.id === id);
        if (!c) throw new Error("Campaign not found");
        c.status = "running";
        c.started_at = nowIso();
        c.updated_at = nowIso();
        for (const r of mockCampaignRecipients) {
          if (r.campaign_id === id && r.status === "pending") {
            r.status = "active";
            r.updated_at = nowIso();
          }
        }
      });
      return { ok: true };
    }
    const campPause = path.match(/^\/api\/goodword\/campaigns\/([^/]+)\/pause$/);
    if (campPause && method === "POST") {
      const id = campPause[1]!;
      mutate((s) => {
        const c = s.campaigns.find((x) => x.id === id);
        if (!c) throw new Error("Campaign not found");
        c.status = "paused";
        c.paused_at = nowIso();
        c.updated_at = nowIso();
      });
      return { ok: true };
    }
    const campResume = path.match(/^\/api\/goodword\/campaigns\/([^/]+)\/resume$/);
    if (campResume && method === "POST") {
      const id = campResume[1]!;
      mutate((s) => {
        const c = s.campaigns.find((x) => x.id === id);
        if (!c) throw new Error("Campaign not found");
        c.status = "running";
        c.paused_at = null;
        c.updated_at = nowIso();
      });
      return { ok: true };
    }
    const campStats = path.match(/^\/api\/goodword\/campaigns\/([^/]+)\/stats$/);
    if (campStats && method === "GET") {
      const id = campStats[1]!;
      const s = getTestState();
      const c = s.campaigns.find((x) => x.id === id);
      if (!c) throw new Error("Campaign not found");
      const recips = mockCampaignRecipients.filter((r) => r.campaign_id === id);
      return {
        campaign_id: id,
        status: c.status,
        total_steps: c.steps?.length ?? c.step_count ?? 0,
        total_recipients: recips.length,
        active_recipients: recips.filter((r) => r.status === "active").length,
        completed_recipients: recips.filter((r) => r.status === "completed").length,
        active_seconds: 0,
        next_scheduled_at: null,
        messages_sent: 0,
        messages_scheduled: 0,
      };
    }
    const campRecips = path.match(/^\/api\/goodword\/campaigns\/([^/]+)\/recipients$/);
    if (campRecips && method === "POST") {
      const id = campRecips[1]!;
      const p = readBody(body) as { contact_ids?: string[] };
      const s = getTestState();
      const c = s.campaigns.find((x) => x.id === id);
      if (!c) throw new Error("Campaign not found");
      const added: string[] = [];
      const errors: { contact_id: string; error: string }[] = [];
      const t = nowIso();
      for (const cid of p.contact_ids || []) {
        const contact = s.contacts.find((x) => x.id === cid);
        if (!contact) {
          errors.push({ contact_id: cid, error: "Contact not found" });
          continue;
        }
        const dup = mockCampaignRecipients.some(
          (r) => r.campaign_id === id && r.contact_id === cid && (r.status === "active" || r.status === "pending"),
        );
        if (dup) {
          errors.push({ contact_id: cid, error: "Already enrolled" });
          continue;
        }
        mockCampaignRecipients.push({
          recipient_id: newId(),
          campaign_id: id,
          contact_id: cid,
          status: c.status === "running" ? "active" : "pending",
          current_step: 0,
          enrolled_at: t,
          updated_at: t,
        });
        added.push(cid);
      }
      mutate((s) => {
        const camp = s.campaigns.find((x) => x.id === id);
        if (camp && added.length > 0) {
          camp.recipient_count = (camp.recipient_count ?? 0) + added.length;
          camp.updated_at = nowIso();
        }
      });
      return { added, errors };
    }
    if (campRecips && method === "GET") {
      const id = campRecips[1]!;
      const limit = Math.min(500, Math.max(1, parseInt(q.get("limit") || "200", 10) || 200));
      const s = getTestState();
      const c = s.campaigns.find((x) => x.id === id);
      if (!c) throw new Error("Campaign not found");
      const stepCount = c.steps?.length ?? c.step_count ?? 0;
      const rows = mockCampaignRecipients
        .filter((r) => r.campaign_id === id)
        .sort((a, b) => (a.enrolled_at < b.enrolled_at ? 1 : -1))
        .slice(0, limit)
        .map((r) => {
          const contact = s.contacts.find((x) => x.id === r.contact_id);
          if (!contact) return null;
          return {
            recipient_id: r.recipient_id,
            contact: { id: contact.id, name: contact.name, email: contact.email, phone_e164: contact.phone_e164 },
            status: r.status,
            current_step: r.current_step,
            step_count: stepCount,
            enrolled_at: r.enrolled_at,
            started_at: r.status !== "pending" ? r.enrolled_at : null,
            completed_at: r.status === "completed" ? r.updated_at : null,
            next_scheduled:
              r.status === "active" && stepCount > 0
                ? { send_at: new Date(Date.now() + 3600e3).toISOString(), step_index: r.current_step }
                : null,
          };
        })
        .filter((x) => x !== null);
      return { recipients: rows };
    }
    const campGet = path.match(/^\/api\/goodword\/campaigns\/([^/]+)$/);
    if (campGet && method === "GET") {
      const id = campGet[1]!;
      const s = getTestState();
      const c = s.campaigns.find((x) => x.id === id);
      if (!c) throw new Error("Campaign not found");
      const steps = (c.steps || []).map((step) => {
        const templ = s.templates.find((t) => t.id === step.template_id);
        return {
          ...step,
          goodword_templates: templ
            ? { id: templ.id, name: templ.name, channel: templ.channel, subject: templ.subject }
            : null,
        };
      });
      return { campaign: { ...c, steps } };
    }
  }

  if (path === "/api/goodword/me/dashboard" && method === "GET") {
    mutate((s) => {
      applyOutboundLogRetentionInPlace(s, OUTBOUND_LOG_RETENTION_DAYS);
    });
    const days = Number(q.get("days") || 30) || 30;
    return getDashboardForDays(days);
  }
  if (path === "/api/goodword/me/feedback" && method === "GET") {
    const s = getTestState();
    const onlyNeg = q.get("only_negative") === "true";
    const days = Number(q.get("days") || 90) || 90;
    const since = new Date(Date.now() - days * 864e5).toISOString();
    const raw = s.routingEvents.filter(
      (e) => e.event === "submit_feedback" && e.created_at >= since,
    );
    const fb = raw.map((e) => ({ id: e.id, rating: e.rating, comment: e.comment, created_at: e.created_at }));
    const out = onlyNeg ? fb.filter((f) => (f.rating || 5) <= 3) : fb;
    return { feedback: out };
  }
  if (path === "/api/goodword/me/messages" && method === "GET") {
    processDueSends();
    const listDays = Math.min(90, Math.max(1, Number(q.get("days")) || 30));
    mutate((s) => {
      applyOutboundLogRetentionInPlace(s, OUTBOUND_LOG_RETENTION_DAYS);
    });
    const s = getTestState();
    const sinceList = new Date(Date.now() - listDays * 864e5).toISOString();
    const limit = Math.min(500, Number(q.get("limit") || 100) || 100);
    const rows = s.messages
      .filter((m) => m.business_id === s.business.id && m.created_at >= sinceList)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, limit)
      .map((m) => {
        const link = s.links.find((l) => l.message_id === m.id);
        return { ...m, routing_token: link?.token ?? null } as ScheduledMessage;
      });
    return { messages: rows };
  }
  if (path === "/api/goodword/me/preview-routing" && method === "GET") {
    const s = getTestState();
    const link = s.links.find((l) => new Date(l.expires_at) > new Date());
    if (!link) throw new Error("No review links yet.");
    return { token: link.token, url: linkUrl(link.token) };
  }
  if (path === "/api/goodword/me/qr" && method === "GET") {
    const s = getTestState();
    const b = s.business;
    const lRaw = (q.get("l") || "").trim();
    if (lRaw) {
      const has = s.locations?.some((x) => x.id === lRaw);
      if (!has) throw new Error("That store is not in your list.");
    }
    const base = `${getPublicOriginForClientLinks()}/q/${b.id}`;
    const u = lRaw ? `${base}?l=${encodeURIComponent(lRaw)}` : base;
    return {
      url: u,
      location_id: lRaw || null,
      png_endpoint: "/api/goodword/me/qr/png",
      svg_endpoint: "/api/goodword/me/qr/svg",
      styles: [
        { id: "classic" as const, label: "Standard", description: "Test mode — all styles are generated locally." },
        { id: "dots" as const, label: "Dots", description: "Test mode" },
        { id: "rounded" as const, label: "Soft", description: "Test mode" },
      ],
    };
  }
  if (path === "/api/goodword/webhook-keys" && method === "GET") {
    return { keys: getTestState().webhooks };
  }
  if (path === "/api/goodword/webhook-keys" && method === "POST") {
    const p = readBody(body) as { label?: string };
    const w = { id: newId(), key_prefix: "t_mk_" + newToken().slice(0, 4), label: p.label || "key", revoked_at: null, last_used_at: null, created_at: nowIso() };
    const raw = "rl_t_" + newToken() + newToken();
    mutate((s) => {
      s.webhooks.unshift(w);
      s.webhookRawKeys[w.id] = raw;
    });
    return { key: raw, record: w };
  }
  {
    const mw = path.match(/\/api\/goodword\/webhook-keys\/([^/]+)$/);
    if (mw && method === "DELETE") {
      const wid = mw[1]!;
      mutate((s) => {
        const w = s.webhooks.find((x) => x.id === wid);
        if (w) w.revoked_at = nowIso();
      });
      return { ok: true };
    }
  }
  if (path === "/api/goodword/me/data-export" && method === "GET") {
    const s = getTestState();
    return {
      business: s.business,
      credits: { balance: s.credits.balance },
      contacts: s.contacts,
      messages: s.messages,
      events: s.routingEvents,
      ledger: s.credits.ledger,
    };
  }
  if (path === "/api/goodword/me/account" && method === "DELETE") {
    resetTestState();
    resetMockSessionStores();
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("user_id");
      localStorage.removeItem(LOCAL_DEMO_FLAG);
    }
    return { ok: true, deleted_user_id: userId || TEST_USER_ID };
  }

  throw new Error(`Test mode: unhandled ${method} ${path}`);
}

/** CSV for test mode: parsed fully in the browser, no network. */
export async function runTestModeCsvUpload(
  file: File,
  opts: {
    consent: boolean;
    channel: "auto" | "email" | "sms";
    enqueue: boolean;
    emailTemplateId?: string;
    smsTemplateId?: string;
    locationId?: string;
  },
): Promise<{ rows: number; imported: number; queued: number; errors: string[] }> {
  if (!opts.consent) {
    throw new Error(
      "You must attest that every customer in this CSV consented to receive a review request from your business.",
    );
  }
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 1) {
    return { rows: 0, imported: 0, queued: 0, errors: ["The file is empty."] };
  }
  const headers = lines[0]!.split(",").map((h) => h.replace(/^﻿?/, "").replace(/"/g, "").trim().toLowerCase());
  const iEmail = headers.findIndex((h) => h === "email" || h === "e-mail" || h.endsWith(" email"));
  const iPhone = headers.findIndex((h) => h.includes("phone") || h === "mobile" || h === "tel");
  const iName = headers.findIndex((h) => h === "name" || h === "first name" || h === "full name");
  if (iEmail < 0 && iPhone < 0) {
    return { rows: 0, imported: 0, queued: 0, errors: ['Add a column header named "email" and/or "phone" (E.164, e.g. +447...).'] };
  }
  const csvLoc = opts.locationId && String(opts.locationId).trim() ? String(opts.locationId).trim() : null;
  let rowCount = 0;
  // ``imported`` counts every row we successfully processed — including ones
  // that merged into an existing contact, matching how the real backend
  // reports the number (see csv_intake.py).
  let imported = 0;
  let queued = 0;
  const errors: string[] = [];
  // Track in-CSV duplicates as well, so a file with the same email twice
  // collapses to a single contact, like the server does.
  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  for (let n = 1; n < lines.length; n++) {
    const cells = lines[n]!.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    rowCount += 1;
    const em = iEmail >= 0 ? normEmail(cells[iEmail]) : null;
    const ph = iPhone >= 0 ? normPhone(cells[iPhone]) : null;
    if (!em && !ph) {
      errors.push(`row ${n + 1}: missing email and phone`);
      continue;
    }
    if ((em && seenEmails.has(em)) || (ph && seenPhones.has(ph))) {
      // Same person earlier in this CSV — silently skip the duplicate row.
      continue;
    }
    if (em) seenEmails.add(em);
    if (ph) seenPhones.add(ph);
    const name = iName >= 0 && cells[iName!] ? cells[iName]!.slice(0, 120) : null;
    try {
      mutate((s) => {
        // Dedup against contacts already in the test fixture — repeat CSV
        // imports of the same customer should update, not stack.
        const existing = findContactByEmailOrPhone(s.contacts, s.business.id, em, ph);
        let c: Contact;
        if (existing) {
          if (name) existing.name = name;
          if (em) existing.email = em;
          if (ph) existing.phone_e164 = ph;
          existing.consent_attested_at = nowIso();
          if (csvLoc !== null) existing.location_id = csvLoc;
          c = existing;
        } else {
          c = {
            id: newId(),
            business_id: s.business.id,
            name,
            email: em,
            phone_e164: ph,
            source: "csv",
            consent_attested_at: nowIso(),
            unsubscribed_at: null,
            last_message_at: null,
            external_ref: null,
            created_at: nowIso(),
            location_id: csvLoc,
          };
          s.contacts = [c, ...s.contacts];
        }
        imported += 1;
        if (opts.enqueue) {
          const b = s.business;
          let ch: "email" | "sms" = "email";
          if (opts.channel === "email") ch = "email";
          else if (opts.channel === "sms") ch = "sms";
          else {
            if (em) ch = "email";
            else ch = "sms";
          }
          if (ch === "sms" && !SMS_OK(b.country_code)) ch = "email";
          if (ch === "email" && !c.email) {
            throw new Error("row needs email in an SMS-restricted country");
          }
          if (ch === "sms" && !c.phone_e164) {
            throw new Error("row needs E.164 phone for SMS");
          }
          const templId = ch === "email" ? opts.emailTemplateId : opts.smsTemplateId;
          enqueue(s, c, ch, templId);
          queued += 1;
        }
      });
    } catch (e) {
      errors.push(`row ${n + 1}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }
  return { rows: rowCount, imported, queued, errors };
}
