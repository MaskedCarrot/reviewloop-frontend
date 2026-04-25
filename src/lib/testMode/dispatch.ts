import type { Business, BusinessLocation, Contact, ReviewDestination, ScheduledMessage } from "@/types";
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

/** In-memory follow-up campaign defs for browser test mode (lost on full reload). */
type MockSequenceRow = {
  id: string;
  name: string;
  is_active: boolean;
  location_id: string | null;
  review_link_style: "hosted" | "direct_google" | "direct_yelp";
  steps: { campaign_id: string; delay_after_previous_minutes: number; step_index: number }[];
  created_at: string;
  updated_at: string;
};
const mockSequenceStore: MockSequenceRow[] = [];

type MockSequenceEnrollment = {
  enrollment_id: string;
  sequence_id: string;
  contact_id: string;
  status: "active" | "completed" | "stopped_replied" | "cancelled";
  created_at: string;
  updated_at: string;
};
const mockSequenceEnrollments: MockSequenceEnrollment[] = [];

/** Clear follow-up campaign rows when re-seeding demo or deleting the test account. */
export function resetMockSessionStores() {
  mockSequenceStore.length = 0;
  mockSequenceEnrollments.length = 0;
}

function activeEnrollmentCount(seqId: string) {
  return mockSequenceEnrollments.filter((e) => e.sequence_id === seqId && e.status === "active").length;
}

function enrollmentStatsAggregate(seqId: string) {
  const list = mockSequenceEnrollments.filter((e) => e.sequence_id === seqId);
  return {
    total: list.length,
    active: list.filter((e) => e.status === "active").length,
    completed: list.filter((e) => e.status === "completed").length,
    stopped_replied: list.filter((e) => e.status === "stopped_replied").length,
    cancelled: list.filter((e) => e.status === "cancelled").length,
  };
}

const SMS_OK = (cc: string) => ["GB", "IE", "US", "AU", "NZ", "DE", "FR", "ES", "IT", "NL"].includes((cc || "").toUpperCase());

function mockSequenceToDetail(r: MockSequenceRow) {
  const campIndex = (cid: string) => getTestState().campaigns.find((c) => c.id === cid) || null;
  const steps = r.steps.map((s) => ({
    id: `${r.id}-st-${s.step_index}`,
    sequence_id: r.id,
    step_index: s.step_index,
    campaign_id: s.campaign_id,
    delay_after_previous_minutes: s.delay_after_previous_minutes,
    campaign: campIndex(s.campaign_id),
  }));
  return {
    id: r.id,
    name: r.name,
    is_active: r.is_active,
    business_id: getTestState().business.id,
    location_id: r.location_id,
    review_link_style: r.review_link_style,
    created_at: r.created_at,
    updated_at: r.updated_at,
    steps,
  };
}

