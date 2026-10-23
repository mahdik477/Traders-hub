// Normalizes a standalone course or a multi-course provider into one shape
// so the compare page can put them side by side without caring which one
// it's looking at. A provider doesn't have a single instructor/curriculum
// (it has several courses, each with its own), so those rows are aggregated
// across its courses rather than left blank — always labelled as an
// aggregate, never presented as if it were one course's own numbers.

import type { CourseMarket, CourseView, LearningFormat, PricingTier, TrustpilotRating } from "./course-types";
import type { ProviderView } from "./provider-types";
import { parsePrice } from "./course-filters";

export type ComparableEntry = {
  id: string;
  name: string;
  logo: string | null;
  logoBg: "white" | "dark";
  tagline: string | null;
  href: string;
  affiliateLink: string | null;
  trustpilot: TrustpilotRating | null;
  whop: TrustpilotRating | null;
  pricing: PricingTier[];
  markets: CourseMarket[];
  hasFreeTier: boolean;
  hasLiveSessions: boolean;
  instructors: string[];
  platforms: string[];
  formats: LearningFormat[];
  curriculumModuleCount: number | null;
  brokerPartnershipName: string | null;
  refundPolicy: string | null;
  /** Set only for a multi-course provider — every aggregated row above is
   *  pooled across this many courses, not one course's own numbers. */
  aggregatedAcrossCourses: number | null;
};

function hasLiveFormat(formats: { label: string }[]): boolean {
  return formats.some((f) => /live/i.test(f.label));
}

export function comparableFromCourse(c: CourseView): ComparableEntry {
  const prices = c.pricing.map((p) => parsePrice(p.price)).filter((n): n is number => n != null);
  return {
    id: c.id,
    name: c.name,
    logo: c.logo,
    logoBg: c.logoBg,
    tagline: c.tagline,
    href: `/courses/${c.id}`,
    affiliateLink: c.affiliateLink,
    trustpilot: c.trustpilot,
    whop: c.whop,
    pricing: c.pricing,
    markets: c.markets,
    hasFreeTier: prices.includes(0),
    hasLiveSessions: hasLiveFormat(c.formats),
    instructors: c.instructor ? [c.instructor.name] : [],
    platforms: c.platforms,
    formats: c.formats,
    curriculumModuleCount: c.curriculum.length || null,
    brokerPartnershipName: c.brokerPartnership?.brokerName ?? null,
    refundPolicy: c.refundPolicy,
    aggregatedAcrossCourses: null,
  };
}

export function comparableFromProvider(p: ProviderView): ComparableEntry {
  const allPricing = p.courses.flatMap((c) => c.pricing);
  const cheapest = [...allPricing].sort((a, b) => (parsePrice(a.price) ?? Infinity) - (parsePrice(b.price) ?? Infinity));
  const prices = allPricing.map((pr) => parsePrice(pr.price)).filter((n): n is number => n != null);
  return {
    id: p.id,
    name: p.name,
    logo: p.logo,
    logoBg: p.logoBg,
    tagline: p.tagline,
    href: `/courses/${p.id}`,
    affiliateLink: p.affiliateLink,
    trustpilot: p.trustpilot,
    whop: p.whop,
    pricing: cheapest.slice(0, 1),
    markets: [...new Set(p.courses.flatMap((c) => c.markets))],
    hasFreeTier: prices.includes(0),
    hasLiveSessions: p.courses.some((c) => hasLiveFormat(c.formats)),
    instructors: [...new Set(p.courses.flatMap((c) => c.instructors.map((i) => i.name)))],
    platforms: [...new Set(p.courses.flatMap((c) => c.platforms))],
    formats: dedupeFormats(p.courses.flatMap((c) => c.formats)),
    curriculumModuleCount: p.courses.reduce((n, c) => n + c.curriculum.length, 0) || null,
    brokerPartnershipName: null,
    refundPolicy: null,
    aggregatedAcrossCourses: p.courses.length,
  };
}

function dedupeFormats(formats: LearningFormat[]): LearningFormat[] {
  const seen = new Map<string, LearningFormat>();
  for (const f of formats) if (!seen.has(f.label)) seen.set(f.label, f);
  return [...seen.values()];
}

/** Looks up up to 3 comparable entries by id, in the order given, skipping
 *  any id that doesn't match a real course or provider. */
export function resolveComparableEntries(
  ids: string[],
  courses: CourseView[],
  providers: ProviderView[],
): ComparableEntry[] {
  const byId = new Map<string, ComparableEntry>();
  for (const c of courses) byId.set(c.id, comparableFromCourse(c));
  for (const p of providers) byId.set(p.id, comparableFromProvider(p));
  const out: ComparableEntry[] = [];
  for (const id of ids) {
    const entry = byId.get(id);
    if (entry && !out.some((e) => e.id === id)) out.push(entry);
    if (out.length === 3) break;
  }
  return out;
}
