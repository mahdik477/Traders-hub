"use client";

import { useMemo, useState } from "react";
import { genVsaDemo } from "@/lib/strategy-sim-utils";

// A live VSA simulator — shuffle the chart and the "stopping volume" bar
// (a narrow spread on unusually heavy volume, right after a run) is
// always marked. Same synthetic-data convention as every other
// interactive strategy page — the volume is fabricated too.

const WIDTH = 760;
const PAD = 28;
const N = 50;
const PRICE_TOP = 16;
const PRICE_BOTTOM = 230;
const VOL_TOP = 250;
const VOL_BOTTOM = 320;
const HEIGHT = VOL_BOTTOM + 16;

export default function VsaSimulator() {
  const [seed, setSeed] = useState(1);
  const bullish = seed % 2 === 0;

  const { bars, volumes, signalI } = useMemo(() => genVsaDemo(seed, N, bullish), [seed, bullish]);

  const { min, max } = useMemo(() => {
    const highs = bars.map((b) => b.h);
    const lows = bars.map((b) => b.l);
    return { min: Math.min(...lows) - 0.3, max: Math.max(...highs) + 0.3 };
  }, [bars]);
  const maxVol = Math.max(...volumes);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const candleWidth = xStep * 0.55;
  const yFor = (v: number) => PRICE_BOTTOM - ((v - min) / (max - min)) * (PRICE_BOTTOM - PRICE_TOP);
  const volY = (v: number) => VOL_BOTTOM - (v / maxVol) * (VOL_BOTTOM - VOL_TOP);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle the chart — the stopping-volume bar is always outlined in gold.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive VSA chart">
          {bars.map((b, i) => {
            const x = PAD + i * xStep;
            const up = b.c > b.o;
            const bodyTop = yFor(Math.max(b.o, b.c));
            const bodyBottom = yFor(Math.min(b.o, b.c));
            const isSignal = i === signalI;
            const color = up ? "var(--color-success)" : "var(--color-danger)";
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={yFor(b.h)} y2={yFor(b.l)} stroke={color} strokeWidth={1.5} />
                <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={Math.max(bodyBottom - bodyTop, 1.5)} fill={color} opacity={isSignal ? 1 : 0.75} stroke={isSignal ? "var(--color-gold-bright)" : "none"} strokeWidth={isSignal ? 2.5 : 0} rx={1} />
                <rect x={x - candleWidth / 2} y={volY(volumes[i])} width={candleWidth} height={VOL_BOTTOM - volY(volumes[i])} fill={isSignal ? "var(--color-gold-bright)" : color} opacity={isSignal ? 1 : 0.4} />
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm border-2 border-gold-bright" /> Narrow spread, heavy volume
          </span>
        </div>

        <p className="meta mt-4">
          This bar has a much narrower price spread than the bars around it, on much heavier volume —
          read as the move running out of willing {bullish ? "sellers" : "buyers"}, not confirmation of
          it. Fabricated price and volume, regenerated each shuffle — not real market data.
        </p>
      </div>
    </div>
  );
}
