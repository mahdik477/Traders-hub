"use client";

import { useMemo, useState } from "react";
import { genSeries, ema, toPath } from "@/lib/strategy-sim-utils";

// A live MA pullback simulator — drag the slider and the EMA (and every
// bar that pulls back and touches it) redraws instantly. Same
// synthetic-data convention as every other interactive strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 90;

export default function MaPullbackSimulator() {
  const [seed, setSeed] = useState(1);
  const [period, setPeriod] = useState(20);

  const closes = useMemo(() => genSeries(seed, N, { driftAmplitude: 0.5 }), [seed]);
  const maLine = useMemo(() => ema(closes, period), [closes, period]);

  const tolerance = useMemo(() => (Math.max(...closes) - Math.min(...closes)) * 0.015, [closes]);
  const touches = useMemo(() => {
    const out: number[] = [];
    closes.forEach((c, i) => {
      const m = maLine[i];
      if (m != null && i > period + 2 && Math.abs(c - m) <= tolerance) out.push(i);
    });
    return out;
  }, [closes, maLine, tolerance, period]);

  const { min, max } = useMemo(() => {
    const maVals = maLine.filter((v): v is number => v != null);
    const all = closes.concat(maVals);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, maLine]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Drag the slider — the EMA redraws live, and every pullback touch is marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive moving average pullback chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <path d={toPath(maLine, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold)" strokeWidth={2} />
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          {touches.map((i) => (
            <circle key={i} cx={PAD + i * xStep} cy={yFor(closes[i])} r={5} fill="var(--color-success)" stroke="var(--color-background)" strokeWidth={2} />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> EMA({period})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Pullback touch
          </span>
        </div>

        <div className="mt-5">
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">EMA period</span>
              <span className="figure text-accent">{period}</span>
            </span>
            <input type="range" min={10} max={40} value={period} onChange={(e) => setPeriod(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-gold-bright)]" />
          </label>
        </div>

        <p className="meta mt-4">
          {touches.length} pullback touch{touches.length === 1 ? "" : "es"} on this run. Synthetic price
          data, regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
