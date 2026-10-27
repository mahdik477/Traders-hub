"use client";

import { useMemo, useState } from "react";
import { genFvgDemo } from "@/lib/strategy-sim-utils";

// A live Fair Value Gap simulator — shuffle the chart and the three-candle
// imbalance (where the first candle's wick and the third candle's wick
// never overlap, leaving a gap in the middle candle's range price never
// actually traded) is always marked. Same synthetic-data convention as
// every other interactive strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 50;

export default function FvgSimulator() {
  const [seed, setSeed] = useState(1);

  const { bars, gapI, up, gapTop, gapBottom } = useMemo(() => genFvgDemo(seed, N), [seed]);

  const { min, max } = useMemo(() => {
    const highs = bars.map((b) => b.h);
    const lows = bars.map((b) => b.l);
    return { min: Math.min(...lows) - 0.5, max: Math.max(...highs) + 0.5 };
  }, [bars]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const candleWidth = xStep * 0.55;
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle the chart — the fair value gap is always boxed in gold.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive fair value gap chart">
          <rect x={PAD + (gapI - 1.5) * xStep} y={yFor(gapTop)} width={xStep * 3} height={Math.max(yFor(gapBottom) - yFor(gapTop), 1)} fill="var(--color-gold)" opacity={0.15} stroke="var(--color-gold-bright)" strokeWidth={1.5} strokeDasharray="5 3" />
          {bars.map((b, i) => {
            const x = PAD + i * xStep;
            const bullish = b.c > b.o;
            const bodyTop = yFor(Math.max(b.o, b.c));
            const bodyBottom = yFor(Math.min(b.o, b.c));
            const isGapBar = i >= gapI - 1 && i <= gapI + 1;
            const color = bullish ? "var(--color-success)" : "var(--color-danger)";
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={yFor(b.h)} y2={yFor(b.l)} stroke={color} strokeWidth={1.5} />
                <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={Math.max(bodyBottom - bodyTop, 1.5)} fill={color} opacity={isGapBar ? 1 : 0.7} rx={1} />
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm border-2 border-gold-bright bg-gold/20" /> The fair value gap
          </span>
        </div>

        <p className="meta mt-4">
          This run is a {up ? "bullish" : "bearish"} gap — three decisive candles in a row leave a zone
          in the middle one&apos;s range that price never actually traded through. Deliberately-shaped
          synthetic candles, regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
