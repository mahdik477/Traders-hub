"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  STRATEGY_CATEGORY_LABELS,
  STRATEGY_DIFFICULTY_LABELS,
  STRATEGY_EVIDENCE_LABELS,
  STRATEGY_MARKET_LABELS,
  STRATEGY_TIER_LABELS,
  type StrategyView,
} from "@/lib/strategy-types";
import {
  EMPTY_FILTERS,
  filtersFromQuery,
  filtersToQuery,
  matchesFilters,
  type Filters,
} from "@/lib/strategy-filters";
import { ShieldIcon } from "@/components/icons";

// Same filter-bar pattern as CourseDirectory/PropFirmDirectory: state saved
// in the address so a trip into a strategy page and back keeps the filters.
// Only 6 of the research doc's ~11 facets became real filter controls (tier,
// market, difficulty, style, evidence, controversy) — execution type, data
// requirement and platform testability still show on every card and detail
// page as plain metadata, to keep the bar usable on a phone.
export default function StrategyDirectory({ strategies }: { strategies: StrategyView[] }) {
  return (
    <Suspense fallback={<Directory strategies={strategies} initialFilters={EMPTY_FILTERS} />}>
      <DirectoryFromAddress strategies={strategies} />
    </Suspense>
  );
}

function DirectoryFromAddress({ strategies }: { strategies: StrategyView[] }) {
  const searchParams = useSearchParams();
  return <Directory strategies={strategies} initialFilters={filtersFromQuery(searchParams)} />;
}

