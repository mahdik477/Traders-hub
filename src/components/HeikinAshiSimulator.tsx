"use client";

import { useMemo, useState } from "react";
import { genHeikinAshiTrendDemo, heikinAshi } from "@/lib/strategy-sim-utils";

// A live Heikin-Ashi simulator — shuffle the chart and watch the smoothed
// HA candles run in one clean colour through the trend, then flip at the
// reversal, which is always marked. Same synthetic-data convention as
// every other interactive strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 50;

export default function HeikinAshiSimulator() {
  const [seed, setSeed] = useState(1);

  const { bars, flipI, up } = useMemo(() => genHeikinAshiTrendDemo(seed, N), [seed]);
  const ha = useMemo(() => heikinAshi(bars), [bars]);

  const { min, max } = useMemo(() => {
    const highs = ha.map((b) => b.h);
    const lows = ha.map((b) => b.l);
    return { min: Math.min(...lows) - 0.5, max: Math.max(...highs) + 0.5 };
  }, [ha]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const candleWidth = xStep * 0.55;
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle the chart — the trend-flip candle is always outlined in gold.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive Heikin-Ashi chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          {ha.map((b, i) => {
            const x = PAD + i * xStep;
            const bullish = b.c > b.o;
            const bodyTop = yFor(Math.max(b.o, b.c));
            const bodyBottom = yFor(Math.min(b.o, b.c));
            const isFlip = i === flipI;
            const color = bullish ? "var(--color-success)" : "var(--color-danger)";
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={yFor(b.h)} y2={yFor(b.l)} stroke={color} strokeWidth={1.5} />
                <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={Math.max(bodyBottom - bodyTop, 1.5)} fill={color} opacity={isFlip ? 1 : 0.75} stroke={isFlip ? "var(--color-gold-bright)" : "none"} strokeWidth={isFlip ? 2.5 : 0} rx={1} />
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-success" /> Trend candle (up)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-danger" /> Trend candle (down)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm border-2 border-gold-bright" /> The flip
          </span>
        </div>

        <p className="meta mt-4">
          This run is a clean {up ? "uptrend" : "downtrend"} that reverses — notice how the HA candles
          run in one colour with barely any opposite wick through the trend, then the colour actually
          flips at the reversal. Deliberately-shaped synthetic candles, regenerated each shuffle — not
          a real historical chart.
        </p>
      </div>
    </div>
  );
}
