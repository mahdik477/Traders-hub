"use client";

import { useMemo, useState } from "react";
import { genSeries, ema, toPath } from "@/lib/strategy-sim-utils";

// Dow Theory isn't a single chart pattern with one signal to click — it's
// a framework about trends nesting inside bigger trends. So instead of a
// click-the-signal simulator, this lets you toggle each of the three
// trends on and off over the same price, to actually see the primary
// trend contain the secondary, which contains the minor day-to-day noise.
// Same synthetic-data convention as every other interactive strategy
// page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 120;

export default function DowTheorySimulator() {
  const [seed, setSeed] = useState(1);
  const [showPrimary, setShowPrimary] = useState(true);
  const [showSecondary, setShowSecondary] = useState(true);
  const [showMinor, setShowMinor] = useState(true);

  const closes = useMemo(() => genSeries(seed, N, { driftAmplitude: 0.6 }), [seed]);
  const primary = useMemo(() => ema(closes, 50), [closes]);
  const secondary = useMemo(() => ema(closes, 15), [closes]);

  const { min, max } = useMemo(() => {
    const vals = primary.concat(secondary).filter((v): v is number => v != null);
    const all = closes.concat(vals);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, primary, secondary]);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Toggle each trend on and off to see how it actually nests inside the others.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive Dow Theory trend-nesting chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          {showMinor && <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-muted)" strokeWidth={1.5} opacity={0.6} />}
          {showSecondary && <path d={toPath(secondary, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold)" strokeWidth={2.5} />}
          {showPrimary && <path d={toPath(primary, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={3} />}
        </svg>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border-strong px-3 text-sm font-medium text-foreground">
            <input type="checkbox" checked={showPrimary} onChange={(e) => setShowPrimary(e.target.checked)} className="size-4 accent-[var(--color-gold-bright)]" />
            Primary trend
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border-strong px-3 text-sm font-medium text-foreground">
            <input type="checkbox" checked={showSecondary} onChange={(e) => setShowSecondary(e.target.checked)} className="size-4 accent-[var(--color-gold)]" />
            Secondary trend
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border-strong px-3 text-sm font-medium text-foreground">
            <input type="checkbox" checked={showMinor} onChange={(e) => setShowMinor(e.target.checked)} className="size-4 accent-[var(--color-muted)]" />
            Minor swings
          </label>
        </div>

        <p className="meta mt-4">
          The primary trend is the slow line; the secondary trend is the corrective moves inside it;
          the minor swings are the day-to-day noise inside those. Synthetic price data, regenerated
          each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
