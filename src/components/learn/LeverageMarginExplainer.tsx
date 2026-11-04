"use client";

import { useMemo, useState } from "react";
import { ScaleIcon } from "@/components/icons";

// Drag the leverage slider and watch how little of a position's actual
// value you'd need to put up as margin — and how that same multiplier
// applies to any loss, not just a gain. The second half of that sentence
// is the point of the widget, not a footnote.
export default function LeverageMarginExplainer() {
  const [notional, setNotional] = useState(10000);
  const [leverage, setLeverage] = useState(10);

  const margin = useMemo(() => notional / leverage, [notional, leverage]);
  const marginPercent = useMemo(() => (margin / notional) * 100, [margin, notional]);

  // A 1% move in the underlying price, scaled by leverage, as % of margin.
  const onePercentMoveEffect = leverage * 1;

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex items-center gap-2.5 border-b border-border bg-surface-2 px-5 py-3.5">
        <ScaleIcon className="size-5 text-accent" />
        <p className="text-lg font-bold text-foreground">Leverage &amp; margin, visualised</p>
      </div>

      <div className="p-5 sm:p-6">
        <label className="block">
          <span className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Position size (notional value)</span>
            <span className="figure text-accent">${notional.toLocaleString()}</span>
          </span>
          <input
            type="range"
            min={1000}
            max={50000}
            step={1000}
            value={notional}
            onChange={(e) => setNotional(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-gold-bright)]"
          />
        </label>

        <label className="mt-5 block">
          <span className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Leverage</span>
            <span className="figure text-accent">{leverage}:1</span>
          </span>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-gold-bright)]"
          />
        </label>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="eyebrow">Margin you&apos;d need to put up</div>
            <div className="figure-lg mt-1 text-3xl text-foreground">${margin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="meta mt-1">{marginPercent.toFixed(1)}% of the position&apos;s full value</div>
          </div>
          <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
            <div className="eyebrow text-danger">A 1% price move against you</div>
            <div className="figure-lg mt-1 text-3xl text-danger">
              {onePercentMoveEffect.toFixed(0)}% of your margin
            </div>
            <div className="meta mt-1">Same multiplier either direction — gains and losses both scale with leverage.</div>
          </div>
        </div>

        <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-bright transition-all"
            style={{ width: `${Math.min(100, marginPercent)}%` }}
          />
        </div>
        <p className="meta mt-2">
          The gold bar is how much of the position is actually your money — the rest is the
          leverage your broker is extending you.
        </p>
      </div>
    </div>
  );
}
