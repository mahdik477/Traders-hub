"use client";

import { useMemo, useState } from "react";
import { genGapDemo } from "@/lib/strategy-sim-utils";

// A live gap simulator — shuffle the chart and it alternates between a
// gap that fills back to the pre-gap level and one that just keeps
// running (gap-and-go). The actual space between the two candles is drawn
// as a real gap, not just a big candle. Same synthetic-data convention as
// every other interactive strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 50;

export default function GapFillSimulator() {
  const [seed, setSeed] = useState(1);
  const fills = seed % 2 === 0;

  const { bars, gapI, up, filled, fillI } = useMemo(() => genGapDemo(seed, N, fills), [seed, fills]);

  const { min, max } = useMemo(() => {
    const highs = bars.map((b) => b.h);
    const lows = bars.map((b) => b.l);
    return { min: Math.min(...lows) - 0.5, max: Math.max(...highs) + 0.5 };
  }, [bars]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const candleWidth = xStep * 0.55;
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);
  const preGapClose = bars[gapI - 1].c;

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle — alternates between a gap that fills and one that just keeps going.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive price gap chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <line x1={PAD} x2={WIDTH - PAD} y1={yFor(preGapClose)} y2={yFor(preGapClose)} stroke="var(--color-gold)" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
          {bars.map((b, i) => {
            const x = PAD + i * xStep;
            const bullish = b.c > b.o;
            const bodyTop = yFor(Math.max(b.o, b.c));
            const bodyBottom = yFor(Math.min(b.o, b.c));
            const isGapCandle = i === gapI;
            const isFillCandle = filled && i === fillI;
            const color = bullish ? "var(--color-success)" : "var(--color-danger)";
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={yFor(b.h)} y2={yFor(b.l)} stroke={color} strokeWidth={1.5} />
                <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={Math.max(bodyBottom - bodyTop, 1.5)} fill={color} opacity={isGapCandle || isFillCandle ? 1 : 0.7} stroke={isGapCandle ? "var(--color-gold-bright)" : isFillCandle ? "var(--color-gold)" : "none"} strokeWidth={isGapCandle || isFillCandle ? 2.5 : 0} rx={1} />
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 border-t border-dashed border-gold" /> Pre-gap close
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm border-2 border-gold-bright" /> The gap candle
          </span>
          {filled && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm border-2 border-gold" /> Where it fills back
            </span>
          )}
        </div>

        <p className="meta mt-4">
          This run gaps {up ? "up" : "down"} at bar {gapI + 1} and {filled ? "fills back to the pre-gap level" : "keeps running without filling"} —
          that distinction is the whole difference between &quot;gap fill&quot; and &quot;gap-and-go&quot;. Deliberately-shaped
          synthetic candles, regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
