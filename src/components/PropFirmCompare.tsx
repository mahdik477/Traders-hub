"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Share2, X } from "lucide-react";
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
// plan cards as column headers, grouped rows, money rules drawn as bars,
// an "only differences" toggle, a sticky summary strip, scroll-snap on
// phones, and an empty state with example comparisons. None of it ranks —
// it's the firms' published terms next to each other.

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
  render: (p: ResolvedPlan) => ReactNode;
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
  const tableRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="mt-6 pb-24 lg:pb-0">
      <SummaryStrip plans={plans} tableRef={tableRef} />

      <div className="flex flex-wrap items-center gap-3">
        <AddPlanControl firms={firms} plans={plans} onAdd={add} />
        <label className="ml-auto flex min-h-11 cursor-pointer items-center gap-2 text-sm text-muted">
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

      <p className="meta mt-3 sm:hidden">Swipe sideways to see every column →</p>
      <div ref={tableRef} className="compare-scroll mt-3 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="compare-table w-full border-collapse text-sm">
          <caption className="sr-only">
            {plans.map((p) => `${p.firm.name} ${p.challenge.label} ${p.tier.name}`).join(", ")} compared from their pricing
            pages
          </caption>
          <thead>
            <tr data-compare-head>
              <th scope="col" className="compare-label-col sticky left-0 z-20 bg-surface p-3 align-bottom">
                <span className="eyebrow">Plan</span>
              </th>
              {plans.map((p, i) => (
                <th key={i} scope="col" className="compare-col border-l border-border p-4 text-left align-top">
                  <PlanCard plan={p} firms={firms} onChange={(patch) => update(i, patch)} onRemove={() => remove(i)} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <GroupRows key={g.id} group={g} plans={plans} sameByRow={sameByRow} onlyDiff={onlyDiff} />
            ))}
            <tr>
              <th scope="row" className="compare-label-col sticky left-0 z-10 bg-surface p-3" />
              {plans.map((p, i) => (
                <td key={i} className="border-l border-border p-4 align-bottom">
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

      <div className="tray-bottom fixed inset-x-0 z-30 lg:static lg:mt-4">
        <div className="container-page pb-3 lg:p-0">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3 shadow-glow lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <ShareLink />
            <SaveComparisonButton kind="firms" title={plans.map((p) => `${p.firm.name} ${p.challenge.label}`).join(" vs ")} />
            <p className="meta hidden lg:block">
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

// ---- Rows -------------------------------------------------------------------

function buildGroups(): Group[] {
  const text = (v: string | null) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : "");
  return [
    {
      id: "price",
      label: "Price & billing",
      rows: [
        { label: "Price", key: (p) => `${p.account.lowestPrice}|${p.account.promoPrice}`, render: (p) => <PriceCell plan={p} />, highlight: true },
        { label: "Billing", key: (p) => p.tier.billing, render: (p) => (p.tier.billing === "monthly" ? "Monthly subscription" : "One-time fee") },
        { label: "Fee refund", key: (p) => String(p.tier.rules.feeRefund), render: (p) => <RefundCell value={p.tier.rules.feeRefund} /> },
      ],
    },
    {
      id: "targets",
      label: "Profit targets",
      rows: [
        { label: "To pass", key: (p) => String(ruleAmount(p, "profitTarget")), render: (p) => <TargetCell plan={p} /> },
        { label: "Profit split", key: (p) => String(p.tier.rules.profitSplitMax), render: (p) => <span className="text-base font-bold">{ruleText(p.tier.rules.profitSplitMax, (n) => `Up to ${n}%`)}</span> },
      ],
    },
    {
      id: "loss",
      label: "Loss limits",
      rows: [
        { label: "In one day", key: (p) => String(ruleAmount(p, "dailyLoss")), render: (p) => <MoneyRule plan={p} which="dailyLoss" /> },
        { label: "In total", key: (p) => String(ruleAmount(p, "maxLoss")), render: (p) => <MoneyRule plan={p} which="maxLoss" /> },
        { label: "Drawdown type", key: (p) => p.tier.rules.drawdownType ?? "", render: (p) => text(p.tier.rules.drawdownType) || <Dash /> },
      ],
    },
    {
      id: "rules",
      label: "Rules",
      rows: [
        { label: "Min trading days", key: (p) => String(p.tier.rules.minTradingDays), render: (p) => ruleText(p.tier.rules.minTradingDays, (n) => (n === 0 ? "No minimum" : String(n))) },
        { label: "Consistency", key: (p) => p.tier.rules.consistency ?? "", render: (p) => text(p.tier.rules.consistency) || <Dash /> },
        { label: "Trading period", key: (p) => p.tier.rules.tradingPeriod ?? "", render: (p) => text(p.tier.rules.tradingPeriod) || <Dash /> },
      ],
    },
    {
      id: "firm",
      label: "Platforms & reviews",
      rows: [
        {
          label: "Platforms",
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
          label: "Recent reviews",
          key: (p) => String(!!p.firm.reviewAlert),
          render: (p) =>
            p.firm.reviewAlert ? (
              <span className="badge badge-warning whitespace-normal">Payout complaints in recent reviews</span>
            ) : (
              <span className="text-muted">No review alert — we don&apos;t verify payouts</span>
            ),
        },
        { label: "Data checked", key: (p) => p.firm.lastVerified ?? "", render: (p) => (p.firm.lastVerified ? formatDate(p.firm.lastVerified) : <Dash />) },
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
    <>
      <tr className="compare-group">
        <th scope="rowgroup" colSpan={plans.length + 1} className="sticky left-0 z-10 bg-surface-2 px-3 py-2 text-left">
          <span className="eyebrow text-accent">{group.label}</span>
          {hidden > 0 && <span className="meta ml-2">{hidden} identical row{hidden === 1 ? "" : "s"} hidden</span>}
        </th>
      </tr>
      {visible.map((r) => {
        const same = sameByRow.get(`${group.id}:${r.label}`);
        return (
          <tr key={r.label} className={`compare-row border-t border-border ${r.highlight ? "bg-surface-2/60" : ""}`}>
            <th
              scope="row"
              className={`compare-label-col sticky left-0 z-10 p-3 text-left text-xs font-medium shadow-[inset_-1px_0_0_var(--color-border)] ${
                r.highlight ? "bg-surface-2 text-accent" : "bg-surface text-muted"
              }`}
            >
              {r.label}
              {same && plans.length > 1 && (
                <span className="mt-0.5 block text-[0.65rem] font-normal text-subtle">same for all</span>
              )}
            </th>
            {plans.map((p, i) => (
              <td key={i} className={`border-l border-border p-3 align-top text-foreground ${same ? "compare-same" : ""}`}>
                {r.render(p)}
              </td>
            ))}
          </tr>
        );
      })}
    </>
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
    <div className="plan-card">
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
        <span className="figure-lg text-2xl text-accent">{price != null ? money(price, p.firm.currency) + period : "—"}</span>
        {p.account.promoPrice != null && p.account.standardPrice != null && (
          <span className="text-xs text-subtle line-through">{money(p.account.standardPrice, p.firm.currency)}{period}</span>
        )}
      </p>
      <p className="meta">
        {p.challenge.label}
        {p.challenge.tiers.length > 1 && ` · ${p.tier.name}`} · {sizeLabel(p.account.size, p.firm.currency)}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-1.5">
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
      <span className="eyebrow text-[0.6rem]">{label}</span>
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

// ---- Cells -------------------------------------------------------------------

function PriceCell({ plan: p }: { plan: ResolvedPlan }) {
  const { account, firm, tier, market } = p;
  const period = tier.billing === "monthly" ? "/month" : "";
  if (account.lowestPrice == null) return <Dash />;
  return (
    <div>
      <div className="figure text-accent">
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
          <span className="badge badge-promo mt-1">{market.promoCode ? `with code ${market.promoCode}` : "current promo"}</span>
        </>
      )}
    </div>
  );
}

/** Amount plus a thin bar: the amount as a share of the account size. A
 *  picture of the published rule, not a verdict. */
function RuleBar({ amount, size, tone, label }: { amount: RuleValue; size: number; tone: "danger" | "success"; label?: string }) {
  if (typeof amount !== "number") return null;
  const pct = Math.max(0, Math.min(100, (amount / size) * 100));
  return (
    <div className="mt-1.5" aria-hidden="true">
      <div className="h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-surface-2">
        <div className={`rule-bar h-full rounded-full ${tone === "danger" ? "bg-danger/80" : "bg-success/80"}`} style={{ width: `${pct}%` }} />
      </div>
      {label && <span className="mt-0.5 block text-[0.7rem] text-muted">{label}</span>}
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
      <RuleBar
        amount={amount}
        size={p.account.size}
        tone="success"
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

function MoneyRule({ plan: p, which }: { plan: ResolvedPlan; which: "dailyLoss" | "maxLoss" }) {
  const amount = ruleAmount(p, which);
  const pct = rulePercent(p, which);
  return (
    <div>
      <div className="font-semibold">{ruleText(amount, (n) => moneyRound(n, p.firm.currency))}</div>
      <RuleBar amount={amount} size={p.account.size} tone="danger" label={typeof pct === "number" ? `${pct}% of the account` : undefined} />
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

/** Slim bar that appears under the site header once the plan cards have
 *  scrolled away, so the reader always knows which column is which. */
function SummaryStrip({ plans, tableRef }: { plans: ResolvedPlan[]; tableRef: React.RefObject<HTMLDivElement | null> }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    // Watch the table's header row: once it has scrolled above the site
    // header, show the strip; hide it again when it comes back.
    const head = tableRef.current?.querySelector("thead");
    if (!head || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([e]) => setShown(!e.isIntersecting && e.boundingClientRect.top < 0), {
      rootMargin: "-80px 0px 0px 0px",
    });
    obs.observe(head);
    return () => obs.disconnect();
  }, [tableRef, plans.length]);
  return (
    <>
      <div className={`compare-summary ${shown ? "is-shown" : ""}`} aria-hidden={!shown}>
        <div className="container-page flex items-center gap-2 overflow-x-auto py-2">
          {plans.map((p, i) => (
            <span key={i} className="flex min-w-0 shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs">
              <FirmBadge name={p.firm.name} logo={p.firm.logo} logoBg={p.firm.logoBg} />
              <span className="truncate font-semibold">{p.firm.name}</span>
              <span className="text-accent">{p.account.lowestPrice != null ? money(p.account.lowestPrice, p.firm.currency) : "—"}</span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

function EmptyState({ firms, onAdd }: { firms: FirmView[]; onAdd: (firmId: string) => void }) {
  const examples = useMemo(() => exampleComparisons(firms), [firms]);
  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-dashed border-border-strong p-6 sm:p-8">
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
                <Link href={`/funded-accounts/compare${plansToQuery(ex.keys)}`} className="lift-card block h-full rounded-xl border border-border bg-surface p-4">
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
      <Share2 className="size-4" aria-hidden="true" />
      Share
    </CopyButton>
  );
}
