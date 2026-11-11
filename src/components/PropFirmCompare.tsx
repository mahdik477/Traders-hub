"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { X } from "lucide-react";
import type { FirmView, RuleValue } from "@/lib/propfirm-types";
import {
  MAX_COMPARE,
  defaultPlanFor,
  exampleComparisons,
  plansFromQuery,
  plansToQuery,
  resolvePlan,
  ruleAmount,
  rulePercent,
  ruleText,
  type PlanKey,
  type ResolvedPlan,
} from "@/lib/propfirm-compare";
import { money, moneyRound, sizeLabel } from "@/lib/format-money";
import { MARKET_LABELS } from "@/components/PropFirmPricing";
import FirmBadge from "@/components/FirmBadge";
import CopyButton from "@/components/CopyButton";
import SaveComparisonButton from "@/components/SaveComparisonButton";
import VisitSiteLink from "@/components/VisitSiteLink";
import { formatDate } from "@/components/PropFirmReviews";

// Side-by-side view of up to 3 prop-firm plans. The selection lives in the
// address (?p=firm/market/challenge/tier/size, repeated) so a comparison is
// a shareable link. See docs/ROLLOUT.md → "Step 2" for the design intent:
// plan cards you configure on top, then one grid (ARIA table) that fits the
// screen — no sideways scrolling: on phones each row's label sits on its
// own line above the values. Column names stick under the site header,
// every row has a plain-English hint, money rules are bars on a shared
// scale, plus an "only differences" toggle and example comparisons when
// empty. None of it ranks — it's the firms' published terms side by side.

export default function PropFirmCompare({ firms }: { firms: FirmView[] }) {
  return (
    <Suspense fallback={null}>
      <CompareFromAddress firms={firms} />
    </Suspense>
  );
}

type Group = { id: string; label: string; rows: RowDef[] };
type RowDef = {
  label: string;
  /** Text used to decide whether columns differ. */
  key: (p: ResolvedPlan) => string;
  /** One plain-English line under the label, for someone new to prop firms. */
  hint?: ReactNode;
  /** `all` is every plan on the page, so bars can share one scale. */
  render: (p: ResolvedPlan, all: ResolvedPlan[]) => ReactNode;
  highlight?: boolean;
};

