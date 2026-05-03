import type {
  Business,
  BusinessLocation,
  Campaign,
  Contact,
  CreditState,
  DashboardStats,
  FeedbackEntry,
  ScheduledMessage,
  StorePerformanceRow,
  Template,
  User,
  WebhookKeyRecord,
} from "@/types";
import { EMAIL_CREDIT, PRO_MONTHLY_CREDITS, SMS_CREDIT, STORAGE_KEY, TEST_BUSINESS_ID, TEST_USER_ID } from "./ids";
import { getPublicOriginForClientLinks } from "./siteOrigin";

/** Seeded for multi-store analytics in browser test mode. */
const SEED_LOC_MAIN = "b0000000-0000-4000-8000-00000loc001";
const SEED_LOC_NORTH = "b0000000-0000-4000-8000-00000loc002";

export type RoutingEventRow = {
  id: string;
  link_id: string;
  business_id: string;
  event: "view" | "click_google" | "click_outbound" | "submit_feedback" | string;
  rating: number | null;
  comment: string | null;
  created_at: string;
  outbound_platform?: string | null;
};

export type LinkRow = {
  id: string;
  token: string;
  message_id: string;
  business_id: string;
  expires_at: string;
  created_at: string;
};

export type TestModeState = {
  user: User;
  business: Business;
  /** Message templates (simple body/subject). */
  templates: Template[];
  /** Multi-step campaigns. */
  campaigns: Campaign[];
  /** Tracks which location is the default for the business. */
  default_location_id: string | null;
  contacts: Contact[];
  messages: ScheduledMessage[];
  links: LinkRow[];
  routingEvents: RoutingEventRow[];
  webhooks: WebhookKeyRecord[];
  /** raw key for newly created webhooks, keyed by id — not persisted */
  webhookRawKeys: Record<string, string>;
  credits: CreditState;
  /** Pro subscription (simulated); monthly credits on "checkout" in test mode. */
  subscriptionPro: boolean;
  /** Seeded in memory; old saved state backfills. */
  locations?: BusinessLocation[];
  /** bump on structural changes to trigger React where needed */
  _rev: number;
};

function nowIso() {
  return new Date().toISOString();
}

let memory: TestModeState | null = null;

function bump(s: TestModeState) {
  s._rev += 1;
}

