"use client";

import { useMemo, useState } from "react";

// A live, in-browser moving-average crossover simulator — built only for
// this one strategy page, not a shared component, since it's tied directly
// to what this specific strategy is. Drag the two sliders and the fast/slow
// averages redraw and the crossover markers recompute instantly. The price
// series is fabricated (same synthetic-data convention as the static chart
// images elsewhere on strategy pages) and reshuffles on demand — never real
// market data, always labelled as such.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 90;

function seededRandom(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function genSeries(seed: number): number[] {
  const rand = seededRandom(seed);
  const closes = [100];
  for (let i = 1; i < N; i++) {
    const drift = Math.sin(i / 14) * 0.35; // gentle wave so crossovers actually happen
    closes.push(closes[i - 1] + drift + (rand() - 0.5) * 1.6);
  }
  return closes;
}

function sma(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    return sum / period;
  });
}

function toPath(values: (number | null)[], min: number, max: number): string {
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);
  let d = "";
  let drawing = false;
  values.forEach((v, i) => {
    if (v == null) return;
    const x = PAD + i * xStep;
    const y = yFor(v);
    d += drawing ? ` L ${x} ${y}` : `M ${x} ${y}`;
    drawing = true;
  });
  return d;
}

export default function MovingAverageSimulator() {
  const [seed, setSeed] = useState(1);
  const [fast, setFast] = useState(9);
  const [slow, setSlow] = useState(26);

  const closes = useMemo(() => genSeries(seed), [seed]);
  const fastLine = useMemo(() => sma(closes, fast), [closes, fast]);
  const slowLine = useMemo(() => sma(closes, slow), [closes, slow]);

  const { min, max } = useMemo(() => {
    const all = closes.concat(
      fastLine.filter((v): v is number => v != null),
      slowLine.filter((v): v is number => v != null),
    );
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, fastLine, slowLine]);

  const crossings = useMemo(() => {
    const points: { i: number; golden: boolean }[] = [];
    for (let i = 1; i < N; i++) {
      const f0 = fastLine[i - 1];
      const f1 = fastLine[i];
      const s0 = slowLine[i - 1];
      const s1 = slowLine[i];
      if (f0 == null || f1 == null || s0 == null || s1 == null) continue;
      const wasBelow = f0 <= s0;
      const isAbove = f1 > s1;
      const wasAbove = f0 >= s0;
      const isBelow = f1 < s1;
      if (wasBelow && isAbove) points.push({ i, golden: true });
      else if (wasAbove && isBelow) points.push({ i, golden: false });
    }
    return points;
  }, [fastLine, slowLine]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Drag the sliders — the crossovers recompute live.</p>
        </div>
        <button
          type="button"
          onClick={() => setSeed((n) => n + 1)}
          className="btn btn-outline"
        >
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive moving average crossover chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={PAD}
              x2={WIDTH - PAD}
              y1={PAD + f * (HEIGHT - PAD * 2)}
              y2={PAD + f * (HEIGHT - PAD * 2)}
              stroke="var(--color-border)"
              strokeWidth={1}
            />
          ))}
          <path d={toPath(closes, min, max)} fill="none" stroke="var(--color-muted)" strokeWidth={1.5} opacity={0.55} />
          <path d={toPath(slowLine, min, max)} fill="none" stroke="var(--color-gold)" strokeWidth={2.5} />
          <path d={toPath(fastLine, min, max)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          {crossings.map((c) => {
            const v = fastLine[c.i];
            if (v == null) return null;
            return (
              <g key={c.i}>
                <circle
                  cx={PAD + c.i * xStep}
                  cy={yFor(v)}
                  r={6}
                  fill={c.golden ? "var(--color-success)" : "var(--color-danger)"}
                  stroke="var(--color-background)"
                  strokeWidth={2}
                />
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Fast MA
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> Slow MA
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Golden cross (buy signal)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-danger" /> Death cross (sell signal)
          </span>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Fast MA period</span>
              <span className="figure text-accent">{fast}</span>
            </span>
            <input
              type="range"
              min={2}
              max={20}
              value={fast}
              onChange={(e) => setFast(Math.min(Number(e.target.value), slow - 1))}
              className="mt-2 w-full accent-[var(--color-gold-bright)]"
            />
          </label>
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Slow MA period</span>
              <span className="figure text-accent">{slow}</span>
            </span>
            <input
              type="range"
              min={10}
              max={60}
              value={slow}
              onChange={(e) => setSlow(Math.max(Number(e.target.value), fast + 1))}
              className="mt-2 w-full accent-[var(--color-gold)]"
            />
          </label>
        </div>

        <p className="meta mt-4">
          {crossings.length} crossover{crossings.length === 1 ? "" : "s"} on this run — a
          shorter fast period or a wider gap between the two periods produces more signals, and
          more false ones with it. Synthetic price data, regenerated each shuffle — not a real
          historical chart.
        </p>
      </div>
    </div>
  );
}
