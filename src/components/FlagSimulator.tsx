"use client";

import { useMemo, useState } from "react";
import { genFlagDemo, toPath } from "@/lib/strategy-sim-utils";

// A live flag/pennant simulator — a deliberately-shaped series (same
// reasoning as the other crafted patterns): a sharp flagpole, a tight
// consolidation drifting gently against it, then a clean breakout
// continuing the pole's direction. Still entirely synthetic.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 60;

export default function FlagSimulator() {
  const [seed, setSeed] = useState(1);

  const { values, poleStartI, poleEndI, flagEndI, breakoutI, up } = useMemo(() => genFlagDemo(seed, N), [seed]);

  const { min, max } = useMemo(() => ({ min: Math.min(...values) - 1, max: Math.max(...values) + 1 }), [values]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle the chart — the flagpole, the flag and the breakout are always marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive flag chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <rect x={PAD + poleStartI * xStep} y={0} width={(poleEndI - poleStartI) * xStep} height={HEIGHT} fill="var(--color-gold)" opacity={0.06} />
          <rect x={PAD + poleEndI * xStep} y={0} width={(flagEndI - poleEndI) * xStep} height={HEIGHT} fill="var(--color-muted)" opacity={0.08} />
          <path d={toPath(values, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <circle cx={PAD + breakoutI * xStep} cy={yFor(values[breakoutI])} r={6} fill={up ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-gold opacity-30" /> Flagpole
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-muted opacity-40" /> Flag (consolidation)
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-full ${up ? "bg-success" : "bg-danger"}`} /> Breakout
          </span>
        </div>

        <p className="meta mt-4">
          This run breaks out {up ? "upward" : "downward"} — the same direction as the flagpole,
          continuing the move after the flag&apos;s tight consolidation. Deliberately-shaped synthetic
          data, regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