export function createSeedState(): TestModeState {
  const t0 = new Date();
  const iso = (d: Date) => d.toISOString();

  const tIso = iso(t0);
  const locations: BusinessLocation[] = [
    {
      id: SEED_LOC_MAIN,
      business_id: TEST_BUSINESS_ID,
      name: "Main",
      sort_index: 0,
      is_default: true,
      created_at: tIso,
      updated_at: tIso,
      platform_links: {
        google: "https://g.page/r/GoodWordDemo",
        yelp: "https://www.yelp.com/biz/demo-coffee-main",
      },
    },
    {
      id: SEED_LOC_NORTH,
      business_id: TEST_BUSINESS_ID,
      name: "Northside",
      sort_index: 1,
      is_default: false,
      created_at: tIso,
      updated_at: tIso,
      platform_links: {
        google: "https://g.page/r/GoodWordDemo-North",
        yelp: "https://www.yelp.com/biz/demo-coffee-north",
      },
    },
  ];

  const business: Business = {
    id: TEST_BUSINESS_ID,
    user_id: TEST_USER_ID,
    name: "Demo Coffee Co. (test mode)",
    country_code: "US",
    timezone: "America/New_York",
    from_name: "Demo Coffee Co.",
    from_email: null,
    sms_sender_id: "DemoCoffee",
    branding_color: "#2563eb",
    is_sandbox: true,
    onboarding_completed_at: tIso,
    created_at: tIso,
    updated_at: tIso,
  };

  const templEmail: Template = {
    id: "a0000000-0000-4000-8000-00000ca111",
    business_id: business.id,
    name: "Email · Default",
    channel: "email",
    subject: "Quick favour from {business}?",
    body: "Thanks for choosing **{business}**! [Leave a review]({link})\n\n— {business}",
    is_default: true,
    created_at: iso(t0),
    updated_at: iso(t0),
  };

  const templSms: Template = {
    id: "a0000000-0000-4000-8000-00000ca222",
    business_id: business.id,
    name: "SMS · Default",
    channel: "sms",
    subject: null,
    body: "Hi {name} — {business} would love a quick review: {link}. Reply STOP to opt out.",
    is_default: true,
    created_at: iso(t0),
    updated_at: iso(t0),
  };

  const contacts: Contact[] = [
    {
      id: "a0000000-0000-4000-8000-00000c01",
      business_id: business.id,
      name: "Alex (manual)",
      email: "alex@example.com",
      phone_e164: null,
      source: "manual",
      consent_attested_at: iso(t0),
      unsubscribed_at: null,
      last_message_at: iso(new Date(t0.getTime() - 2 * 864e5)),
      external_ref: null,
      created_at: iso(t0),
    },
    {
      id: "a0000000-0000-4000-8000-00000c02",
      business_id: business.id,
      name: "Jordan (email queue)",
      email: "jordan@example.com",
      phone_e164: null,
      source: "csv",
      consent_attested_at: iso(t0),
      unsubscribed_at: null,
      last_message_at: null,
      external_ref: null,
      created_at: iso(t0),
    },
    {
      id: "a0000000-0000-4000-8000-00000c03",
      business_id: business.id,
      name: "Sam (QR)",
      email: "sam@example.com",
      phone_e164: null,
      source: "qr",
      consent_attested_at: iso(t0),
      unsubscribed_at: null,
      last_message_at: null,
      external_ref: null,
      created_at: iso(t0),
    },
    {
      id: "a0000000-0000-4000-8000-00000c04",
      business_id: business.id,
      name: "Riley (SMS)",
      email: null,
      phone_e164: "+447700900200",
      source: "manual",
      consent_attested_at: iso(t0),
      unsubscribed_at: null,
      last_message_at: null,
      external_ref: null,
      created_at: iso(t0),
    },
    {
      id: "a0000000-0000-4000-8000-00000c05",
      business_id: business.id,
      name: "Taylor (email + SMS)",
      email: "taylor@example.com",
      phone_e164: "+447700900201",
      source: "manual",
      consent_attested_at: iso(t0),
      unsubscribed_at: null,
      last_message_at: null,
      external_ref: null,
      created_at: iso(t0),
    },
  ];

  const m1: ScheduledMessage = {
    id: "a0000000-0000-4000-8000-00000m01",
    business_id: business.id,
    contact_id: contacts[0]!.id,
    template_id: templEmail.id,
    campaign_id: null,
    campaign_step_index: null,
    channel: "email",
    send_at: iso(new Date(t0.getTime() - 2 * 864e5)),
    status: "sent",
    provider_id: "test-seed",
    error_detail: null,
    cost_credits: EMAIL_CREDIT,
    sent_at: iso(new Date(t0.getTime() - 2 * 864e5)),
    created_at: iso(t0),
    location_id: SEED_LOC_MAIN,
  };

  const m2: ScheduledMessage = {
    id: "a0000000-0000-4000-8000-00000m02",
    business_id: business.id,
    contact_id: contacts[1]!.id,
    template_id: templEmail.id,
    campaign_id: null,
    campaign_step_index: null,
    channel: "email",
    send_at: iso(new Date(t0.getTime() - 2 * 60_000)),
    status: "scheduled",
    provider_id: null,
    error_detail: null,
    cost_credits: EMAIL_CREDIT,
    sent_at: null,
    created_at: iso(t0),
    location_id: SEED_LOC_NORTH,
  };
  const m3sms: ScheduledMessage = {
    id: "a0000000-0000-4000-8000-00000m03",
    business_id: business.id,
    contact_id: contacts[3]!.id,
    template_id: templSms.id,
    campaign_id: null,
    campaign_step_index: null,
    channel: "sms",
    send_at: iso(new Date(t0.getTime() - 90_000)),
    status: "scheduled",
    provider_id: null,
    error_detail: null,
    cost_credits: SMS_CREDIT,
    sent_at: null,
    created_at: iso(t0),
    location_id: SEED_LOC_NORTH,
  };
  const m4future: ScheduledMessage = {
    id: "a0000000-0000-4000-8000-00000m04",
    business_id: business.id,
    contact_id: contacts[2]!.id,
    template_id: templEmail.id,
    campaign_id: null,
    campaign_step_index: null,
    channel: "email",
    send_at: iso(new Date(t0.getTime() + 2 * 3600e3)),
    status: "scheduled",
    provider_id: null,
    error_detail: null,
    cost_credits: EMAIL_CREDIT,
    sent_at: null,
    created_at: iso(t0),
    location_id: SEED_LOC_MAIN,
  };

  const tok1 = "a3demo01xx";
  const link1: LinkRow = {
    id: "a0000000-0000-4000-8000-00000l01",
    token: tok1,
    message_id: m1.id,
    business_id: business.id,
    expires_at: iso(new Date(t0.getTime() + 90 * 864e5)),
    created_at: iso(t0),
  };

  const link2: LinkRow = {
    id: "a0000000-0000-4000-8000-00000l02",
    token: "a3demo02yy",
    message_id: m2.id,
    business_id: business.id,
    expires_at: iso(new Date(t0.getTime() + 90 * 864e5)),
    created_at: iso(t0),
  };
  const link3sms: LinkRow = {
    id: "a0000000-0000-4000-8000-00000l03",
    token: "a3smsx34zz",
    message_id: m3sms.id,
    business_id: business.id,
    expires_at: iso(new Date(t0.getTime() + 90 * 864e5)),
    created_at: iso(t0),
  };
  const link4f: LinkRow = {
    id: "a0000000-0000-4000-8000-00000l04",
    token: "a3future55",
    message_id: m4future.id,
    business_id: business.id,
    expires_at: iso(new Date(t0.getTime() + 90 * 864e5)),
    created_at: iso(t0),
  };

  const re: RoutingEventRow[] = [
    {
      id: "a0000000-0000-4000-8000-00000e01",
      link_id: link1.id,
      business_id: business.id,
      event: "view",
      rating: null,
      comment: null,
      created_at: iso(new Date(t0.getTime() - 1.5 * 864e5)),
    },
    {
      id: "a0000000-0000-4000-8000-00000e02",
      link_id: link1.id,
      business_id: business.id,
      event: "click_google",
      rating: null,
      comment: null,
      created_at: iso(new Date(t0.getTime() - 1.4 * 864e5)),
      outbound_platform: "google",
    },
    {
      id: "a0000000-0000-4000-8000-00000e04",
      link_id: link1.id,
      business_id: business.id,
      event: "click_outbound",
      rating: null,
      comment: null,
      created_at: iso(new Date(t0.getTime() - 1.35 * 864e5)),
      outbound_platform: "yelp",
    },
    {
      id: "a0000000-0000-4000-8000-00000e05",
      link_id: link1.id,
      business_id: business.id,
      event: "click_outbound",
      rating: null,
      comment: null,
      created_at: iso(new Date(t0.getTime() - 1.32 * 864e5)),
      outbound_platform: "facebook",
    },
    {
      id: "a0000000-0000-4000-8000-00000e03",
      link_id: link1.id,
      business_id: business.id,
      event: "submit_feedback",
      rating: 5,
      comment: "Great coffee — will be back.",
      created_at: iso(new Date(t0.getTime() - 1.3 * 864e5)),
    },
  ];

  const wh: WebhookKeyRecord = {
    id: "a0000000-0000-4000-8000-00000w01",
    key_prefix: "test_key",
    label: "Zapier (test)",
    revoked_at: null,
    last_used_at: null,
    created_at: iso(t0),
  };

  const credits: CreditState = {
    balance: 950,
    low_balance_threshold: 50,
    auto_topup_enabled: false,
    low_balance_notified_at: null,
    ledger: [
      { delta: 950, reason: "demo_credits", ref_id: "try_demo_seed", balance_after: 950, created_at: iso(t0) },
    ],
  };

  const st: TestModeState = {
    user: {
      id: TEST_USER_ID,
      email: "test@goodword.local",
      name: "Test user (local mode)",
      picture_url: null,
    },
    business,
    locations,
    default_location_id: SEED_LOC_MAIN,
    templates: [templEmail, templSms],
    campaigns: [],
    contacts,
    messages: [m1, m2, m3sms, m4future],
    links: [link1, link2, link3sms, link4f],
    routingEvents: re,
    webhooks: [wh],
    webhookRawKeys: {},
    credits,
    subscriptionPro: true,
    _rev: 1,
  };
  return st;
}

