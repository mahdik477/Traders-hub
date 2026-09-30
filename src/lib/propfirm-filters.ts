// Filter-bar logic for the Funded Accounts page, kept separate from the UI so
// it's easy to test.

import type { FirmView } from "./propfirm-types";

/** Where a firm's pricing table opens: market / challenge type / tier. */
export type PricingSelection = {
  market?: string;
  challenge?: string;
  tier?: string;
};

export type Filters = {
  market: string;
  challenge: string; // challenge label, e.g. "2-Step" or "Flex"
  size: string;
  maxPrice: string;
  minSplit: string;
  feeRefund: string;
};

export const EMPTY_FILTERS: Filters = {
  market: "",
  challenge: "",
  size: "",
  maxPrice: "",
  minSplit: "",
  feeRefund: "",
};

/** One account (a single column in a firm's pricing table). */
export type Account = {
  market: string;
  challengeKey: string;
  challengeLabel: string;
  tier: string;
  size: number;
  lowestPrice: number | null;
  profitSplit: number | null;
  feeRefund: boolean | null;
};

export function allAccounts(firm: FirmView): Account[] {
  return firm.markets.flatMap((m) =>
    m.challenges.flatMap((c) =>
      c.tiers.flatMap((t) =>
        t.accounts.map((a) => ({
          market: m.market,
          challengeKey: c.key,
          challengeLabel: c.label,
          tier: t.name,
          size: a.size,
          lowestPrice: a.lowestPrice,
          profitSplit: t.profitSplit,
          feeRefund: t.feeRefund,
        })),
      ),
    ),
  );
}

export function matchesFilters(a: Account, f: Filters) {
  const maxPrice = f.maxPrice === "" ? NaN : Number(f.maxPrice);
  return (
    (!f.market || a.market === f.market) &&
    (!f.challenge || a.challengeLabel === f.challenge) &&
    (!f.size || a.size === Number(f.size)) &&
    (Number.isNaN(maxPrice) || (a.lowestPrice != null && a.lowestPrice <= maxPrice)) &&
    (!f.minSplit || (a.profitSplit != null && a.profitSplit >= Number(f.minSplit))) &&
    (!f.feeRefund || a.feeRefund === (f.feeRefund === "yes"))
  );
}

// Where to open a firm's table: the first market / challenge / tier that
// matches the filters.
export function selectionFor(match: Account): PricingSelection {
  return { market: match.market, challenge: match.challengeKey, tier: match.tier };
}

// ---- Filters in the web address ---------------------------------------------
// Filters are saved in the address (e.g. ?market=forex&challenge=2-Step) so a
// firm's page can open on the matching table, and "Back to all firms" can bring
// the visitor's filters back.

const QUERY_KEYS: Record<keyof Filters, string> = {
  market: "market",
  challenge: "challenge",
  size: "size",
  maxPrice: "max",
  minSplit: "split",
  feeRefund: "refund",
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

/** The first market / challenge / tier of this firm that matches the filters. */
export function firstMatch(firm: FirmView, f: Filters): Account | undefined {
  return allAccounts(firm).find((a) => matchesFilters(a, f));
}
