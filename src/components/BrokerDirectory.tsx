"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BROKER_MARKET_LABELS, formatDeposit, type BrokerView } from "@/lib/broker-types";
import {
  EMPTY_FILTERS,
  filtersFromQuery,
  filtersToQuery,
  matchesFilters,
  type Filters,
} from "@/lib/broker-filters";
import TrustpilotStars from "@/components/TrustpilotStars";

const RATING_OPTIONS = ["3", "3.5", "4", "4.5"];

// Grid of broker cards with a filter bar — same layout and behaviour as the
// Courses directory: filters are saved in the address, so a trip into a
// broker and back keeps them.
export default function BrokerDirectory({ brokers }: { brokers: BrokerView[] }) {
  return (
    <Suspense fallback={<Directory brokers={brokers} initialFilters={EMPTY_FILTERS} />}>
      <DirectoryFromAddress brokers={brokers} />
    </Suspense>
  );
}

function DirectoryFromAddress({ brokers }: { brokers: BrokerView[] }) {
  const searchParams = useSearchParams();
  return <Directory brokers={brokers} initialFilters={filtersFromQuery(searchParams)} />;
}

function Directory({ brokers, initialFilters }: { brokers: BrokerView[]; initialFilters: Filters }) {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  // Only offer options that actually exist across the current listings.
  const marketOptions = [...new Set(brokers.flatMap((b) => b.markets))].sort((a, b) =>
    BROKER_MARKET_LABELS[a].localeCompare(BROKER_MARKET_LABELS[b]),
  );
  const regulatorOptions = [...new Set(brokers.flatMap((b) => b.regulators.map((r) => r.regulator)))].sort();

  const matching = brokers.filter((b) => matchesFilters(b, filters));

  function updateFilters(changes: Partial<Filters>) {
    const next = { ...filters, ...changes };
    setFilters(next);
    window.history.replaceState(null, "", window.location.pathname + filtersToQuery(next));
  }

  const chips = activeFilterChips(filters);

  return (
    <div>
      {/* Filter bar */}
      <form
        aria-label="Filter brokers"
        className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-3 lg:grid-cols-4"
        onSubmit={(e) => e.preventDefault()}
      >
        <Select
          label="Market"
          value={filters.market}
          onChange={(v) => updateFilters({ market: v })}
          options={marketOptions.map((m) => [m, BROKER_MARKET_LABELS[m]])}
        />
        <Select
          label="Regulator"
          anyLabel="Any"
          value={filters.regulator}
          onChange={(v) => updateFilters({ regulator: v })}
          options={regulatorOptions.map((r) => [r, r])}
        />
        <label className="flex flex-col gap-1">
          <span className="eyebrow">Max min. deposit</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="Any"
            value={filters.maxDeposit}
            onChange={(e) => updateFilters({ maxDeposit: e.target.value })}
            className="field"
          />
        </label>
        <Select
          label="Rating"
          anyLabel="Any"
          value={filters.minRating}
          onChange={(v) => updateFilters({ minRating: v })}
          options={RATING_OPTIONS.map((r) => [r, `${r}+ stars`])}
        />
      </form>

      {/* Result count + active filters as removable chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p aria-live="polite" className="meta mr-1">
          <span className="font-semibold text-foreground">{matching.length}</span> of {brokers.length}{" "}
          match
        </p>
        {chips.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => updateFilters({ [key]: "" })}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface-2 py-0.5 pl-3 pr-2 text-xs font-medium text-foreground transition-colors hover:border-subtle"
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
            className="text-xs text-muted underline hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>

      {matching.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border-strong p-10 text-center text-muted">
          No brokers match these filters.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {matching.map((broker) => {
            const deposit = formatDeposit(broker.minDeposit, broker.currency);
            return (
              <li
                key={broker.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition duration-200 hover:border-accent/50 hover:shadow-glow motion-safe:hover:-translate-y-0.5"
              >
                <div className="h-1 w-full bg-gradient-to-r from-accent to-accent-strong" />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-3">
                    {broker.logo ? (
                      <div
                        className={`flex size-14 shrink-0 items-center justify-center rounded-lg p-2 ${
                          broker.logoBg === "dark" ? "bg-black" : "bg-white"
                        }`}
                      >
                        <Image
                          src={broker.logo}
                          alt={`${broker.name} logo`}
                          width={56}
                          height={56}
                          className="h-auto max-h-9 w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-lg font-bold text-accent">
                        {broker.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">{broker.name}</h2>
                      {broker.trustpilot && (
                        <div className="mt-1 text-xs">
                          <TrustpilotStars rating={broker.trustpilot} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>

                  {broker.markets.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {broker.markets.map((m) => (
                        <span key={m} className="pill">
                          {BROKER_MARKET_LABELS[m]}
                        </span>
                      ))}
                    </div>
                  )}

                  {broker.tagline && <p className="mt-4 text-sm text-muted">{broker.tagline}</p>}

                  <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      {deposit && (
                        <>
                          <div className="eyebrow">Min. deposit</div>
                          <div className="figure-lg mt-1 text-accent">{deposit}</div>
                        </>
                      )}
                    </div>
                    {broker.regulators.length > 0 && (
                      <span className="pill">
                        {broker.regulators.length} regulator{broker.regulators.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/brokers/${broker.id}`}
                    className="btn btn-primary mt-5 w-full after:absolute after:inset-0"
                  >
                    View broker
                    <span className="sr-only"> — {broker.name}</span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function activeFilterChips(f: Filters): { key: keyof Filters; label: string }[] {
  const chips: { key: keyof Filters; label: string }[] = [];
  if (f.market)
    chips.push({
      key: "market",
      label: BROKER_MARKET_LABELS[f.market as keyof typeof BROKER_MARKET_LABELS] ?? f.market,
    });
  if (f.regulator) chips.push({ key: "regulator", label: f.regulator });
  if (f.maxDeposit) chips.push({ key: "maxDeposit", label: `Deposit ≤ $${f.maxDeposit}` });
  if (f.minRating) chips.push({ key: "minRating", label: `${f.minRating}+ stars` });
  return chips;
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
