"use client";

import { useMemo, useState } from "react";
import { genOHLC, rsi, findCrossings } from "@/lib/strategy-sim-utils";

// A live Connors RSI-2 simulator — the same RSI math as the plain RSI
// page, just a 2-period lookback and far more extreme 10/90 thresholds,
// which is what makes it fire on short, sharp pullbacks rather than
// slow overbought/oversold swings. Same synthetic-data convention as
// every other interactive strategy page.

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

export default function ConnorsRsi2Simulator() {
  const [seed, setSeed] = useState(1);

  const bars = useMemo(() => genOHLC(seed, N), [seed]);
  const closes = useMemo(() => bars.map((b) => b.c), [bars]);
  const r = useMemo(() => rsi(closes, 2), [closes]);
  const ten = useMemo(() => r.map((v) => (v == null ? null : 10)), [r]);
  const ninety = useMemo(() => r.map((v) => (v == null ? null : 90)), [r]);
  const buySignals = useMemo(() => findCrossings(r, ten).filter((c) => c.up), [r, ten]);
  const sellSignals = useMemo(() => findCrossings(r, ninety).filter((c) => !c.up), [r, ninety]);

  const { pmin, pmax } = useMemo(() => ({ pmin: Math.min(...closes) - 1, pmax: Math.max(...closes) + 1 }), [closes]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yForPrice = (v: number) => PRICE_BOTTOM - ((v - pmin) / (pmax - pmin)) * (PRICE_BOTTOM - PRICE_TOP);
  const yForOsc = (v: number) => OSC_BOTTOM - (v / 100) * (OSC_BOTTOM - OSC_TOP);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle the chart — every 10/90 cross back is always marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive Connors RSI-2 chart">
          <path d={pathFor(closes, yForPrice, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <line x1={PAD} x2={WIDTH - PAD} y1={yForOsc(90)} y2={yForOsc(90)} stroke="var(--color-danger)" strokeWidth={1.5} strokeDasharray="5 3" />
          <line x1={PAD} x2={WIDTH - PAD} y1={yForOsc(10)} y2={yForOsc(10)} stroke="var(--color-success)" strokeWidth={1.5} strokeDasharray="5 3" />
          <path d={pathFor(r, yForOsc, xStep)} fill="none" stroke="var(--color-accent)" strokeWidth={2} />
          {buySignals.map((c) => (
            <circle key={`b${c.i}`} cx={PAD + c.i * xStep} cy={yForOsc(r[c.i]!)} r={5} fill="var(--color-success)" stroke="var(--color-background)" strokeWidth={2} />
          ))}
          {sellSignals.map((c) => (
            <circle key={`s${c.i}`} cx={PAD + c.i * xStep} cy={yForOsc(r[c.i]!)} r={5} fill="var(--color-danger)" stroke="var(--color-background)" strokeWidth={2} />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-accent" /> RSI(2)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Crosses back above 10 (buy)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-danger" /> Crosses back below 90 (sell)
          </span>
        </div>

        <p className="meta mt-4">
          {buySignals.length + sellSignals.length} signal{buySignals.length + sellSignals.length === 1 ? "" : "s"} on
          this run. Synthetic price data, regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
