"use client";

import { useMemo, useState } from "react";
import { genElderScreenDemo } from "@/lib/strategy-sim-utils";

// A live Elder Triple Screen simulator — three panels stacked: the
// higher-timeframe trend on top (just direction, screen 1), the lower-
// timeframe price with its pullback oscillator underneath (screen 2),
// and the actual entry trigger marked where price breaks back out of
// its short-term range once the pullback is done (screen 3). Same
// synthetic-data convention as every other interactive strategy page.

const WIDTH = 760;
const PAD = 28;
const N = 80;
const HTF_TOP = 10;
const HTF_BOTTOM = 80;
const LTF_TOP = 106;
const LTF_BOTTOM = 220;
const OSC_TOP = 240;
const OSC_BOTTOM = 320;
const HEIGHT = OSC_BOTTOM + 16;

function pathFor(values: (number | null)[], yFn: (v: number) => number, xStep: number) {
  let d = "";
  let drawing = false;
  values.forEach((v, i) => {
    if (v == null) {
      drawing = false;
      return;
    }
    const x = PAD + i * xStep;
    const y = yFn(v);
    d += drawing ? ` L ${x} ${y}` : `M ${x} ${y}`;
    drawing = true;
  });
  return d;
}

export default function ElderScreenSimulator() {
  const [seed, setSeed] = useState(1);

  const { htfTrend, ltf, oscillator, dipI, triggerI, up } = useMemo(() => genElderScreenDemo(seed, N), [seed]);

  const htfRange = useMemo(() => ({ min: Math.min(...htfTrend) - 1, max: Math.max(...htfTrend) + 1 }), [htfTrend]);
  const ltfRange = useMemo(() => ({ min: Math.min(...ltf) - 1, max: Math.max(...ltf) + 1 }), [ltf]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yForHtf = (v: number) => HTF_BOTTOM - ((v - htfRange.min) / (htfRange.max - htfRange.min)) * (HTF_BOTTOM - HTF_TOP);
  const yForLtf = (v: number) => LTF_BOTTOM - ((v - ltfRange.min) / (ltfRange.max - ltfRange.min)) * (LTF_BOTTOM - LTF_TOP);
  const yForOsc = (v: number) => OSC_BOTTOM - (v / 100) * (OSC_BOTTOM - OSC_TOP);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle — the pullback and the entry trigger are always marked across all three screens.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive Elder Triple Screen chart">
          <text x={PAD} y={HTF_TOP - 1} fontSize={11} fill="var(--color-muted)">
            Screen 1 — higher timeframe trend
          </text>
          <path d={pathFor(htfTrend, yForHtf, xStep)} fill="none" stroke="var(--color-gold)" strokeWidth={2} />

          <text x={PAD} y={LTF_TOP - 1} fontSize={11} fill="var(--color-muted)">
            Screen 2 — lower timeframe pullback
          </text>
          <path d={pathFor(ltf, yForLtf, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <circle cx={PAD + dipI * xStep} cy={yForLtf(ltf[dipI])} r={5} fill="var(--color-muted)" stroke="var(--color-background)" strokeWidth={2} />

          <text x={PAD} y={OSC_TOP - 1} fontSize={11} fill="var(--color-muted)">
            Screen 3 — entry trigger
          </text>
          <line x1={PAD} x2={WIDTH - PAD} y1={yForOsc(50)} y2={yForOsc(50)} stroke="var(--color-border)" strokeWidth={1} />
          <path d={pathFor(oscillator, yForOsc, xStep)} fill="none" stroke="var(--color-accent)" strokeWidth={2} />
          <circle cx={PAD + triggerI * xStep} cy={yForLtf(ltf[triggerI])} r={6} fill={up ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-muted" /> The pullback low/high
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-full ${up ? "bg-success" : "bg-danger"}`} /> The entry trigger
          </span>
        </div>

        <p className="meta mt-4">
          The bigger trend is {up ? "up" : "down"}; the pullback gives a better entry price, and the
          trigger confirms the pullback is actually over. Deliberately-shaped synthetic data,
          regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
