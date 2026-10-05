// Filter-bar logic for the Brokers page — same idea as course-filters.ts.

import type { BrokerMarket, BrokerView } from "./broker-types";

export type Filters = {
  market: string;
  regulator: string;
  maxDeposit: string;
  minRating: string;
};

export const EMPTY_FILTERS: Filters = {
  market: "",
  regulator: "",
  maxDeposit: "",
  minRating: "",
};

export function matchesFilters(b: BrokerView, f: Filters): boolean {
  const maxDeposit = f.maxDeposit === "" ? NaN : Number(f.maxDeposit);
  return (
    (!f.market || b.markets.includes(f.market as BrokerMarket)) &&
    (!f.regulator || b.regulators.some((r) => r.regulator === f.regulator)) &&
    (Number.isNaN(maxDeposit) || (b.minDeposit != null && b.minDeposit <= maxDeposit)) &&
    (!f.minRating || (b.trustpilot != null && b.trustpilot.rating >= Number(f.minRating)))
  );
}

// ---- Filters in the web address ---------------------------------------------

const QUERY_KEYS: Record<keyof Filters, string> = {
  market: "market",
  regulator: "regulator",
  maxDeposit: "deposit",
  minRating: "rating",
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