function requireUser(uid: string | null): void {
  if (!uid) throw new Error("Missing session");
  // All mock data is local; any non-empty X-User-Id is ok (stale Google ids are common after toggling test mode).
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

function pickDefaultCampaign(s: TestModeState, channel: "email" | "sms") {
  return s.campaigns.find((c) => c.channel === channel && c.is_default) || s.campaigns.find((c) => c.channel === channel);
}

function pickCampaignForChannel(
  s: TestModeState,
  ch: "email" | "sms",
  campaignId: string | null | undefined
) {
  const id = (campaignId || "").trim();
  if (id) {
    const c = s.campaigns.find((x) => x.id === id);
    if (!c) throw new Error("Campaign not found");
    if (c.channel !== ch) throw new Error("Selected template is for a different channel than this send");
    return c;
  }
  const d = pickDefaultCampaign(s, ch);
  if (!d) throw new Error("No campaign");
  return d;
}

function defaultDelayMins(b: Business, camp: { delay_minutes: number } | null) {
  return camp ? camp.delay_minutes : b.default_send_delay_minutes || 60;
}

const _TEST_PLATFORM_LABEL: Record<string, string> = {
  yelp: "Yelp",
  facebook: "Facebook",
  tripadvisor: "TripAdvisor",
  fb: "Facebook",
  trustpilot: "Trustpilot",
};

/** Mirrors backend `build_review_destinations` for the browser mock API. */
function testReviewDestinationsForLocation(
  loc: BusinessLocation | undefined,
  fallbackGmb: string,
): ReviewDestination[] {
  if (!loc) {
    const g = (fallbackGmb || "").trim();
    return g ? [{ id: "google", label: "Google", url: g }] : [];
  }
  const out: ReviewDestination[] = [];
  const gmb = (loc.gmb_review_url || "").trim();
  if (gmb) out.push({ id: "google", label: "Google", url: gmb });
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

function resolveChannel(
  b: Business,
  c: Contact,
  prefer?: "auto" | "email" | "sms"
): "email" | "sms" {
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
  return new Date(Date.now() + Math.max(0, delayMin) * 60e3).toISOString();
}

function costFor(s: TestModeState, b: Business, ch: "email" | "sms", camp: { id: string } | null) {
  if (ch === "email") return EMAIL_CREDIT;
  return SMS_CREDIT; // 1 seg approx
}

function resolveTestLocationIdForSend(
  s: TestModeState,
  contact: Contact,
  camp: { id: string; location_id?: string | null } | null,
): string | null {
  if (camp && (camp.location_id || "").toString().trim()) {
    const lid = (camp.location_id as string).toString().trim();
    if (s.locations?.some((l) => l.id === lid)) return lid;
  }
  if (contact.location_id) return contact.location_id;
  if (s.business.default_location_id) return s.business.default_location_id;
  return s.locations?.[0]?.id ?? null;
}

function enqueue(
  s: TestModeState,
  contact: Contact,
  ch: "email" | "sms",
  campaignId?: string | null
): { message: ScheduledMessage; routing_token: string } {
  const b = s.business;
  const camp = pickCampaignForChannel(s, ch, campaignId);
  const locId = resolveTestLocationIdForSend(s, contact, camp);
  const m: ScheduledMessage = {
    id: newId(),
    business_id: b.id,
    contact_id: contact.id,
    campaign_id: camp.id,
    channel: ch,
    send_at: scheduleSendAt(b, defaultDelayMins(b, camp)),
    status: "scheduled",
    provider_id: null,
    error: null,
    cost_credits: costFor(s, b, ch, camp),
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
  auth: boolean
): unknown {
  const u = new URL(fullPath, "https://test.local");
  const path = u.pathname;
  const q = u.searchParams;

  const readBody = (b: unknown) => (b && typeof b === "object" ? (b as Record<string, unknown>) : {});

  // no auth
  if (method === "GET" && path === "/api/reviewloop/config") {
    return {
      country_allowlist: ["GB", "IE", "US", "AU", "NZ", "DE", "FR", "ES", "IT", "NL", "SE", "DK", "NO", "FI", "CH", "BE", "AT", "PT", "PL"],
      sms_supported_countries: ["GB", "IE", "US", "AU", "NZ", "DE", "FR", "ES", "IT", "NL", "SE", "DK", "NO", "FI", "CH", "BE", "AT", "PT", "PL"],
      email_credits: EMAIL_CREDIT,
      sms_credits: SMS_CREDIT,
      credit_rate_notes: "In-app preview: fixed test rates. Production uses your host's per-country file.",
      // Same shape as `list_platforms_for_config_api()` so Store locations + chips show every supported site in local mock.
      review_platforms: [
        { id: "google", label: "Google", description: "Link from your Google Business profile", link_source: "gmb", sort: 0 },
        { id: "yelp", label: "Yelp", description: "Link to your business on Yelp", link_source: "custom", sort: 10 },
        { id: "facebook", label: "Facebook", description: "Page or review link on Facebook", link_source: "custom", sort: 20 },
        { id: "tripadvisor", label: "TripAdvisor", description: "Property link on TripAdvisor", link_source: "custom", sort: 30 },
        { id: "trustpilot", label: "Trustpilot", description: "Business profile on Trustpilot", link_source: "custom", sort: 40 },
      ],
    };
  }

  if (method === "GET" && path === "/api/reviewloop/config/send-rates") {
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
        "In-app preview: example rates (higher US SMS in sample). Production values come from your host send_rates in reviewloop_pricing.yaml.",
      countries,
    };
  }

  if (method === "GET" && path === "/api/reviewloop/config/membership-preview") {
    const raw = (q.get("country") || "").trim();
    const cc = raw.length === 2 ? raw.toUpperCase() : null;
    const mPro = cc === "US" ? 250 : 200;
    return {
      country_code: cc,
      tiers: [
        { key: "pro", display_name: "Pro", display_price: "$7 / month", monthly_credits: mPro, polar_configured: true },
        { key: "pro_500", display_name: "Pro 500", display_price: "$15 / month", monthly_credits: 500, polar_configured: true },
      ],
      notes: "Test mode: sample Pro tiers. Live stack uses your pricing YAML and business country at checkout.",
    };
  }

  if (method === "GET" && path === "/api/reviewloop/me/credit-rates") {
    return {
      country_code: (getTestState().business?.country_code || "GB").toUpperCase(),
      email_credits: EMAIL_CREDIT,
      sms_credits_per_segment: SMS_CREDIT,
      source: "default",
      notes: "Test mode: sample rates (see billing for copy).",
    };
  }

  if (method === "GET" && path === "/api/reviewloop/me/membership-offers") {
    return {
      country_code: (getTestState().business?.country_code || "GB").toUpperCase(),
      tiers: [
        { key: "pro", display_name: "Pro", display_price: "$7 / month", monthly_credits: 200, polar_configured: true },
        { key: "pro_500", display_name: "Pro 500", display_price: "$15 / month", monthly_credits: 500, polar_configured: true },
      ],
      notes: "Test mode: two sample Pro options. Live stack uses your pricing YAML and Polar product ids.",
    };
  }

  {
    const rpub = path.match(/^\/api\/reviewloop\/public\/r\/([^/]+)$/);
    if (rpub && method === "GET") {
      let biz: {
        id: string;
        name: string;
        from_name: string | null;
        gmb_review_url: string;
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
        const review_destinations = testReviewDestinationsForLocation(loc, s.business.gmb_review_url);
        const gmbForBiz = (review_destinations.find((d) => d.id === "google")?.url || "").trim();
        s.routingEvents.push({
          id: newId(),
          link_id: link.id,
          business_id: link.business_id,
          event: "view",
          rating: null,
          comment: null,
          created_at: nowIso(),
        });
        biz = {
          id: s.business.id,
          name: s.business.name,
          from_name: s.business.from_name,
          gmb_review_url: gmbForBiz,
          branding_color: s.business.branding_color,
          review_destinations,
          location_id: loc?.id ?? null,
        };
      });
      return { business: biz! };
    }
  }
  {
    const rcl = path.match(/^\/api\/reviewloop\/public\/r\/([^/]+)\/click-google$/);
    if (rcl && method === "POST") {
      let gmb: string;
      mutate((s) => {
        const link = s.links.find((l) => l.token === rcl[1]);
        if (!link) throw new Error("Link not found");
        const msg = s.messages.find((m) => m.id === link.message_id);
        const locs = s.locations || [];
        const loc = msg?.location_id
          ? locs.find((l) => l.id === msg.location_id)
          : locs.find((l) => l.is_default) || locs[0];
        const dests = testReviewDestinationsForLocation(loc, s.business.gmb_review_url);
        const hit = dests.find((d) => d.id === "google");
        if (!hit?.url?.trim()) throw new Error("No Google review URL is set for this store");
        gmb = hit.url.trim();
        s.routingEvents.push({
          id: newId(),
          link_id: link.id,
          business_id: link.business_id,
          event: "click_google",
          rating: null,
          comment: null,
          created_at: nowIso(),
        });
      });
      return { ok: true, redirect_url: gmb! };
    }
  }
  {
    const rout = path.match(/^\/api\/reviewloop\/public\/r\/([^/]+)\/outbound$/);
    if (rout && method === "POST") {
      const p = readBody(body) as { platform?: string };
      const platform = String(p.platform || "")
        .trim()
        .toLowerCase();
      if (!platform) throw new Error("platform required");
      let redirect: string;
      mutate((s) => {
        const link = s.links.find((l) => l.token === rout[1]);
        if (!link) throw new Error("Link not found");
        const msg = s.messages.find((m) => m.id === link.message_id);
        const locs = s.locations || [];
        const loc = msg?.location_id
          ? locs.find((l) => l.id === msg.location_id)
          : locs.find((l) => l.is_default) || locs[0];
        const dests = testReviewDestinationsForLocation(loc, s.business.gmb_review_url);
        const hit = dests.find((d) => d.id === platform);
        if (!hit) throw new Error("Unknown or unset destination for this request");
        redirect = hit.url;
        s.routingEvents.push({
          id: newId(),
          link_id: link.id,
          business_id: link.business_id,
          event: "click_outbound",
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
    const rfb = path.match(/^\/api\/reviewloop\/public\/r\/([^/]+)\/feedback$/);
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
    const mq = path.match(/^\/api\/reviewloop\/public\/q\/([^/]+)$/);
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
      const review_destinations = testReviewDestinationsForLocation(loc, s.business.gmb_review_url);
      const gmbForBiz = (review_destinations.find((d) => d.id === "google")?.url || "").trim();
      return {
        business: {
          id: s.business.id,
          name: s.business.name,
          from_name: s.business.from_name,
          gmb_review_url: gmbForBiz,
          branding_color: s.business.branding_color,
          review_destinations,
          location_id: resolvedLocId,
        },
      };
    }
  }
  {
    const mq2 = path.match(/^\/api\/reviewloop\/public\/q\/([^/]+)\/optin$/);
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
        const contact: Contact = {
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

  if (method === "POST" && path === "/api/auth/google") {
    return { user: { ...getTestState().user } };
  }
  if (method === "POST" && path === "/api/reviewloop/dev/bootstrap") {
    return { user: { ...getTestState().user }, seed: { seeded: true, test_mode: true } };
  }
  if (method === "GET" && path.startsWith("/api/users/")) {
    return { ...getTestState().user };
  }

  if (auth) requireUser(userId);

  if (path === "/api/billing/checkout" && method === "POST") {
    const p = readBody(body) as { success_url?: string; tier_key?: string };
    const grant = p.tier_key === "pro_500" ? 500 : PRO_MONTHLY_CREDITS;
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
  if (path === "/api/reviewloop/me/credits/topup" && method === "POST") {
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
  if (path === "/api/reviewloop/me/credits" && method === "GET") {
    processDueSends();
    return { ...getTestState().credits, ledger: [...getTestState().credits.ledger] };
  }
  if (path === "/api/reviewloop/me/credits/settings" && method === "PATCH") {
    const p = readBody(body) as { low_balance_threshold: number };
    let out = 0;
    mutate((s) => {
      s.credits.low_balance_threshold = p.low_balance_threshold;
      out = s.credits.low_balance_threshold;
    });
    return { low_balance_threshold: out };
  }
  if (path === "/api/reviewloop/me/business" && method === "GET") {
    return { business: { ...getTestState().business } };
  }
  if (path === "/api/reviewloop/me/locations" && method === "GET") {
    const s = getTestState();
    const locs = s.locations ?? [];
    const withLinks = locs.map((loc) => ({ ...loc, platform_links: loc.platform_links || {} }));
    return {
      locations: withLinks,
      default_location_id: s.business.default_location_id ?? null,
    };
  }
  {
    const mPlPut = path.match(/^\/api\/reviewloop\/me\/locations\/([^/]+)\/platform-links$/);
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
          if (!pid || pid === "google") {
            throw new Error("Use the Google field for Google, not platform links.");
          }
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
  if (path === "/api/reviewloop/me/locations" && method === "POST") {
    const p = readBody(body) as {
      name?: string;
      gmb_review_url?: string;
      platform_links?: Record<string, string>;
      is_default?: boolean;
      sort_index?: number;
    };
    const name = (p.name || "").trim();
    if (!name) throw new Error("Store name is required");
    const gmb = (p.gmb_review_url || "").trim();
    if (gmb) {
      try {
        const h = new URL(gmb);
        if (!h.protocol.startsWith("http")) throw new Error("Invalid URL");
      } catch {
        throw new Error("If you add a link, it must be a full http(s) URL, or leave the field empty");
      }
    }
    const fromPl: Record<string, string> = {};
    if (p.platform_links) {
      for (const [k, v] of Object.entries(p.platform_links)) {
        const pid = String(k).trim();
        if (!pid || pid === "google") {
          throw new Error("Use the Google field for Google when creating a store, not platform_links");
        }
        const u = String(v).trim();
        if (!u) continue;
        if (!u.startsWith("https://")) throw new Error("Yelp and other non-Google links must be https:// URLs");
        try {
          void new URL(u);
        } catch {
          throw new Error('If you add a link, it must be a full https URL, or choose "No first link"');
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
        gmb_review_url: gmb,
        sort_index: p.sort_index ?? 0,
        is_default: makeDef,
        created_at: t,
        updated_at: t,
        platform_links: { ...fromPl } as Record<string, string>,
      };
      s.locations = [...s.locations, created];
      if (makeDef) {
        s.business = {
          ...s.business,
          default_location_id: created.id,
          gmb_review_url: (gmb || s.business.gmb_review_url) as string,
          updated_at: t,
        };
      }
    });
    return { location: { ...created!, platform_links: created!.platform_links || {} } };
  }
  if (path === "/api/reviewloop/me/bootstrap" && method === "GET") {
    processDueSends();
    const s = getTestState();
    const tzn = (s.business?.timezone || "UTC").trim() || "UTC";
    const withLinks = (s.locations ?? []).map((loc) => ({ ...loc, platform_links: loc.platform_links || {} }));
    return {
      business: { ...s.business },
      config: dispatchTestMode("/api/reviewloop/config", "GET", null, null, false) as Record<string, unknown>,
      credits: { ...s.credits, ledger: [...s.credits.ledger] },
      locations: { locations: withLinks, default_location_id: s.business.default_location_id ?? null },
      ingest_presets: computeIngestPresetsForZone(tzn),
      display_timezone: tzn,
    } as const;
  }
  if (path === "/api/reviewloop/me/business" && method === "POST") {
    const p = readBody(body) as Record<string, unknown>;
    let out: Business;
    mutate((s) => {
      s.business = { ...s.business, ...p, updated_at: nowIso() } as Business;
      out = s.business;
    });
    return { business: { ...out! } };
  }
  if (path === "/api/reviewloop/contacts/lookup" && method === "POST") {
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
  if (path === "/api/reviewloop/contacts/ingest-presets" && method === "GET") {
    return computeIngestPresetsForZone((getTestState().business?.timezone || "UTC").trim() || "UTC");
  }
  if (path === "/api/reviewloop/contacts" && method === "GET") {
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
      list = list.filter((c) => {
        const n = (c.name || "").toLowerCase();
        const e = (c.email || "").toLowerCase();
        const r = (c.external_ref || "").toLowerCase();
        return n.includes(textQ) || e.includes(textQ) || r.includes(textQ);
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
  if (path === "/api/reviewloop/contacts" && method === "POST") {
    const p = readBody(body) as Record<string, unknown>;
    if (!p.consent) throw new Error("You must confirm the customer has consented to receive a review request from your business.");
    const em = normEmail(p.email as string);
    const ph = normPhone(p.phone as string);
    if (!em && !ph) throw new Error("At least one of email or phone (E.164) is required");
    const sendNow = p.send_now !== false;
    const locId =
      p.location_id != null && String(p.location_id).trim() ? String(p.location_id).trim() : null;
    const out: { c: Contact; m: unknown | null } = { c: {} as Contact, m: null };
    mutate((s) => {
      const contact: Contact = {
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
      out.c = contact;
      if (sendNow) {
        const b = s.business;
        const ch = p.channel
          ? (p.channel as "email" | "sms")
          : resolveChannel(b, contact, "auto");
        const camId =
          ch === "email"
            ? (p.email_campaign_id as string | undefined) || null
            : (p.sms_campaign_id as string | undefined) || null;
        const r = enqueue(s, contact, ch, camId);
        out.m = { ...r.message, routing_token: r.routing_token, routing_link: { token: r.routing_token } };
      }
    });
    return { contact: out.c, message: out.m };
  }
  if (path === "/api/reviewloop/contacts/unsubscribe" && method === "POST") {
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
  if (path === "/api/reviewloop/contacts/resubscribe" && method === "POST") {
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
  {
    const ms = path.match(/\/api\/reviewloop\/contacts\/([^/]+)\/send$/);
    if (ms && method === "POST") {
      const p = readBody(body) as { channel?: "email" | "sms"; campaign_id?: string };
      const cid = ms[1]!;
      const res: { message: unknown } = { message: null as unknown };
      mutate((s) => {
        const c = s.contacts.find((x) => x.id === cid);
        if (!c) throw new Error("Contact not found");
        const b = s.business;
        const ch = p.channel
          ? resolveChannel(b, c, p.channel)
          : resolveChannel(b, c, "auto");
        const r = enqueue(s, c, ch, p.campaign_id);
        res.message = { ...r.message, routing_token: r.routing_token, routing_link: { token: r.routing_token } };
      });
      return { message: res.message };
    }
  }
  if (path === "/api/reviewloop/contacts/bulk-send" && method === "POST") {
    const p = readBody(body) as {
      contact_ids: string[];
      channel?: "email" | "sms";
      email_campaign_id?: string;
      sms_campaign_id?: string;
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
          const camId = ch === "email" ? p.email_campaign_id : p.sms_campaign_id;
          enqueue(s, c, ch, camId);
          res.scheduled += 1;
        } catch (e) {
          res.failed.push({ contact_id: cid, error: e instanceof Error ? e.message : "err" });
        }
      }
    });
    return res;
  }
  if (path === "/api/reviewloop/contacts/csv-upload" && method === "POST") {
    throw new Error("Use testModePostCsv in api.ts (multipart) — this path is only for JSON dispatch");
  }
  if (path.match(/\/api\/reviewloop\/contacts\/[^/]+$/) && method === "DELETE") {
    const m = path.match(/\/api\/reviewloop\/contacts\/([^/]+)$/);
    const id = m?.[1];
    mutate((s) => {
      s.contacts = s.contacts.filter((c) => c.id !== id);
    });
    return { ok: true };
  }
  if (path === "/api/reviewloop/campaigns" && method === "GET") {
    return { campaigns: getTestState().campaigns };
  }
  if (path === "/api/reviewloop/campaigns" && method === "POST") {
    const p = readBody(body) as Record<string, unknown>;
    const locRaw = p.location_id;
    const location_id =
      locRaw === null || locRaw === undefined || locRaw === ""
        ? null
        : (typeof locRaw === "string" || typeof locRaw === "number" ? String(locRaw) : null);
    const camp = {
      id: newId(),
      business_id: getTestState().business.id,
      name: p.name,
      channel: p.channel,
      template_subject: p.channel === "sms" ? null : p.template_subject,
      template_body: p.template_body,
      delay_minutes: Number(p.delay_minutes) || 60,
      is_default: Boolean(p.is_default),
      location_id,
      created_at: nowIso(),
      updated_at: nowIso(),
    } as any;
    mutate((s) => s.campaigns.push(camp));
    return { campaign: camp };
  }
  if (path.match(/\/api\/reviewloop\/campaigns\/[^/]+$/) && method === "PUT") {
    const id = path.split("/").pop()!;
    const p = readBody(body) as Record<string, unknown>;
    const locRaw = p.location_id;
    const location_id =
      "location_id" in p
        ? locRaw === null || locRaw === undefined || locRaw === ""
          ? null
          : String(locRaw)
        : undefined;
    mutate((s) => {
      const i = s.campaigns.findIndex((c) => c.id === id);
      if (i < 0) return;
      const next = { ...s.campaigns[i], ...p, updated_at: nowIso() } as any;
      if (location_id !== undefined) next.location_id = location_id;
      s.campaigns[i] = next;
    });
    return { campaign: getTestState().campaigns.find((c) => c.id === id)! };
  }
  if (path.match(/\/api\/reviewloop\/campaigns\/[^/]+$/) && method === "DELETE") {
    const id = path.split("/").pop()!;
    mutate((s) => (s.campaigns = s.campaigns.filter((c) => c.id !== id)));
    return { ok: true };
  }
  {
    if (path === "/api/reviewloop/sequences" && method === "GET") {
      const page = Math.max(1, parseInt(q.get("page") || "1", 10) || 1);
      const pageSize = Math.min(2000, Math.max(1, parseInt(q.get("page_size") || "20", 10) || 20));
      const nameQ = (q.get("q") || "").trim().toLowerCase();
      const st = (q.get("status") || "all").trim().toLowerCase();
      const fromD = (q.get("from") || "").trim();
      const toD = (q.get("to") || "").trim();
      const rows0 = mockSequenceStore.map((r) => {
        const activeEnrollments = activeEnrollmentCount(r.id);
        const listStatus = r.is_active
          ? "running"
          : activeEnrollments > 0
            ? "paused"
            : "completed";
        return {
          id: r.id,
          name: r.name,
          is_active: r.is_active,
          list_status: listStatus,
          step_count: r.steps.length,
          active_enrollments: activeEnrollments,
          location_id: r.location_id,
          review_link_style: r.review_link_style,
          created_at: r.created_at,
          updated_at: r.updated_at,
        };
      });
      let rows = nameQ
        ? rows0.filter((x) => (x.name || "").toLowerCase().includes(nameQ))
        : rows0.slice();
      if (fromD) {
        const lo = fromD.length >= 8 ? fromD.slice(0, 10) : fromD;
        rows = rows.filter((x) => (x.created_at || "").slice(0, 10) >= lo);
      }
      if (toD) {
        const hi = toD.length >= 8 ? toD.slice(0, 10) : toD;
        rows = rows.filter((x) => (x.created_at || "").slice(0, 10) <= hi);
      }
      if (st === "running") {
        rows = rows.filter((x) => x.is_active);
      } else if (st === "paused") {
        rows = rows.filter((x) => !x.is_active && (x as { list_status: string }).list_status === "paused");
      } else if (st === "completed") {
        rows = rows.filter((x) => !x.is_active && (x as { list_status: string }).list_status === "completed");
      }
      const total = rows.length;
      const start = (page - 1) * pageSize;
      const pageRows = rows.slice(start, start + pageSize);
      return { sequences: pageRows, total, page, page_size: pageSize };
    }
    if (path === "/api/reviewloop/sequences" && method === "POST") {
      const p = readBody(body) as {
        name?: string;
        is_active?: boolean;
        location_id?: string | null;
        review_link_style?: string;
        steps?: { campaign_id: string; delay_after_previous_minutes: number }[];
      };
      const stepsIn = p.steps && p.steps.length ? p.steps : [{ campaign_id: "", delay_after_previous_minutes: 60 }];
      const id = newId();
      const now = nowIso();
      const steps = stepsIn.map((s, i) => ({ ...s, step_index: i }));
      const rs = (p.review_link_style || "hosted") as string;
      const rstyle: MockSequenceRow["review_link_style"] =
        rs === "direct_google" || rs === "direct_yelp" ? (rs as MockSequenceRow["review_link_style"]) : "hosted";
      const row: MockSequenceRow = {
        id,
        name: String(p.name || "Campaign").trim() || "Campaign",
        is_active: p.is_active !== false,
        location_id: p.location_id && String(p.location_id).trim() ? String(p.location_id).trim() : null,
        review_link_style: rstyle,
        steps,
        created_at: now,
        updated_at: now,
      };
      mockSequenceStore.push(row);
      return mockSequenceToDetail(row);
    }
    {
      const statsM = path.match(/^\/api\/reviewloop\/sequences\/([^/]+)\/stats$/);
      if (statsM && method === "GET") {
        const sid = statsM[1]!;
        const r = mockSequenceStore.find((x) => x.id === sid);
        const ev = enrollmentStatsAggregate(sid);
        return {
          sequence_id: sid,
          step_count: r ? r.steps.length : 0,
          enrollments: {
            active: ev.active,
            completed: ev.completed,
            stopped_replied: ev.stopped_replied,
            cancelled: ev.cancelled,
            total: ev.total,
          },
          messages_sent: 0,
          step_sends_count: 0,
          finished_all_steps_count: ev.completed,
          scheduled_messages_pending: 0,
        };
      }
      if (path.match(/^\/api\/reviewloop\/sequences\/([^/]+)\/enrollments$/) && method === "GET") {
        const em = path.match(/^\/api\/reviewloop\/sequences\/([^/]+)\/enrollments$/);
        const sequenceId = em?.[1] || "";
        const limit = Math.min(500, Math.max(1, parseInt(q.get("limit") || "200", 10) || 200));
        const s = getTestState();
        const seq = mockSequenceStore.find((x) => x.id === sequenceId);
        const sc = seq ? seq.steps.length : 0;
        const nextAt = (stepIdx: number) => ({
          send_at: new Date(Date.now() + 3600e3).toISOString(),
          step_index: stepIdx,
        });
        const rows = mockSequenceEnrollments
          .filter((e) => e.sequence_id === sequenceId)
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
          .slice(0, limit)
          .map((e) => {
            const c = s.contacts.find((x) => x.id === e.contact_id);
            if (!c) return null;
            return {
              enrollment_id: e.enrollment_id,
              contact: {
                id: c.id,
                name: c.name || "—",
                email: c.email,
                phone_e164: c.phone_e164,
              },
              status: e.status,
              created_at: e.created_at,
              updated_at: e.updated_at,
              step_count: sc,
              last_sent_step_index: null,
              messages_sent: 0,
              next_scheduled: e.status === "active" && sc > 0 ? nextAt(0) : null,
            };
          })
          .filter((x) => x != null);
        return { enrollments: rows };
      }
      {
        const stopAllM = path.match(/^\/api\/reviewloop\/sequences\/([^/]+)\/stop-active$/);
        if (stopAllM && method === "POST") {
          const sequenceId = stopAllM[1]!;
          const t = nowIso();
          let stopped = 0;
          for (const e of mockSequenceEnrollments) {
            if (e.sequence_id === sequenceId && e.status === "active") {
              e.status = "cancelled";
              e.updated_at = t;
              stopped += 1;
            }
          }
          return { ok: true, stopped };
        }
        const stopOneM = path.match(
          /^\/api\/reviewloop\/sequences\/([^/]+)\/enrollments\/([^/]+)\/stop$/,
        );
        if (stopOneM && method === "POST") {
          const sequenceId = stopOneM[1]!;
          const enrollmentId = stopOneM[2]!;
          const row = mockSequenceEnrollments.find(
            (e) => e.sequence_id === sequenceId && e.enrollment_id === enrollmentId,
          );
          if (row) {
            row.status = "cancelled";
            row.updated_at = nowIso();
          }
          return { ok: true, stopped: true };
        }
        const stopSeq = path.match(/^\/api\/reviewloop\/sequences\/([^/]+)\/stop$/);
        if (stopSeq && method === "POST") {
          const r = mockSequenceStore.find((x) => x.id === stopSeq[1]);
          if (!r) throw new Error("Campaign not found");
          r.is_active = false;
          r.updated_at = nowIso();
          return { ok: true, is_active: false };
        }
        const resumeSeq = path.match(/^\/api\/reviewloop\/sequences\/([^/]+)\/resume$/);
        if (resumeSeq && method === "POST") {
          const r = mockSequenceStore.find((x) => x.id === resumeSeq[1]);
          if (!r) throw new Error("Campaign not found");
          r.is_active = true;
          r.updated_at = nowIso();
          return { ok: true, is_active: true };
        }
      }
    }
    const seqGet = path.match(/^\/api\/reviewloop\/sequences\/([^/]+)$/);
    if (seqGet && method === "GET" && !path.includes("/enroll")) {
      const r = mockSequenceStore.find((x) => x.id === seqGet[1]);
      if (!r) throw new Error("Campaign not found");
      return mockSequenceToDetail(r);
    }
    if (seqGet && method === "PUT") {
      const id = seqGet[1]!;
      if (!mockSequenceStore.find((x) => x.id === id)) throw new Error("Campaign not found");
      throw new Error(
        "This campaign can't be edited after it's been created. You can open it, stop it, and use Analytics for history.",
      );
    }
    if (seqGet && method === "DELETE") {
      const id = seqGet[1]!;
      if (mockSequenceStore.findIndex((x) => x.id === id) < 0) throw new Error("Campaign not found");
      throw new Error(
        "Campaigns can't be deleted. Stop the campaign to prevent new people and new follow-up steps. Scheduled messages that are already queued will still send.",
      );
    }
    const enrollM = path.match(/^\/api\/reviewloop\/sequences\/([^/]+)\/enroll$/);
    if (enrollM && method === "POST") {
      const sequenceId = enrollM[1]!;
      const seq = mockSequenceStore.find((x) => x.id === sequenceId);
      if (!seq) throw new Error("Campaign not found");
      const p = readBody(body) as { contact_ids?: string[]; location_id?: string };
      const rawIds = (p.contact_ids || []).map(String);
      const s = getTestState();
      const enrolled: string[] = [];
      const errors: { contact_id: string; error: string }[] = [];
      const t = nowIso();
      for (const cid of rawIds) {
        const c = s.contacts.find((x) => x.id === cid);
        if (!c) {
          errors.push({ contact_id: cid, error: "Contact not found" });
          continue;
        }
        const dup = mockSequenceEnrollments.some(
          (e) => e.sequence_id === sequenceId && e.contact_id === cid && e.status === "active",
        );
        if (dup) {
          errors.push({ contact_id: cid, error: "Already enrolled" });
          continue;
        }
        mockSequenceEnrollments.push({
          enrollment_id: newId(),
          sequence_id: sequenceId,
          contact_id: cid,
          status: "active",
          created_at: t,
          updated_at: t,
        });
        enrolled.push(cid);
      }
      return { enrolled, errors };
    }
  }
  if (path === "/api/reviewloop/me/dashboard" && method === "GET") {
    mutate((s) => {
      applyOutboundLogRetentionInPlace(s, OUTBOUND_LOG_RETENTION_DAYS);
    });
    const days = Number(q.get("days") || 30) || 30;
    return getDashboardForDays(days);
  }
  if (path === "/api/reviewloop/me/feedback" && method === "GET") {
    const s = getTestState();
    const onlyNeg = q.get("only_negative") === "true";
    const days = Number(q.get("days") || 90) || 90;
    const since = new Date(Date.now() - days * 864e5).toISOString();
    const raw = s.routingEvents.filter(
      (e) => e.event === "submit_feedback" && e.created_at >= since
    );
    const fb = raw.map((e) => ({ id: e.id, rating: e.rating, comment: e.comment, created_at: e.created_at }));
    const out = onlyNeg ? fb.filter((f) => (f.rating || 5) <= 3) : fb;
    return { feedback: out };
  }
  if (path === "/api/reviewloop/me/messages" && method === "GET") {
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
  if (path === "/api/reviewloop/me/preview-routing" && method === "GET") {
    const s = getTestState();
    const link = s.links.find((l) => new Date(l.expires_at) > new Date());
    if (!link) throw new Error("No review links yet.");
    return { token: link.token, url: linkUrl(link.token) };
  }
  if (path === "/api/reviewloop/me/qr" && method === "GET") {
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
      png_endpoint: "/api/reviewloop/me/qr/png",
      svg_endpoint: "/api/reviewloop/me/qr/svg",
      styles: [
        { id: "classic" as const, label: "Standard", description: "Test mode — all styles are generated locally." },
        { id: "dots" as const, label: "Dots", description: "Test mode" },
        { id: "rounded" as const, label: "Soft", description: "Test mode" },
      ],
    };
  }
  if (path === "/api/reviewloop/webhook-keys" && method === "GET") {
    return { keys: getTestState().webhooks };
  }
  if (path === "/api/reviewloop/webhook-keys" && method === "POST") {
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
    const mw = path.match(/\/api\/reviewloop\/webhook-keys\/([^/]+)$/);
    if (mw && method === "DELETE") {
      const wid = mw[1]!;
      mutate((s) => {
        const w = s.webhooks.find((x) => x.id === wid);
        if (w) w.revoked_at = nowIso();
      });
      return { ok: true };
    }
  }
  if (path === "/api/reviewloop/me/data-export" && method === "GET") {
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
  if (path === "/api/reviewloop/me/account" && method === "DELETE") {
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
    emailCampaignId?: string;
    smsCampaignId?: string;
    locationId?: string;
  }
): Promise<{ rows: number; imported: number; queued: number; errors: string[] }> {
  if (!opts.consent) {
    throw new Error(
      "You must attest that every customer in this CSV consented to receive a review request from your business."
    );
  }
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 1) {
    return { rows: 0, imported: 0, queued: 0, errors: ["The file is empty."] };
  }
  const headers = lines[0]!.split(",").map((h) => h.replace(/^\ufeff?/, "").replace(/"/g, "").trim().toLowerCase());
  const iEmail = headers.findIndex((h) => h === "email" || h === "e-mail" || h.endsWith(" email"));
  const iPhone = headers.findIndex((h) => h.includes("phone") || h === "mobile" || h === "tel");
  const iName = headers.findIndex((h) => h === "name" || h === "first name" || h === "full name");
  if (iEmail < 0 && iPhone < 0) {
    return { rows: 0, imported: 0, queued: 0, errors: ['Add a column header named "email" and/or "phone" (E.164, e.g. +447...).'] };
  }
  const csvLoc = opts.locationId && String(opts.locationId).trim() ? String(opts.locationId).trim() : null;
  let rowCount = 0;
  let imported = 0;
  let queued = 0;
  const errors: string[] = [];
  for (let n = 1; n < lines.length; n++) {
    const cells = lines[n]!.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    rowCount += 1;
    const em = iEmail >= 0 ? normEmail(cells[iEmail]) : null;
    const ph = iPhone >= 0 ? normPhone(cells[iPhone]) : null;
    if (!em && !ph) {
      errors.push(`row ${n + 1}: missing email and phone`);
      continue;
    }
    const name = iName >= 0 && cells[iName!] ? cells[iName]!.slice(0, 120) : null;
    try {
      mutate((s) => {
        const c: Contact = {
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
          const camId = ch === "email" ? opts.emailCampaignId : opts.smsCampaignId;
          enqueue(s, c, ch, camId);
          queued += 1;
        }
      });
    } catch (e) {
      errors.push(`row ${n + 1}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }
  return { rows: rowCount, imported, queued, errors };
}
