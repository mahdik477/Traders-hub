// Types shared by the course data loader (server) and the directory/detail
// pages (may render on the client). Keep this file free of Node-only imports.

export type PricingTier = {
  name: string;
  price: string;
  billingNote: string | null;
  /** e.g. "Best value" — shown as a small ribbon on the card. Null for a
   *  plain tier. */
  highlight: string | null;
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
  pricing: PricingTier[];
  /** What the provider's own site states about refunds. Shown as-is; null
   *  means we checked and found nothing stated. */
  refundPolicy: string | null;
  trustpilot: TrustpilotRating | null;
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