function loadFromStorage(): TestModeState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TestModeState;
  } catch {
    return null;
  }
}

function saveToStorage(s: TestModeState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function getTestState(): TestModeState {
  if (typeof window === "undefined") {
    if (!memory) memory = createSeedState();
    return memory;
  }
  if (memory) return memory;
  const from = loadFromStorage();
  if (from) {
    if (!from.webhookRawKeys) from.webhookRawKeys = {};
    if (from.subscriptionPro == null) from.subscriptionPro = true;
    if (!from.locations) {
      from.locations = [];
    }
    if (!from.templates) {
      from.templates = (from as unknown as { campaigns?: Template[] }).campaigns ?? [];
    }
    if (!from.campaigns) {
      from.campaigns = [];
    }
    if (from.default_location_id === undefined) {
      from.default_location_id = null;
    }
    if (from.locations.length === 0) {
      const t = new Date().toISOString();
      from.locations = [
        {
          id: SEED_LOC_MAIN,
          business_id: from.business.id,
          name: "Main",
          sort_index: 0,
          is_default: true,
          created_at: t,
          updated_at: t,
          platform_links: { google: "", yelp: "https://www.yelp.com/biz/example" },
        },
      ];
      for (const m of from.messages) {
        if (!m.location_id) m.location_id = from.locations[0]!.id;
      }
      if (!from.default_location_id) {
        from.default_location_id = from.locations[0]!.id;
      }
      saveToStorage(from);
    }
    memory = from;
    return memory;
  }
  memory = createSeedState();
  saveToStorage(memory);
  return memory;
}

/** Re-seed saved state. Does not change `user_id` in localStorage. */
export function resetTestState() {
  memory = createSeedState();
  saveToStorage(memory);
}

export function persist() {
  if (memory) saveToStorage(memory);
}

export function mutate(fn: (s: TestModeState) => void) {
  const s = getTestState();
  fn(s);
  bump(s);
  saveToStorage(s);
}

let rid = 0;
export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  rid += 1;
  return `a0000000-0000-4000-8000-${(1000000 + rid).toString(16).padStart(12, "0")}`;
}

