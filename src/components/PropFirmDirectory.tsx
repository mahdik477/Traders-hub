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
import {
  MAX_COMPARE,
  defaultPlanFor,
  plansToQuery,
  samePlan,
  type PlanKey,
} from "@/lib/propfirm-compare";
import CountrySwitch, { useCountry } from "@/components/CountrySwitch";
import SaveButton from "@/components/SaveButton";
import { firmAvailability } from "@/lib/countries";

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
  // Plans ticked for the compare page. Each is the first plan of that firm
  // that matches the current filters, so "Compare" on a futures-filtered
  // list lines up futures plans, not whatever the firm lists first.
  const [comparePlans, setComparePlans] = useState<PlanKey[]>([]);
  const [compareNote, setCompareNote] = useState("");

  function toggleCompare(firm: FirmView, match: ReturnType<typeof allAccounts>[number] | undefined) {
    const existing = comparePlans.find((p) => p.firm === firm.id);
    if (existing) {
      setComparePlans((ps) => ps.filter((p) => p.firm !== firm.id));
      setCompareNote("");
      return;
    }
    if (comparePlans.length >= MAX_COMPARE) {
      setCompareNote(`You can compare up to ${MAX_COMPARE} firms. Remove one to add another.`);
      return;
    }
    const plan = defaultPlanFor(
      firm,
      match ? { market: match.market, challenge: match.challengeKey, tier: match.tier, size: match.size } : undefined,
    );
    if (!plan) return;
    setComparePlans((ps) => (ps.some((p) => samePlan(p, plan)) ? ps : [...ps, plan]));
    setCompareNote("");
  }

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

  // "Available where I live": firms whose published country list blocks the
  // visitor's country drop into a collapsed list at the bottom instead of
  // disappearing silently. Firms with no published list stay in the grid
  // with a note.
  const [country, setCountry] = useCountry();
  const withAvailability = firms
    .map((firm) => ({
      firm,
      matches: accountsByFirm.get(firm.id)!.filter((a) => matchesFilters(a, filters)),
      availability: country ? firmAvailability(firm.countries, country) : null,
    }))
    .filter((x) => x.matches.length > 0);
  const matchingFirms = withAvailability.filter((x) => x.availability?.status !== "restricted");
  const restrictedFirms = withAvailability.filter((x) => x.availability?.status === "restricted");

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
    // Save the filters in the address without reloading the page, keeping
    // the country switch's own ?country= in place.
    const params = new URLSearchParams(filtersToQuery(next));
    if (country) params.set("country", country);
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }

  const query = filtersToQuery(filters);
  const chips = activeFilterChips(filters);

  return (
    <div className={comparePlans.length > 0 ? "pb-24" : ""}>
      <CountrySwitch
        country={country}
        onChange={setCountry}
        hiddenCount={restrictedFirms.length}
        unknownCount={matchingFirms.filter((x) => x.availability?.status === "unknown").length}
      />

      {/* Market: the one choice everyone makes first, so it's a switch, not a dropdown */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="seg" role="group" aria-label="Market">
          {(
            [
              ["", "All firms"],
              ["forex", MARKET_LABELS.forex],
              ["futures", MARKET_LABELS.futures],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value || "all"}
              type="button"
              aria-pressed={filters.market === value}
              onClick={() => updateFilters({ market: value })}
              className="seg-btn"
            >
              {label}
              <span className="seg-count">
                {value ? firms.filter((f) => f.markets.some((m) => m.market === value)).length : firms.length}
              </span>
            </button>
          ))}
        </div>
        <p aria-live="polite" className="readout">
          <span className="text-foreground">{matchingFirms.length}</span> of {firms.length} firms match
        </p>
      </div>

      {/* Filter bar */}
      <form
        aria-label="Filter prop firm accounts"
        className="kit-panel mt-3 grid grid-cols-2 gap-3 p-3 sm:p-4 lg:grid-cols-5"
        onSubmit={(e) => e.preventDefault()}
      >
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
        <div className="col-span-2 lg:col-span-1">
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
        </div>
      </form>

      {/* Result count + active filters as removable chips */}
      <div className={`flex flex-wrap items-center gap-2 ${chips.length > 0 ? "mt-3" : ""}`}>
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

      {/* Firm cards */}
      {matchingFirms.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border-strong p-10 text-center">
          <p className="text-muted">No firms have accounts matching these filters.</p>
          <button type="button" onClick={() => updateFilters(EMPTY_FILTERS)} className="btn btn-outline mt-4">
            Clear filters and show everything
          </button>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matchingFirms.map(({ firm, matches, availability }) => {
            const cheapest = matches
              .filter((a) => a.lowestPrice != null)
              .reduce<(typeof matches)[number] | null>(
                (best, a) => (best == null || a.lowestPrice! < best.lowestPrice! ? a : best),
                null,
              );
            const splits = matches.map((a) => a.profitSplit).filter((s): s is number => s != null);
            const inCompare = comparePlans.some((p) => p.firm === firm.id);
            const sizes = matches.map((a) => a.size);
            const minSize = Math.min(...sizes);
            const maxSize = Math.max(...sizes);
            return (
              <li
                key={firm.id}
                className={`lift-card kit-panel listing-card flex cursor-pointer flex-col p-5 ${inCompare ? "is-selected" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <FirmBadge name={firm.name} logo={firm.logo} logoBg={firm.logoBg} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold leading-tight">
                      <Link href={`/funded-accounts/${firm.id}${query}`} className="card-stretch rounded-2xl">
                        {firm.name}
                      </Link>
                    </h2>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {firm.markets.map((m) => (
                        <span key={m.market} className="pill">
                          {MARKET_LABELS[m.market]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="relative z-10 -mr-1.5 -mt-1.5 shrink-0">
                    <SaveButton kind="firm" id={firm.id} name={firm.name} />
                  </div>
                </div>

                {(firm.reviewAlert || availability?.status === "unknown") && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {firm.reviewAlert && (
                      <span className="badge badge-warning whitespace-normal">Payout complaints in recent reviews</span>
                    )}
                    {availability?.status === "unknown" && (
                      <span className="pill whitespace-normal text-xs" title={availability.reason}>
                        Country list not published
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-auto pt-5">
                  <div className="eyebrow">From</div>
                  <div className="figure-lg mt-1 text-accent">
                    {cheapest ? (
                      <>
                        {money(cheapest.lowestPrice!, firm.currency)}
                        {cheapest.monthly && <span className="ml-1 text-sm font-medium text-muted">/month</span>}
                      </>
                    ) : (
                      "—"
                    )}
                  </div>
                  <dl className="stat-strip mt-3 grid-cols-[1fr_1.4fr_1fr]">
                    <div className="stat-cell">
                      <dt className="eyebrow">Max split</dt>
                      <dd className="stat-value">{splits.length > 0 ? `${Math.max(...splits)}%` : "—"}</dd>
                    </div>
                    <div className="stat-cell">
                      <dt className="eyebrow">Sizes</dt>
                      <dd className="stat-value">
                        {minSize === maxSize ? sizeLabel(minSize) : `${sizeLabel(minSize)}–${sizeLabel(maxSize)}`}
                      </dd>
                    </div>
                    <div className="stat-cell">
                      <dt className="eyebrow">Accounts</dt>
                      <dd className="stat-value">{matches.length}</dd>
                    </div>
                  </dl>

                  {/* The whole card is clickable through the name link's overlay. */}
                  <div className="relative z-10 mt-4 flex gap-2">
                    <Link href={`/funded-accounts/${firm.id}${query}`} className="btn btn-soft min-w-0 flex-1 whitespace-nowrap px-3">
                      View challenges
                      <span className="sr-only"> — {firm.name}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                    <button
                      type="button"
                      aria-pressed={inCompare}
                      onClick={() => toggleCompare(firm, cheapest ?? matches[0])}
                      className={`btn shrink-0 px-3 ${
                        inCompare
                          ? "border-accent bg-accent/12 text-foreground"
                          : "border-border-strong text-muted hover:border-subtle hover:text-foreground"
                      }`}
                    >
                      <span aria-hidden="true" className="font-mono">
                        {inCompare ? "✓" : "+"}
                      </span>
                      {inCompare ? "Comparing" : "Compare"}
                      <span className="sr-only"> — {firm.name}</span>
                    </button>
                  </div>
                  {firm.affiliateLink && (
                    <VisitSiteLink
                      href={firm.affiliateLink}
                      firmName={firm.name}
                      variant="outline"
                      className="relative z-10 mt-2 w-full"
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {restrictedFirms.length > 0 && (
        <details className="group kit-panel mt-8">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
            <span>
              {restrictedFirms.length} firm{restrictedFirms.length === 1 ? "" : "s"} hidden — their published
              country list includes where you live
            </span>
            <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <ul className="divide-y divide-border border-t border-border">
            {restrictedFirms.map(({ firm, availability }) => (
              <li key={firm.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <FirmBadge name={firm.name} logo={firm.logo} logoBg={firm.logoBg} />
                <div className="min-w-0 flex-1">
                  <Link href={`/funded-accounts/${firm.id}${query}`} className="font-semibold hover:text-accent">
                    {firm.name}
                  </Link>
                  <p className="meta">
                    {availability?.reason}
                    {firm.countries?.lastChecked && ` Checked ${firm.countries.lastChecked}.`}
                  </p>
                </div>
                {firm.countries?.source && (
                  <a
                    href={firm.countries.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted underline hover:text-foreground"
                  >
                    Firm&apos;s list
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}

      {comparePlans.length > 0 && (
        <div className="tray-bottom fixed inset-x-0 z-40">
          <div className="container-page pb-4">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-strong bg-surface p-3 shadow-glow sm:p-4">
              <span className="meta hidden sm:inline">Comparing:</span>
              <div className="flex flex-wrap items-center gap-2">
                {comparePlans.map((p) => {
                  const firm = firms.find((f) => f.id === p.firm);
                  if (!firm) return null;
                  return (
                    <span
                      key={p.firm}
                      className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border-strong bg-surface-2 pl-3 text-xs font-medium text-foreground"
                    >
                      {firm.name}
                      <button
                        type="button"
                        onClick={() => toggleCompare(firm, undefined)}
                        aria-label={`Remove ${firm.name} from comparison`}
                        className="flex size-11 items-center justify-center rounded-full text-muted hover:text-foreground"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
              {compareNote && (
                <p role="status" className="meta w-full sm:w-auto">
                  {compareNote}
                </p>
              )}
              <div className="ml-auto flex items-center gap-3">
                {comparePlans.length < 2 ? (
                  <span className="meta">Pick at least 2 to compare</span>
                ) : (
                  <Link href={`/funded-accounts/compare${plansToQuery(comparePlans)}`} className="btn btn-primary">
                    Compare ({comparePlans.length})
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setComparePlans([]);
                    setCompareNote("");
                  }}
                  className="text-sm text-muted underline hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
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
