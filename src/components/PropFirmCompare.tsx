"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { Share2, X } from "lucide-react";
import type { FirmView, RuleValue } from "@/lib/propfirm-types";
import {
  MAX_COMPARE,
  defaultPlanFor,
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
// address (?p=firm/market/challenge/tier/size, repeated), same as the course
// and broker compare pages, so a comparison is a shareable link. Each
// column has its own plan and size pickers, so a visitor can line up e.g.
// FTMO 2-Step $100K against Topstep's $100K Combine without going back.

export default function PropFirmCompare({ firms }: { firms: FirmView[] }) {
  return (
    <Suspense fallback={null}>
      <CompareFromAddress firms={firms} />
    </Suspense>
  );
}

function CompareFromAddress({ firms }: { firms: FirmView[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const keys = useMemo(() => plansFromQuery(searchParams), [searchParams]);
  const plans = useMemo(
    () => keys.map((k) => resolvePlan(k, firms)).filter((p): p is ResolvedPlan => p != null),
    [keys, firms],
  );

  function write(next: PlanKey[]) {
    router.replace(`/funded-accounts/compare${plansToQuery(next)}`, { scroll: false });
  }

  function update(i: number, patch: Partial<PlanKey>) {
    const next = plans.map((p) => p.key);
    const merged = { ...next[i], ...patch };
    // Changing firm/market/challenge resets the deeper levels to the first
    // thing that exists, so a stale tier name never breaks the column.
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

  return (
    <div className="mt-6">
      <AddPlanBar firms={firms} plans={plans} onAdd={add} />

      {plans.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border-strong p-10 text-center">
          <p className="text-muted">Pick a firm above, or tick &ldquo;Compare&rdquo; on firm cards in the directory.</p>
          <Link href="/funded-accounts" className="btn btn-primary mt-4">
            Browse firms
          </Link>
        </div>
      ) : (
        <>
          <p className="meta mt-3 sm:hidden">Scroll sideways to see every column →</p>
          <div className="compare-scroll mt-3 overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">
                {plans.map((p) => `${p.firm.name} ${p.challenge.label} ${p.tier.name}`).join(", ")} compared from their
                pricing pages
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 w-28 min-w-28 bg-surface p-3 sm:w-40 sm:min-w-40">
                    <span className="sr-only">Field</span>
                  </th>
                  {plans.map((p, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="compare-col min-w-[230px] border-l border-border bg-surface p-4 text-left align-top sm:min-w-[260px]"
                    >
                      <ColumnHeader
                        plan={p}
                        firms={firms}
                        onChange={(patch) => update(i, patch)}
                        onRemove={() => remove(i)}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <Row label="Price" plans={plans} render={(p) => <PriceCell plan={p} />} highlight />
                <Row label="Billing" plans={plans} render={(p) => (p.tier.billing === "monthly" ? "Monthly subscription" : "One-time fee")} />
                <Row
                  label="Profit target"
                  plans={plans}
                  render={(p) => <TargetCell plan={p} />}
                />
                <Row
                  label="Daily loss limit"
                  plans={plans}
                  render={(p) => <MoneyRule plan={p} which="dailyLoss" />}
                />
                <Row
                  label="Max loss"
                  plans={plans}
                  render={(p) => <MoneyRule plan={p} which="maxLoss" />}
                />
                <Row label="Drawdown type" plans={plans} render={(p) => cap(p.tier.rules.drawdownType) ?? <Dash />} />
                <Row
                  label="Profit split"
                  plans={plans}
                  render={(p) => (
                    <span className="font-bold">{ruleText(p.tier.rules.profitSplitMax, (n) => `Up to ${n}%`)}</span>
                  )}
                />
                <Row
                  label="Min trading days"
                  plans={plans}
                  render={(p) => ruleText(p.tier.rules.minTradingDays, (n) => (n === 0 ? "No minimum" : String(n)))}
                />
                <Row label="Consistency rule" plans={plans} render={(p) => cap(p.tier.rules.consistency) ?? <Dash />} />
                <Row label="Trading period" plans={plans} render={(p) => cap(p.tier.rules.tradingPeriod) ?? <Dash />} />
                <Row label="Fee refund" plans={plans} render={(p) => <RefundCell value={p.tier.rules.feeRefund} />} />
                <Row
                  label="Platforms"
                  plans={plans}
                  render={(p) =>
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
                    )
                  }
                />
                <Row
                  label="Recent reviews"
                  plans={plans}
                  render={(p) =>
                    p.firm.reviewAlert ? (
                      <span className="badge badge-warning whitespace-normal">Payout complaints in recent reviews</span>
                    ) : (
                      <span className="text-muted">No review alert — we don&apos;t verify payouts</span>
                    )
                  }
                />
                <Row
                  label="Data checked"
                  plans={plans}
                  render={(p) => (p.firm.lastVerified ? formatDate(p.firm.lastVerified) : <Dash />)}
                />
                <tr className="border-t border-border">
                  <th scope="row" className="sticky left-0 z-10 bg-surface p-3" />
                  {plans.map((p, i) => (
                    <td key={i} className="border-l border-border bg-surface p-4 align-bottom">
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
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ShareLink />
            <SaveComparisonButton kind="firms" title={plans.map((p) => `${p.firm.name} ${p.challenge.label}`).join(" vs ")} />
            <p className="meta">
              Forex rules are a percentage of the account size; the amounts shown are that percentage of the
              size you picked. Futures rules are the firm&apos;s fixed amounts. This is a side-by-side of published
              terms, not a ranking.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function AddPlanBar({
  firms,
  plans,
  onAdd,
}: {
  firms: FirmView[];
  plans: ResolvedPlan[];
  onAdd: (firmId: string) => void;
}) {
  const full = plans.length >= MAX_COMPARE;
  const chosen = new Set(plans.map((p) => p.firm.id));
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-3">
      <label className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-sm">
        <span className="eyebrow">{full ? `Comparing ${MAX_COMPARE} of ${MAX_COMPARE}` : "Add a firm"}</span>
        <select
          className="field"
          value=""
          disabled={full}
          onChange={(e) => e.target.value && onAdd(e.target.value)}
          aria-label="Add a firm to the comparison"
        >
          <option value="">{full ? "Remove one to add another" : "Choose a firm…"}</option>
          {firms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
              {chosen.has(f.id) ? " (add another plan)" : ""}
            </option>
          ))}
        </select>
      </label>
      <p className="meta pb-2">
        {plans.length} of {MAX_COMPARE} plans. You can add the same firm twice to compare two of its plans.
      </p>
    </div>
  );
}

function ColumnHeader({
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
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <FirmBadge name={p.firm.name} logo={p.firm.logo} logoBg={p.firm.logoBg} />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">{p.firm.name}</p>
            <p className="meta">{MARKET_LABELS[p.market.market]}</p>
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
      <div className="mt-3 grid grid-cols-1 gap-2">
        {firm.markets.length > 1 && (
          <Picker
            label="Market"
            value={p.market.market}
            options={firm.markets.map((m) => [m.market, MARKET_LABELS[m.market]])}
            onChange={(v) => onChange({ market: v, challenge: undefined, tier: undefined, size: null })}
          />
        )}
        <Picker
          label="Plan"
          value={p.challenge.key}
          options={p.market.challenges.map((c) => [c.key, c.label])}
          onChange={(v) => onChange({ challenge: v, tier: undefined, size: null })}
        />
        {p.challenge.tiers.length > 1 && (
          <Picker
            label="Tier"
            value={p.tier.name}
            options={p.challenge.tiers.map((t) => [t.name, t.name])}
            onChange={(v) => onChange({ tier: v, size: null })}
          />
        )}
        <Picker
          label="Size"
          value={String(p.account.size)}
          options={p.tier.accounts.map((a) => [String(a.size), sizeLabel(a.size, p.firm.currency)])}
          onChange={(v) => onChange({ size: Number(v) })}
        />
      </div>
    </div>
  );
}

function Picker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="eyebrow w-12 shrink-0">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="field min-h-10 py-1 text-xs sm:text-xs">
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

function Row({
  label,
  plans,
  render,
  highlight = false,
}: {
  label: string;
  plans: ResolvedPlan[];
  render: (p: ResolvedPlan) => ReactNode;
  highlight?: boolean;
}) {
  return (
    <tr className={`border-t border-border ${highlight ? "bg-surface-2" : "odd:bg-surface even:bg-background"}`}>
      <th
        scope="row"
        className={`sticky left-0 z-10 p-3 text-left text-xs font-medium ${
          highlight ? "bg-surface-2 text-accent" : "bg-inherit text-muted"
        } shadow-[inset_-1px_0_0_var(--color-border)]`}
      >
        {label}
      </th>
      {plans.map((p, i) => (
        <td key={i} className="border-l border-border p-3 align-top text-foreground">
          {render(p)}
        </td>
      ))}
    </tr>
  );
}

function PriceCell({ plan: p }: { plan: ResolvedPlan }) {
  const { account, firm, tier, market } = p;
  const period = tier.billing === "monthly" ? "/month" : "";
  if (account.lowestPrice == null) return <Dash />;
  if (account.promoPrice != null && account.standardPrice != null) {
    return (
      <div>
        <div className="figure text-accent">
          {money(account.promoPrice, firm.currency)}
          {period}
        </div>
        <div className="mt-1 text-xs text-subtle line-through">
          <span className="sr-only">Full price </span>
          {money(account.standardPrice, firm.currency)}
          {period}
        </div>
        <span className="badge badge-promo mt-1">{market.promoCode ? `with code ${market.promoCode}` : "current promo"}</span>
      </div>
    );
  }
  return (
    <div className="figure text-accent">
      {money(account.lowestPrice, firm.currency)}
      {period}
    </div>
  );
}

function TargetCell({ plan: p }: { plan: ResolvedPlan }) {
  const amount = ruleAmount(p, "profitTarget");
  const pct1 = rulePercent(p, "phase1Target");
  const pct2 = p.tier.rules.unit === "percent" ? p.tier.rules.phase2Target : "n/a";
  const pct3 = p.tier.rules.unit === "percent" ? p.tier.rules.phase3Target : "n/a";
  const phases = [pct1, pct2, pct3].filter((v) => v !== "n/a");
  return (
    <div>
      <div className="font-semibold">{ruleText(amount, (n) => moneyRound(n, p.firm.currency))}</div>
      {p.tier.rules.unit === "percent" && (
        <div className="mt-0.5 text-xs text-muted">
          {phases.length > 1
            ? phases.map((v, i) => `Phase ${i + 1}: ${ruleText(v, (n) => `${n}%`)}`).join(" · ")
            : `${ruleText(pct1, (n) => `${n}%`)} of ${sizeLabel(p.account.size, p.firm.currency)}`}
        </div>
      )}
    </div>
  );
}

function MoneyRule({ plan: p, which }: { plan: ResolvedPlan; which: "dailyLoss" | "maxLoss" }) {
  const amount = ruleAmount(p, which);
  const pct = rulePercent(p, which);
  return (
    <div>
      <div className="font-semibold">{ruleText(amount, (n) => moneyRound(n, p.firm.currency))}</div>
      {typeof pct === "number" && <div className="mt-0.5 text-xs text-muted">{pct}% of the account</div>}
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

function cap(s: string | null): string | null {
  if (!s) return null;
  return s.charAt(0).toUpperCase() + s.slice(1);
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
      <Share2 className="size-4" aria-hidden="true" />
      Share this comparison
    </CopyButton>
  );
}
