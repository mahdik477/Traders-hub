"use client";

import { useMemo, useState } from "react";
import { genSeries, findPivots, toPath, type Pivot } from "@/lib/strategy-sim-utils";

// A live trendline simulator — connects the two most recent matching swing
// points (two swing lows for a rising trendline, or two swing highs for a
// falling one) and extends that line across the chart, the same way a
// trader would draw it by hand. Same synthetic-data convention as every
// other interactive strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 90;

function trendlineFrom(pivots: Pivot[]) {
  const lows = pivots.filter((p) => !p.high);
  const highs = pivots.filter((p) => p.high);
  const useLows = lows.length >= 2;
  const points = useLows ? lows.slice(-2) : highs.slice(-2);
  if (points.length < 2) return null;
  const [p1, p2] = points;
  const slope = (p2.value - p1.value) / (p2.i - p1.i);
  const intercept = p1.value - slope * p1.i;
  return { slope, intercept, up: useLows, startI: p1.i };
}

export default function TrendlineSimulator() {
  const [seed, setSeed] = useState(1);
  const [strength, setStrength] = useState(3);

  const closes = useMemo(() => genSeries(seed, N), [seed]);
  const pivots = useMemo(() => findPivots(closes, strength), [closes, strength]);
  const line = useMemo(() => trendlineFrom(pivots), [pivots]);
  const lineValues = useMemo(
    () => (line ? closes.map((_, i) => (i >= line.startI ? line.slope * i + line.intercept : null)) : closes.map(() => null)),
    [closes, line],
  );

  const { min, max } = useMemo(() => {
    const lineVals = lineValues.filter((v): v is number => v != null);
    const all = closes.concat(lineVals);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, lineValues]);

  const tolerance = (max - min) * 0.018;
  const touches = useMemo(() => {
    if (!line) return [];
    const out: number[] = [];
    closes.forEach((c, i) => {
      const lv = lineValues[i];
      if (lv != null && Math.abs(c - lv) <= tolerance) out.push(i);
    });
    return out;
  }, [closes, lineValues, line, tolerance]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Drag the slider — the trendline redraws live from the swing points.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive trendline chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          {line && <path d={toPath(lineValues, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold)" strokeWidth={2} strokeDasharray="7 4" />}
          {touches.map((i) => (
            <circle key={i} cx={PAD + i * xStep} cy={yFor(closes[i])} r={5} fill={line?.up ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> Trendline ({line?.up ? "rising support" : "falling resistance"})
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-full ${line?.up ? "bg-success" : "bg-danger"}`} /> Touch
          </span>
        </div>

        <div className="mt-5">
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Pivot strength</span>
              <span className="figure text-accent">{strength}</span>
            </span>
            <input type="range" min={2} max={6} value={strength} onChange={(e) => setStrength(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-gold-bright)]" />
          </label>
        </div>

        <p className="meta mt-4">
          {touches.length} touch{touches.length === 1 ? "" : "es"} of the line on this run — a lower
          pivot strength finds more swing points to draw from. Synthetic price data, regenerated each
          shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
