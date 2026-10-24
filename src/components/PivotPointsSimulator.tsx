"use client";

import { useMemo, useState } from "react";
import { genOHLC, classicPivots, toPath } from "@/lib/strategy-sim-utils";

// A live pivot points simulator — the first stretch of bars stands in for
// "yesterday's session", the pivot levels are calculated from its
// high/low/close by the classic floor-trader formula, and every touch
// afterwards is marked. Same synthetic-data convention as every other
// interactive strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 90;
const SPLIT = Math.round(N * 0.3);

export default function PivotPointsSimulator() {
  const [seed, setSeed] = useState(1);

  const bars = useMemo(() => genOHLC(seed, N), [seed]);
  const closes = useMemo(() => bars.map((b) => b.c), [bars]);
  const levels = useMemo(() => {
    const prior = bars.slice(0, SPLIT);
    const prevHigh = Math.max(...prior.map((b) => b.h));
    const prevLow = Math.min(...prior.map((b) => b.l));
    const prevClose = prior[prior.length - 1].c;
    return classicPivots(prevHigh, prevLow, prevClose);
  }, [bars]);

  const tolerance = useMemo(() => (Math.max(...closes) - Math.min(...closes)) * 0.012, [closes]);
  const levelList = useMemo(
    () => [
      { label: "R2", value: levels.r2, color: "var(--color-danger)" },
      { label: "R1", value: levels.r1, color: "var(--color-danger)" },
      { label: "P", value: levels.p, color: "var(--color-gold)" },
      { label: "S1", value: levels.s1, color: "var(--color-success)" },
      { label: "S2", value: levels.s2, color: "var(--color-success)" },
    ],
    [levels],
  );
  const touches = useMemo(() => {
    const out: { i: number; label: string; color: string }[] = [];
    for (let i = SPLIT + 1; i < closes.length; i++) {
      for (const lvl of levelList) {
        if (Math.abs(closes[i] - lvl.value) <= tolerance) {
          out.push({ i, label: lvl.label, color: lvl.color });
          break;
        }
      }
    }
    return out;
  }, [closes, levelList, tolerance]);

  const { min, max } = useMemo(() => {
    const all = closes.concat(levelList.map((l) => l.value));
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, levelList]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle — the pivot levels recompute from the first stretch of bars, and every touch is marked.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive pivot points chart">
          <rect x={PAD} y={PAD} width={SPLIT * xStep} height={HEIGHT - PAD * 2} fill="var(--color-border)" opacity={0.15} />
          {levelList.map((lvl) => (
            <line key={lvl.label} x1={PAD + SPLIT * xStep} x2={WIDTH - PAD} y1={yFor(lvl.value)} y2={yFor(lvl.value)} stroke={lvl.color} strokeWidth={1.5} strokeDasharray="5 3" opacity={0.85} />
          ))}
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          {touches.map((t) => (
            <circle key={t.i} cx={PAD + t.i * xStep} cy={yFor(closes[t.i])} r={5} fill={t.color} stroke="var(--color-background)" strokeWidth={2} />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-border opacity-60" /> &quot;Yesterday&apos;s session&quot;
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-danger" /> Resistance (R1/R2)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> Pivot (P)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-success" /> Support (S1/S2)
          </span>
        </div>

        <p className="meta mt-4">
          {touches.length} pivot touch{touches.length === 1 ? "" : "es"} on this run. Synthetic price
          data, regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
