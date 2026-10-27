"use client";

import { useMemo, useState } from "react";
import { genHarmonicDemo, toPath } from "@/lib/strategy-sim-utils";

// A live Gartley-style harmonic pattern simulator — a deliberately-shaped
// XABCD sequence at the textbook fib ratios (AB ≈ 61.8% of XA, D ≈ 78.6%
// of XA), since a plain random walk only rarely lines those ratios up on
// demand. Point D is the signal — the pattern's completion. Same crafted-
// pattern approach as the other chart-pattern pages.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 70;

export default function HarmonicSimulator() {
  const [seed, setSeed] = useState(1);

  const { values, xI, aI, bI, cI, dI, bullish } = useMemo(() => genHarmonicDemo(seed, N), [seed]);

  const { min, max } = useMemo(() => ({ min: Math.min(...values) - 1, max: Math.max(...values) + 1 }), [values]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  const points = [
    { i: xI, label: "X" },
    { i: aI, label: "A" },
    { i: bI, label: "B" },
    { i: cI, label: "C" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle the chart — X, A, B and C are always marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive harmonic pattern chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <path d={toPath(values, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          {points.map((p) => (
            <g key={p.label}>
              <circle cx={PAD + p.i * xStep} cy={yFor(values[p.i])} r={5} fill="var(--color-muted)" stroke="var(--color-background)" strokeWidth={2} />
              <text x={PAD + p.i * xStep} y={yFor(values[p.i]) - 10} fontSize={13} fontWeight={700} fill="var(--color-muted)" textAnchor="middle">
                {p.label}
              </text>
            </g>
          ))}
          <circle cx={PAD + dI * xStep} cy={yFor(values[dI])} r={6} fill={bullish ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
          <text x={PAD + dI * xStep} y={yFor(values[dI]) - 11} fontSize={13} fontWeight={700} fill={bullish ? "var(--color-success)" : "var(--color-danger)"} textAnchor="middle">
            D
          </text>
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-muted" /> X, A, B, C
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-full ${bullish ? "bg-success" : "bg-danger"}`} /> D — the completion (the signal)
          </span>
        </div>

        <p className="meta mt-4">
          This run is a {bullish ? "bullish" : "bearish"} Gartley — B retraces roughly 61.8% of X-A, and D
          completes near a 78.6% retracement of the same leg. Deliberately-shaped synthetic data,
          regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