const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
export function newToken() {
  let o = "";
  for (let i = 0; i < 10; i++) o += alphabet[Math.floor(Math.random() * alphabet.length)];
  return o;
}

/** Advance scheduled messages that are due — sandbox: mark sent, deduct, provider sandbox. */
export function processDueSends() {
  mutate((s) => {
    const now = new Date();
    for (const m of s.messages) {
      if (m.status !== "scheduled") continue;
      if (new Date(m.send_at) > now) continue;
      const cost = m.cost_credits;
      if (s.credits.balance < cost) {
        m.status = "failed";
        m.error_detail = "insufficient credits (test mode)";
        m.sent_at = nowIso();
        continue;
      }
      s.credits.balance -= cost;
      s.credits.ledger = [
        {
          delta: -cost,
          reason: `${m.channel}_send`,
          ref_id: m.id,
          balance_after: s.credits.balance,
          created_at: nowIso(),
        },
        ...s.credits.ledger,
      ].slice(0, 40);
      m.status = "sent";
      m.sent_at = nowIso();
      m.provider_id = "sandbox";
      const c = s.contacts.find((x) => x.id === m.contact_id);
      if (c) c.last_message_at = nowIso();
    }
  });
}

export function routingBaseUrl() {
  return getPublicOriginForClientLinks();
}

export function linkUrl(token: string) {
  return `${routingBaseUrl()}/r/${token}`;
}

/** Trims local outbound log in test mode: messages, routing links, and old events. Keeps localStorage small. */
export const OUTBOUND_LOG_RETENTION_DAYS = 30;

export function applyOutboundLogRetentionInPlace(s: TestModeState, retentionDays: number) {
  const since = new Date(Date.now() - retentionDays * 864e5).toISOString();
  const newMsgs = s.messages.filter((m) => m.created_at >= since);
  const keepMid = new Set(newMsgs.map((m) => m.id));
  s.messages = newMsgs;
  s.links = s.links.filter((l) => keepMid.has(l.message_id));
  const keepLid = new Set(s.links.map((l) => l.id));
  s.routingEvents = s.routingEvents.filter((e) => e.created_at >= since && keepLid.has(e.link_id));
}

function feedbackFromEvents(events: RoutingEventRow[], sinceIso: string): FeedbackEntry[] {
  const since = new Date(sinceIso).getTime();
  return events
    .filter((e) => e.event === "submit_feedback" && new Date(e.created_at).getTime() >= since)
    .map((e) => ({
      id: e.id,
      rating: e.rating,
      comment: e.comment,
      created_at: e.created_at,
    }));
}

function _msgLocKey(
  m: ScheduledMessage,
  locs: BusinessLocation[],
  defId: string | null | undefined,
  multi: boolean
): string {
  if (m.location_id) return m.location_id;
  if (multi) return "unassigned";
  if (defId) return defId;
  return "unassigned";
}

