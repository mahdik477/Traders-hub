// Filter-bar logic for the Strategies page — same shape as course-filters.ts
// and propfirm-filters.ts. The research doc lists ~11 facets; these 6 became
// real filter controls (the ones people actually narrow by first), the rest
// (execution type, data requirement, platform testability) still show on
// every card and detail page as plain metadata rather than filters, to keep
// the bar usable on a phone.

import type { StrategyCategory, StrategyDifficulty, StrategyMarket, StrategyPricingTier, StrategyView } from "./strategy-types";

export type Filters = {
  search: string;
  tier: string;
  market: string;
  difficulty: string;
  category: string;
  controversial: string; // "hide" | "" (never defaults to hiding)
};

export const EMPTY_FILTERS: Filters = {
  search: "",
  tier: "",
  market: "",
  difficulty: "",
  category: "",
  controversial: "",
};

export function matchesFilters(s: StrategyView, f: Filters): boolean {
  return (
    (!f.search || s.name.toLowerCase().includes(f.search.trim().toLowerCase())) &&
    (!f.tier || s.tier === (f.tier as StrategyPricingTier)) &&
    (!f.market || s.markets.includes(f.market as StrategyMarket)) &&
    (!f.difficulty || s.difficulty === (f.difficulty as StrategyDifficulty)) &&
    (!f.category || s.category === (f.category as StrategyCategory)) &&
    (!f.controversial || !s.controversyFlag)
  );
}

// ---- Filters in the web address ---------------------------------------------

const QUERY_KEYS: Record<keyof Filters, string> = {
  search: "q",
  tier: "tier",
  market: "market",
  difficulty: "level",
  category: "style",
  controversial: "hide_controversial",
};

export function filtersToQuery(f: Filters): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(QUERY_KEYS) as (keyof Filters)[]) {
    if (f[key]) params.set(QUERY_KEYS[key], f[key]);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// A stale or hand-edited address — an old bookmark, a shared link from
// before a category was renamed, a typo — could otherwise hold a value
// that matches nothing, silently showing an empty page with no obvious way
// out. Anything that isn't a real option for that filter is dropped back to
// "no filter" instead.
const VALID_VALUES: Record<string, readonly string[]> = {
  tier: ["free", "intermediate", "advanced"],
  difficulty: ["beginner", "intermediate", "advanced"],
  category: [
    "trend_following",
    "mean_reversion",
    "breakout",
    "price_action",
    "momentum",
    "volume_order_flow",
    "market_structure",
    "quantitative",
  ],
  market: ["forex", "stocks", "crypto", "futures", "commodities", "etfs"],
  controversial: ["hide"],
};

export function filtersFromQuery(params: { get(name: string): string | null }): Filters {
  const f = { ...EMPTY_FILTERS };
  for (const key of Object.keys(QUERY_KEYS) as (keyof Filters)[]) {
    const raw = params.get(QUERY_KEYS[key]) ?? "";
    const valid = VALID_VALUES[key];
    f[key] = valid && raw && !valid.includes(raw) ? "" : raw;
  }
  return f;
}
