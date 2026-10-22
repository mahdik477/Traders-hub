"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genSeries, findBiggestSwing, fibPrice, FIB_LEVELS, toPath } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: the fib levels are drawn on from the start (same
// as the simulator) — the question is only where price actually reacted
// off one of them.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 80;
const STRENGTH = 4;
const TOLERANCE_BARS = 3;

export default function FibonacciQuiz() {
  const [seed, setSeed] = useState(100);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const closes = useMemo(() => genSeries(seed, N, { driftAmplitude: 0.5 }), [seed]);
  const swing = useMemo(() => findBiggestSwing(closes, STRENGTH), [closes]);
  const levels = useMemo(() => (swing ? FIB_LEVELS.map((l) => ({ level: l, price: fibPrice(swing, l) })) : []), [swing]);
  const afterSwingI = swing ? Math.max(swing.startI, swing.endI) : 0;
  const tolerance = useMemo(() => (swing ? Math.abs(swing.endV - swing.startV) * 0.045 : 0), [swing]);

  const touches = useMemo(() => {
    if (!swing) return [];
    const out: { i: number; level: number }[] = [];
    for (let i = afterSwingI + 1; i < closes.length; i++) {
      for (const { level, price } of levels) {
        if (Math.abs(closes[i] - price) <= tolerance) {
          out.push({ i, level });
          break;
        }
      }
    }
    return out;
  }, [closes, levels, swing, afterSwingI, tolerance]);

  const targetTouch = touches.length ? touches[Math.floor(touches.length / 2)] : null;

  const { min, max } = useMemo(() => {
    const all = closes.concat(levels.map((l) => l.price));
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, levels]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);
  const indexFor = (x: number) => Math.round((x - PAD) / xStep);

  const answered = guessIndex != null;
  const isCorrect = targetTouch != null && guessIndex != null && Math.abs(guessIndex - targetTouch.i) <= TOLERANCE_BARS;

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered || !targetTouch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.max(0, Math.min(N - 1, indexFor(svgX)));
    setGuessIndex(idx);
    setScore((s) => ({
      correct: s.correct + (Math.abs(idx - targetTouch.i) <= TOLERANCE_BARS ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function nextRound() {
    setSeed((n) => n + 1);
    setGuessIndex(null);
  }

  if (!targetTouch || !swing) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <p className="text-muted">That run didn&apos;t produce a clean retracement — try another.</p>
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
          <p className="text-lg font-bold text-foreground">Spot the reaction</p>
          <p className="meta mt-0.5">Click the area where price reacted off a fib level.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          {levels.map(({ level, price }) => (
            <line key={level} x1={PAD + afterSwingI * xStep} x2={WIDTH - PAD} y1={yFor(price)} y2={yFor(price)} stroke="var(--color-gold)" strokeWidth={1} opacity={0.6} strokeDasharray="4 3" />
          ))}
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={PAD} y2={HEIGHT - PAD} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered && (
            <circle cx={PAD + targetTouch.i * xStep} cy={yFor(closes[targetTouch.i])} r={7} fill="var(--color-success)" stroke="var(--color-background)" strokeWidth={2} />
          )}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 border-t-2 border-dashed border-gold" /> Fib levels
          </span>
        </div>

        {answered ? (
          <div className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${isCorrect ? "border-success/30 bg-success/8" : "border-danger/30 bg-danger/8"}`}>
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${isCorrect ? "bg-success text-white" : "bg-danger text-white"}`}>
              <CheckIcon className="size-4" />
            </span>
            <div className="flex-1">
              <p className={`text-lg font-bold ${isCorrect ? "text-success" : "text-danger"}`}>{isCorrect ? "Right on it." : "Not quite."}</p>
              <p className="mt-1 text-base leading-relaxed text-foreground/90">
                The solid dot is the bar where price actually reacted off the{" "}
                {(targetTouch.level * 100).toFixed(1)}% level. Your click is the dashed line.
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
