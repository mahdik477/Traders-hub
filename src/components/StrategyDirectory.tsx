"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  STRATEGY_CATEGORY_ICONS,
  STRATEGY_CATEGORY_LABELS,
  STRATEGY_DIFFICULTY_LABELS,
  STRATEGY_MARKET_LABELS,
  STRATEGY_TIER_LABELS,
  type StrategyCategory,
  type StrategyPricingTier,
  type StrategyView,
} from "@/lib/strategy-types";
import {
  EMPTY_FILTERS,
  filtersFromQuery,
  filtersToQuery,
  matchesFilters,
  type Filters,
} from "@/lib/strategy-filters";
import { SearchIcon, ShieldIcon } from "@/components/icons";
import ScrollReveal from "@/components/ScrollReveal";

// Strategy categories in a fixed, deliberate order (not alphabetical) for
// the quick-pick pill row — trend-following and mean-reversion first since
// they're the two a beginner hears about most.
const CATEGORY_ORDER: StrategyCategory[] = [
  "trend_following",
  "mean_reversion",
  "breakout",
  "price_action",
  "momentum",
  "volume_order_flow",
  "market_structure",
  "quantitative",
];

// Same filter-bar pattern as CourseDirectory/PropFirmDirectory: state saved
// in the address so a trip into a strategy page and back keeps the filters.
// Only 5 of the research doc's ~11 facets became real filter controls (tier,
// market, difficulty, style, controversy) — execution type, data requirement,
// platform testability and independent-evidence rating still exist in the
// data but aren't surfaced in the UI, to keep the bar usable on a phone and
// because a rating badge reads as a performance score, which this site
// doesn't do (see CLAUDE.md).
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
  const categoriesPresent = new Set(strategies.map((s) => s.category));

  return (
    <div>
      {/* One-click browse by style, leading with the icons from the cards
          below so the same visual language carries through. */}
      <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {CATEGORY_ORDER.filter((c) => categoriesPresent.has(c)).map((c) => {
          const Icon = STRATEGY_CATEGORY_ICONS[c];
          const active = filters.category === c;
          return (
            <li key={c} className="shrink-0">
              <button
                type="button"
                onClick={() => updateFilters({ category: active ? "" : c })}
                aria-pressed={active}
                className={`flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "border-accent bg-accent/12 text-foreground"
                    : "border-border-strong bg-surface text-muted hover:border-subtle hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {STRATEGY_CATEGORY_LABELS[c]}
              </button>
            </li>
          );
        })}
      </ul>

      <label className="mt-3 flex min-h-12 items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5">
        <SearchIcon className="size-4.5 shrink-0 text-subtle" />
        <span className="sr-only">Search strategies by name</span>
        <input
          type="search"
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          placeholder="Search by name — e.g. “RSI” or “breakout”"
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-foreground outline-none placeholder:text-subtle"
        />
      </label>

      <form
        aria-label="Filter strategies"
        className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-3 sm:grid-cols-2 lg:grid-cols-4"
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
        <ScrollReveal>
          <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {matching.map((s) => (
              <StrategyCard key={s.slug} strategy={s} listingQuery={filtersToQuery(filters)} />
            ))}
          </ul>
        </ScrollReveal>
      )}
    </div>
  );
}

// Colours the two ends of the tier spectrum (free = nothing to lose,
// advanced = harder, slow down) and leaves intermediate neutral — three
// distinct hues would have clashed with the site's gold accent.
const TIER_BADGE_CLASS: Record<StrategyPricingTier, string> = {
  free: "badge-success",
  intermediate: "",
  advanced: "badge-warning",
};

function StrategyCard({ strategy: s, listingQuery }: { strategy: StrategyView; listingQuery: string }) {
  const href = listingQuery ? `/strategies/${s.slug}${listingQuery}` : `/strategies/${s.slug}`;
  const CategoryIcon = STRATEGY_CATEGORY_ICONS[s.category];
  const tierClass = TIER_BADGE_CLASS[s.tier];

  return (
    <li className="lift-card group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <div className="h-1 w-full bg-gradient-to-r from-gold-deep to-gold-bright" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
            <CategoryIcon className="size-6" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-lg font-semibold leading-snug">{s.name}</h2>
            <p className="mt-0.5 text-xs font-medium text-subtle">{STRATEGY_CATEGORY_LABELS[s.category]}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className={tierClass ? `badge ${tierClass}` : "pill"}>{STRATEGY_TIER_LABELS[s.tier]}</span>
          <span className="pill">{STRATEGY_DIFFICULTY_LABELS[s.difficulty]}</span>
          {s.controversyFlag && (
            <span className="badge badge-warning inline-flex items-center gap-1">
              <ShieldIcon className="size-3" />
              Debated
            </span>
          )}
        </div>

        <p className="mt-3 line-clamp-2 flex-1 text-sm text-muted">{s.publicTeaser}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {s.markets.slice(0, 3).map((m) => (
            <span key={m} className="pill text-xs">
              {STRATEGY_MARKET_LABELS[m]}
            </span>
          ))}
          {s.markets.length > 3 && <span className="pill text-xs">+{s.markets.length - 3} more</span>}
        </div>

        <Link href={href} className="btn btn-outline mt-5 w-full after:absolute after:inset-0">
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
  if (f.search) chips.push({ key: "search", label: `“${f.search}”` });
  if (f.tier) chips.push({ key: "tier", label: STRATEGY_TIER_LABELS[f.tier as keyof typeof STRATEGY_TIER_LABELS] });
  if (f.market) chips.push({ key: "market", label: STRATEGY_MARKET_LABELS[f.market as keyof typeof STRATEGY_MARKET_LABELS] });
  if (f.difficulty)
    chips.push({ key: "difficulty", label: STRATEGY_DIFFICULTY_LABELS[f.difficulty as keyof typeof STRATEGY_DIFFICULTY_LABELS] });
  if (f.category)
    chips.push({ key: "category", label: STRATEGY_CATEGORY_LABELS[f.category as keyof typeof STRATEGY_CATEGORY_LABELS] });
  if (f.controversial) chips.push({ key: "controversial", label: "Hiding controversial" });
  return chips;
}
