"use client";

import { useMemo, useState } from "react";
import { genOHLC, genVolume, vwap, toPath } from "@/lib/strategy-sim-utils";

// A live VWAP simulator — shuffle the chart and the reversion touches
// (where price comes back and touches VWAP) are always marked. Same
// synthetic-data convention as every other interactive strategy page,
// including the volume, which is fabricated too.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 90;

export default function VwapSimulator() {
  const [seed, setSeed] = useState(1);

  const bars = useMemo(() => genOHLC(seed, N), [seed]);
  const closes = useMemo(() => bars.map((b) => b.c), [bars]);
  const volumes = useMemo(() => genVolume(seed, bars), [seed, bars]);
  const vwapLine = useMemo(() => vwap(bars, volumes), [bars, volumes]);

  const tolerance = useMemo(() => {
    const all = closes.concat(vwapLine);
    return (Math.max(...all) - Math.min(...all)) * 0.015;
  }, [closes, vwapLine]);
  const touches = useMemo(() => {
    const out: number[] = [];
    closes.forEach((c, i) => {
      if (i > 5 && Math.abs(c - vwapLine[i]) <= tolerance) out.push(i);
    });
    return out;
  }, [closes, vwapLine, tolerance]);

  const { min, max } = useMemo(() => {
    const all = closes.concat(vwapLine);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, vwapLine]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle — VWAP redraws live, and every bar that touches it back is marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive VWAP chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <path d={toPath(vwapLine, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold)" strokeWidth={2} strokeDasharray="6 4" />
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          {touches.map((i) => (
            <circle key={i} cx={PAD + i * xStep} cy={yFor(closes[i])} r={5} fill="var(--color-success)" stroke="var(--color-background)" strokeWidth={2} />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> VWAP
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Reversion touch
          </span>
        </div>

        <p className="meta mt-4">
          {touches.length} VWAP touch{touches.length === 1 ? "" : "es"} on this run. Fabricated price and
          volume, regenerated each shuffle — not real market data.
        </p>
      </div>
    </div>
  );
}
