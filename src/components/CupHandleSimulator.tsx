"use client";

import { useMemo, useState } from "react";
import { genCupHandleDemo, toPath } from "@/lib/strategy-sim-utils";

// A live cup-and-handle simulator — a deliberately-shaped series: a
// U-shaped recovery back to its starting level (the cup), a small
// pullback (the handle), then a clean breakout above the rim. Same
// crafted-pattern approach as the double top/bottom and head-and-
// shoulders pages.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 60;

export default function CupHandleSimulator() {
  const [seed, setSeed] = useState(1);

  const { values, cupStartI, cupEndI, handleEndI, breakoutI, rimV } = useMemo(() => genCupHandleDemo(seed, N), [seed]);

  const { min, max } = useMemo(() => ({ min: Math.min(...values) - 1, max: Math.max(...values) + 1 }), [values]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle the chart — the cup, the handle, the rim and the breakout are always marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive cup and handle chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <line x1={PAD + cupStartI * xStep} x2={WIDTH - PAD} y1={yFor(rimV)} y2={yFor(rimV)} stroke="var(--color-gold)" strokeWidth={1.5} strokeDasharray="6 4" />
          <rect x={PAD + cupStartI * xStep} y={0} width={(cupEndI - cupStartI) * xStep} height={HEIGHT} fill="var(--color-gold)" opacity={0.05} />
          <rect x={PAD + cupEndI * xStep} y={0} width={(handleEndI - cupEndI) * xStep} height={HEIGHT} fill="var(--color-muted)" opacity={0.08} />
          <path d={toPath(values, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <circle cx={PAD + breakoutI * xStep} cy={yFor(values[breakoutI])} r={6} fill="var(--color-success)" stroke="var(--color-background)" strokeWidth={2} />
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> The rim
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-gold opacity-30" /> The cup
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-muted opacity-40" /> The handle
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Breakout above the rim
          </span>
        </div>

        <p className="meta mt-4">
          The handle&apos;s small pullback happens well above the bottom of the cup — then price
          actually breaks above the rim. Deliberately-shaped synthetic data, regenerated each shuffle —
          not a real historical chart.
        </p>
      </div>
    </div>
  );
}
