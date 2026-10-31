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

export function filtersFromQuery(params: { get(name: string): string | null }): Filters {
  const f = { ...EMPTY_FILTERS };
  for (const key of Object.keys(QUERY_KEYS) as (keyof Filters)[]) {
    f[key] = params.get(QUERY_KEYS[key]) ?? "";
  }
  return f;
}
