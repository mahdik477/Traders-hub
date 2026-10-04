// A "provider" is a brand selling several distinct courses (e.g. SharperTrades),
// as opposed to course-types.ts's CourseView, which is one course on its own.
// A provider gets a hub page at /courses/<id> listing its courses, each with
// its own page at /courses/<id>/<course slug>.

import type {
  CourseMarket,
  CurriculumModule,
  LearningFormat,
  PricingTier,
  Testimonial,
  TrustpilotRating,
} from "./course-types";

export type ProviderInstructor = { name: string; role: string | null; link: string | null };

export type ProviderCourse = {
  /** Also the page address: /courses/<provider id>/<slug>. */
  slug: string;
  name: string;
  /** This specific course's own page on the provider's site — used for
   *  "Visit site" instead of the provider's homepage. Falls back to the
   *  provider's website if a course doesn't have its own link. */
  website: string | null;
  tagline: string | null;
  about: string | null;
  /** e.g. for a bundle — names of the other courses it includes. */
  bundleOf: string[];
  /** A provider-claimed performance figure, shown with heavy caveats — we
   *  don't verify these. Null when there's nothing like that to show. */
  performanceClaim: string | null;
  instructors: ProviderInstructor[];
  curriculum: CurriculumModule[];
  formats: LearningFormat[];
  platforms: string[];
  /** What it actually trades — forex, options, stocks, etc. */
  markets: CourseMarket[];
  pricing: PricingTier[];
  testimonials: Testimonial[];
  testimonialsNote: string;
};

/** A prop firm this provider is partnered with/promotes. Only gets an
 *  internal link when we've manually confirmed it's genuinely the same firm
 *  we list (not just a similar name — e.g. "Alpha Futures" is NOT our
 *  "Alpha Funded", see CLAUDE.md). */
export type PartnerFirm = {
  /** Name as the provider itself writes it. */
  name: string;
  /** Our /funded-accounts/<id>, only when confirmed as the same company. */
  internalId: string | null;
};

export type ProviderView = {
  /** Also the page address: /courses/<id>. */
  id: string;
  name: string;
  logo: string | null;
  /** "dark" for a logo that's a light mark with no transparent background —
   *  see FirmView.logoBg for the same idea on prop firms. */
  logoBg: "white" | "dark";
  tagline: string | null;
  about: string | null;
  trustpilot: TrustpilotRating | null;
  /** Same idea as CourseView.whop — independent Whop buyer reviews. */
  whop: TrustpilotRating | null;
  website: string | null;
  affiliateLink: string | null;
  /** Prop firms this provider promotes/partners with — distinct from a
   *  course's `platforms` (software), since this is specifically about
   *  funded-account firms, some of which we may already list ourselves. */
  partnerFirms: PartnerFirm[];
  /** Shown under the partner firms list — for flagging a naming mix-up,
   *  e.g. a partner firm that sounds like but isn't one we list. Null most
   *  of the time. */
  partnerFirmsNote: string | null;
  courses: ProviderCourse[];
};
