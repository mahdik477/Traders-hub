"use client";

import { useMemo, useState } from "react";
import { genSeries, findBiggestSwing, fibPrice, FIB_LEVELS, toPath } from "@/lib/strategy-sim-utils";

// A live fib retracement simulator — drag the slider and the swing (and
// the fib levels drawn from it, and the touches marked on them) recompute
// instantly. Same synthetic-data convention as every other interactive
// strategy page.

const WIDTH = 760;
const HEIGHT = 340;
const PAD = 28;
const N = 90;

export default function FibonacciSimulator() {
  const [seed, setSeed] = useState(1);
  const [strength, setStrength] = useState(4);

  const closes = useMemo(() => genSeries(seed, N, { driftAmplitude: 0.5 }), [seed]);
  const swing = useMemo(() => findBiggestSwing(closes, strength), [closes, strength]);
  const levels = useMemo(() => (swing ? FIB_LEVELS.map((l) => ({ level: l, price: fibPrice(swing, l) })) : []), [swing]);

  const afterSwingI = swing ? Math.max(swing.startI, swing.endI) : 0;
  const tolerance = useMemo(() => {
    if (!swing) return 0;
    return Math.abs(swing.endV - swing.startV) * 0.04;
  }, [swing]);
  const touches = useMemo(() => {
    if (!swing) return [];
    const out: { i: number; level: number }[] = [];
    for (let i = afterSwingI + 1; i < closes.length; i++) {
      for (const { level, price } of levels) {
        if (Math.abs(closes[i] - price) <= tolerance) {
          out.push({ i, level });
          break;
        }
      }
    }
    return out;
  }, [closes, levels, swing, afterSwingI, tolerance]);

  const { min, max } = useMemo(() => {
    const all = closes.concat(levels.map((l) => l.price));
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, levels]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Drag the slider — the fib levels redraw live from the biggest swing.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive fibonacci retracement chart">
          {levels.map(({ level, price }) => (
            <g key={level}>
              <line x1={PAD + afterSwingI * xStep} x2={WIDTH - PAD} y1={yFor(price)} y2={yFor(price)} stroke="var(--color-gold)" strokeWidth={1} opacity={0.6} strokeDasharray="4 3" />
              <text x={WIDTH - PAD + 3} y={yFor(price) + 3} fontSize={10} fill="var(--color-muted)">
                {(level * 100).toFixed(1)}%
              </text>
            </g>
          ))}
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          {swing && (
            <>
              <circle cx={PAD + swing.startI * xStep} cy={yFor(swing.startV)} r={5} fill="var(--color-muted)" stroke="var(--color-background)" strokeWidth={2} />
              <circle cx={PAD + swing.endI * xStep} cy={yFor(swing.endV)} r={5} fill="var(--color-muted)" stroke="var(--color-background)" strokeWidth={2} />
            </>
          )}
          {touches.map((t) => (
            <circle key={t.i} cx={PAD + t.i * xStep} cy={yFor(closes[t.i])} r={5} fill="var(--color-success)" stroke="var(--color-background)" strokeWidth={2} />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> Fib levels (from the biggest swing)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Retracement touch
          </span>
        </div>

        <div className="mt-5">
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Pivot strength</span>
              <span className="figure text-accent">{strength}</span>
            </span>
            <input type="range" min={2} max={7} value={strength} onChange={(e) => setStrength(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-gold-bright)]" />
          </label>
        </div>

        <p className="meta mt-4">
          {touches.length} retracement touch{touches.length === 1 ? "" : "es"} found after the swing —
          a lower pivot strength finds smaller, more frequent swings to measure from. Synthetic price
          data, regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
