"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genIntermarketDemo } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: both markets are drawn on from the start — the
// question is where market 2 actually fails to confirm market 1's more
// extreme second move.

const WIDTH = 760;
const HEIGHT = 300;
const PAD = 28;
const N = 70;
const TOLERANCE_BARS = 4;

function pathFor(values: number[], yFn: (v: number) => number, xStep: number) {
  let d = "";
  values.forEach((v, i) => {
    const x = PAD + i * xStep;
    const y = yFn(v);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });
  return d;
}

export default function IntermarketQuiz() {
  const [seed, setSeed] = useState(100);
  const bullish = seed % 2 === 0;
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const { market1, market2, divergeI } = useMemo(() => genIntermarketDemo(seed, N, bullish), [seed, bullish]);

  const { min, max } = useMemo(() => {
    const all = market1.concat(market2);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [market1, market2]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);
  const indexFor = (x: number) => Math.round((x - PAD) / xStep);

  const answered = guessIndex != null;
  const isCorrect = guessIndex != null && Math.abs(guessIndex - divergeI) <= TOLERANCE_BARS;

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.max(0, Math.min(N - 1, indexFor(svgX)));
    setGuessIndex(idx);
    setScore((s) => ({
      correct: s.correct + (Math.abs(idx - divergeI) <= TOLERANCE_BARS ? 1 : 0),
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
          <p className="text-lg font-bold text-foreground">Spot the disagreement</p>
          <p className="meta mt-0.5">Both markets are marked — click where market 2 fails to confirm market 1&apos;s move.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <path d={pathFor(market1, yFor, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <path d={pathFor(market2, yFor, xStep)} fill="none" stroke="var(--color-accent)" strokeWidth={2.5} />

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={PAD} y2={HEIGHT - PAD} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered && (
            <circle cx={PAD + divergeI * xStep} cy={yFor(market2[divergeI])} r={7} fill={bullish ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
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
                The solid dot is where market 1 pushes to its more extreme move while market 2 doesn&apos;t
                keep pace — the actual intermarket signal. Your click is the dashed line.
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
