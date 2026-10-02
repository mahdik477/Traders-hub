// Loads every `providers-data-*.json` file in the project root, the same way
// courses.ts loads single-course files. To add a provider, drop a new
// `providers-data-<name>.json` file next to the others and redeploy — no
// code changes needed.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ProviderCourse, ProviderView } from "./provider-types";

type RawInstructor = { name: string; role?: string | null; link?: string | null };

type RawCourse = {
  slug: string;
  name: string;
  website?: string | null;
  tagline?: string | null;
  about?: string | null;
  bundle_of?: string[];
  performance_claim?: string | null;
  instructors?: RawInstructor[];
  curriculum?: { title: string; module_count?: number | null; topics: string[] }[];
  formats?: { label: string; description: string }[];
  platforms?: string[];
  pricing?: { name: string; price: string; billing_note?: string | null; highlight?: string | null }[];
  testimonials?: { quote: string; author: string; source?: string | null }[];
  testimonials_note?: string | null;
};

type RawFile = {
  provider: {
    id: string;
    name: string;
    logo?: string | null;
    tagline?: string | null;
    about?: string | null;
    trustpilot?: { rating: number; review_count?: number | null; url?: string | null } | null;
    website?: string | null;
    affiliate_link?: string | null;
    courses: RawCourse[];
  };
};

const DATA_FILE_PATTERN = /^providers-data-.+\.json$/i;

const DEFAULT_TESTIMONIALS_NOTE =
  "These testimonials are quoted from the course provider's own website and marketing. We haven't independently verified them, and we don't verify trading performance or results.";

function loadProviders(): ProviderView[] {
  const dir = process.cwd();
  const files = readdirSync(/*turbopackIgnore: true*/ dir)
    .filter((f) => DATA_FILE_PATTERN.test(f))
    .sort();

  const providers = files.map((file) => {
    let data: RawFile;
    try {
      data = JSON.parse(readFileSync(path.join(/*turbopackIgnore: true*/ dir, file), "utf-8"));
    } catch (err) {
      throw new Error(`Could not read provider data file "${file}": ${err}`);
    }
    if (!data?.provider?.id || !data.provider.name) {
      throw new Error(`Provider data file "${file}" is missing "provider.id" or "provider.name".`);
    }
    if (!/^[a-z0-9-]+$/.test(data.provider.id)) {
      throw new Error(
        `Provider data file "${file}": "id" must use only lowercase letters, numbers and dashes.`,
      );
    }
    return buildProvider(data.provider);
  });

  const ids = providers.map((p) => p.id);
  const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
  if (duplicate) throw new Error(`Two provider data files use the id "${duplicate}".`);
  return providers;
}

function buildProvider(p: RawFile["provider"]): ProviderView {
  const slugs = p.courses.map((c) => c.slug);
  const duplicateSlug = slugs.find((s, i) => slugs.indexOf(s) !== i);
  if (duplicateSlug) {
    throw new Error(`Provider "${p.id}" has two courses with the slug "${duplicateSlug}".`);
  }

  return {
    id: p.id,
    name: p.name,
    logo: p.logo || null,
    tagline: p.tagline || null,
    about: p.about || null,
    trustpilot: p.trustpilot
      ? {
          rating: p.trustpilot.rating,
          reviewCount: p.trustpilot.review_count ?? null,
          url: safeLink(p.trustpilot.url),
        }
      : null,
    website: safeLink(p.website),
    affiliateLink: safeLink(p.affiliate_link),
    courses: p.courses.map(buildCourse),
  };
}

function buildCourse(c: RawCourse): ProviderCourse {
  return {
    slug: c.slug,
    name: c.name,
    website: safeLink(c.website),
    tagline: c.tagline || null,
    about: c.about || null,
    bundleOf: c.bundle_of ?? [],
    performanceClaim: c.performance_claim || null,
    instructors: (c.instructors ?? []).map((i) => ({
      name: i.name,
      role: i.role ?? null,
      link: safeLink(i.link),
    })),
    curriculum: (c.curriculum ?? []).map((m) => ({
      title: m.title,
      moduleCount: m.module_count ?? null,
      topics: m.topics,
    })),
    formats: c.formats ?? [],
    platforms: c.platforms ?? [],
    pricing: (c.pricing ?? []).map((pr) => ({
      name: pr.name,
      price: pr.price,
      billingNote: pr.billing_note ?? null,
      highlight: pr.highlight ?? null,
    })),
    testimonials: (c.testimonials ?? []).map((t) => ({
      quote: t.quote,
      author: t.author,
      source: t.source ?? null,
    })),
    testimonialsNote: c.testimonials_note || DEFAULT_TESTIMONIALS_NOTE,
  };
}

// Only allow normal web links — same guard as courses.ts / propfirms.ts.
function safeLink(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

// Read once when the module loads (build time for a static page).
export const providers: ProviderView[] = loadProviders();

export function getProvider(id: string): ProviderView | undefined {
  return providers.find((p) => p.id === id);
}

export function getProviderCourse(
  providerId: string,
  slug: string,
): { provider: ProviderView; course: ProviderCourse } | undefined {
  const provider = getProvider(providerId);
  if (!provider) return undefined;
  const course = provider.courses.find((c) => c.slug === slug);
  if (!course) return undefined;
  return { provider, course };
}
