"use client";

import { useMemo, useState } from "react";
import { genDoublePattern, findDoublePattern, toPath, type DoublePattern } from "@/lib/strategy-sim-utils";

// Pulled out of the component so the memoization below is a plain function
// call the compiler can reason about, not an inline loop with early returns.
function findConfirmation(values: number[], pattern: DoublePattern | null): { i: number } | null {
  if (!pattern) return null;
  for (let i = pattern.peak2 + 1; i < values.length; i++) {
    if (pattern.top ? values[i] < pattern.necklineV : values[i] > pattern.necklineV) return { i };
  }
  return null;
}

// A live double top/bottom simulator. Unlike the other free strategies,
// this pattern needs a deliberately-shaped series to actually show up —
// a plain random walk essentially never forms two matching peaks on
// demand — so this one chart is generated to contain the shape, not left
// to chance. The two peaks/troughs and the neckline are still detected
// from the series, not just read off the generator settings. Still
// entirely synthetic, still labelled as such.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 70;

export default function DoublePatternSimulator() {
  const [seed, setSeed] = useState(1);
  const top = seed % 2 === 0;

  const values = useMemo(() => genDoublePattern(seed, N, top), [seed, top]);
  const pattern = useMemo(() => findDoublePattern(values, top, 4), [values, top]);
  const confirmation = useMemo(() => findConfirmation(values, pattern), [values, pattern]);

  const { min, max } = useMemo(() => ({ min: Math.min(...values) - 1, max: Math.max(...values) + 1 }), [values]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle — alternates between a double top and a double bottom.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive double top / double bottom chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          {pattern && (
            <line x1={PAD} x2={WIDTH - PAD} y1={yFor(pattern.necklineV)} y2={yFor(pattern.necklineV)} stroke="var(--color-gold)" strokeWidth={1.5} strokeDasharray="6 4" />
          )}
          <path d={toPath(values, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          {pattern && (
            <>
              <circle cx={PAD + pattern.peak1 * xStep} cy={yFor(values[pattern.peak1])} r={6} fill="var(--color-muted)" stroke="var(--color-background)" strokeWidth={2} />
              <circle cx={PAD + pattern.peak2 * xStep} cy={yFor(values[pattern.peak2])} r={6} fill="var(--color-muted)" stroke="var(--color-background)" strokeWidth={2} />
            </>
          )}
          {confirmation && (
            <circle cx={PAD + confirmation.i * xStep} cy={yFor(values[confirmation.i])} r={6} fill={top ? "var(--color-danger)" : "var(--color-success)"} stroke="var(--color-background)" strokeWidth={2} />
          )}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> Neckline
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-muted" /> {top ? "The two tops" : "The two bottoms"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-full ${top ? "bg-danger" : "bg-success"}`} /> Neckline break (confirmation)
          </span>
        </div>

        <p className="meta mt-4">
          This run is a {top ? "double top" : "double bottom"} — two {top ? "peaks" : "troughs"} at a
          similar level, with the move only confirmed once price actually breaks the neckline.
          Deliberately-shaped synthetic data — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
