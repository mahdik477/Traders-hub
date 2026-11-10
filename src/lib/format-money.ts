// Money formatting shared by the newer prop-firm tools (compare, matcher,
// cost calculator, rules-in-money). Browser-safe: no Node imports.

export function money(n: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Whole units only — for rule amounts like "$5,000". */
export function moneyRound(n: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

/** "$100K" style account sizes. Sizes under $10K keep their exact figure
 *  (so a $1,250 account isn't shown as "$1.3K"). */
export function sizeLabel(size: number, currency = "USD"): string {
  if (size < 10_000) return moneyRound(size, currency);
  return new Intl.NumberFormat("en-US", { style: "currency", currency, notation: "compact" }).format(size);
}
