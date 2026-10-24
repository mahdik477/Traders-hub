"use client";

import { useMemo, useState } from "react";
import { genOHLC, supertrend, toPath } from "@/lib/strategy-sim-utils";

// A live Supertrend simulator — drag the two sliders and the trailing
// line (and the flip it marks) recomputes instantly. Same synthetic-data
// convention as every other interactive strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 90;

export default function SupertrendSimulator() {
  const [seed, setSeed] = useState(1);
  const [period, setPeriod] = useState(10);
  const [mult, setMult] = useState(3);

  const bars = useMemo(() => genOHLC(seed, N), [seed]);
  const closes = useMemo(() => bars.map((b) => b.c), [bars]);
  const line = useMemo(() => supertrend(bars, period, mult), [bars, period, mult]);
  const lineValues = useMemo(() => line.map((p) => p.value), [line]);
  const flips = useMemo(() => {
    const out: number[] = [];
    for (let i = 1; i < line.length; i++) if (line[i].up !== line[i - 1].up) out.push(i);
    return out;
  }, [line]);

  const { min, max } = useMemo(() => {
    const all = closes.concat(lineValues);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, lineValues]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Drag the sliders — the Supertrend line redraws live, and flips colour when it flips sides.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive Supertrend chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2} opacity={0.6} />
          {line.map((p, i) => {
            if (i === 0) return null;
            const prev = line[i - 1];
            return (
              <line
                key={i}
                x1={PAD + (i - 1) * xStep}
                x2={PAD + i * xStep}
                y1={yFor(prev.value)}
                y2={yFor(p.value)}
                stroke={p.up ? "var(--color-success)" : "var(--color-danger)"}
                strokeWidth={2.5}
              />
            );
          })}
          {flips.map((i) => (
            <circle key={i} cx={PAD + i * xStep} cy={yFor(lineValues[i])} r={5} fill={line[i].up ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-success" /> Supertrend (uptrend)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-danger" /> Supertrend (downtrend)
          </span>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">ATR period</span>
              <span className="figure text-accent">{period}</span>
            </span>
            <input type="range" min={5} max={20} value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-gold-bright)]" />
          </label>
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Multiplier</span>
              <span className="figure text-accent">{mult.toFixed(1)}</span>
            </span>
            <input type="range" min={1} max={5} step={0.5} value={mult} onChange={(e) => setMult(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-gold)]" />
          </label>
        </div>

        <p className="meta mt-4">
          {flips.length} flip{flips.length === 1 ? "" : "s"} on this run — a smaller multiplier flips
          more often. Synthetic price data, regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
