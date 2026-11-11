// The prop-firm compare page's selection logic. A "plan" is one firm +
// market + challenge type + tier (+ optionally one account size) — the same
// thing a visitor picks with the toggles on a firm's page. Up to 3 plans
// live in the address as repeated ?p= parameters, e.g.
//   /funded-accounts/compare?p=ftmo/forex/2-step/Standard/100000&p=apex/futures/...
// so a comparison is a real, shareable link (same idea as the course and
// broker compare pages). Browser-safe: no Node imports.

import type {
  AccountView,
  ChallengeView,
  FirmView,
  MarketView,
  RuleValue,
  TierView,
} from "./propfirm-types";

export const MAX_COMPARE = 3;

export type PlanKey = {
  firm: string;
  market: string;
  challenge: string;
  tier: string;
  /** Account size, when the visitor has picked one. */
  size: number | null;
};

export type ResolvedPlan = {
  key: PlanKey;
  firm: FirmView;
  market: MarketView;
  challenge: ChallengeView;
  tier: TierView;
  /** The chosen size, or the tier's first size when none was chosen. */
  account: AccountView;
};

export function planToString(k: PlanKey): string {
  const parts = [k.firm, k.market, k.challenge, k.tier].map(encodeURIComponent);
  if (k.size != null) parts.push(String(k.size));
  return parts.join("/");
}

export function planFromString(s: string): PlanKey | null {
  const parts = s.split("/").map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  });
  if (parts.length < 4 || parts.length > 5) return null;
  const size = parts[4] != null ? Number(parts[4]) : null;
  if (size != null && !(Number.isFinite(size) && size > 0)) return null;
  return { firm: parts[0], market: parts[1], challenge: parts[2], tier: parts[3], size };
}

export function plansToQuery(keys: PlanKey[]): string {
  const params = new URLSearchParams();
  for (const k of keys.slice(0, MAX_COMPARE)) params.append("p", planToString(k));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function plansFromQuery(params: { getAll(name: string): string[] }): PlanKey[] {
  return params
    .getAll("p")
    .map(planFromString)
    .filter((k): k is PlanKey => k != null)
    .slice(0, MAX_COMPARE);
}

export function samePlan(a: PlanKey, b: PlanKey): boolean {
  return a.firm === b.firm && a.market === b.market && a.challenge === b.challenge && a.tier === b.tier;
}

/** Looks a key up against the real data. Returns null for a key that no
 *  longer matches anything (a renamed tier, a typo in a shared link). */
export function resolvePlan(key: PlanKey, firms: FirmView[]): ResolvedPlan | null {
  const firm = firms.find((f) => f.id === key.firm);
  if (!firm) return null;
  const market = firm.markets.find((m) => m.market === key.market);
  if (!market) return null;
  const challenge = market.challenges.find((c) => c.key === key.challenge);
  if (!challenge) return null;
  const tier = challenge.tiers.find((t) => t.name === key.tier);
  if (!tier || tier.accounts.length === 0) return null;
  const account = tier.accounts.find((a) => a.size === key.size) ?? tier.accounts[0];
  return { key: { ...key, size: account.size }, firm, market, challenge, tier, account };
}

/** The first plan of a firm — what the Compare button adds when the visitor
 *  hasn't picked anything more specific. */
export function defaultPlanFor(firm: FirmView, prefer?: Partial<PlanKey>): PlanKey | null {
  const market = firm.markets.find((m) => m.market === prefer?.market) ?? firm.markets[0];
  if (!market) return null;
  const challenge = market.challenges.find((c) => c.key === prefer?.challenge) ?? market.challenges[0];
  if (!challenge) return null;
  const tier = challenge.tiers.find((t) => t.name === prefer?.tier) ?? challenge.tiers[0];
  if (!tier) return null;
  const size = tier.accounts.find((a) => a.size === prefer?.size)?.size ?? null;
  return { firm: firm.id, market: market.market, challenge: challenge.key, tier: tier.name, size };
}

// ---- Turning rules into money -----------------------------------------------

/** A rule as an amount of money for one account size. Forex rules are a
 *  percentage of the size; futures rules are already fixed USD amounts. */
export function ruleAmount(plan: ResolvedPlan, which: "dailyLoss" | "maxLoss" | "profitTarget"): RuleValue {
  const { tier, account } = plan;
  if (tier.rules.unit === "usd") {
    return which === "profitTarget" ? account.profitTarget : account[which];
  }
  const pct = which === "profitTarget" ? tier.rules.phase1Target : tier.rules[which];
  if (typeof pct !== "number") return pct;
  return Math.round((pct / 100) * account.size);
}

/** Percentage view of the same rule — only meaningful for forex. */
export function rulePercent(plan: ResolvedPlan, which: "dailyLoss" | "maxLoss" | "phase1Target" | "phase2Target"): RuleValue {
  const { tier, account } = plan;
  if (tier.rules.unit === "percent") return tier.rules[which];
  const amount =
    which === "dailyLoss" ? account.dailyLoss : which === "maxLoss" ? account.maxLoss : which === "phase1Target" ? account.profitTarget : "n/a";
  if (typeof amount !== "number") return amount;
  return Math.round((amount / account.size) * 1000) / 10;
}

export function ruleText(v: RuleValue, format: (n: number) => string): string {
  if (v == null) return "—";
  if (v === "n/a") return "N/A";
  if (v === "none") return "None";
  return format(v);
}

// ---- Example comparisons for the empty state ----------------------------------

export type ExampleComparison = { eyebrow: string; title: string; firms: string[]; keys: PlanKey[] };

/** Three ready-made comparisons built from the data: the first three firms
 *  (alphabetically) that offer a given program, at a common size. Examples
 *  to click, never a recommendation. */
export function exampleComparisons(firms: FirmView[]): ExampleComparison[] {
  const sorted = [...firms].sort((a, b) => a.name.localeCompare(b.name));
  const out: ExampleComparison[] = [];

  function pick(eyebrow: string, title: string, market: "forex" | "futures", challengeKey: string | null, size: number) {
    const keys: PlanKey[] = [];
    const names: string[] = [];
    for (const f of sorted) {
      const m = f.markets.find((x) => x.market === market);
      if (!m) continue;
      const c = challengeKey ? m.challenges.find((x) => x.key === challengeKey) : m.challenges[0];
      if (!c) continue;
      const t = c.tiers.find((tier) => tier.accounts.some((a) => a.size === size));
      if (!t) continue;
      keys.push({ firm: f.id, market, challenge: c.key, tier: t.name, size });
      names.push(f.name);
      if (keys.length === MAX_COMPARE) break;
    }
    if (keys.length >= 2) out.push({ eyebrow, title, firms: names, keys });
  }

  pick("Forex", "Three 2-step plans at $100K", "forex", "2-step", 100_000);
  pick("Forex", "Three 1-step plans at $50K", "forex", "1-step", 50_000);
  pick("Futures", "Three futures evaluations at $50K", "futures", null, 50_000);
  return out.slice(0, 3);
}
