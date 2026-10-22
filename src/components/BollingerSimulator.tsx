"use client";

import { useMemo, useState } from "react";
import { genSeries, bollinger, toPath } from "@/lib/strategy-sim-utils";

// A live Bollinger Bands simulator — drag the two sliders and the bands
// (and the touches marked on them) recompute instantly. Same
// synthetic-data convention as every other interactive strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 90;

export default function BollingerSimulator() {
  const [seed, setSeed] = useState(1);
  const [period, setPeriod] = useState(20);
  const [mult, setMult] = useState(2);

  const closes = useMemo(() => genSeries(seed, N), [seed]);
  const { mid, upper, lower } = useMemo(() => bollinger(closes, period, mult), [closes, period, mult]);

  const touches = useMemo(() => {
    const out: { i: number; band: "upper" | "lower" }[] = [];
    closes.forEach((c, i) => {
      if (upper[i] != null && c >= upper[i]!) out.push({ i, band: "upper" });
      else if (lower[i] != null && c <= lower[i]!) out.push({ i, band: "lower" });
    });
    return out;
  }, [closes, upper, lower]);

  const { min, max } = useMemo(() => {
    const all = closes.concat(
      upper.filter((v): v is number => v != null),
      lower.filter((v): v is number => v != null),
    );
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, upper, lower]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Drag the sliders — the bands redraw live.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive Bollinger Bands chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <path d={toPath(upper, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-danger)" strokeWidth={1.5} opacity={0.75} />
          <path d={toPath(lower, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-success)" strokeWidth={1.5} opacity={0.75} />
          <path d={toPath(mid, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-muted)" strokeWidth={1} opacity={0.5} strokeDasharray="4 3" />
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          {touches.map((t) => (
            <circle key={t.i} cx={PAD + t.i * xStep} cy={yFor(closes[t.i])} r={5} fill={t.band === "upper" ? "var(--color-danger)" : "var(--color-success)"} stroke="var(--color-background)" strokeWidth={2} />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-danger" /> Upper band touch
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Lower band touch
          </span>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Period</span>
              <span className="figure text-accent">{period}</span>
            </span>
            <input type="range" min={10} max={40} value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-gold-bright)]" />
          </label>
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Band width (std devs)</span>
              <span className="figure text-accent">{mult.toFixed(1)}</span>
            </span>
            <input type="range" min={1} max={3} step={0.1} value={mult} onChange={(e) => setMult(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-gold)]" />
          </label>
        </div>

        <p className="meta mt-4">
          {touches.length} band touch{touches.length === 1 ? "" : "es"} on this run — narrower bands
          (fewer std devs) get touched more often. Synthetic price data, regenerated each shuffle — not
          a real historical chart.
        </p>
      </div>
    </div>
  );
}
