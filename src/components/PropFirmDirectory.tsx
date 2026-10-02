"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { FirmView } from "@/lib/propfirm-types";
import { MARKET_LABELS } from "@/components/PropFirmPricing";
import {
  allAccounts,
  EMPTY_FILTERS,
  filtersFromQuery,
  filtersToQuery,
  matchesFilters,
  type Filters,
} from "@/lib/propfirm-filters";
import FirmBadge from "@/components/FirmBadge";
import VisitSiteLink from "@/components/VisitSiteLink";

function uniqueSorted<T>(values: T[], compare?: (a: T, b: T) => number): T[] {
  return [...new Set(values)].sort(compare);
}

function money(n: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function sizeLabel(size: number) {
  return `${size / 1000}K`;
}

// The filters live in the web address (?market=forex&...) so they survive a
// trip to a firm's page and back. The page is built ahead of time without an
// address, so until the browser reads it we show the unfiltered list.
export default function PropFirmDirectory({ firms }: { firms: FirmView[] }) {
  return (
    <Suspense fallback={<Directory firms={firms} initialFilters={EMPTY_FILTERS} />}>
      <DirectoryFromAddress firms={firms} />
    </Suspense>
  );
}

function DirectoryFromAddress({ firms }: { firms: FirmView[] }) {
  const searchParams = useSearchParams();
  return <Directory firms={firms} initialFilters={filtersFromQuery(searchParams)} />;
}

function Directory({ firms, initialFilters }: { firms: FirmView[]; initialFilters: Filters }) {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const accountsByFirm = new Map(firms.map((f) => [f.id, allAccounts(f)]));
  const everyAccount = [...accountsByFirm.values()].flat();

  // Filter options only list what exists for the chosen market (and challenge).
  const inMarket = everyAccount.filter((a) => !filters.market || a.market === filters.market);
  const challengeOptions = uniqueSorted(inMarket.map((a) => a.challengeLabel));
  const sizeOptions = uniqueSorted(
    inMarket
      .filter((a) => !filters.challenge || a.challengeLabel === filters.challenge)
      .map((a) => a.size),
    (a, b) => a - b,
  );
  const splitOptions = uniqueSorted(
    everyAccount.map((a) => a.profitSplit).filter((s): s is number => s != null),
    (a, b) => a - b,
  );

  const matchingFirms = firms
    .map((firm) => ({
      firm,
      matches: accountsByFirm.get(firm.id)!.filter((a) => matchesFilters(a, filters)),
    }))
    .filter((x) => x.matches.length > 0);

  function updateFilters(changes: Partial<Filters>) {
    const next = { ...filters, ...changes };
    // Drop choices the new market / challenge no longer offers.
    const nextInMarket = everyAccount.filter((a) => !next.market || a.market === next.market);
    if (next.challenge && !nextInMarket.some((a) => a.challengeLabel === next.challenge)) {
      next.challenge = "";
    }
    if (
      next.size &&
      !nextInMarket.some(
        (a) =>
          a.size === Number(next.size) && (!next.challenge || a.challengeLabel === next.challenge),
      )
    ) {
      next.size = "";
    }
    setFilters(next);
    // Save the filters in the address without reloading the page.
    window.history.replaceState(null, "", window.location.pathname + filtersToQuery(next));
  }

  const query = filtersToQuery(filters);
  const chips = activeFilterChips(filters);

  return (
    <div>
      {/* Filter bar */}
      <form
        aria-label="Filter prop firm accounts"
        className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-3 sm:grid-cols-3 lg:grid-cols-6"
        onSubmit={(e) => e.preventDefault()}
      >
        <Select
          label="Market"
          value={filters.market}
          onChange={(v) => updateFilters({ market: v })}
          options={(["forex", "futures"] as const).map((m) => [m, MARKET_LABELS[m]])}
        />
        <Select
          label="Challenge type"
          value={filters.challenge}
          onChange={(v) => updateFilters({ challenge: v })}
          options={challengeOptions.map((c) => [c, c])}
        />
        <Select
          label="Account size"
          value={filters.size}
          onChange={(v) => updateFilters({ size: v })}
          options={sizeOptions.map((s) => [String(s), sizeLabel(s)])}
        />
        <label className="flex flex-col gap-1">
          <span className="eyebrow">Max price</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="Any"
            value={filters.maxPrice}
            onChange={(e) => updateFilters({ maxPrice: e.target.value })}
            className="field"
          />
        </label>
        <Select
          label="Profit split"
          anyLabel="Any"
          value={filters.minSplit}
          onChange={(v) => updateFilters({ minSplit: v })}
          options={splitOptions.map((s) => [String(s), `${s}% or more`])}
        />
        <Select
          label="Fee refund"
          anyLabel="Any"
          value={filters.feeRefund}
          onChange={(v) => updateFilters({ feeRefund: v })}
          options={[
            ["yes", "Yes"],
            ["no", "No"],
          ]}
        />
      </form>

      {/* Result count + active filters as removable chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p aria-live="polite" className="meta mr-1">
          <span className="font-semibold text-foreground">{matchingFirms.length}</span> of{" "}
          {firms.length} firms match
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

      {/* Firm cards */}
      {matchingFirms.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border-strong p-10 text-center text-muted">
          No firms have accounts matching these filters.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {matchingFirms.map(({ firm, matches }) => {
            const cheapest = matches
              .filter((a) => a.lowestPrice != null)
              .reduce<(typeof matches)[number] | null>(
                (best, a) => (best == null || a.lowestPrice! < best.lowestPrice! ? a : best),
                null,
              );
            const splits = matches.map((a) => a.profitSplit).filter((s): s is number => s != null);
            return (
              <li
                key={firm.id}
                className="relative flex flex-col rounded-xl border border-border bg-surface p-5 transition duration-200 hover:border-accent/50 hover:shadow-glow motion-safe:hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <FirmBadge name={firm.name} />
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">{firm.name}</h2>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {firm.markets.map((m) => (
                        <span key={m.market} className="pill">
                          {MARKET_LABELS[m.market]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="eyebrow">From</div>
                    <div className="figure-lg mt-1 text-accent">
                      {cheapest
                        ? money(cheapest.lowestPrice!, firm.currency) + (cheapest.monthly ? "/month" : "")
                        : "—"}
                    </div>
                  </div>
                  {splits.length > 0 && (
                    <span className="badge badge-success">Up to {Math.max(...splits)}% split</span>
                  )}
                </div>
                <p className="meta mt-2">
                  {matches.length} matching account{matches.length === 1 ? "" : "s"}
                </p>

                {/* The whole card is clickable through this link's overlay. */}
                <Link
                  href={`/funded-accounts/${firm.id}${query}`}
                  className="btn btn-primary mt-5 w-full after:absolute after:inset-0 after:rounded-xl"
                >
                  View challenges
                  <span className="sr-only"> — {firm.name}</span>
                </Link>
                {firm.affiliateLink && (
                  <VisitSiteLink
                    href={firm.affiliateLink}
                    firmName={firm.name}
                    variant="outline"
                    className="relative z-10 mt-2 w-full"
                  />
                )}
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
  if (f.market) {
    chips.push({
      key: "market",
      label: MARKET_LABELS[f.market as keyof typeof MARKET_LABELS] ?? f.market,
    });
  }
  if (f.challenge) chips.push({ key: "challenge", label: f.challenge });
  if (f.size) chips.push({ key: "size", label: `${sizeLabel(Number(f.size))} account` });
  if (f.maxPrice) chips.push({ key: "maxPrice", label: `Max price ${f.maxPrice}` });
  if (f.minSplit) chips.push({ key: "minSplit", label: `${f.minSplit}%+ split` });
  if (f.feeRefund) {
    chips.push({ key: "feeRefund", label: `Fee refund: ${f.feeRefund === "yes" ? "Yes" : "No"}` });
  }
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
