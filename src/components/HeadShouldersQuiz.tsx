"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genHeadShouldersPattern, findThreePointPattern, toPath, type ThreePointPattern } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: spot where the pattern is actually confirmed —
// not the third peak itself, but the moment price breaks the neckline
// afterwards, which is the point a trader would actually act on.

function findConfirmationIndex(values: number[], pattern: ThreePointPattern | null): number | null {
  if (!pattern) return null;
  for (let i = pattern.right + 1; i < values.length; i++) {
    if (pattern.inverse ? values[i] > pattern.necklineV : values[i] < pattern.necklineV) return i;
  }
  return null;
}

const WIDTH = 760;
const HEIGHT = 300;
const PAD = 28;
const N = 80;
const TOLERANCE_BARS = 3;

export default function HeadShouldersQuiz() {
  const [seed, setSeed] = useState(101);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const inverse = seed % 2 === 0;
  const values = useMemo(() => genHeadShouldersPattern(seed, N, inverse), [seed, inverse]);
  const pattern = useMemo(() => findThreePointPattern(values, inverse, 4), [values, inverse]);
  const confirmI = useMemo(() => findConfirmationIndex(values, pattern), [values, pattern]);

  const { min, max } = useMemo(() => ({ min: Math.min(...values) - 1, max: Math.max(...values) + 1 }), [values]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);
  const indexFor = (x: number) => Math.round((x - PAD) / xStep);

  const answered = guessIndex != null;
  const isCorrect = confirmI != null && guessIndex != null && Math.abs(guessIndex - confirmI) <= TOLERANCE_BARS;

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered || confirmI == null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.max(0, Math.min(N - 1, indexFor(svgX)));
    setGuessIndex(idx);
    setScore((s) => ({
      correct: s.correct + (Math.abs(idx - confirmI) <= TOLERANCE_BARS ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function nextRound() {
    setSeed((n) => n + 1);
    setGuessIndex(null);
  }

  if (!pattern || confirmI == null) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <p className="text-muted">That run didn&apos;t confirm cleanly — try another.</p>
        <button type="button" onClick={nextRound} className="btn btn-outline mt-3">
          New chart
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-success/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Spot the confirmation</p>
          <p className="meta mt-0.5">
            The three peaks are marked — click where price actually breaks the neckline afterwards.
          </p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <path d={toPath(values, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <circle cx={PAD + pattern.left * xStep} cy={yFor(values[pattern.left])} r={5} fill="var(--color-muted)" stroke="var(--color-background)" strokeWidth={2} />
          <circle cx={PAD + pattern.mid * xStep} cy={yFor(values[pattern.mid])} r={6} fill="var(--color-muted)" stroke="var(--color-background)" strokeWidth={2} />
          <circle cx={PAD + pattern.right * xStep} cy={yFor(values[pattern.right])} r={5} fill="var(--color-muted)" stroke="var(--color-background)" strokeWidth={2} />

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={PAD} y2={HEIGHT - PAD} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered && (
            <>
              <line x1={PAD} x2={WIDTH - PAD} y1={yFor(pattern.necklineV)} y2={yFor(pattern.necklineV)} stroke="var(--color-gold)" strokeWidth={1.5} strokeDasharray="6 4" />
              <circle cx={PAD + confirmI * xStep} cy={yFor(values[confirmI])} r={7} fill={inverse ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
            </>
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
                The neckline and the solid dot only show up once you answer — that&apos;s the bar
                where price actually broke it. Your click is the dashed line.
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
