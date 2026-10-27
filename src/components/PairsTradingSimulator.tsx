"use client";

import { useMemo, useState } from "react";
import { genPairsDemo } from "@/lib/strategy-sim-utils";

// A live pairs trading simulator — two correlated series that normally
// move together, deliberately stretched apart for a stretch and then
// pulled back. The spread panel underneath is what pairs trading
// actually watches; the peak (widest gap) and the reversion (where it
// genuinely snaps back) are always marked. Same synthetic-data
// convention as every other interactive strategy page.

const WIDTH = 760;
const PAD = 28;
const N = 80;
const PRICE_TOP = 16;
const PRICE_BOTTOM = 160;
const SPREAD_TOP = 196;
const SPREAD_BOTTOM = 320;
const HEIGHT = SPREAD_BOTTOM + 16;

function pathFor(values: (number | null)[], yFn: (v: number) => number, xStep: number) {
  let d = "";
  let drawing = false;
  values.forEach((v, i) => {
    if (v == null) {
      drawing = false;
      return;
    }
    const x = PAD + i * xStep;
    const y = yFn(v);
    d += drawing ? ` L ${x} ${y}` : `M ${x} ${y}`;
    drawing = true;
  });
  return d;
}

export default function PairsTradingSimulator() {
  const [seed, setSeed] = useState(1);

  const { a, b, spread, peakI, reversionI } = useMemo(() => genPairsDemo(seed, N), [seed]);

  const priceRange = useMemo(() => {
    const all = a.concat(b);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [a, b]);
  const spreadRange = useMemo(() => {
    const m = Math.max(...spread.map(Math.abs), 1) * 1.15;
    return { min: -m, max: m };
  }, [spread]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yForPrice = (v: number) => PRICE_BOTTOM - ((v - priceRange.min) / (priceRange.max - priceRange.min)) * (PRICE_BOTTOM - PRICE_TOP);
  const yForSpread = (v: number) => SPREAD_BOTTOM - ((v - spreadRange.min) / (spreadRange.max - spreadRange.min)) * (SPREAD_BOTTOM - SPREAD_TOP);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle — the widest gap and the actual reversion are always marked on the spread.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive pairs trading chart">
          <path d={pathFor(a, yForPrice, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <path d={pathFor(b, yForPrice, xStep)} fill="none" stroke="var(--color-accent)" strokeWidth={2.5} />

          <line x1={PAD} x2={WIDTH - PAD} y1={yForSpread(0)} y2={yForSpread(0)} stroke="var(--color-border)" strokeWidth={1.5} />
          <path d={pathFor(spread, yForSpread, xStep)} fill="none" stroke="var(--color-gold)" strokeWidth={2} />
          <circle cx={PAD + peakI * xStep} cy={yForSpread(spread[peakI])} r={5} fill="var(--color-danger)" stroke="var(--color-background)" strokeWidth={2} />
          <circle cx={PAD + reversionI * xStep} cy={yForSpread(spread[reversionI])} r={6} fill="var(--color-success)" stroke="var(--color-background)" strokeWidth={2} />
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Asset A
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-accent" /> Asset B
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-danger" /> Widest gap
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Spread reverts
          </span>
        </div>

        <p className="meta mt-4">
          The two assets normally move together; when the gap between them stretches this wide, pairs
          trading bets on it closing back up — which it does here. Deliberately-shaped synthetic data,
          regenerated each shuffle — not real market data.
        </p>
      </div>
    </div>
  );
}
