"use client";

import { useMemo, useState } from "react";
import { genOHLC, genVolume, vwap, findPivots, toPath } from "@/lib/strategy-sim-utils";

// A live anchored VWAP simulator — the same VWAP math as the plain VWAP
// page, but reset to start from a specific swing point instead of the
// start of the window, which is the whole idea of anchoring it. Same
// synthetic-data convention as every other interactive strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 90;

export default function AnchoredVwapSimulator() {
  const [seed, setSeed] = useState(1);

  const bars = useMemo(() => genOHLC(seed, N), [seed]);
  const closes = useMemo(() => bars.map((b) => b.c), [bars]);
  const volumes = useMemo(() => genVolume(seed, bars), [seed, bars]);
  const pivots = useMemo(() => findPivots(closes, 4), [closes]);
  const anchorI = useMemo(() => {
    const lows = pivots.filter((p) => !p.high);
    return lows.length ? lows[0].i : 10;
  }, [pivots]);

  const anchoredVwap = useMemo(() => {
    const barsFromAnchor = bars.slice(anchorI);
    const volsFromAnchor = volumes.slice(anchorI);
    const vw = vwap(barsFromAnchor, volsFromAnchor);
    return bars.map((_, i) => (i < anchorI ? null : vw[i - anchorI]));
  }, [bars, volumes, anchorI]);

  const tolerance = useMemo(() => (Math.max(...closes) - Math.min(...closes)) * 0.025, [closes]);
  const touches = useMemo(() => {
    const out: number[] = [];
    closes.forEach((c, i) => {
      const v = anchoredVwap[i];
      if (v != null && i > anchorI + 3 && Math.abs(c - v) <= tolerance) out.push(i);
    });
    return out;
  }, [closes, anchoredVwap, anchorI, tolerance]);

  const { min, max } = useMemo(() => {
    const vwapVals = anchoredVwap.filter((v): v is number => v != null);
    const all = closes.concat(vwapVals);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, anchoredVwap]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle — VWAP re-anchors from the swing low each time, and every touch is marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive anchored VWAP chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <path d={toPath(anchoredVwap, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold)" strokeWidth={2} strokeDasharray="6 4" />
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <circle cx={PAD + anchorI * xStep} cy={yFor(closes[anchorI])} r={5} fill="var(--color-muted)" stroke="var(--color-background)" strokeWidth={2} />
          {touches.map((i) => (
            <circle key={i} cx={PAD + i * xStep} cy={yFor(closes[i])} r={5} fill="var(--color-success)" stroke="var(--color-background)" strokeWidth={2} />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> Anchored VWAP
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-muted" /> The anchor point
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Reversion touch
          </span>
        </div>

        <p className="meta mt-4">
          {touches.length} touch{touches.length === 1 ? "" : "es"} since the anchor. Fabricated price and
          volume, regenerated each shuffle — not real market data.
        </p>
      </div>
    </div>
  );
}
