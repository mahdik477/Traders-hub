"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genHarmonicDemo, toPath } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: X, A, B and C are marked — the question is
// where point D actually completes, since that's the signal to act on.

const WIDTH = 760;
const HEIGHT = 300;
const PAD = 28;
const N = 70;
const TOLERANCE_BARS = 3;

export default function HarmonicQuiz() {
  const [seed, setSeed] = useState(100);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const { values, xI, aI, bI, cI, dI, bullish } = useMemo(() => genHarmonicDemo(seed, N), [seed]);

  const { min, max } = useMemo(() => ({ min: Math.min(...values) - 1, max: Math.max(...values) + 1 }), [values]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);
  const indexFor = (x: number) => Math.round((x - PAD) / xStep);

  const points = [
    { i: xI, label: "X" },
    { i: aI, label: "A" },
    { i: bI, label: "B" },
    { i: cI, label: "C" },
  ];

  const answered = guessIndex != null;
  const isCorrect = guessIndex != null && Math.abs(guessIndex - dI) <= TOLERANCE_BARS;

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.max(0, Math.min(N - 1, indexFor(svgX)));
    setGuessIndex(idx);
    setScore((s) => ({
      correct: s.correct + (Math.abs(idx - dI) <= TOLERANCE_BARS ? 1 : 0),
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
          <p className="text-lg font-bold text-foreground">Spot point D</p>
          <p className="meta mt-0.5">X, A, B and C are marked — click where the pattern actually completes.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think point D is" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <path d={toPath(values, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          {points.map((p) => (
            <g key={p.label}>
              <circle cx={PAD + p.i * xStep} cy={yFor(values[p.i])} r={5} fill="var(--color-muted)" stroke="var(--color-background)" strokeWidth={2} />
              <text x={PAD + p.i * xStep} y={yFor(values[p.i]) - 10} fontSize={13} fontWeight={700} fill="var(--color-muted)" textAnchor="middle">
                {p.label}
              </text>
            </g>
          ))}

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={PAD} y2={HEIGHT - PAD} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered && (
            <circle cx={PAD + dI * xStep} cy={yFor(values[dI])} r={7} fill={bullish ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
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
                The solid dot is point D — the completion of the X-A-B-C-D sequence, and the actual
                signal. Your click is the dashed line.
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
