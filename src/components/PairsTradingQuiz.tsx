"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genPairsDemo } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: the widest gap is marked — the question is
// only where the spread actually reverts back toward normal.

const WIDTH = 760;
const PAD = 28;
const N = 80;
const PRICE_TOP = 16;
const PRICE_BOTTOM = 140;
const SPREAD_TOP = 176;
const SPREAD_BOTTOM = 300;
const HEIGHT = SPREAD_BOTTOM + 16;
const TOLERANCE_BARS = 3;

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

export default function PairsTradingQuiz() {
  const [seed, setSeed] = useState(100);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const { a, b, spread, peakI, reversionI } = useMemo(() => genPairsDemo(seed, N), [seed]);

  const priceRange = useMemo(() => {
    const all = a.concat(b);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [a, b]);
  const spreadRange = useMemo(() => {
    const m = Math.max(...spread.map(Math.abs), 1) * 1.15;
    return { min: -m, max: m };
  }, [spread]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yForPrice = (v: number) => PRICE_BOTTOM - ((v - priceRange.min) / (priceRange.max - priceRange.min)) * (PRICE_BOTTOM - PRICE_TOP);
  const yForSpread = (v: number) => SPREAD_BOTTOM - ((v - spreadRange.min) / (spreadRange.max - spreadRange.min)) * (SPREAD_BOTTOM - SPREAD_TOP);
  const indexFor = (x: number) => Math.round((x - PAD) / xStep);

  const answered = guessIndex != null;
  const isCorrect = guessIndex != null && Math.abs(guessIndex - reversionI) <= TOLERANCE_BARS;

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.max(0, Math.min(N - 1, indexFor(svgX)));
    setGuessIndex(idx);
    setScore((s) => ({
      correct: s.correct + (Math.abs(idx - reversionI) <= TOLERANCE_BARS ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function nextRound() {
    setSeed((n) => n + 1);
    setGuessIndex(null);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-success/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Spot the reversion</p>
          <p className="meta mt-0.5">The widest gap is marked — click where the spread actually snaps back.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <path d={pathFor(a, yForPrice, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <path d={pathFor(b, yForPrice, xStep)} fill="none" stroke="var(--color-accent)" strokeWidth={2.5} />

          <line x1={PAD} x2={WIDTH - PAD} y1={yForSpread(0)} y2={yForSpread(0)} stroke="var(--color-border)" strokeWidth={1.5} />
          <path d={pathFor(spread, yForSpread, xStep)} fill="none" stroke="var(--color-gold)" strokeWidth={2} />
          <circle cx={PAD + peakI * xStep} cy={yForSpread(spread[peakI])} r={5} fill="var(--color-danger)" stroke="var(--color-background)" strokeWidth={2} />

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={PRICE_TOP} y2={SPREAD_BOTTOM} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered && (
            <circle cx={PAD + reversionI * xStep} cy={yForSpread(spread[reversionI])} r={7} fill="var(--color-success)" stroke="var(--color-background)" strokeWidth={2} />
          )}
        </svg>

        {answered ? (
          <div className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${isCorrect ? "border-success/30 bg-success/8" : "border-danger/30 bg-danger/8"}`}>
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${isCorrect ? "bg-success text-white" : "bg-danger text-white"}`}>
              <CheckIcon className="size-4" />
            </span>
            <div className="flex-1">
              <p className={`text-lg font-bold ${isCorrect ? "text-success" : "text-danger"}`}>{isCorrect ? "Right on it." : "Not quite."}</p>
              <p className="mt-1 text-base leading-relaxed text-foreground/90">
                The solid dot is where the spread actually closes most of the way back toward zero — the
                reversion the trade was betting on. Your click is the dashed line.
              </p>
              <button type="button" onClick={nextRound} className="btn btn-primary mt-3">
                <PlayIcon className="size-3.5" />
                Next round
              </button>
            </div>
          </div>
        ) : (
          <p className="meta mt-4">Tap or click anywhere on the chart to lock in your answer.</p>
        )}
      </div>
    </div>
  );
}
