"use client";

import { useMemo, useState } from "react";
import { genOHLC, ichimoku, findCrossings, toPath } from "@/lib/strategy-sim-utils";

// A live Ichimoku simulator — the cloud (the span between Senkou A and B)
// and the Tenkan/Kijun lines redraw live, with every cross marked. Shown
// lined up with the price that produced them rather than shifted forward/
// back, so the crossovers are easy to read against the bars that caused
// them. Same synthetic-data convention as every other interactive
// strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 90;

export default function IchimokuSimulator() {
  const [seed, setSeed] = useState(1);

  const bars = useMemo(() => genOHLC(seed, N), [seed]);
  const closes = useMemo(() => bars.map((b) => b.c), [bars]);
  const { tenkan, kijun, senkouA, senkouB } = useMemo(() => ichimoku(bars), [bars]);
  const crossings = useMemo(() => findCrossings(tenkan, kijun), [tenkan, kijun]);

  const { min, max } = useMemo(() => {
    const vals = [tenkan, kijun, senkouA, senkouB].flatMap((arr) => arr.filter((v): v is number => v != null));
    const all = closes.concat(vals);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, tenkan, kijun, senkouA, senkouB]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  const cloudPath = useMemo(() => {
    const top: string[] = [];
    const bottom: string[] = [];
    senkouA.forEach((a, i) => {
      const b = senkouB[i];
      if (a == null || b == null) return;
      const x = PAD + i * xStep;
      const yForTop = HEIGHT - PAD - ((Math.max(a, b) - min) / (max - min)) * (HEIGHT - PAD * 2);
      const yForBottom = HEIGHT - PAD - ((Math.min(a, b) - min) / (max - min)) * (HEIGHT - PAD * 2);
      top.push(`${x},${yForTop}`);
      bottom.unshift(`${x},${yForBottom}`);
    });
    if (!top.length) return "";
    return `M ${top.join(" L ")} L ${bottom.join(" L ")} Z`;
  }, [senkouA, senkouB, xStep, min, max]);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle the chart — the cloud and every Tenkan/Kijun cross are always marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive Ichimoku chart">
          <path d={cloudPath} fill="var(--color-gold)" opacity={0.1} />
          <path d={toPath(kijun, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold)" strokeWidth={2} />
          <path d={toPath(tenkan, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2} />
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-muted)" strokeWidth={1.5} opacity={0.6} />
          {crossings.map((c) => (
            <circle key={c.i} cx={PAD + c.i * xStep} cy={yFor(tenkan[c.i]!)} r={5} fill={c.up ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-muted" /> Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Tenkan-sen
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> Kijun-sen
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-gold opacity-30" /> The cloud
          </span>
        </div>

        <p className="meta mt-4">
          {crossings.length} Tenkan/Kijun cross{crossings.length === 1 ? "" : "es"} on this run.
          Synthetic price data, regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