function CompareFromAddress({ firms }: { firms: FirmView[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const keys = useMemo(() => plansFromQuery(searchParams), [searchParams]);
  // A shared link whose tier/plan name has since changed still shows the
  // firm — on its first plan — rather than silently dropping the column.
  const plans = useMemo(
    () =>
      keys
        .map((k) => {
          const exact = resolvePlan(k, firms);
          if (exact) return exact;
          const firm = firms.find((f) => f.id === k.firm);
          const fallback = firm && defaultPlanFor(firm, { market: k.market, size: k.size ?? undefined });
          return fallback ? resolvePlan(fallback, firms) : null;
        })
        .filter((p): p is ResolvedPlan => p != null),
    [keys, firms],
  );
  const [onlyDiff, setOnlyDiff] = useState(false);
  // The column names stick directly under the site header, whose height
  // changes between phone (two rows) and desktop (one).
  const [stickyTop, setStickyTop] = useState<string | undefined>(undefined);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header || typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver(() => setStickyTop(`${Math.round(header.getBoundingClientRect().height) - 1}px`));
    obs.observe(header);
    return () => obs.disconnect();
  }, []);

  function write(next: PlanKey[]) {
    router.replace(`/funded-accounts/compare${plansToQuery(next)}`, { scroll: false });
  }

  function update(i: number, patch: Partial<PlanKey>) {
    const next = plans.map((p) => p.key);
    const merged = { ...next[i], ...patch };
    const firm = firms.find((f) => f.id === merged.firm);
    const fixed = firm ? defaultPlanFor(firm, merged) : null;
    if (!fixed) return;
    next[i] = fixed;
    write(next);
  }

  function remove(i: number) {
    write(plans.map((p) => p.key).filter((_, j) => j !== i));
  }

  function add(firmId: string) {
    const firm = firms.find((f) => f.id === firmId);
    const key = firm && defaultPlanFor(firm);
    if (!key) return;
    write([...plans.map((p) => p.key), key]);
  }

  const groups = useMemo(() => buildGroups(), []);
  const sameByRow = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const g of groups) for (const r of g.rows) {
      const vals = plans.map((p) => r.key(p));
      map.set(`${g.id}:${r.label}`, plans.length > 1 && vals.every((v) => v === vals[0]));
    }
    return map;
  }, [groups, plans]);

  if (plans.length === 0) return <EmptyState firms={firms} onAdd={add} />;

  const cols = { "--cols": plans.length, "--cmp-sticky-top": stickyTop } as CSSProperties;

  return (
    <div className="cmp mt-8" style={cols}>
      {/* 1 — choose the plans */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="readout">Step 1</p>
          <h2 className="section-title mt-1">Your plans</h2>
        </div>
        <AddPlanControl firms={firms} plans={plans} onAdd={add} />
      </div>
      <ul className="cmp-plans mt-4">
        {plans.map((p, i) => (
          <li key={`${p.firm.id}-${i}`} className="compare-col min-w-0">
            <PlanCard plan={p} firms={firms} onChange={(patch) => update(i, patch)} onRemove={() => remove(i)} />
          </li>
        ))}
      </ul>

      {/* 2 — read them side by side */}
      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="readout">Step 2</p>
          <h2 className="section-title mt-1">Side by side</h2>
        </div>
        <label className={`seg-toggle ${onlyDiff ? "is-on" : ""} ${plans.length < 2 ? "opacity-50" : "cursor-pointer"}`}>
          <input
            type="checkbox"
            checked={onlyDiff}
            onChange={(e) => setOnlyDiff(e.target.checked)}
            className="size-4 accent-[var(--color-gold-fill)]"
            disabled={plans.length < 2}
          />
          Only show differences
        </label>
      </div>

      <div
        role="table"
        aria-label={`${plans.map((p) => `${p.firm.name} ${p.challenge.label} ${p.tier.name}`).join(", ")} compared from their pricing pages`}
        className="cmp-table kit-panel mt-4 text-sm"
      >
        <div role="rowgroup" className="cmp-head">
          <div role="row" className="cmp-row">
            <div role="columnheader" className="cmp-corner">
              <span className="readout">Plan</span>
            </div>
            {plans.map((p, i) => (
              <div key={i} role="columnheader" className="cmp-cell min-w-0">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="hidden shrink-0 sm:block">
                    <FirmBadge name={p.firm.name} logo={p.firm.logo} logoBg={p.firm.logoBg} />
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-2 break-words text-sm font-semibold leading-tight text-foreground sm:text-base">{p.firm.name}</p>
                    <p className="truncate font-mono text-[0.7rem] text-muted">
                      {p.challenge.label} · {sizeLabel(p.account.size, p.firm.currency)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {groups.map((g) => (
          <GroupRows key={g.id} group={g} plans={plans} sameByRow={sameByRow} onlyDiff={onlyDiff} />
        ))}

        <div role="rowgroup" className="hidden md:block">
          <div role="row" className="cmp-row border-t border-border">
            <div role="rowheader" className="cmp-label">
              <span className="sr-only">Links</span>
            </div>
            {plans.map((p, i) => (
              <div key={i} role="cell" className="cmp-cell">
                <PlanActions plan={p} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-3 md:hidden">
        {plans.map((p, i) => (
          <li key={i} className="kit-panel p-4">
            <p className="mb-3 font-semibold text-foreground">{p.firm.name}</p>
            <PlanActions plan={p} />
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <ShareLink />
            <SaveComparisonButton kind="firms" title={plans.map((p) => `${p.firm.name} ${p.challenge.label}`).join(" vs ")} />
            <p className="meta hidden lg:block lg:max-w-2xl">
              Forex rules are a percentage of the account; the amounts shown are that percentage of the size you picked.
              Futures rules are the firm&apos;s fixed amounts. A side-by-side of published terms — not a ranking.
            </p>
          </div>
        </div>
      </div>
      <p className="meta mt-4 lg:hidden">
        Forex rules are a percentage of the account; amounts are for the size you picked. Not a ranking.
      </p>
    </div>
  );
}

function PlanActions({ plan: p }: { plan: ResolvedPlan }) {
  return (
    <div className="flex flex-col gap-2">
      <Link
        href={`/funded-accounts/${p.firm.id}?market=${p.market.market}&challenge=${encodeURIComponent(p.challenge.label)}`}
        className="btn btn-primary w-full"
      >
        View {p.firm.name}
      </Link>
      {p.firm.affiliateLink && (
        <VisitSiteLink href={p.firm.affiliateLink} firmName={p.firm.name} variant="outline" className="w-full" />
      )}
    </div>
  );
}

// ---- Rows -------------------------------------------------------------------

function buildGroups(): Group[] {
  const text = (v: string | null) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : "");
  return [
    {
      id: "price",
      label: "Price & billing",
      rows: [
        { label: "Price", hint: "What you pay to start this challenge today.", key: (p) => `${p.account.lowestPrice}|${p.account.promoPrice}`, render: (p) => <PriceCell plan={p} />, highlight: true },
        { label: "Billing", hint: "One payment, or a subscription that renews.", key: (p) => p.tier.billing, render: (p) => (p.tier.billing === "monthly" ? "Monthly subscription" : "One-time fee") },
        { label: "Fee refund", hint: "Whether the firm states the fee is refundable.", key: (p) => String(p.tier.rules.feeRefund), render: (p) => <RefundCell value={p.tier.rules.feeRefund} /> },
      ],
    },
    {
      id: "targets",
      label: "Profit targets",
      rows: [
        { label: "To pass", hint: "Total profit you have to make, across every phase, before the firm funds you.", key: (p) => [targetTotal(p), p.tier.rules.phase2Target, p.tier.rules.phase3Target].join("|"), render: (p, all) => <TargetCell plan={p} all={all} /> },
        { label: "Profit split", hint: "The largest share of profits the firm says you keep.", key: (p) => String(p.tier.rules.profitSplitMax), render: (p) => <span className="cmp-num">{ruleText(p.tier.rules.profitSplitMax, (n) => `Up to ${n}%`)}</span> },
      ],
    },
    {
      id: "loss",
      label: "Loss limits",
      rows: [
        { label: "In one day", hint: "The most you can lose in one day. At most firms going past it closes the account; a few only pause trading until the next day. Check the firm’s rules.", key: (p) => String(ruleAmount(p, "dailyLoss")), render: (p, all) => <MoneyRule plan={p} all={all} which="dailyLoss" /> },
        { label: "In total", hint: "How far the account can fall before the firm closes it. With a trailing drawdown this is measured from your highest balance, not your starting balance.", key: (p) => String(ruleAmount(p, "maxLoss")), render: (p, all) => <MoneyRule plan={p} all={all} which="maxLoss" /> },
        {
          label: "Drawdown type",
          hint: (
            <>
              How the loss limit moves as your balance grows.{" "}
              <Link href="/funded-accounts/drawdown-explained" className="text-accent underline">
                See it on a chart
              </Link>
            </>
          ), key: (p) => p.tier.rules.drawdownType ?? "", render: (p) => text(p.tier.rules.drawdownType) || <Dash /> },
      ],
    },
    {
      id: "rules",
      label: "Rules",
      rows: [
        { label: "Min trading days", hint: "Days you must trade before you can pass.", key: (p) => String(p.tier.rules.minTradingDays), render: (p) => ruleText(p.tier.rules.minTradingDays, (n) => (n === 0 ? "No minimum" : String(n))) },
        { label: "Consistency", hint: "Rules about making too much of your profit in one day.", key: (p) => p.tier.rules.consistency ?? "", render: (p) => text(p.tier.rules.consistency) || <Dash /> },
        { label: "Trading period", hint: "Any time limit for reaching the target.", key: (p) => p.tier.rules.tradingPeriod ?? "", render: (p) => text(p.tier.rules.tradingPeriod) || <Dash /> },
      ],
    },
    {
      id: "firm",
      label: "Platforms & reviews",
      rows: [
        {
          label: "Platforms", hint: "The software you place trades with.",
          key: (p) => (p.firm.platforms ?? []).join(","),
          render: (p) =>
            p.firm.platforms?.length ? (
              <div className="flex flex-wrap gap-1">
                {p.firm.platforms.map((pl) => (
                  <span key={pl} className="pill text-xs">
                    {pl}
                  </span>
                ))}
              </div>
            ) : (
              <Dash />
            ),
        },
        {
          label: "Recent reviews", hint: "Whether we flagged payout complaints in recent public reviews.",
          key: (p) => String(!!p.firm.reviewAlert),
          render: (p) =>
            p.firm.reviewAlert ? (
              <span className="badge badge-warning whitespace-normal">Payout complaints in recent reviews</span>
            ) : (
              <span className="text-muted">No review alert — we don&apos;t verify payouts</span>
            ),
        },
        { label: "Data checked", hint: "When we last compared this with the firm's pricing page.", key: (p) => p.firm.lastVerified ?? "", render: (p) => (p.firm.lastVerified ? formatDate(p.firm.lastVerified) : <Dash />) },
      ],
    },
  ];
}

function GroupRows({
  group,
  plans,
  sameByRow,
  onlyDiff,
}: {
  group: Group;
  plans: ResolvedPlan[];
  sameByRow: Map<string, boolean>;
  onlyDiff: boolean;
}) {
  const visible = group.rows.filter((r) => !(onlyDiff && sameByRow.get(`${group.id}:${r.label}`)));
  const hidden = group.rows.length - visible.length;
  return (
    <div role="rowgroup" className="cmp-group">
      <div role="row" className="cmp-group-title">
        <span role="cell" aria-colspan={plans.length + 1} className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="readout text-accent">{group.label}</span>
          {hidden > 0 && (
            <span className="meta">
              {hidden} identical row{hidden === 1 ? "" : "s"} hidden
            </span>
          )}
        </span>
      </div>
      {visible.map((r) => {
        const same = sameByRow.get(`${group.id}:${r.label}`);
        return (
          <div key={r.label} role="row" className={`cmp-row cmp-data-row ${r.highlight ? "is-highlight" : ""}`}>
            <div role="rowheader" className="cmp-label">
              <span className="flex flex-wrap items-center gap-x-2">
                <span className={`text-sm font-semibold ${r.highlight ? "text-accent" : "text-foreground"}`}>{r.label}</span>
                {same && plans.length > 1 && <span className="cmp-same-tag">same for all</span>}
              </span>
              {r.hint && <span className="mt-0.5 block text-xs leading-snug text-muted">{r.hint}</span>}
            </div>
            {plans.map((p, i) => (
              <div key={i} role="cell" className={`cmp-cell min-w-0 text-foreground ${same ? "compare-same" : ""}`}>
                {r.render(p, plans)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ---- Column header -----------------------------------------------------------

function PlanCard({
  plan: p,
  firms,
  onChange,
  onRemove,
}: {
  plan: ResolvedPlan;
  firms: FirmView[];
  onChange: (patch: Partial<PlanKey>) => void;
  onRemove: () => void;
}) {
  const firm = firms.find((f) => f.id === p.firm.id)!;
  const price = p.account.lowestPrice;
  const period = p.tier.billing === "monthly" ? "/mo" : "";
  return (
    <div className="plan-card kit-panel listing-card h-full p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <FirmBadge name={p.firm.name} logo={p.firm.logo} logoBg={p.firm.logoBg} />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">{p.firm.name}</p>
            <p className="meta flex flex-wrap items-center gap-1.5">
              <span className="pill text-[0.65rem]">{MARKET_LABELS[p.market.market]}</span>
              {p.firm.reviewAlert && <span className="badge badge-warning text-[0.65rem]">Review alert</span>}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${p.firm.name} from comparison`}
          className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <p className="mt-3 flex items-baseline gap-2">
        <span className="figure-lg text-3xl text-accent">{price != null ? money(price, p.firm.currency) + period : "—"}</span>
        {p.account.promoPrice != null && p.account.standardPrice != null && (
          <span className="text-xs text-subtle line-through">{money(p.account.standardPrice, p.firm.currency)}{period}</span>
        )}
      </p>
      <p className="meta">
        {p.challenge.label}
        {p.challenge.tiers.length > 1 && ` · ${p.tier.name}`} · {sizeLabel(p.account.size, p.firm.currency)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
        {firm.markets.length > 1 && (
          <Picker label="Market" value={p.market.market} options={firm.markets.map((m) => [m.market, MARKET_LABELS[m.market]])} onChange={(v) => onChange({ market: v, challenge: undefined, tier: undefined, size: null })} />
        )}
        <Picker label="Plan" value={p.challenge.key} options={p.market.challenges.map((c) => [c.key, c.label])} onChange={(v) => onChange({ challenge: v, tier: undefined, size: null })} />
        {p.challenge.tiers.length > 1 && (
          <Picker label="Tier" value={p.tier.name} options={p.challenge.tiers.map((t) => [t.name, t.name])} onChange={(v) => onChange({ tier: v, size: null })} />
        )}
        <Picker label="Size" value={String(p.account.size)} options={p.tier.accounts.map((a) => [String(a.size), sizeLabel(a.size, p.firm.currency)])} onChange={(v) => onChange({ size: Number(v) })} />
      </div>
    </div>
  );
}

function Picker({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <label className="flex min-w-0 flex-col gap-0.5">
      <span className="eyebrow">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="field">
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

// ---- Cells -------------------------------------------------------------------

function PriceCell({ plan: p }: { plan: ResolvedPlan }) {
  const { account, firm, tier, market } = p;
  const period = tier.billing === "monthly" ? "/month" : "";
  if (account.lowestPrice == null) return <Dash />;
  return (
    <div>
      <div className="figure-lg text-accent">
        {money(account.lowestPrice, firm.currency)}
        {period}
      </div>
      {account.promoPrice != null && account.standardPrice != null && (
        <>
          <div className="mt-1 text-xs text-subtle line-through">
            <span className="sr-only">Full price </span>
            {money(account.standardPrice, firm.currency)}
            {period}
          </div>
          <span className="badge badge-promo mt-1 whitespace-normal">{market.promoCode ? `with code ${market.promoCode}` : "current promo"}</span>
        </>
      )}
    </div>
  );
}

/** Amount as a share of the account, or null when it isn't a number. */
function share(amount: RuleValue, size: number): number | null {
  return typeof amount === "number" && size > 0 ? amount / size : null;
}

/** Amount plus a bar. The bar is the amount as a share of the account size,
 *  drawn on one scale across the columns (the largest share in the row
 *  fills the bar) so the plans can be read against each other. A picture of
 *  the published rule, not a verdict. */
function RuleBar({ value, max, tone, label }: { value: number | null; max: number; tone: "loss" | "target"; label?: string }) {
  if (value == null) return null;
  const pct = max > 0 ? Math.max(4, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="mt-2">
      <div className="cmp-bar" aria-hidden="true">
        <div
          className={`rule-bar ${tone === "loss" ? "cmp-bar-loss" : "cmp-bar-target"}`}
          style={{ transform: `translateX(${pct - 100}%)` }}
        />
      </div>
      {label && <span className="mt-1 block text-xs leading-snug text-muted">{label}</span>}
    </div>
  );
}

/** Profit needed to get funded: every phase added up. Forex phases are
 *  percentages of the account (each phase starts from a fresh balance, so
 *  they add); futures plans have one fixed amount. */
function targetTotal(p: ResolvedPlan): RuleValue {
  const { rules } = p.tier;
  if (rules.unit !== "percent") return ruleAmount(p, "profitTarget");
  if (typeof rules.phase1Target !== "number") return rules.phase1Target;
  const pct = [rules.phase1Target, rules.phase2Target, rules.phase3Target].reduce<number>(
    (sum, v) => (typeof v === "number" ? sum + v : sum),
    0,
  );
  return Math.round((pct / 100) * p.account.size);
}

function TargetCell({ plan: p, all }: { plan: ResolvedPlan; all: ResolvedPlan[] }) {
  const amount = targetTotal(p);
  const pct1 = rulePercent(p, "phase1Target");
  const pct2 = p.tier.rules.unit === "percent" ? p.tier.rules.phase2Target : "n/a";
  const pct3 = p.tier.rules.unit === "percent" ? p.tier.rules.phase3Target : "n/a";
  const phases = [pct1, pct2, pct3].filter((v) => v !== "n/a");
  const max = Math.max(0, ...all.map((q) => share(targetTotal(q), q.account.size) ?? 0));
  return (
    <div>
      <div className="cmp-num">{ruleText(amount, (n) => moneyRound(n, p.firm.currency))}</div>
      <RuleBar
        value={share(amount, p.account.size)}
        max={max}
        tone="target"
        label={
          phases.length > 1
            ? phases.map((v, i) => `Phase ${i + 1}: ${ruleText(v, (n) => `${n}%`)}`).join(" · ")
            : typeof pct1 === "number"
              ? `${pct1}% of the account`
              : undefined
        }
      />
    </div>
  );
}

function MoneyRule({ plan: p, all, which }: { plan: ResolvedPlan; all: ResolvedPlan[]; which: "dailyLoss" | "maxLoss" }) {
  const amount = ruleAmount(p, which);
  const pct = rulePercent(p, which);
  const max = Math.max(0, ...all.map((q) => share(ruleAmount(q, which), q.account.size) ?? 0));
  return (
    <div>
      <div className="cmp-num">{ruleText(amount, (n) => moneyRound(n, p.firm.currency))}</div>
      <RuleBar value={share(amount, p.account.size)} max={max} tone="loss" label={typeof pct === "number" ? `${pct}% of the account` : undefined} />
    </div>
  );
}

function RefundCell({ value }: { value: boolean | RuleValue }) {
  if (value === true) return <span className="badge badge-success">Yes</span>;
  if (value === false) return <span className="badge badge-danger">No</span>;
  if (value === "n/a") return <span className="text-xs text-subtle">N/A</span>;
  if (value === "none") return <span>None</span>;
  return <Dash />;
}

function Dash() {
  return (
    <span className="text-subtle" title="Not confirmed from the firm's own pages yet">
      —
    </span>
  );
}

// ---- Chrome ------------------------------------------------------------------

function AddPlanControl({ firms, plans, onAdd }: { firms: FirmView[]; plans: ResolvedPlan[]; onAdd: (firmId: string) => void }) {
  const full = plans.length >= MAX_COMPARE;
  return (
    <label className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-sm">
      <span className="eyebrow shrink-0">{full ? `${MAX_COMPARE} of ${MAX_COMPARE}` : "Add a firm"}</span>
      <select className="field" value="" disabled={full} onChange={(e) => e.target.value && onAdd(e.target.value)} aria-label="Add a firm to the comparison">
        <option value="">{full ? "Remove one to add another" : "Choose a firm…"}</option>
        {firms.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyState({ firms, onAdd }: { firms: FirmView[]; onAdd: (firmId: string) => void }) {
  const examples = useMemo(() => exampleComparisons(firms), [firms]);
  return (
    <div className="mt-6 space-y-6">
      <div className="kit-panel p-6 sm:p-8">
        <p className="text-lg font-semibold text-foreground">Pick up to three plans</p>
        <p className="meta mt-1">
          Add a firm here, or tick &ldquo;Compare&rdquo; on cards in the{" "}
          <Link href="/funded-accounts" className="text-accent underline">
            directory
          </Link>
          . You can change the plan and account size in each column afterwards.
        </p>
        <div className="mt-4 max-w-sm">
          <AddPlanControl firms={firms} plans={[]} onAdd={onAdd} />
        </div>
      </div>

      {examples.length > 0 && (
        <div>
          <h2 className="section-title">Or start from an example</h2>
          <p className="meta mt-1">Three plans that share a program, picked alphabetically — examples, not recommendations.</p>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {examples.map((ex) => (
              <li key={ex.title}>
                <Link href={`/funded-accounts/compare${plansToQuery(ex.keys)}`} className="lift-card kit-panel listing-card block h-full p-4">
                  <p className="eyebrow">{ex.eyebrow}</p>
                  <p className="mt-1 font-semibold text-foreground">{ex.title}</p>
                  <p className="meta mt-2">{ex.firms.join(" · ")}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ShareLink() {
  const [url, setUrl] = useState("");
  const searchParams = useSearchParams();
  useEffect(() => {
    // The full address only exists in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(window.location.href);
  }, [searchParams]);
  return (
    <CopyButton value={url} label="Copy a link to this comparison" copiedLabel="Link copied">
      Share
    </CopyButton>
  );
}
