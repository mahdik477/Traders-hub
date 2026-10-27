"use client";

import { useMemo, useState } from "react";
import { genOHLC, bollinger, ema, atr } from "@/lib/strategy-sim-utils";

// A live TTM Squeeze simulator — Bollinger Bands (volatility) tucked
// inside a Keltner Channel (average range) marks the squeeze; every bar
// where the bands pop back outside the channel — the actual "fire" — is
// marked. Same synthetic-data convention as every other interactive
// strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 90;
const PERIOD = 20;
const MULT = 1.5;

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

export default function TtmSqueezeSimulator() {
  const [seed, setSeed] = useState(1);

  const bars = useMemo(() => genOHLC(seed, N), [seed]);
  const closes = useMemo(() => bars.map((b) => b.c), [bars]);
  const bb = useMemo(() => bollinger(closes, PERIOD, 2), [closes]);
  const kcMid = useMemo(() => ema(closes, PERIOD), [closes]);
  const kcAtrVals = useMemo(() => atr(bars, PERIOD), [bars]);
  const { kcUpper, kcLower, squeeze, releases } = useMemo(() => {
    const kcUpper: (number | null)[] = [];
    const kcLower: (number | null)[] = [];
    const squeeze: boolean[] = [];
    const releases: number[] = [];
    let wasSqueeze = false;
    for (let i = 0; i < closes.length; i++) {
      const m = kcMid[i];
      const a = kcAtrVals[i];
      if (m == null || a == null || bb.upper[i] == null || bb.lower[i] == null) {
        kcUpper.push(null);
        kcLower.push(null);
        squeeze.push(false);
        wasSqueeze = false;
        continue;
      }
      const u = m + MULT * a;
      const l = m - MULT * a;
      kcUpper.push(u);
      kcLower.push(l);
      const inSqueeze = bb.upper[i]! < u && bb.lower[i]! > l;
      squeeze.push(inSqueeze);
      if (wasSqueeze && !inSqueeze) releases.push(i);
      wasSqueeze = inSqueeze;
    }
    return { kcUpper, kcLower, squeeze, releases };
  }, [closes, bb, kcMid, kcAtrVals]);

  const { min, max } = useMemo(() => {
    const vals = [...closes, ...bb.upper, ...bb.lower, ...kcUpper, ...kcLower].filter((v): v is number => v != null);
    return { min: Math.min(...vals) - 1, max: Math.max(...vals) + 1 };
  }, [closes, bb, kcUpper, kcLower]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle the chart — every bar in a squeeze, and every fire out of one, are always marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive TTM Squeeze chart">
          <path d={pathFor(kcUpper, yFor, xStep)} fill="none" stroke="var(--color-accent)" strokeWidth={1.5} opacity={0.6} />
          <path d={pathFor(kcLower, yFor, xStep)} fill="none" stroke="var(--color-accent)" strokeWidth={1.5} opacity={0.6} />
          <path d={pathFor(bb.upper, yFor, xStep)} fill="none" stroke="var(--color-gold)" strokeWidth={1.5} />
          <path d={pathFor(bb.lower, yFor, xStep)} fill="none" stroke="var(--color-gold)" strokeWidth={1.5} />
          <path d={pathFor(closes, yFor, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2} />
          {squeeze.map(
            (s, i) =>
              s && (
                <rect key={i} x={PAD + i * xStep - 1.5} y={PAD} width={3} height={HEIGHT - PAD * 2} fill="var(--color-muted)" opacity={0.12} />
              ),
          )}
          {releases.map((i) => (
            <circle key={i} cx={PAD + i * xStep} cy={yFor(closes[i])} r={5} fill="var(--color-success)" stroke="var(--color-background)" strokeWidth={2} />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> Bollinger Bands
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-accent" /> Keltner Channel
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-muted opacity-40" /> In a squeeze
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Fires out of it
          </span>
        </div>

        <p className="meta mt-4">
          {releases.length} squeeze fire{releases.length === 1 ? "" : "s"} on this run — Bollinger Bands
          tucked inside the Keltner Channel is low volatility compressing before a move. Synthetic
          price data, regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
