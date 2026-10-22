"use client";

import { useMemo, useState } from "react";
import { genCandleReversalDemo } from "@/lib/strategy-sim-utils";

// A live candlestick simulator. This pattern only reads clearly if there's
// exactly one obvious example on the chart, so — unlike the other free
// strategies — this doesn't scan a random walk for whatever patterns
// happen to show up; it generates one deliberate, obvious engulfing or
// pin bar/hammer every time, in an otherwise plain run of candles. Still
// entirely synthetic, still labelled as such.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 50;

export default function CandlestickSimulator() {
  const [seed, setSeed] = useState(2);

  const { bars, patternI, kind, bullish } = useMemo(() => genCandleReversalDemo(seed, N), [seed]);

  const { min, max } = useMemo(() => {
    const highs = bars.map((b) => b.h);
    const lows = bars.map((b) => b.l);
    return { min: Math.min(...lows) - 0.5, max: Math.max(...highs) + 0.5 };
  }, [bars]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const candleWidth = xStep * 0.55;
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);
  const patternName = kind === "engulfing" ? (bullish ? "bullish engulfing" : "bearish engulfing") : bullish ? "hammer" : "pin bar";

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle the chart — the reversal candle is always outlined in gold.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive candlestick chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          {bars.map((b, i) => {
            const x = PAD + i * xStep;
            const up = b.c > b.o;
            const bodyTop = yFor(Math.max(b.o, b.c));
            const bodyBottom = yFor(Math.min(b.o, b.c));
            const isPattern = i === patternI;
            const color = up ? "var(--color-success)" : "var(--color-danger)";
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={yFor(b.h)} y2={yFor(b.l)} stroke={color} strokeWidth={1.5} />
                <rect
                  x={x - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={Math.max(bodyBottom - bodyTop, 1.5)}
                  fill={color}
                  opacity={isPattern ? 1 : 0.7}
                  stroke={isPattern ? "var(--color-gold-bright)" : "none"}
                  strokeWidth={isPattern ? 2.5 : 0}
                  rx={1}
                />
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-success" /> Bullish candle
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-danger" /> Bearish candle
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm border-2 border-gold-bright" /> Reversal pattern
          </span>
        </div>

        <p className="meta mt-4">
          This run&apos;s pattern is a {patternName} at bar {patternI + 1}. Deliberately-shaped
          synthetic candles, regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
