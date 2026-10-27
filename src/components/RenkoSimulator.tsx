"use client";

import { useMemo, useState } from "react";
import { genSeries, toRenko } from "@/lib/strategy-sim-utils";

// A live Renko simulator — drag the brick-size slider and the chart
// redraws as bricks, filtering out time and noise the way Renko actually
// works: no new brick until price moves a full brick size, and a
// reversal needs two bricks the other way. Same synthetic-data
// convention as every other interactive strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 90;

export default function RenkoSimulator() {
  const [seed, setSeed] = useState(1);
  const [brickSize, setBrickSize] = useState(1.2);

  const closes = useMemo(() => genSeries(seed, N), [seed]);
  const bricks = useMemo(() => toRenko(closes, brickSize), [closes, brickSize]);
  const reversals = useMemo(() => {
    const out: number[] = [];
    for (let i = 1; i < bricks.length; i++) if (bricks[i].up !== bricks[i - 1].up) out.push(i);
    return out;
  }, [bricks]);

  const { min, max } = useMemo(() => {
    const vals = bricks.map((b) => b.close);
    return { min: Math.min(...vals, closes[0]) - brickSize, max: Math.max(...vals, closes[0]) + brickSize };
  }, [bricks, closes, brickSize]);

  const brickW = bricks.length ? (WIDTH - PAD * 2) / bricks.length : 1;
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Drag the slider — the bricks redraw live, and every reversal brick is marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive Renko chart">
          {bricks.map((b, i) => {
            const x = PAD + i * brickW;
            const bottom = b.up ? b.close - brickSize : b.close;
            const top = b.up ? b.close : b.close + brickSize;
            const isReversal = reversals.includes(i);
            return (
              <rect
                key={i}
                x={x + brickW * 0.08}
                y={yFor(top)}
                width={brickW * 0.84}
                height={Math.max(yFor(bottom) - yFor(top), 1)}
                fill={b.up ? "var(--color-success)" : "var(--color-danger)"}
                opacity={isReversal ? 1 : 0.75}
                stroke={isReversal ? "var(--color-gold-bright)" : "none"}
                strokeWidth={isReversal ? 2.5 : 0}
              />
            );
          })}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-success" /> Up brick
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-danger" /> Down brick
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm border-2 border-gold-bright" /> Reversal brick
          </span>
        </div>

        <div className="mt-5">
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Brick size</span>
              <span className="figure text-accent">{brickSize.toFixed(1)}</span>
            </span>
            <input type="range" min={0.6} max={2} step={0.2} value={brickSize} onChange={(e) => setBrickSize(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-gold-bright)]" />
          </label>
        </div>

        <p className="meta mt-4">
          {bricks.length} bricks, {reversals.length} reversal{reversals.length === 1 ? "" : "s"} —
          a smaller brick size shows more detail (and more reversals). Synthetic price data, regenerated
          each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
