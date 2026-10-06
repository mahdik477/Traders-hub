"use client";

import { useState } from "react";
import type { Cell, FirmView } from "@/lib/propfirm-types";
import type { PricingSelection } from "@/lib/propfirm-filters";
import VisitSiteLink from "@/components/VisitSiteLink";

export const MARKET_LABELS = { forex: "Forex", futures: "Futures" } as const;

// Pick the chosen option if this firm/market offers it, otherwise fall back to
// the first one.
function pick<T>(items: T[], matches: (item: T) => boolean): T {
  return items.find(matches) ?? items[0];
}

// One firm's pricing table with market / challenge type / tier toggles.
// The parent owns the selection so it can start the table on whatever
// matches the filter bar.
export default function PropFirmPricing({
  firm,
  selection,
  onSelect,
}: {
  firm: FirmView;
  selection: PricingSelection;
  onSelect: (selection: PricingSelection) => void;
}) {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  const market = pick(firm.markets, (m) => m.market === selection.market);
  const challenge = pick(market.challenges, (c) => c.key === selection.challenge);
  const tier = pick(challenge.tiers, (t) => t.name === selection.tier);

  // Column hover highlight sits on top of the alternating row shades.
  const colClass = (i: number) => (hoveredCol === i ? "bg-accent/10" : "");

  return (
    <div>
      <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
        <ToggleRow
          label="Market"
          options={firm.markets.map((m) => ({ key: m.market, label: MARKET_LABELS[m.market] }))}
          selected={market.market}
          onSelect={(key) => onSelect({ ...selection, market: key })}
        />
        <ToggleRow
          label="Challenge type"
          options={market.challenges.map((c) => ({ key: c.key, label: c.label, sub: c.tagline }))}
          selected={challenge.key}
          onSelect={(key) => onSelect({ ...selection, challenge: key })}
        />
        {/* Tier — hidden when there's only one */}
        {challenge.tiers.length > 1 && (
          <ToggleRow
            label="Tier"
            options={challenge.tiers.map((t) => ({ key: t.name, label: t.name, sub: t.tagline }))}
            selected={tier.name}
            onSelect={(key) => onSelect({ ...selection, tier: key })}
          />
        )}
      </div>

      <div className="mt-8">
        <h3 className="section-title">
          {firm.name} · {MARKET_LABELS[market.market]} · {challenge.label}
          {challenge.tiers.length > 1 && ` · ${tier.name}`}
        </h3>
        <p className="meta mt-1">
          {[
            `Prices in ${firm.currency}`,
            market.partner && `Via partner ${market.partner}`,
            market.promoCode && `Promo code ${market.promoCode}`,
            firm.platforms && `Platforms: ${firm.platforms.join(", ")}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="meta mt-3 sm:hidden">Scroll sideways to see every account size →</p>

        <div className="mt-3 overflow-x-auto rounded-xl border border-border">
          <table
            className="w-full border-collapse text-sm"
            onMouseLeave={() => setHoveredCol(null)}
          >
            <thead>
              <tr className="border-b border-border-strong bg-surface-2">
                <th
                  scope="col"
                  className="eyebrow sticky left-0 z-10 bg-surface-2 px-4 py-3 text-left shadow-[inset_-1px_0_0_var(--color-border)]"
                >
                  Account size
                </th>
                {tier.sizes.map((size, i) => (
                  <th
                    key={size}
                    scope="col"
                    onMouseEnter={() => setHoveredCol(i)}
                    className={`whitespace-nowrap px-4 py-3 text-center text-base font-bold transition-colors ${
                      hoveredCol === i ? "bg-accent/15 text-accent" : ""
                    }`}
                  >
                    {size}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tier.rows.map((row) => (
                <tr key={row.label} className="odd:bg-surface even:bg-background">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 whitespace-nowrap bg-inherit px-4 py-3 text-left font-medium text-muted shadow-[inset_-1px_0_0_var(--color-border)]"
                  >
                    {row.label}
                  </th>
                  {row.values.map((v, i) => (
                    <td
                      key={i}
                      onMouseEnter={() => setHoveredCol(i)}
                      className={`whitespace-nowrap px-4 py-3 text-center transition-colors ${colClass(i)}`}
                    >
                      <CellValue value={v} rowLabel={row.label} />
                    </td>
                  ))}
                </tr>
              ))}
              {/* Price row: stands out from the rules above it */}
              <tr className="border-t-2 border-border-strong bg-surface-2">
                <th
                  scope="row"
                  className="sticky left-0 z-10 whitespace-nowrap bg-surface-2 px-4 py-4 text-left text-base font-bold text-accent shadow-[inset_-1px_0_0_var(--color-border)]"
                >
                  Price
                </th>
                {tier.prices.map((p, i) => (
                  <td
                    key={i}
                    onMouseEnter={() => setHoveredCol(i)}
                    className={`whitespace-nowrap px-4 py-4 text-center align-top transition-colors ${colClass(i)}`}
                  >
                    {p.full == null ? (
                      <CellValue value={null} rowLabel="Price" />
                    ) : p.discounted ? (
                      <>
                        <div className="figure text-accent">{p.discounted}</div>
                        <div className="mt-1.5 flex flex-col items-center gap-1">
                          <span className="text-xs text-subtle line-through">
                            <span className="sr-only">Full price </span>
                            {p.full}
                          </span>
                          <span className="badge badge-promo">{p.discountLabel}</span>
                        </div>
                      </>
                    ) : (
                      <div className="figure text-accent">{p.full}</div>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {firm.affiliateLink && (
          <div className="mt-5">
            <VisitSiteLink href={firm.affiliateLink} firmName={firm.name} />
          </div>
        )}
      </div>
    </div>
  );
}

function CellValue({ value, rowLabel }: { value: Cell; rowLabel: string }) {
  if (value == null) {
    return (
      <span className="text-subtle" title="Not shown on the firm's pricing page">
        —
      </span>
    );
  }
  if (rowLabel === "Fee refund" && (value === "Yes" || value === "No")) {
    return (
      <span className={`badge ${value === "Yes" ? "badge-success" : "badge-danger"}`}>{value}</span>
    );
  }
  if (rowLabel === "Profit split") {
    return <span className="text-base font-bold">{value}</span>;
  }
  return <>{value}</>;
}

function ToggleRow({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { key: string; label: string; sub?: string | null }[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
      <span className="eyebrow sm:w-28 sm:shrink-0 sm:pt-3">{label}</span>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const isSelected = o.key === selected;
          return (
            <button
              key={o.key}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(o.key)}
              className={`flex min-h-11 min-w-24 flex-col items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                isSelected
                  ? "border-gold-fill bg-gold-fill text-gold-ink"
                  : "border-border-strong text-foreground hover:border-accent/70 hover:bg-surface-2"
              }`}
            >
              {o.label}
              {o.sub && (
                <span
                  className={`mt-0.5 text-xs font-normal ${
                    isSelected ? "text-gold-ink/75" : "text-subtle"
                  }`}
                >
                  {o.sub}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
