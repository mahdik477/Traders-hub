"use client";

import { useMemo, useState } from "react";
import { genObvDivergenceDemo, obvFromCloses, findDivergence } from "@/lib/strategy-sim-utils";

// A live OBV simulator — shuffle the chart and the panel below the price
// shows On-Balance Volume, with the actual divergence (price and OBV
// disagreeing on direction) marked between its two defining points. Same
// synthetic-data convention as every other interactive strategy page —
// including the volume, which is fabricated too, never real.

const WIDTH = 760;
const PAD = 28;
const N = 70;
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

export default function ObvSimulator() {
  const [seed, setSeed] = useState(1);
  const bullish = seed % 2 === 0;

  const { closes, volumes } = useMemo(() => genObvDivergenceDemo(seed, N, bullish), [seed, bullish]);
  const obvLine = useMemo(() => obvFromCloses(closes, volumes), [closes, volumes]);
  const divergence = useMemo(() => findDivergence(closes, obvLine, 4), [closes, obvLine]);

  const { pmin, pmax } = useMemo(() => ({ pmin: Math.min(...closes) - 1, pmax: Math.max(...closes) + 1 }), [closes]);
  const { omin, omax } = useMemo(() => {
    const m = Math.max(...obvLine.map(Math.abs)) * 1.15 || 1;
    return { omin: -m, omax: m };
  }, [obvLine]);
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
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive OBV chart">
          <path d={pathFor(closes, yForPrice, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <line x1={PAD} x2={WIDTH - PAD} y1={yForOsc(0)} y2={yForOsc(0)} stroke="var(--color-border)" strokeWidth={1.5} />
          <path d={pathFor(obvLine, yForOsc, xStep)} fill="none" stroke="var(--color-gold)" strokeWidth={2.5} />
          {divergence && (
            <>
              <line x1={PAD + divergence.priceI1 * xStep} x2={PAD + divergence.priceI2 * xStep} y1={yForPrice(closes[divergence.priceI1])} y2={yForPrice(closes[divergence.priceI2])} stroke={divergence.bullish ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="5 3" />
              <line x1={PAD + divergence.oscI1 * xStep} x2={PAD + divergence.oscI2 * xStep} y1={yForOsc(obvLine[divergence.oscI1])} y2={yForOsc(obvLine[divergence.oscI2])} stroke={divergence.bullish ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="5 3" />
              {[divergence.priceI1, divergence.priceI2].map((i) => (
                <circle key={`p${i}`} cx={PAD + i * xStep} cy={yForPrice(closes[i])} r={5} fill={divergence.bullish ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
              ))}
              {[divergence.oscI1, divergence.oscI2].map((i) => (
                <circle key={`o${i}`} cx={PAD + i * xStep} cy={yForOsc(obvLine[i])} r={5} fill={divergence.bullish ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
              ))}
            </>
          )}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> OBV
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-full ${bullish ? "bg-success" : "bg-danger"}`} /> The two divergence points
          </span>
        </div>

        <p className="meta mt-4">
          This run is a {bullish ? "bullish" : "bearish"} divergence — price makes a {bullish ? "lower low" : "higher high"} while
          OBV makes a {bullish ? "higher low" : "lower high"}, meaning volume isn&apos;t actually confirming the move.
          Fabricated price and volume, regenerated each shuffle — not real market data.
        </p>
      </div>
    </div>
  );
}
