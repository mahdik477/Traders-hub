"use client";

import { useMemo, useState } from "react";
import { genSeries, roc, findCrossings } from "@/lib/strategy-sim-utils";

// A live time-series momentum simulator — a longer-period rate-of-change
// read on the asset's OWN past price (not against another asset), with
// the zero line as the long/short flip. Same math as the plain ROC page,
// just a longer lookback and framed as "is this trending at all" rather
// than "is it overbought." Same synthetic-data convention as every other
// interactive strategy page.

const WIDTH = 760;
const PRICE_TOP = 16;
const PRICE_BOTTOM = 160;
const OSC_TOP = 196;
const OSC_BOTTOM = 320;
const HEIGHT = 336;
const PAD = 28;
const N = 90;
const PERIOD = 20;

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
    d += drawing ? ` L ${x} ${y}` : ` M ${x} ${y}`;
    drawing = true;
  });
  return d;
}

export default function TimeSeriesMomentumSimulator() {
  const [seed, setSeed] = useState(1);

  const closes = useMemo(() => genSeries(seed, N), [seed]);
  const momentum = useMemo(() => roc(closes, PERIOD), [closes]);
  const zeroLine = useMemo(() => momentum.map((v) => (v == null ? null : 0)), [momentum]);
  const crossings = useMemo(() => findCrossings(momentum, zeroLine), [momentum, zeroLine]);

  const priceRange = useMemo(() => ({ min: Math.min(...closes) - 1, max: Math.max(...closes) + 1 }), [closes]);
  const oscVals = momentum.filter((v): v is number => v != null);
  const oscRange = useMemo(() => {
    const maxAbs = Math.max(...oscVals.map((v) => Math.abs(v)), 1);
    return { min: -maxAbs * 1.1, max: maxAbs * 1.1 };
  }, [oscVals]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yForPrice = (v: number) => PRICE_BOTTOM - ((v - priceRange.min) / (priceRange.max - priceRange.min)) * (PRICE_BOTTOM - PRICE_TOP);
  const yForOsc = (v: number) => OSC_BOTTOM - ((v - oscRange.min) / (oscRange.max - oscRange.min)) * (OSC_BOTTOM - OSC_TOP);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle the chart — every zero-line flip is always marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive time-series momentum chart">
          <path d={pathFor(closes, yForPrice, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />

          <line x1={PAD} x2={WIDTH - PAD} y1={yForOsc(0)} y2={yForOsc(0)} stroke="var(--color-border)" strokeWidth={1.5} />
          <path d={pathFor(momentum, yForOsc, xStep)} fill="none" stroke="var(--color-accent)" strokeWidth={2} />
          {crossings.map((c) => (
            <circle key={c.i} cx={PAD + c.i * xStep} cy={yForOsc(momentum[c.i]!)} r={5} fill={c.up ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-accent" /> {PERIOD}-bar momentum
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Flip to long
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-danger" /> Flip to short
          </span>
        </div>

        <p className="meta mt-4">
          {crossings.length} zero-line flip{crossings.length === 1 ? "" : "s"} on this run. Synthetic
          price data, regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
