"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genSeries, toRenko } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-brick quiz: spot where the trend actually reverses — two
// bricks the other way, the Renko reversal rule. It can reverse more
// than once in a run, so any reversal counts.

const WIDTH = 760;
const HEIGHT = 300;
const PAD = 28;
const N = 80;
const BRICK_SIZE = 1.2;

export default function RenkoQuiz() {
  const [seed, setSeed] = useState(100);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const closes = useMemo(() => genSeries(seed, N), [seed]);
  const bricks = useMemo(() => toRenko(closes, BRICK_SIZE), [closes]);
  const reversals = useMemo(() => {
    const out: number[] = [];
    for (let i = 1; i < bricks.length; i++) if (bricks[i].up !== bricks[i - 1].up) out.push(i);
    return out;
  }, [bricks]);

  const { min, max } = useMemo(() => {
    const vals = bricks.map((b) => b.close);
    return { min: Math.min(...vals, closes[0]) - BRICK_SIZE, max: Math.max(...vals, closes[0]) + BRICK_SIZE };
  }, [bricks, closes]);
  const brickW = bricks.length ? (WIDTH - PAD * 2) / bricks.length : 1;
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);
  const indexFor = (x: number) => Math.max(0, Math.min(bricks.length - 1, Math.floor((x - PAD) / brickW)));

  const answered = guessIndex != null;
  const isCorrect = reversals.includes(guessIndex ?? -1);

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered || reversals.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = indexFor(svgX);
    setGuessIndex(idx);
    setScore((s) => ({ correct: s.correct + (reversals.includes(idx) ? 1 : 0), total: s.total + 1 }));
  }

  function nextRound() {
    setSeed((n) => n + 1);
    setGuessIndex(null);
  }

  if (reversals.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <p className="text-muted">That run didn&apos;t reverse cleanly — try another.</p>
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
          <p className="text-lg font-bold text-foreground">Spot the reversal</p>
          <p className="meta mt-0.5">Click the brick where the trend actually reverses — any reversal counts.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click the brick you think is a reversal" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          {bricks.map((b, i) => {
            const x = PAD + i * brickW;
            const bottom = b.up ? b.close - BRICK_SIZE : b.close;
            const top = b.up ? b.close : b.close + BRICK_SIZE;
            const isTarget = answered && reversals.includes(i);
            const isGuess = guessIndex === i;
            return (
              <rect
                key={i}
                x={x + brickW * 0.08}
                y={yFor(top)}
                width={brickW * 0.84}
                height={Math.max(yFor(bottom) - yFor(top), 1)}
                fill={b.up ? "var(--color-success)" : "var(--color-danger)"}
                opacity={0.75}
                stroke={isTarget ? "var(--color-success)" : isGuess ? (isCorrect ? "var(--color-success)" : "var(--color-danger)") : "none"}
                strokeWidth={isTarget || isGuess ? 3 : 0}
              />
            );
          })}
        </svg>

        {answered ? (
          <div className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${isCorrect ? "border-success/30 bg-success/8" : "border-danger/30 bg-danger/8"}`}>
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${isCorrect ? "bg-success text-white" : "bg-danger text-white"}`}>
              <CheckIcon className="size-4" />
            </span>
            <div className="flex-1">
              <p className={`text-lg font-bold ${isCorrect ? "text-success" : "text-danger"}`}>{isCorrect ? "Right on it." : "Not quite."}</p>
              <p className="mt-1 text-base leading-relaxed text-foreground/90">
                Every outlined brick is a genuine reversal (two bricks the other way) — any of them
                counted. Your click is outlined in {isCorrect ? "green" : "red"}.
              </p>
              <button type="button" onClick={nextRound} className="btn btn-primary mt-3">
                <PlayIcon className="size-3.5" />
                Next round
              </button>
            </div>
          </div>
        ) : (
          <p className="meta mt-4">Tap or click the brick you think is a reversal to lock in your answer.</p>
        )}
      </div>
    </div>
  );
}
