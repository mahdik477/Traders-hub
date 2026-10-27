"use client";

import { useMemo, useState } from "react";
import { genDeltaDivergenceDemo, findDivergence } from "@/lib/strategy-sim-utils";

// A live order-flow simulator — shuffle the chart and the panel below
// the price shows cumulative delta (buy volume minus sell volume), with
// the actual divergence marked between its two defining points. Same
// synthetic-data convention as every other interactive strategy page —
// this is a simplified stand-in for real footprint/delta data, which
// needs trade-by-trade order book data no public API gives out.

const WIDTH = 760;
const PAD = 28;
const N = 70;
const PRICE_TOP = 16;
const PRICE_BOTTOM = 130;
const OSC_TOP = 166;
const OSC_BOTTOM = 320;
const HEIGHT = OSC_BOTTOM + 16;

function pathFor(values: number[], yFn: (v: number) => number, xStep: number) {
  let d = "";
  values.forEach((v, i) => {
    const x = PAD + i * xStep;
    const y = yFn(v);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });
  return d;
}

export default function OrderFlowSimulator() {
  const [seed, setSeed] = useState(1);
  const bullish = seed % 2 === 0;

  const { closes, delta } = useMemo(() => genDeltaDivergenceDemo(seed, N, bullish), [seed, bullish]);
  const divergence = useMemo(() => findDivergence(closes, delta, 4), [closes, delta]);

  const { pmin, pmax } = useMemo(() => ({ pmin: Math.min(...closes) - 1, pmax: Math.max(...closes) + 1 }), [closes]);
  const { omin, omax } = useMemo(() => {
    const m = Math.max(...delta.map(Math.abs)) * 1.15 || 1;
    return { omin: -m, omax: m };
  }, [delta]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yForPrice = (v: number) => PRICE_BOTTOM - ((v - pmin) / (pmax - pmin)) * (PRICE_BOTTOM - PRICE_TOP);
  const yForOsc = (v: number) => OSC_BOTTOM - ((v - omin) / (omax - omin)) * (OSC_BOTTOM - OSC_TOP);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle — the two points that make up the divergence are always marked, on both panels.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive order flow delta chart">
          <path d={pathFor(closes, yForPrice, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <line x1={PAD} x2={WIDTH - PAD} y1={yForOsc(0)} y2={yForOsc(0)} stroke="var(--color-border)" strokeWidth={1.5} />
          <path d={pathFor(delta, yForOsc, xStep)} fill="none" stroke="var(--color-gold)" strokeWidth={2.5} />
          {divergence && (
            <>
              <line x1={PAD + divergence.priceI1 * xStep} x2={PAD + divergence.priceI2 * xStep} y1={yForPrice(closes[divergence.priceI1])} y2={yForPrice(closes[divergence.priceI2])} stroke={divergence.bullish ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="5 3" />
              <line x1={PAD + divergence.oscI1 * xStep} x2={PAD + divergence.oscI2 * xStep} y1={yForOsc(delta[divergence.oscI1])} y2={yForOsc(delta[divergence.oscI2])} stroke={divergence.bullish ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="5 3" />
              {[divergence.priceI1, divergence.priceI2].map((i) => (
                <circle key={`p${i}`} cx={PAD + i * xStep} cy={yForPrice(closes[i])} r={5} fill={divergence.bullish ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
              ))}
              {[divergence.oscI1, divergence.oscI2].map((i) => (
                <circle key={`o${i}`} cx={PAD + i * xStep} cy={yForOsc(delta[i])} r={5} fill={divergence.bullish ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
              ))}
            </>
          )}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> Cumulative delta
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-full ${bullish ? "bg-success" : "bg-danger"}`} /> The two divergence points
          </span>
        </div>

        <p className="meta mt-4">
          This run is a {bullish ? "bullish" : "bearish"} divergence — price makes a {bullish ? "lower low" : "higher high"} while
          cumulative delta makes a {bullish ? "higher low" : "lower high"}, meaning the aggressive buying/selling
          isn&apos;t actually confirming the move. Fabricated price and order flow, regenerated each shuffle —
          not real market data.
        </p>
      </div>
    </div>
  );
}
