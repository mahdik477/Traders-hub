// A "provider" is a brand selling several distinct courses (e.g. SharperTrades),
// as opposed to course-types.ts's CourseView, which is one course on its own.
// A provider gets a hub page at /courses/<id> listing its courses, each with
// its own page at /courses/<id>/<course slug>.

import type {
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
  pricing: PricingTier[];
  testimonials: Testimonial[];
  testimonialsNote: string;
};

export type ProviderView = {
  /** Also the page address: /courses/<id>. */
  id: string;
  name: string;
  logo: string | null;
  tagline: string | null;
  about: string | null;
  trustpilot: TrustpilotRating | null;
  website: string | null;
  affiliateLink: string | null;
  courses: ProviderCourse[];
};
