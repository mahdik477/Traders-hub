"use client";

import { useMemo, useState } from "react";
import { genGannAngleDemo, toPath } from "@/lib/strategy-sim-utils";

// A live Gann angle simulator — a classic 1x1 angle drawn from a
// significant swing low at a fixed rate, with every touch marked. The
// exact "correct" slope in real Gann work depends on a price-per-bar
// scaling convention that varies by instrument, so this uses one fixed,
// clearly-labelled scale for illustration — same spirit as every other
// synthetic chart here.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 90;

export default function GannSimulator() {
  const [seed, setSeed] = useState(1);

  const { values, anchorI, anchorV, slope, touches } = useMemo(() => genGannAngleDemo(seed, N), [seed]);
  const line = useMemo(() => values.map((_, i) => (i >= anchorI ? anchorV + slope * (i - anchorI) : null)), [values, anchorI, anchorV, slope]);

  const { min, max } = useMemo(() => {
    const lineVals = line.filter((v): v is number => v != null);
    const all = values.concat(lineVals);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [values, line]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle — the 1x1 angle redraws from the swing low, and every touch is marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive Gann angle chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <path d={toPath(line, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold)" strokeWidth={2} strokeDasharray="7 4" />
          <path d={toPath(values, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <circle cx={PAD + anchorI * xStep} cy={yFor(anchorV)} r={5} fill="var(--color-muted)" stroke="var(--color-background)" strokeWidth={2} />
          {touches.map((i) => (
            <circle key={i} cx={PAD + i * xStep} cy={yFor(values[i])} r={5} fill="var(--color-success)" stroke="var(--color-background)" strokeWidth={2} />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> 1x1 angle
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-muted" /> Anchor (the swing low)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Angle touch
          </span>
        </div>

        <p className="meta mt-4">
          {touches.length} angle touch{touches.length === 1 ? "" : "es"} on this run. Synthetic price
          data, regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
