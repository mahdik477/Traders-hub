// Types shared by the course data loader (server) and the directory/detail
// pages (may render on the client). Keep this file free of Node-only imports.

export type PricingTier = {
  name: string;
  price: string;
  billingNote: string | null;
  /** e.g. "Best value" — shown as a small ribbon on the card. Null for a
   *  plain tier. */
  highlight: string | null;
  /** This tier's own tracked/checkout link, when it has one of its own
   *  (e.g. separate monthly vs. annual affiliate links). Falls back to the
   *  course's general visit link when null. */
  link: string | null;
};

/** A group of topics under one course/module name, e.g. "14-Day Foundation Course". */
export type CurriculumModule = {
  title: string;
  moduleCount: number | null;
  topics: string[];
};

/** One way the course is delivered, e.g. "Video lessons". There's no verified
 *  numeric split between these (providers don't publish one) — just the list
 *  of formats actually included, each with what it covers. */
export type LearningFormat = {
  label: string;
  description: string;
};

export type Testimonial = {
  quote: string;
  author: string;
  /** Where the quote is from, e.g. "Six Figure Capital website" or
   *  "Forex Peace Army review". Always shown — these are not independently
   *  verified (see CourseView.testimonialsNote). */
  source: string | null;
};

export type TrustpilotRating = {
  /** Out of 5. */
  rating: number;
  reviewCount: number | null;
  url: string | null;
  /** The verbal label (Excellent/Great/Average/Poor/Bad) exactly as shown on
   *  Trustpilot at the time we checked — Trustpilot's own banding doesn't
   *  match a simple formula on the number, so we record what it actually
   *  said rather than guess. Optional/null falls back to an approximation —
   *  also keeps this type compatible with propfirm-types.ts's ReviewRating,
   *  which doesn't have one yet. */
  label?: string | null;
};

/** A standalone credibility figure, e.g. "10,000+ students taught". Optional
 *  and course-specific — most courses won't have any of these, some (the
 *  ones with more public info available) will have several. */
export type CourseStat = {
  label: string;
  value: string;
};

/** A disclosed broker/platform partnership — distinct from `platforms`,
 *  which just lists software the course uses. This is for a named,
 *  compensated partnership the provider has with a specific broker. */
export type BrokerPartnership = {
  brokerName: string;
  /** In our own words, including the fact that it's a paid/compensated
   *  partnership when the source discloses that. */
  description: string;
  url: string | null;
};

export type CourseView = {
  /** Also the page address: /courses/<id>. */
  id: string;
  name: string;
  /** Path under /public, e.g. "/courses/six-figure-capital-logo.webp". Null if
   *  we don't have one — the page falls back to a lettermark. */
  logo: string | null;
  /** One-line "what it sells". */
  tagline: string | null;
  /** General info paragraph. */
  about: string | null;
  instructor: { name: string; link: string | null } | null;
  curriculum: CurriculumModule[];
  formats: LearningFormat[];
  /** Platforms/software the course trades or teaches on, e.g. "MetaTrader 4". */
  platforms: string[];
  /** Optional credibility figures shown in the hero, e.g. students taught,
   *  years coaching. Empty for most courses — only shown when we actually
   *  have sourced numbers, never estimated. */
  stats: CourseStat[];
  /** A disclosed, named broker partnership, when the provider has one. Null
   *  for most courses. */
  brokerPartnership: BrokerPartnership | null;
  pricing: PricingTier[];
  /** What the provider's own site states about refunds. Shown as-is; null
   *  means we checked and found nothing stated. */
  refundPolicy: string | null;
  trustpilot: TrustpilotRating | null;
  /** Same shape, for a course sold through Whop — Whop collects its own
   *  independent buyer reviews, separate from Trustpilot, and the two can
   *  disagree a lot, so we show both rather than picking one. */
  whop: TrustpilotRating | null;
  testimonials: Testimonial[];
  /** Shown once above the testimonials — these are sourced from the
   *  provider's own site/marketing, not independently verified. */
  testimonialsNote: string;
  /** The course's own website. Shown as "Visit site" until a real
   *  affiliate link is added. */
  website: string | null;
  /** Null until a real affiliate deal is in place. */
  affiliateLink: string | null;
};
