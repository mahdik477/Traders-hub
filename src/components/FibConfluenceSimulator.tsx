"use client";

import { useMemo, useState } from "react";
import { genConfluenceDemo, FIB_LEVELS, fibPrice, toPath } from "@/lib/strategy-sim-utils";

// A live fib confluence simulator — two separate swings, each with its
// own fib levels, deliberately built so one level from each swing lands
// at nearly the same price. That overlap — the confluence zone — is a
// stronger level than either swing's fib levels on their own, and price
// coming back to actually test it is always marked.

const WIDTH = 760;
const HEIGHT = 340;
const PAD = 28;
const N = 80;

export default function FibConfluenceSimulator() {
  const [seed, setSeed] = useState(1);

  const { values, swing1, swing2, confluencePrice, touchI } = useMemo(() => genConfluenceDemo(seed, N), [seed]);
  const levels1 = useMemo(() => FIB_LEVELS.map((l) => fibPrice(swing1, l)), [swing1]);
  const levels2 = useMemo(() => FIB_LEVELS.map((l) => fibPrice(swing2, l)), [swing2]);

  const { min, max } = useMemo(() => {
    const all = values.concat(levels1, levels2);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [values, levels1, levels2]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle — both swings&apos; fib levels and the confluence touch are always marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive fibonacci confluence chart">
          {levels1.map((p, i) => (
            <line key={`a${i}`} x1={PAD + swing1.endI * xStep} x2={WIDTH - PAD} y1={yFor(p)} y2={yFor(p)} stroke="var(--color-gold)" strokeWidth={1} opacity={0.4} strokeDasharray="4 3" />
          ))}
          {levels2.map((p, i) => (
            <line key={`b${i}`} x1={PAD + swing2.endI * xStep} x2={WIDTH - PAD} y1={yFor(p)} y2={yFor(p)} stroke="var(--color-accent)" strokeWidth={1} opacity={0.4} strokeDasharray="4 3" />
          ))}
          <line x1={PAD} x2={WIDTH - PAD} y1={yFor(confluencePrice)} y2={yFor(confluencePrice)} stroke="var(--color-gold-bright)" strokeWidth={2} />
          <path d={toPath(values, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <circle cx={PAD + touchI * xStep} cy={yFor(values[touchI])} r={6} fill="var(--color-success)" stroke="var(--color-background)" strokeWidth={2} />
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 border-t border-dashed border-gold" /> Swing 1 levels
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 border-t border-dashed border-accent" /> Swing 2 levels
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> The confluence zone
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Confluence touch
          </span>
        </div>

        <p className="meta mt-4">
          A level from each swing lines up here, which is the whole idea of confluence — more than one
          independent reason for the same price to matter. Deliberately-shaped synthetic data,
          regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
