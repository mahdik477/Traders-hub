"use client";

import { useMemo, useState } from "react";
import { genElliottWaveDemo, toPath } from "@/lib/strategy-sim-utils";

// A live Elliott Wave simulator — a deliberately-shaped five-wave impulse
// (three moves with the trend, two corrective moves against it, wave 3
// the longest leg) followed by a correction. Same crafted-pattern
// approach as the other chart-pattern pages, since a plain random walk
// only rarely produces a clean five-wave count on demand.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 70;

export default function ElliottWaveSimulator() {
  const [seed, setSeed] = useState(1);

  const { values, waveEnds, impulseEndI, up } = useMemo(() => genElliottWaveDemo(seed, N), [seed]);

  const { min, max } = useMemo(() => ({ min: Math.min(...values) - 1, max: Math.max(...values) + 1 }), [values]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle the chart — all five waves and the end of the impulse are always marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive Elliott Wave chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <path d={toPath(values, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          {[0, ...waveEnds].map((wi, idx) => (
            <circle key={idx} cx={PAD + wi * xStep} cy={yFor(values[wi])} r={4} fill="var(--color-muted)" stroke="var(--color-background)" strokeWidth={1.5} />
          ))}
          <circle cx={PAD + impulseEndI * xStep} cy={yFor(values[impulseEndI])} r={6} fill={up ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-muted" /> Waves 1–4
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-full ${up ? "bg-success" : "bg-danger"}`} /> End of wave 5 (impulse complete)
          </span>
        </div>

        <p className="meta mt-4">
          This run is a {up ? "bullish" : "bearish"} five-wave impulse, with wave 3 the longest leg —
          the correction only starts once wave 5 is actually done. Deliberately-shaped synthetic data,
          regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
