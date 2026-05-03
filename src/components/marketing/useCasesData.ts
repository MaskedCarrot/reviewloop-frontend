/**
 * Vertical use-case examples for marketing pages (home + /use-cases).
 *
 * Each example is hand-authored to feel concrete to a small business owner —
 * a realistic message template, a realistic outcome, and a single insight.
 * If you change copy here, it will reflow into the use-cases page automatically.
 */
export type UseCase = {
  /** Stable URL slug for /use-cases#slug */
  slug: string;
  /** Short label used in tabs / chips. */
  label: string;
  /** Headline shown on each card. */
  title: string;
  /** One-line summary under the headline. */
  pitch: string;
  /** Three concrete outcomes for the vertical. */
  outcomes: string[];
  /** A copy-paste-ready email template the user can imagine sending. */
  template: {
    subject: string;
    body: string;
  };
  /** Insight quote to anchor the example. */
  insight: string;
  /** Lucide-ish emoji + colour so we don't ship custom illustrations per vertical. */
  emoji: string;
  tone: "warm" | "blue" | "green" | "rose" | "violet" | "amber";
};

export const USE_CASES: UseCase[] = [
  {
    slug: "cafe",
    label: "Café",
    title: "For the busy café",
    pitch:
      "Every morning rush ends. Send a friendly nudge that afternoon — not at the till.",
    outcomes: [
      "Reach regulars without slowing the queue",
      "Catch private feedback before it becomes a public 1-star",
      "Stack reviews when the seasonal menu launches",
    ],
    template: {
      subject: "Hey Maya — thanks for stopping by today ☕",
      body:
        "It made our afternoon. If you have 20 seconds, we'd love a quick review of the visit — it really helps a small shop like ours.\n\n→ Leave a review (1 tap)\n\nNot quite right? Tell us privately, we'll make it right next time.\n\n— Sam at Bluebird Coffee",
    },
    insight:
      "Cafés that send the request between 2pm and 5pm see the highest conversion in our data — calm, post-coffee headspace.",
    emoji: "☕",
    tone: "warm",
  },
  {
    slug: "salon",
    label: "Salon",
    title: "For the salon & spa",
    pitch:
      "Right after the cut feels too much. Two hours later — when they look in their bathroom mirror — is gold.",
    outcomes: [
      "Schedule the request for 2 hours after the appointment",
      "Route happy customers to Google · Yelp · Facebook in one tap",
      "Keep pricing complaints in private feedback, not on Google",
    ],
    template: {
      subject: "How's the new colour, Priya?",
      body:
        "Hope you're loving it as much as we did styling it. If it's a yes, would you share a quick word on Google? Two-tap thing, I promise.\n\nAnd if anything wasn't quite right — please tell us first. We'd love the chance to make it perfect next time.\n\n— Léa at Clover Hair",
    },
    insight:
      "Adding a 2-hour delay after an appointment lifted reply rate by ~40% in our beta cohort.",
    emoji: "💇",
    tone: "rose",
  },
  {
    slug: "trades",
    label: "Trades & home services",
    title: "For trades & home services",
    pitch:
      "The job is done, the kettle's on. Now's the moment — before the receipt gets filed.",
    outcomes: [
      "Drop a QR on the invoice your tech leaves behind",
      "CSV upload from your job-management tool (Jobber, ServiceM8, etc.)",
      "Templates for plumbers, electricians, builders, gardeners",
    ],
    template: {
      subject: "Hope the new boiler's keeping you warm",
      body:
        "If we did right by you, would you share a quick review? It's how a small shop like ours keeps the lights on.\n\nIf anything's off, please reply — we'll come back out, no charge.\n\n— Mike at Hartley Plumbing",
    },
    insight:
      "Trades inherit trust from word-of-mouth. One real Google review per week beats every Facebook ad we tested.",
    emoji: "🔧",
    tone: "blue",
  },
  {
    slug: "dentist",
    label: "Dentist & clinic",
    title: "For dentists & clinics",
    pitch:
      "Patients expect a follow-up. Make it the moment you also (politely) ask for a review.",
    outcomes: [
      "HIPAA / GDPR-friendly — opt-in is recorded on every contact",
      "Quiet hours respect their evening, not yours",
      "One-tap unsubscribe; we never re-contact a stop",
    ],
    template: {
      subject: "How are you feeling after today's visit?",
      body:
        "If anything's sore or worrying you, reply directly — Dr. Khan will get straight back to you.\n\nIf today went smoothly, would you mind a quick word on Google? It really helps other patients find us.\n\n— Maple Dental",
    },
    insight:
      "Healthcare profiles with 30+ recent reviews convert ~2× more booking-page visitors than those with under 10.",
    emoji: "🦷",
    tone: "green",
  },
  {
    slug: "restaurant",
    label: "Restaurant",
    title: "For the restaurant",
    pitch:
      "Send the next morning — not at the table. The 'best meal we've had in months' feeling lasts longer than the bill.",
    outcomes: [
      "Templates for date-night, family meals, business lunches",
      "Route to Google, Yelp, TripAdvisor depending on platform mix",
      "Bulk import from your reservation tool",
    ],
    template: {
      subject: "Last night's table 7 — how did we do?",
      body:
        "Hope dinner lived up to expectations. If yes, we'd be grateful for a quick word — it's the single best way you can support a small kitchen.\n\nIf something didn't land, please tell us — chef wants to know.\n\n— The team at Fern & Fig",
    },
    insight:
      "Restaurants with consistent recent reviews rank higher in Google's local 3-pack — and nothing reads 'recent' like daily sends.",
    emoji: "🍽️",
    tone: "amber",
  },
  {
    slug: "ecommerce",
    label: "Online & DTC",
    title: "For DTC & online stores",
    pitch:
      "Your delivery is the moment. Trigger GoodWord the day after parcel-delivered, not the day of order.",
    outcomes: [
      "Webhook from Shopify / WooCommerce / your stack",
      "Land in inbox after the unboxing — not before",
      "Routes to Google AND your store reviews",
    ],
    template: {
      subject: "Does the candle smell like spring? 🌸",
      body:
        "Genuinely curious — we hand-pour every one. If it's a yes, a quick line on Google would make our week.\n\nNot what you hoped? Reply and we'll send a free replacement. No questions, no friction.\n\n— Iris Candles",
    },
    insight:
      "Sending 24-72 hours after delivery (not after order) lifts reply rate by 2-3× across our beta merchants.",
    emoji: "📦",
    tone: "violet",
  },
];

