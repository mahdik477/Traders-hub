"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FirmView } from "@/lib/propfirm-types";
import type { PricingSelection } from "@/lib/propfirm-filters";
import { resolvePlan, ruleAmount, rulePercent, ruleText } from "@/lib/propfirm-compare";
import { moneyRound, sizeLabel } from "@/lib/format-money";

// "Rules in plain money": the selected plan's rules as amounts for one
// account size, written as sentences a beginner can picture — "you can
// lose $X in one day". Sits under the pricing table on a firm's page and
// follows the same market/challenge/tier toggles; the size is its own
// choice here.

export default function RulesInMoney({ firm, selection }: { firm: FirmView; selection: PricingSelection }) {
  const market = firm.markets.find((m) => m.market === selection.market) ?? firm.markets[0];
  const challenge = market?.challenges.find((c) => c.key === selection.challenge) ?? market?.challenges[0];
  const tier = challenge?.tiers.find((t) => t.name === selection.tier) ?? challenge?.tiers[0];
  const [sizeChoice, setSizeChoice] = useState<number | null>(null);

  const plan = useMemo(() => {
    if (!market || !challenge || !tier) return null;
    const size = tier.accounts.some((a) => a.size === sizeChoice) ? sizeChoice : null;
    return resolvePlan({ firm: firm.id, market: market.market, challenge: challenge.key, tier: tier.name, size }, [firm]);
  }, [firm, market, challenge, tier, sizeChoice]);

  if (!plan) return null;

  const cur = firm.currency;
  const daily = ruleAmount(plan, "dailyLoss");
  const max = ruleAmount(plan, "maxLoss");
  const target = ruleAmount(plan, "profitTarget");
  const r = plan.tier.rules;
  const pct2 = r.unit === "percent" ? r.phase2Target : "n/a";
  const pct3 = r.unit === "percent" ? r.phase3Target : "n/a";
  const target2 = typeof pct2 === "number" ? Math.round((pct2 / 100) * plan.account.size) : pct2;
  const target3 = typeof pct3 === "number" ? Math.round((pct3 / 100) * plan.account.size) : pct3;
  const dailyPct = rulePercent(plan, "dailyLoss");
  const maxPct = rulePercent(plan, "maxLoss");
  const split = r.profitSplitMax;
  const minDays = r.minTradingDays;

  const facts: { label: string; value: string; sub?: string; tone: "danger" | "warning" | "success" | "neutral" }[] = [
    {
      label: "Most you can lose in one day",
      value: ruleText(daily, (n) => moneyRound(n, cur)),
      sub: daily === "none" ? "No daily limit on this plan" : typeof dailyPct === "number" ? `${dailyPct}% of the account` : undefined,
      tone: "danger",
    },
    {
      label: "Most you can lose in total",
      value: ruleText(max, (n) => moneyRound(n, cur)),
      sub: [typeof maxPct === "number" ? `${maxPct}% of the account` : null, r.drawdownType ? `${r.drawdownType} drawdown` : null]
        .filter(Boolean)
        .join(" · ") || undefined,
      tone: "warning",
    },
    {
      label: pct2 !== "n/a" ? "Profit needed to pass phase 1" : "Profit needed to pass",
      value: ruleText(target, (n) => moneyRound(n, cur)),
      sub:
        pct2 !== "n/a"
          ? `then ${ruleText(target2, (n) => moneyRound(n, cur))} in phase 2${pct3 !== "n/a" ? `, ${ruleText(target3, (n) => moneyRound(n, cur))} in phase 3` : ""}`
          : r.unit === "percent" && typeof r.phase1Target === "number"
            ? `${r.phase1Target}% of the account`
            : undefined,
      tone: "success",
    },
    {
      label: "Your share of profits",
      value: ruleText(split, (n) => `up to ${n}%`),
      sub: minDays != null && minDays !== "n/a" ? `Minimum trading days: ${ruleText(minDays, (n) => (n === 0 ? "none" : String(n)))}` : undefined,
      tone: "neutral",
    },
  ];

  const TONE = {
    danger: "border-danger/30 bg-danger/5 text-danger",
    warning: "border-warning/30 bg-warning/5 text-warning",
    success: "border-success/30 bg-success/5 text-success",
    neutral: "border-border-strong bg-surface text-foreground",
  } as const;

  return (
    <section aria-labelledby="rules-money-heading" className="mt-10 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="rules-money-heading" className="section-title">
            The rules in plain money
          </h3>
          <p className="meta mt-1">
            {firm.name} · {plan.challenge.label}
            {plan.challenge.tiers.length > 1 && ` · ${plan.tier.name}`} — pick a size and the percentages become amounts.
          </p>
        </div>
        <div role="group" aria-label="Account size" className="flex flex-wrap gap-2">
          {plan.tier.accounts.map((a) => {
            const selected = a.size === plan.account.size;
            return (
              <button
                key={a.size}
                type="button"
                aria-pressed={selected}
                onClick={() => setSizeChoice(a.size)}
                className={`inline-flex min-h-10 items-center rounded-lg border px-3 text-sm font-semibold transition-colors ${
                  selected ? "border-gold-fill bg-gold-fill text-gold-ink" : "border-border-strong text-foreground hover:border-accent/70 hover:bg-surface-2"
                }`}
              >
                {sizeLabel(a.size, cur)}
              </button>
            );
          })}
        </div>
      </div>

      <dl key={`${plan.tier.name}-${plan.account.size}`} className="rules-money mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((f, i) => (
          <div key={f.label} className={`rules-money-card rounded-xl border p-4 ${TONE[f.tone]}`} style={{ animationDelay: `${i * 50}ms` }}>
            <dt className="text-xs font-semibold uppercase tracking-wide opacity-90">{f.label}</dt>
            <dd className="figure-lg mt-2 text-foreground">{f.value}</dd>
            {f.sub && <dd className="mt-1 text-xs text-muted">{f.sub}</dd>}
          </div>
        ))}
      </dl>

      <p className="meta mt-4">
        Worked out from the firm&apos;s published rules for a {sizeLabel(plan.account.size, cur)} account
        {r.unit === "percent" ? " (percentages of the starting balance)" : " (the firm's fixed amounts for this size)"}.
        A dash means the firm&apos;s page doesn&apos;t state it. Trailing drawdown rules move the total-loss line as
        your balance grows —{" "}
        <Link href="/funded-accounts/drawdown-explained" className="text-accent underline">
          see how
        </Link>
        .
      </p>
    </section>
  );
}
