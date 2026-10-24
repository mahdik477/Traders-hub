"use client";

import { useMemo, useState } from "react";
import { genOHLC, stochastic, findCrossings } from "@/lib/strategy-sim-utils";

// A live Stochastic Oscillator simulator — drag the period slider and the
// %K/%D panel below the price recomputes instantly. Same synthetic-data
// convention as every other interactive strategy page.

const WIDTH = 760;
const PAD = 28;
const N = 90;
const PRICE_TOP = 16;
const PRICE_BOTTOM = 130;
const OSC_TOP = 166;
const OSC_BOTTOM = 320;
const HEIGHT = OSC_BOTTOM + 16;

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

export default function StochasticSimulator() {
  const [seed, setSeed] = useState(1);
  const [period, setPeriod] = useState(14);

  const bars = useMemo(() => genOHLC(seed, N), [seed]);
  const closes = useMemo(() => bars.map((b) => b.c), [bars]);
  const { k, d } = useMemo(() => stochastic(bars, period, 3, 3), [bars, period]);
  const twenty = useMemo(() => k.map(() => 20), [k]);
  const eighty = useMemo(() => k.map(() => 80), [k]);
  const buySignals = useMemo(() => findCrossings(k, twenty).filter((c) => c.up), [k, twenty]);
  const sellSignals = useMemo(() => findCrossings(k, eighty).filter((c) => !c.up), [k, eighty]);

  const { pmin, pmax } = useMemo(() => ({ pmin: Math.min(...closes) - 1, pmax: Math.max(...closes) + 1 }), [closes]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yForPrice = (v: number) => PRICE_BOTTOM - ((v - pmin) / (pmax - pmin)) * (PRICE_BOTTOM - PRICE_TOP);
  const yForOsc = (v: number) => OSC_BOTTOM - (v / 100) * (OSC_BOTTOM - OSC_TOP);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Drag the slider — the %K/%D panel recomputes live underneath the price.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive Stochastic Oscillator chart">
          <path d={pathFor(closes, yForPrice, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <line x1={PAD} x2={WIDTH - PAD} y1={OSC_TOP} y2={OSC_TOP} stroke="var(--color-border)" strokeWidth={1} />
          <line x1={PAD} x2={WIDTH - PAD} y1={yForOsc(80)} y2={yForOsc(80)} stroke="var(--color-danger)" strokeWidth={1.5} strokeDasharray="5 3" />
          <line x1={PAD} x2={WIDTH - PAD} y1={yForOsc(20)} y2={yForOsc(20)} stroke="var(--color-success)" strokeWidth={1.5} strokeDasharray="5 3" />
          <path d={pathFor(d, yForOsc, xStep)} fill="none" stroke="var(--color-gold)" strokeWidth={2} opacity={0.8} />
          <path d={pathFor(k, yForOsc, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          {buySignals.map((c) => (
            <circle key={`b${c.i}`} cx={PAD + c.i * xStep} cy={yForOsc(k[c.i]!)} r={5} fill="var(--color-success)" stroke="var(--color-background)" strokeWidth={2} />
          ))}
          {sellSignals.map((c) => (
            <circle key={`s${c.i}`} cx={PAD + c.i * xStep} cy={yForOsc(k[c.i]!)} r={5} fill="var(--color-danger)" stroke="var(--color-background)" strokeWidth={2} />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> %K
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> %D
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Crosses back above 20 (buy)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-danger" /> Crosses back below 80 (sell)
          </span>
        </div>

        <div className="mt-5">
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">%K period</span>
              <span className="figure text-accent">{period}</span>
            </span>
            <input type="range" min={5} max={25} value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-gold-bright)]" />
          </label>
        </div>

        <p className="meta mt-4">
          {buySignals.length + sellSignals.length} signal{buySignals.length + sellSignals.length === 1 ? "" : "s"} on this run. Synthetic
          price data, regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