function Directory({
  strategies,
  initialFilters,
}: {
  strategies: StrategyView[];
  initialFilters: Filters;
}) {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const matching = strategies.filter((s) => matchesFilters(s, filters));

  function updateFilters(changes: Partial<Filters>) {
    const next = { ...filters, ...changes };
    setFilters(next);
    window.history.replaceState(null, "", window.location.pathname + filtersToQuery(next));
  }

  const chips = activeFilterChips(filters);
  const marketOptions = [...new Set(strategies.flatMap((s) => s.markets))].sort((a, b) =>
    STRATEGY_MARKET_LABELS[a].localeCompare(STRATEGY_MARKET_LABELS[b]),
  );
  const categoryOptions = [...new Set(strategies.map((s) => s.category))].sort((a, b) =>
    STRATEGY_CATEGORY_LABELS[a].localeCompare(STRATEGY_CATEGORY_LABELS[b]),
  );

  return (
    <div>
      <form
        aria-label="Filter strategies"
        className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-3 sm:grid-cols-2 lg:grid-cols-6"
        onSubmit={(e) => e.preventDefault()}
      >
        <Select
          label="Tier"
          value={filters.tier}
          onChange={(v) => updateFilters({ tier: v })}
          options={(["free", "intermediate", "advanced"] as const).map((t) => [t, STRATEGY_TIER_LABELS[t]])}
        />
        <Select
          label="Market"
          value={filters.market}
          onChange={(v) => updateFilters({ market: v })}
          options={marketOptions.map((m) => [m, STRATEGY_MARKET_LABELS[m]])}
        />
        <Select
          label="Difficulty"
          value={filters.difficulty}
          onChange={(v) => updateFilters({ difficulty: v })}
          options={(["beginner", "intermediate", "advanced"] as const).map((d) => [d, STRATEGY_DIFFICULTY_LABELS[d]])}
        />
        <Select
          label="Style"
          value={filters.category}
          onChange={(v) => updateFilters({ category: v })}
          options={categoryOptions.map((c) => [c, STRATEGY_CATEGORY_LABELS[c]])}
        />
        <Select
          label="Evidence"
          value={filters.evidence}
          onChange={(v) => updateFilters({ evidence: v })}
          options={(["strong", "mixed", "weak", "little"] as const).map((e) => [e, STRATEGY_EVIDENCE_LABELS[e]])}
        />
        <Select
          label="Controversial methods"
          anyLabel="Show all"
          value={filters.controversial}
          onChange={(v) => updateFilters({ controversial: v })}
          options={[["hide", "Hide controversial"]]}
        />
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p aria-live="polite" className="meta mr-1">
          <span className="font-semibold text-foreground">{matching.length}</span> of {strategies.length} match
        </p>
        {chips.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => updateFilters({ [key]: "" })}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border-strong bg-surface-2 py-1 pl-3 pr-2 text-xs font-medium text-foreground transition-colors hover:border-subtle"
          >
            {label}
            <span aria-hidden="true" className="text-muted">
              ✕
            </span>
            <span className="sr-only">(remove filter)</span>
          </button>
        ))}
        {chips.length > 1 && (
          <button
            type="button"
            onClick={() => updateFilters(EMPTY_FILTERS)}
            className="inline-flex min-h-11 items-center text-xs text-muted underline hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>

      {matching.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border-strong p-10 text-center text-muted">
          No strategies match these filters.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {matching.map((s) => (
            <StrategyCard key={s.slug} strategy={s} listingQuery={filtersToQuery(filters)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function StrategyCard({ strategy: s, listingQuery }: { strategy: StrategyView; listingQuery: string }) {
  const href = listingQuery ? `/strategies/${s.slug}${listingQuery}` : `/strategies/${s.slug}`;
  const evidenceBadgeClass =
    s.evidence.rating === "strong"
      ? "badge-success"
      : s.evidence.rating === "mixed"
        ? "badge-warning"
        : "badge-danger";

  return (
    <li className="lift-card group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <div className="h-1 w-full bg-gradient-to-r from-gold-deep to-gold-bright" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill">{STRATEGY_TIER_LABELS[s.tier]}</span>
          <span className={`badge ${evidenceBadgeClass}`}>{STRATEGY_EVIDENCE_LABELS[s.evidence.rating]} evidence</span>
          {s.controversyFlag && (
            <span className="badge badge-warning inline-flex items-center gap-1">
              <ShieldIcon className="size-3" />
              Debated
            </span>
          )}
        </div>
        <h2 className="mt-3 text-lg font-semibold">{s.name}</h2>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-subtle">
          {STRATEGY_CATEGORY_LABELS[s.category]} · {STRATEGY_DIFFICULTY_LABELS[s.difficulty]}
        </p>
        <p className="mt-3 line-clamp-3 flex-1 text-sm text-muted">{s.publicTeaser}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {s.markets.slice(0, 4).map((m) => (
            <span key={m} className="pill text-xs">
              {STRATEGY_MARKET_LABELS[m]}
            </span>
          ))}
        </div>
        <Link
          href={href}
          className="btn btn-outline mt-5 w-full after:absolute after:inset-0"
        >
          View strategy
          <span className="sr-only"> — {s.name}</span>
        </Link>
      </div>
    </li>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  anyLabel = "All",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  anyLabel?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="field">
        <option value="">{anyLabel}</option>
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function activeFilterChips(f: Filters): { key: keyof Filters; label: string }[] {
  const chips: { key: keyof Filters; label: string }[] = [];
  if (f.tier) chips.push({ key: "tier", label: STRATEGY_TIER_LABELS[f.tier as keyof typeof STRATEGY_TIER_LABELS] });
  if (f.market) chips.push({ key: "market", label: STRATEGY_MARKET_LABELS[f.market as keyof typeof STRATEGY_MARKET_LABELS] });
  if (f.difficulty)
    chips.push({ key: "difficulty", label: STRATEGY_DIFFICULTY_LABELS[f.difficulty as keyof typeof STRATEGY_DIFFICULTY_LABELS] });
  if (f.category)
    chips.push({ key: "category", label: STRATEGY_CATEGORY_LABELS[f.category as keyof typeof STRATEGY_CATEGORY_LABELS] });
  if (f.evidence)
    chips.push({ key: "evidence", label: `${STRATEGY_EVIDENCE_LABELS[f.evidence as keyof typeof STRATEGY_EVIDENCE_LABELS]} evidence` });
  if (f.controversial) chips.push({ key: "controversial", label: "Hiding controversial" });
  return chips;
}
