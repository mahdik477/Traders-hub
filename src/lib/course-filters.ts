// Filter-bar logic for the Courses page — same idea as propfirm-filters.ts,
// adapted for how different course listings actually are from each other
// (wildly different pricing structures, not every course has every rating
// source, etc).

import type { CourseMarket, CourseView, TrustpilotRating } from "./course-types";
import type { ProviderView } from "./provider-types";

export type Filters = {
  market: string;
  maxPrice: string;
  minRating: string;
  live: string; // "yes" | ""
  free: string; // "yes" | ""
};

export const EMPTY_FILTERS: Filters = {
  market: "",
  maxPrice: "",
  minRating: "",
  live: "",
  free: "",
};

// One filterable directory card — a standalone course, or a whole provider
// (aggregated across its courses, so a provider card matches if ANY of its
// courses would).
export type Listing = {
  id: string;
  markets: CourseMarket[];
  /** The cheapest tier's price, as a plain currency-agnostic number (see
   *  parsePrice) — an approximation used only for filtering/sorting, never
   *  shown to a visitor in place of the real, currency-labelled price. */
  startingPrice: number | null;
  hasFreeTier: boolean;
  hasLiveSessions: boolean;
  /** The higher of Trustpilot/Whop, when either exists. */
  bestRating: number | null;
};

// Pulls a plain number out of a price string for filtering purposes only —
// "Free" -> 0, "$65/month" -> 65, "5 × $347/month" -> 347 (anchored on the
// currency symbol so it doesn't grab the "5"), "Apply for pricing" -> null.
// Currency and billing period are deliberately ignored: this is a rough
// "what's the sticker price" number, not a real like-for-like conversion.
export function parsePrice(price: string): number | null {
  if (/free/i.test(price)) return 0;
  const m = price.match(/[£$€]\s?([\d,]+(?:\.\d+)?)/);
  if (!m) return null;
  return parseFloat(m[1].replace(/,/g, ""));
}

function hasLiveFormat(formats: { label: string }[]): boolean {
  return formats.some((f) => /live/i.test(f.label));
}

function bestRating(...ratings: (TrustpilotRating | null)[]): number | null {
  const values = ratings.map((r) => r?.rating).filter((n): n is number => n != null);
  return values.length ? Math.max(...values) : null;
}

export function listingFromCourse(c: CourseView): Listing {
  const prices = c.pricing.map((p) => parsePrice(p.price)).filter((n): n is number => n != null);
  return {
    id: c.id,
    markets: c.markets,
    startingPrice: prices.length ? Math.min(...prices) : null,
    hasFreeTier: prices.includes(0),
    hasLiveSessions: hasLiveFormat(c.formats),
    bestRating: bestRating(c.trustpilot, c.whop),
  };
}

export function listingFromProvider(p: ProviderView): Listing {
  const prices = p.courses
    .flatMap((c) => c.pricing.map((pr) => parsePrice(pr.price)))
    .filter((n): n is number => n != null);
  return {
    id: p.id,
    markets: [...new Set(p.courses.flatMap((c) => c.markets))],
    startingPrice: prices.length ? Math.min(...prices) : null,
    hasFreeTier: prices.includes(0),
    hasLiveSessions: p.courses.some((c) => hasLiveFormat(c.formats)),
    bestRating: bestRating(p.trustpilot, p.whop),
  };
}

export function matchesFilters(l: Listing, f: Filters): boolean {
  const maxPrice = f.maxPrice === "" ? NaN : Number(f.maxPrice);
  return (
    (!f.market || l.markets.includes(f.market as CourseMarket)) &&
    (Number.isNaN(maxPrice) || (l.startingPrice != null && l.startingPrice <= maxPrice)) &&
    (!f.minRating || (l.bestRating != null && l.bestRating >= Number(f.minRating))) &&
    (!f.live || l.hasLiveSessions) &&
    (!f.free || l.hasFreeTier)
  );
}

// ---- Filters in the web address ---------------------------------------------

const QUERY_KEYS: Record<keyof Filters, string> = {
  market: "market",
  maxPrice: "max",
  minRating: "rating",
  live: "live",
  free: "free",
};

export function filtersToQuery(f: Filters): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(QUERY_KEYS) as (keyof Filters)[]) {
    if (f[key]) params.set(QUERY_KEYS[key], f[key]);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function filtersFromQuery(params: { get(name: string): string | null }): Filters {
  const f = { ...EMPTY_FILTERS };
  for (const key of Object.keys(QUERY_KEYS) as (keyof Filters)[]) {
    f[key] = params.get(QUERY_KEYS[key]) ?? "";
  }
  return f;
}
