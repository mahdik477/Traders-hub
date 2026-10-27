"use client";

import { useMemo, useState } from "react";
import { genIntermarketDemo } from "@/lib/strategy-sim-utils";

// A live intermarket analysis simulator — two markets that normally
// move together, until one of them fails to confirm the other's more
// extreme second move. That gap — not just "they both moved" — is the
// actual signal, and it's always marked. Same synthetic-data convention
// as every other interactive strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 70;

function pathFor(values: number[], yFn: (v: number) => number, xStep: number) {
  let d = "";
  values.forEach((v, i) => {
    const x = PAD + i * xStep;
    const y = yFn(v);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });
  return d;
}

export default function IntermarketSimulator() {
  const [seed, setSeed] = useState(1);
  const bullish = seed % 2 === 0;

  const { market1, market2, divergeI } = useMemo(() => genIntermarketDemo(seed, N, bullish), [seed, bullish]);

  const { min, max } = useMemo(() => {
    const all = market1.concat(market2);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [market1, market2]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle — the point where the second market fails to confirm is always marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive intermarket analysis chart">
          <path d={pathFor(market1, yFor, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <path d={pathFor(market2, yFor, xStep)} fill="none" stroke="var(--color-accent)" strokeWidth={2.5} />
          <circle cx={PAD + divergeI * xStep} cy={yFor(market2[divergeI])} r={6} fill={bullish ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Market 1 (leader)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-accent" /> Market 2 (should confirm)
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-full ${bullish ? "bg-success" : "bg-danger"}`} /> Fails to confirm
          </span>
        </div>

        <p className="meta mt-4">
          Market 1 makes a more extreme move the second time; market 2 doesn&apos;t keep up — that
          disagreement between two normally-correlated markets is the signal. Deliberately-shaped
          synthetic data, regenerated each shuffle — not real market data.
        </p>
      </div>
    </div>
  );
}
