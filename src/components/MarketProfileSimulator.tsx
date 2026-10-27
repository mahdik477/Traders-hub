"use client";

import { useMemo, useState } from "react";
import { genProfileDemo } from "@/lib/strategy-sim-utils";

// A live market profile simulator — the histogram on the right shows how
// much time price spent at each level over the window; the point of
// control (the busiest level) is always marked. Same synthetic-data
// convention as every other interactive strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const PROFILE_WIDTH = 110;
const CHART_RIGHT = WIDTH - PROFILE_WIDTH - 10;
const N = 60;

export default function MarketProfileSimulator() {
  const [seed, setSeed] = useState(1);

  const { bars, levels, pocPrice } = useMemo(() => genProfileDemo(seed, N), [seed]);

  const { min, max } = useMemo(() => {
    const highs = bars.map((b) => b.h);
    const lows = bars.map((b) => b.l);
    return { min: Math.min(...lows) - 0.3, max: Math.max(...highs) + 0.3 };
  }, [bars]);
  const maxVol = Math.max(...levels.map((l) => l.volume));

  const xStep = (CHART_RIGHT - PAD) / (N - 1);
  const candleWidth = xStep * 0.55;
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle the chart — the point of control (the busiest price level) is always marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive market profile chart">
          <line x1={CHART_RIGHT} x2={CHART_RIGHT} y1={PAD} y2={HEIGHT - PAD} stroke="var(--color-border)" strokeWidth={1} />
          <line x1={PAD} x2={CHART_RIGHT} y1={yFor(pocPrice)} y2={yFor(pocPrice)} stroke="var(--color-gold)" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
          {bars.map((b, i) => {
            const x = PAD + i * xStep;
            const up = b.c > b.o;
            const bodyTop = yFor(Math.max(b.o, b.c));
            const bodyBottom = yFor(Math.min(b.o, b.c));
            const color = up ? "var(--color-success)" : "var(--color-danger)";
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={yFor(b.h)} y2={yFor(b.l)} stroke={color} strokeWidth={1.2} />
                <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={Math.max(bodyBottom - bodyTop, 1.2)} fill={color} opacity={0.75} rx={1} />
              </g>
            );
          })}
          {levels.map((l, i) => {
            const barWidth = (l.volume / maxVol) * (PROFILE_WIDTH - 10);
            const isPoc = l.price === pocPrice;
            return (
              <rect
                key={i}
                x={CHART_RIGHT + 4}
                y={yFor(l.price) - 3}
                width={Math.max(barWidth, 1)}
                height={6}
                fill={isPoc ? "var(--color-gold-bright)" : "var(--color-gold)"}
                opacity={isPoc ? 1 : 0.45}
              />
            );
          })}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> Point of control (busiest level)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-3 bg-gold opacity-50" /> The profile (time spent at each level)
          </span>
        </div>

        <p className="meta mt-4">
          Price tends to accept (spend more time) around the point of control and move through the
          thinner parts of the profile quickly. Synthetic price data, regenerated each shuffle — not a
          real historical chart.
        </p>
      </div>
    </div>
  );
}
