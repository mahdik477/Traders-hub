"use client";

import { useMemo, useState } from "react";
import { genSeries, findBreakout, toPath } from "@/lib/strategy-sim-utils";

// A live range-breakout simulator — drag the lookback slider and the
// consolidation range box (and the breakout marker) recompute instantly.
// Same synthetic-data convention as every other interactive strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 90;

export default function BreakoutSimulator() {
  const [seed, setSeed] = useState(1);
  const [lookback, setLookback] = useState(15);

  const closes = useMemo(() => genSeries(seed, N, { driftAmplitude: 0.5 }), [seed]);
  const breakout = useMemo(() => findBreakout(closes, lookback), [closes, lookback]);

  const { min, max } = useMemo(() => {
    const all = closes.concat(breakout ? [breakout.hi, breakout.lo] : []);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, breakout]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Drag the slider — the consolidation range redraws live.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive range breakout chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          {breakout && (
            <>
              <rect
                x={PAD + (breakout.i - lookback) * xStep}
                y={yFor(breakout.hi)}
                width={lookback * xStep}
                height={Math.max(yFor(breakout.lo) - yFor(breakout.hi), 1)}
                fill="var(--color-gold)"
                opacity={0.1}
                stroke="var(--color-gold)"
                strokeWidth={1.5}
                strokeDasharray="5 3"
              />
            </>
          )}
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          {breakout && (
            <circle cx={PAD + breakout.i * xStep} cy={yFor(closes[breakout.i])} r={6} fill={breakout.up ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
          )}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-3 rounded border border-dashed border-gold" /> Consolidation range
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Breakout up
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-danger" /> Breakout down
          </span>
        </div>

        <div className="mt-5">
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Range lookback (bars)</span>
              <span className="figure text-accent">{lookback}</span>
            </span>
            <input type="range" min={8} max={30} value={lookback} onChange={(e) => setLookback(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-gold-bright)]" />
          </label>
        </div>

        <p className="meta mt-4">
          {breakout ? `Breakout found at bar ${breakout.i}.` : "No clean breakout on this run — try shuffling."} A shorter
          lookback finds tighter, more frequent ranges. Synthetic price data, regenerated each shuffle —
          not a real historical chart.
        </p>
      </div>
    </div>
  );
}
