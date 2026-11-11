// Every active promotion across the prop firm data, in one list for the
// Deals page. A "deal" is one firm + market that has at least one account
// with a discounted price. The discount is worked out from the firm's own
// standard vs promo prices — we never invent a percentage. Browser-safe.

import type { FirmView } from "./propfirm-types";

export type Deal = {
  firmId: string;
  firmName: string;
  logo: string | null;
  logoBg: "white" | "dark";
  currency: string;
  market: "forex" | "futures";
  /** The code to enter at checkout, or null when the discount is applied
   *  automatically ("current promo"). */
  code: string | null;
  /** Biggest percentage off across the discounted accounts, rounded. */
  maxDiscountPct: number;
  /** Smallest percentage off, so a range can be shown when they differ. */
  minDiscountPct: number;
  /** How many account sizes/tiers carry the discount. */
  discountedAccounts: number;
  /** Cheapest discounted price and what it was, for an example line. */
  example: { size: number; promo: number; standard: number; monthly: boolean; plan: string } | null;
  /** YYYY-MM-DD we last checked the firm's pricing page. */
  lastVerified: string | null;
  hasReviewAlert: boolean;
};

export function collectDeals(firms: FirmView[]): Deal[] {
  const deals: Deal[] = [];
  for (const firm of firms) {
    for (const market of firm.markets) {
      let count = 0;
      let maxPct = 0;
      let minPct = 100;
      let example: Deal["example"] = null;
      for (const c of market.challenges) {
        for (const t of c.tiers) {
          for (const a of t.accounts) {
            if (a.promoPrice == null || a.standardPrice == null || a.standardPrice <= 0 || a.promoPrice >= a.standardPrice) continue;
            count += 1;
            const pct = Math.round((1 - a.promoPrice / a.standardPrice) * 100);
            maxPct = Math.max(maxPct, pct);
            minPct = Math.min(minPct, pct);
            if (!example || a.promoPrice < example.promo) {
              example = {
                size: a.size,
                promo: a.promoPrice,
                standard: a.standardPrice,
                monthly: t.billing === "monthly",
                plan: c.tiers.length > 1 ? `${c.label} · ${t.name}` : c.label,
              };
            }
          }
        }
      }
      if (count === 0) continue;
      deals.push({
        firmId: firm.id,
        firmName: firm.name,
        logo: firm.logo,
        logoBg: firm.logoBg,
        currency: firm.currency,
        market: market.market,
        code: market.promoCode,
        maxDiscountPct: maxPct,
        minDiscountPct: minPct,
        discountedAccounts: count,
        example,
        lastVerified: firm.lastVerified,
        hasReviewAlert: firm.reviewAlert != null,
      });
    }
  }
  // Codes first (they need action), then by firm name — not by size of
  // discount, which would read as a recommendation.
  return deals.sort((a, b) => Number(b.code != null) - Number(a.code != null) || a.firmName.localeCompare(b.firmName));
}

/** Days between a YYYY-MM-DD date and today, for the "checked N days ago" label. */
export function daysSince(isoDate: string | null, now = new Date()): number | null {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const then = new Date(`${isoDate}T00:00:00Z`).getTime();
  return Math.max(0, Math.floor((now.getTime() - then) / 86_400_000));
}