export function getDashboardForDays(days: number): DashboardStats {
  processDueSends();
  const s = getTestState();
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const locs = s.locations && s.locations.length > 0 ? s.locations! : [];
  const locNames: Record<string, string> = Object.fromEntries(
    (locs || []).map((l) => [l.id, l.name] as [string, string])
  );
  const multi = locs.length > 1;
  const def = s.default_location_id;

  const msgs = s.messages.filter((m) => m.created_at >= since);
  const byStatus: Record<string, number> = {};
  const byCh: Record<string, number> = {};
  const byChSent: Record<string, number> = {};
  let credits_used = 0;
  const perLoc: Record<
    string,
    {
      messages_total: number;
      credits: number;
      sends: number;
      view: number;
      click_platform: number;
      submit_feedback: number;
    }
  > = {};
  for (const m of msgs) {
    byStatus[m.status] = (byStatus[m.status] || 0) + 1;
    byCh[m.channel] = (byCh[m.channel] || 0) + 1;
    if (m.status === "sent") {
      byChSent[m.channel] = (byChSent[m.channel] || 0) + 1;
      credits_used += m.cost_credits;
    }
    const k = _msgLocKey(m, locs, def, multi);
    if (!perLoc[k]) {
      perLoc[k] = {
        messages_total: 0,
        credits: 0,
        sends: 0,
        view: 0,
        click_platform: 0,
        submit_feedback: 0,
      };
    }
    perLoc[k]!.messages_total += 1;
    if (m.status === "sent") {
      perLoc[k]!.credits += m.cost_credits;
      perLoc[k]!.sends += 1;
    }
  }

  const evs = s.routingEvents.filter((e) => e.created_at >= since);
  const msgIdToLoc: Record<string, string | null | undefined> = {};
  for (const m of s.messages) msgIdToLoc[m.id] = m.location_id;

  const eventStoreKey = (e: (typeof s.routingEvents)[0]): string => {
    if (!e.link_id) return multi && !def ? "unassigned" : (def as string) || "unassigned";
    const l = s.links.find((x) => x.id === e.link_id);
    if (!l) return multi && !def ? "unassigned" : (def as string) || "unassigned";
    const lid = msgIdToLoc[l.message_id] ?? s.messages.find((m) => m.id === l.message_id)?.location_id;
    if (lid) return lid;
    if (multi) return "unassigned";
    return (def as string) || "unassigned";
  };

  const funnel = { sent: byStatus.sent || 0, view: 0, click_platform: 0, submit_feedback: 0 };
  const clicks_by_platform: Record<string, number> = {};
  const rating_distribution: Record<string, number> = {};
  for (const e of evs) {
    const fe = e.event;
    if (fe === "view") funnel.view += 1;
    if (fe === "submit_feedback") funnel.submit_feedback += 1;
    if (fe === "click_google" || fe === "click_outbound" || fe === "click_platform") {
      funnel.click_platform += 1;
      const p = e.outbound_platform || (fe === "click_google" ? "google" : "other");
      clicks_by_platform[p] = (clicks_by_platform[p] || 0) + 1;
    }
    if (e.rating) {
      const k = String(e.rating);
      rating_distribution[k] = (rating_distribution[k] || 0) + 1;
    }
    if (["view", "click_google", "click_outbound", "click_platform", "submit_feedback"].includes(fe)) {
      const k = eventStoreKey(e);
      if (!perLoc[k]) {
        perLoc[k] = { messages_total: 0, credits: 0, sends: 0, view: 0, click_platform: 0, submit_feedback: 0 };
      }
      if (fe === "view") perLoc[k]!.view += 1;
      if (fe === "click_google" || fe === "click_outbound" || fe === "click_platform") perLoc[k]!.click_platform += 1;
      if (fe === "submit_feedback") perLoc[k]!.submit_feedback += 1;
    }
  }

  const keys: string[] = (locs || []).map((l) => l.id);
  if ("unassigned" in perLoc && (multi || locs.length === 0)) keys.push("unassigned");
  for (const pk of Object.keys(perLoc)) {
    if (!keys.includes(pk)) keys.push(pk);
  }

  const store_performance: StorePerformanceRow[] = [];
  for (const k of keys) {
    const d = perLoc[k] || {
      messages_total: 0,
      credits: 0,
      sends: 0,
      view: 0,
      click_platform: 0,
      submit_feedback: 0,
    };
    if (k === "unassigned" && multi && !d.messages_total && !d.sends && !d.view && !d.click_platform) {
      continue;
    }
    const name = k === "unassigned" ? "Unassigned (no store on message)" : (locNames[k] ?? "Store");
    store_performance.push({
      location_id: k,
      name,
      messages_total: d.messages_total,
      sends: d.sends,
      credits_used: d.credits,
      view: d.view,
      click_platform: d.click_platform,
      submit_feedback: d.submit_feedback,
    });
  }

  return {
    window_days: days,
    messages_total: msgs.length,
    messages_by_status: byStatus,
    messages_by_channel: byCh,
    messages_by_channel_sent: byChSent,
    credits_used,
    funnel,
    rating_distribution,
    clicks_by_platform: Object.keys(clicks_by_platform).length > 0 ? clicks_by_platform : undefined,
    multi_location: multi,
    store_performance: locs.length > 0 && store_performance.length > 0 ? store_performance : undefined,
  };
}

export { feedbackFromEvents };
