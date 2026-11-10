// "Find my firm" logic: turn five plain answers into a list of firms whose
// published plans fit, with a short factual explanation for each. Pure
// functions, browser-safe.
//
// Deliberately NOT a score or a ranking. A firm either has at least one
// plan that fits every answer the visitor gave, or it doesn't; the result
// is listed alphabetically (or by price, if the visitor asks) and every
// reason is a fact we can point to in the firm's data file. Nothing here
// says "best", and nothing here uses reviews, pass rates or payouts.

import type { DrawdownKind, FirmView } from "./propfirm-types";
import { firmAvailability, type Availability } from "./countries";
import { defaultPlanFor, resolvePlan, ruleAmount, type PlanKey, type ResolvedPlan } from "./propfirm-compare";
import { money, moneyRound, sizeLabel } from "./format-money";

export type MatcherAnswers = {
  /** Max price per attempt (one month for subscriptions), in the firm's
   *  currency as listed. "" = no limit. */
  budget: string;
  market: "" | "forex" | "futures";
  /** Account size in dollars, "" = any. */
  size: string;
  drawdown: "" | DrawdownKind;
  /** ISO country code, "" = skip. */
  country: string;
};

export const EMPTY_ANSWERS: MatcherAnswers = { budget: "", market: "", size: "", drawdown: "", country: "" };

export const DRAWDOWN_LABELS: Record<Exclude<DrawdownKind, "unknown">, string> = {
  static: "Static (fixed from the starting balance)",
  "eod-trailing": "End-of-day trailing",
  "intraday-trailing": "Intraday trailing",
  mixed: "Changes between evaluation and funded",
};

export const DRAWDOWN_SHORT: Record<DrawdownKind, string> = {
  static: "static",
  "eod-trailing": "end-of-day trailing",
  "intraday-trailing": "intraday trailing",
  mixed: "mixed",
  unknown: "not stated",
};

export type FirmMatch = {
  firm: FirmView;
  /** The cheapest plan that fits — what the explanation and links use. */
  plan: ResolvedPlan;
  /** How many plans (tier + size combinations) fit the answers. */
  fittingPlans: number;
  reasons: string[];
  availability: Availability | null;
};

const QUERY_KEYS: Record<keyof MatcherAnswers, string> = {
  budget: "budget",
  market: "market",
  size: "size",
  drawdown: "drawdown",
  country: "country",
};