export const USE_CASE_TONES: Record<
  UseCase["tone"],
  { card: string; chip: string; iconBg: string; iconRing: string }
> = {
  warm: {
    card: "from-warm-50 to-white border-warm-200/80",
    chip: "bg-warm-100 text-warm-800",
    iconBg: "bg-warm-100 text-warm-700",
    iconRing: "ring-warm-200",
  },
  blue: {
    card: "from-brand-50 to-white border-brand-200/70",
    chip: "bg-brand-100 text-brand-800",
    iconBg: "bg-brand-100 text-brand-700",
    iconRing: "ring-brand-200",
  },
  green: {
    card: "from-emerald-50 to-white border-emerald-200/70",
    chip: "bg-emerald-100 text-emerald-800",
    iconBg: "bg-emerald-100 text-emerald-700",
    iconRing: "ring-emerald-200",
  },
  rose: {
    card: "from-rose-50 to-white border-rose-200/70",
    chip: "bg-rose-100 text-rose-800",
    iconBg: "bg-rose-100 text-rose-700",
    iconRing: "ring-rose-200",
  },
  violet: {
    card: "from-violet-50 to-white border-violet-200/70",
    chip: "bg-violet-100 text-violet-800",
    iconBg: "bg-violet-100 text-violet-700",
    iconRing: "ring-violet-200",
  },
  amber: {
    card: "from-amber-50 to-white border-amber-200/70",
    chip: "bg-amber-100 text-amber-800",
    iconBg: "bg-amber-100 text-amber-700",
    iconRing: "ring-amber-200",
  },
};
