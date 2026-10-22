"use client";

import { useMemo, useState } from "react";
import { genSeries, ema, emaSkipNulls, findCrossings } from "@/lib/strategy-sim-utils";

// A live MACD simulator — drag the two sliders and the price panel on top
// plus the MACD/signal panel below it (with the crossover markers)
// recompute instantly. Same synthetic-data convention as every other
// interactive strategy page.

const WIDTH = 760;
const PAD = 28;
const N = 100;
const PRICE_TOP = 16;
const PRICE_BOTTOM = 130;
const MACD_TOP = 166;
const MACD_BOTTOM = 320;
const HEIGHT = MACD_BOTTOM + 16;
const SIGNAL_PERIOD = 9;

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

export default function MacdSimulator() {
  const [seed, setSeed] = useState(1);
  const [fast, setFast] = useState(12);
  const [slow, setSlow] = useState(26);

  const closes = useMemo(() => genSeries(seed, N), [seed]);
  const macdLine = useMemo(() => {
    const fastE = ema(closes, fast);
    const slowE = ema(closes, slow);
    return fastE.map((v, i) => (v != null && slowE[i] != null ? v - slowE[i]! : null));
  }, [closes, fast, slow]);
  const signalLine = useMemo(() => emaSkipNulls(macdLine, SIGNAL_PERIOD), [macdLine]);
  const crossings = useMemo(() => findCrossings(macdLine, signalLine), [macdLine, signalLine]);

  const { pmin, pmax } = useMemo(() => ({ pmin: Math.min(...closes) - 1, pmax: Math.max(...closes) + 1 }), [closes]);
  const { mmin, mmax } = useMemo(() => {
    const all = macdLine.concat(signalLine).filter((v): v is number => v != null);
    const m = Math.max(Math.abs(Math.min(...all)), Math.abs(Math.max(...all))) * 1.15 || 1;
    return { mmin: -m, mmax: m };
  }, [macdLine, signalLine]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yForPrice = (v: number) => PRICE_BOTTOM - ((v - pmin) / (pmax - pmin)) * (PRICE_BOTTOM - PRICE_TOP);
  const yForMacd = (v: number) => MACD_BOTTOM - ((v - mmin) / (mmax - mmin)) * (MACD_BOTTOM - MACD_TOP);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Drag the sliders — the MACD panel recomputes live underneath the price.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive MACD chart">
          <path d={pathFor(closes, yForPrice, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <line x1={PAD} x2={WIDTH - PAD} y1={yForMacd(0)} y2={yForMacd(0)} stroke="var(--color-border)" strokeWidth={1.5} />
          <path d={pathFor(signalLine, yForMacd, xStep)} fill="none" stroke="var(--color-gold)" strokeWidth={2.5} />
          <path d={pathFor(macdLine, yForMacd, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          {crossings.map((c) => (
            <circle
              key={c.i}
              cx={PAD + c.i * xStep}
              cy={yForMacd(macdLine[c.i]!)}
              r={5}
              fill={c.up ? "var(--color-success)" : "var(--color-danger)"}
              stroke="var(--color-background)"
              strokeWidth={2}
            />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Price / MACD line
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> Signal line
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-success" /> Bullish cross (buy)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-danger" /> Bearish cross (sell)
          </span>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Fast EMA period</span>
              <span className="figure text-accent">{fast}</span>
            </span>
            <input type="range" min={5} max={20} value={fast} onChange={(e) => setFast(Math.min(Number(e.target.value), slow - 1))} className="mt-2 w-full accent-[var(--color-gold-bright)]" />
          </label>
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Slow EMA period</span>
              <span className="figure text-accent">{slow}</span>
            </span>
            <input type="range" min={21} max={40} value={slow} onChange={(e) => setSlow(Math.max(Number(e.target.value), fast + 1))} className="mt-2 w-full accent-[var(--color-gold)]" />
          </label>
        </div>

        <p className="meta mt-4">
          {crossings.length} crossover{crossings.length === 1 ? "" : "s"} on this run — a tighter gap
          between the fast and slow EMA produces more signals, and more false ones with it. Synthetic
          price data, regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
