"use client";

import { useMemo, useState } from "react";
import { genSeries, findPivots, toPath, type Pivot } from "@/lib/strategy-sim-utils";

// A live support/resistance simulator — drag the "pivot strength" slider
// and the support/resistance lines (and the touches marked on them)
// recompute instantly from the same fabricated price series. Same
// synthetic-data convention as every other interactive strategy page: never
// real market data, always labelled as such.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 90;

function levelsFrom(pivots: Pivot[]) {
  const highs = pivots.filter((p) => p.high).map((p) => p.value);
  const lows = pivots.filter((p) => !p.high).map((p) => p.value);
  return {
    resistance: highs.length ? Math.max(...highs) : null,
    support: lows.length ? Math.min(...lows) : null,
  };
}

export default function SupportResistanceSimulator() {
  const [seed, setSeed] = useState(1);
  const [strength, setStrength] = useState(3);

  const closes = useMemo(() => genSeries(seed, N), [seed]);
  const pivots = useMemo(() => findPivots(closes, strength), [closes, strength]);
  const { resistance, support } = useMemo(() => levelsFrom(pivots), [pivots]);

  const { min, max } = useMemo(() => {
    const all = closes.concat([resistance, support].filter((v): v is number => v != null));
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, resistance, support]);

  const tolerance = (max - min) * 0.018;
  const touches = useMemo(() => {
    const out: { i: number; level: "support" | "resistance" }[] = [];
    closes.forEach((c, i) => {
      if (resistance != null && Math.abs(c - resistance) <= tolerance) out.push({ i, level: "resistance" });
      if (support != null && Math.abs(c - support) <= tolerance) out.push({ i, level: "support" });
    });
    return out;
  }, [closes, resistance, support, tolerance]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Drag the slider — the support/resistance lines redraw live.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive support and resistance chart">
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
          {resistance != null && (
            <line x1={PAD} x2={WIDTH - PAD} y1={yFor(resistance)} y2={yFor(resistance)} stroke="var(--color-danger)" strokeWidth={2} strokeDasharray="6 4" />
          )}
          {support != null && (
            <line x1={PAD} x2={WIDTH - PAD} y1={yFor(support)} y2={yFor(support)} stroke="var(--color-success)" strokeWidth={2} strokeDasharray="6 4" />
          )}
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          {touches.map((t) => (
            <circle
              key={t.i}
              cx={PAD + t.i * xStep}
              cy={yFor(closes[t.i])}
              r={5}
              fill={t.level === "resistance" ? "var(--color-danger)" : "var(--color-success)"}
              stroke="var(--color-background)"
              strokeWidth={2}
            />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-danger" /> Resistance touch
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Support touch
          </span>
        </div>

        <div className="mt-5">
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Pivot strength</span>
              <span className="figure text-accent">{strength}</span>
            </span>
            <input
              type="range"
              min={2}
              max={6}
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--color-gold-bright)]"
            />
          </label>
        </div>

        <p className="meta mt-4">
          {touches.length} touch{touches.length === 1 ? "" : "es"} on this run — a lower pivot strength
          finds more (and weaker) levels. Synthetic price data, regenerated each shuffle — not a real
          historical chart.
        </p>
      </div>
    </div>
  );
}
