"use client";

import { useMemo, useState } from "react";
import { genCycleDemo, toPath } from "@/lib/strategy-sim-utils";

// A live cycle analysis simulator — a deliberately periodic series with a
// fixed rhythm, since cycle analysis only makes sense when there actually
// is one. The prior lows and the next expected low (given that rhythm)
// are always marked. Same synthetic-data convention as every other
// interactive strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 70;

export default function CycleSimulator() {
  const [seed, setSeed] = useState(1);

  const { values, period, priorLows, nextLowI } = useMemo(() => genCycleDemo(seed, N), [seed]);

  const { min, max } = useMemo(() => ({ min: Math.min(...values) - 1, max: Math.max(...values) + 1 }), [values]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle — the established rhythm and the next expected low are always marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive cycle analysis chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <path d={toPath(values, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          {priorLows.map((i) => (
            <circle key={i} cx={PAD + i * xStep} cy={yFor(values[i])} r={5} fill="var(--color-muted)" stroke="var(--color-background)" strokeWidth={2} />
          ))}
          <circle cx={PAD + nextLowI * xStep} cy={yFor(values[nextLowI])} r={6} fill="var(--color-success)" stroke="var(--color-background)" strokeWidth={2} />
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-muted" /> Prior cycle lows
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Next expected low
          </span>
        </div>

        <p className="meta mt-4">
          This run has a roughly {period}-bar rhythm — each low lands about {period} bars after the
          last one. Deliberately-shaped synthetic data, regenerated each shuffle — not a real
          historical chart.
        </p>
      </div>
    </div>
  );
}
