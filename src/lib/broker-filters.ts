// Filter-bar logic for the Brokers page — same idea as course-filters.ts.

import type { BrokerMarket, BrokerView } from "./broker-types";

export type SortKey = "name" | "deposit" | "rating";

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

export function sortFromQuery(value: string | null): SortKey {
  if (value === "deposit" || value === "rating") return value;
  return "name";
}

/** Up to three broker ids from ?compare=a,b,c */
export function compareFromQuery(value: string | null): string[] {
  if (!value) return [];
  const ids = value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9-]+$/.test(s));
  return [...new Set(ids)].slice(0, 3);
}

export function sortBrokers(list: BrokerView[], sort: SortKey): BrokerView[] {
  const copy = [...list];
  if (sort === "deposit") {
    copy.sort((a, b) => {
      if (a.minDeposit == null && b.minDeposit == null) return a.name.localeCompare(b.name);
      if (a.minDeposit == null) return 1;
      if (b.minDeposit == null) return -1;
      return a.minDeposit - b.minDeposit || a.name.localeCompare(b.name);
    });
  } else if (sort === "rating") {
    copy.sort(
      (a, b) =>
        (b.trustpilot?.rating ?? -1) - (a.trustpilot?.rating ?? -1) || a.name.localeCompare(b.name),
    );
  } else {
    copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  return copy;
}

export function leverageLabel(broker: BrokerView): string {
  return broker.leverageSummary || broker.leverage[0]?.value || "Not listed";
}
