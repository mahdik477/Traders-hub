"use client";

import { useMemo, useState } from "react";
import { genOHLC, parabolicSar, toPath } from "@/lib/strategy-sim-utils";

// A live Parabolic SAR simulator — drag the step slider and the dots
// (and the flip they mark) recompute instantly. Same synthetic-data
// convention as every other interactive strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 90;

export default function ParabolicSarSimulator() {
  const [seed, setSeed] = useState(1);
  const [step, setStep] = useState(0.02);

  const bars = useMemo(() => genOHLC(seed, N), [seed]);
  const closes = useMemo(() => bars.map((b) => b.c), [bars]);
  const sar = useMemo(() => parabolicSar(bars, step, step * 10), [bars, step]);
  const flips = useMemo(() => {
    const out: number[] = [];
    for (let i = 1; i < sar.length; i++) if (sar[i].up !== sar[i - 1].up) out.push(i);
    return out;
  }, [sar]);

  const { min, max } = useMemo(() => {
    const all = closes.concat(sar.map((p) => p.value));
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, sar]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Drag the slider — the dots redraw live, and flip sides when price reverses through them.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive Parabolic SAR chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2} />
          {sar.map((p, i) => (
            <circle key={i} cx={PAD + i * xStep} cy={yFor(p.value)} r={2.5} fill={p.up ? "var(--color-success)" : "var(--color-danger)"} />
          ))}
          {flips.map((i) => (
            <circle key={`flip${i}`} cx={PAD + i * xStep} cy={yFor(sar[i].value)} r={5.5} fill="none" stroke={sar[i].up ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-success" /> SAR below price (uptrend)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-danger" /> SAR above price (downtrend)
          </span>
        </div>

        <div className="mt-5">
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Step (acceleration)</span>
              <span className="figure text-accent">{step.toFixed(2)}</span>
            </span>
            <input type="range" min={0.01} max={0.05} step={0.01} value={step} onChange={(e) => setStep(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-gold-bright)]" />
          </label>
        </div>

        <p className="meta mt-4">
          {flips.length} flip{flips.length === 1 ? "" : "s"} on this run — a bigger step makes SAR hug
          price more closely and flip more often. Synthetic price data, regenerated each shuffle — not
          a real historical chart.
        </p>
      </div>
    </div>
  );
}