export function answersToQuery(a: MatcherAnswers): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(QUERY_KEYS) as (keyof MatcherAnswers)[]) {
    if (a[key]) params.set(QUERY_KEYS[key], a[key]);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function answersFromQuery(params: { get(name: string): string | null }): MatcherAnswers {
  const a = { ...EMPTY_ANSWERS };
  for (const key of Object.keys(QUERY_KEYS) as (keyof MatcherAnswers)[]) {
    const v = params.get(QUERY_KEYS[key]) ?? "";
    (a as Record<string, string>)[key] = v;
  }
  if (a.market !== "forex" && a.market !== "futures") a.market = "";
  if (!(a.drawdown in DRAWDOWN_LABELS)) a.drawdown = "";
  return a;
}

export function answeredCount(a: MatcherAnswers): number {
  return Object.values(a).filter(Boolean).length;
}

/** Every (tier, size) plan of a firm as a resolvable key. */
function allPlanKeys(firm: FirmView): PlanKey[] {
  const keys: PlanKey[] = [];
  for (const m of firm.markets)
    for (const c of m.challenges)
      for (const t of c.tiers)
        for (const a of t.accounts)
          keys.push({ firm: firm.id, market: m.market, challenge: c.key, tier: t.name, size: a.size });
  return keys;
}

function planFits(p: ResolvedPlan, a: MatcherAnswers): boolean {
  if (a.market && p.market.market !== a.market) return false;
  if (a.size && p.account.size !== Number(a.size)) return false;
  if (a.budget) {
    const max = Number(a.budget);
    if (!Number.isFinite(max)) return true;
    if (p.account.lowestPrice == null || p.account.lowestPrice > max) return false;
  }
  if (a.drawdown && p.tier.drawdownKind !== a.drawdown) return false;
  return true;
}

export function matchFirms(firms: FirmView[], a: MatcherAnswers, sort: "name" | "price" = "name"): FirmMatch[] {
  const out: FirmMatch[] = [];
  for (const firm of firms) {
    const availability = a.country ? firmAvailability(firm.countries, a.country) : null;
    if (availability?.status === "restricted") continue;

    const fitting = allPlanKeys(firm)
      .map((k) => resolvePlan(k, firms))
      .filter((p): p is ResolvedPlan => p != null && planFits(p, a));
    if (fitting.length === 0) continue;

    const plan = [...fitting].sort(
      (x, y) => (x.account.lowestPrice ?? Infinity) - (y.account.lowestPrice ?? Infinity),
    )[0];
    out.push({ firm, plan, fittingPlans: fitting.length, reasons: explain(plan, a, availability), availability });
  }
  out.sort((x, y) =>
    sort === "price"
      ? (x.plan.account.lowestPrice ?? Infinity) - (y.plan.account.lowestPrice ?? Infinity) ||
        x.firm.name.localeCompare(y.firm.name)
      : x.firm.name.localeCompare(y.firm.name),
  );
  return out;
}

/** Plain-English facts about why this plan fits — one line per answer the
 *  visitor actually gave, plus the loss limits in money. */
function explain(p: ResolvedPlan, a: MatcherAnswers, availability: Availability | null): string[] {
  const cur = p.firm.currency;
  const price = p.account.lowestPrice;
  const period = p.tier.billing === "monthly" ? " a month" : "";
  const planName = `${p.challenge.label}${p.challenge.tiers.length > 1 ? ` · ${p.tier.name}` : ""}`;
  const reasons: string[] = [];

  reasons.push(
    `${p.market.market === "forex" ? "Forex" : "Futures"} ${planName}, ${sizeLabel(p.account.size, cur)} account${
      price != null ? ` — ${money(price, cur)}${period}` : ""
    }${p.account.promoPrice != null ? ` with the current promo (full price ${money(p.account.standardPrice!, cur)})` : ""}.`,
  );
  if (a.budget && price != null) {
    reasons.push(`That's within your ${money(Number(a.budget), cur)} budget${period ? " per month" : ""}.`);
  }
  const daily = ruleAmount(p, "dailyLoss");
  const max = ruleAmount(p, "maxLoss");
  const parts: string[] = [];
  if (typeof daily === "number") parts.push(`${moneyRound(daily, cur)} in a day`);
  else if (daily === "none") parts.push("no daily loss limit");
  if (typeof max === "number") parts.push(`${moneyRound(max, cur)} in total`);
  if (parts.length) reasons.push(`Loss limits on this size: ${parts.join(", ")}.`);

  const dd = p.tier.rules.drawdownType;
  if (a.drawdown) {
    reasons.push(`Drawdown type matches: the firm describes it as "${dd}".`);
  } else if (dd) {
    reasons.push(`Drawdown type: ${dd}.`);
  }
  if (availability) reasons.push(availability.reason + (p.firm.countries?.lastChecked ? ` (country list checked ${p.firm.countries.lastChecked}).` : ""));
  return reasons;
}

/** The sizes that exist anywhere in the data for the chosen market — so the
 *  size question only offers real options. */
export function sizeOptions(firms: FirmView[], market: MatcherAnswers["market"]): number[] {
  const sizes = new Set<number>();
  for (const f of firms)
    for (const m of f.markets)
      if (!market || m.market === market)
        for (const c of m.challenges) for (const t of c.tiers) for (const acc of t.accounts) sizes.add(acc.size);
  return [...sizes].sort((x, y) => x - y);
}

export { defaultPlanFor };
