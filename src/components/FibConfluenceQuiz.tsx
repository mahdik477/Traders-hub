"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genConfluenceDemo, FIB_LEVELS, fibPrice, toPath } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: both swings' fib levels are drawn on from the
// start — the question is only where price actually reacts off the
// confluence zone where a level from each one lines up.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 80;
const TOLERANCE_BARS = 3;

export default function FibConfluenceQuiz() {
  const [seed, setSeed] = useState(100);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const { values, swing1, swing2, confluencePrice, touchI } = useMemo(() => genConfluenceDemo(seed, N), [seed]);
  const levels1 = useMemo(() => FIB_LEVELS.map((l) => fibPrice(swing1, l)), [swing1]);
  const levels2 = useMemo(() => FIB_LEVELS.map((l) => fibPrice(swing2, l)), [swing2]);

  const { min, max } = useMemo(() => {
    const all = values.concat(levels1, levels2);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [values, levels1, levels2]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);
  const indexFor = (x: number) => Math.round((x - PAD) / xStep);

  const answered = guessIndex != null;
  const isCorrect = guessIndex != null && Math.abs(guessIndex - touchI) <= TOLERANCE_BARS;

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.max(0, Math.min(N - 1, indexFor(svgX)));
    setGuessIndex(idx);
    setScore((s) => ({
      correct: s.correct + (Math.abs(idx - touchI) <= TOLERANCE_BARS ? 1 : 0),
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
          <p className="text-lg font-bold text-foreground">Spot the confluence reaction</p>
          <p className="meta mt-0.5">Both swings&apos; fib levels are marked — click where price reacts off the one they share.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          {levels1.map((p, i) => (
            <line key={`a${i}`} x1={PAD + swing1.endI * xStep} x2={WIDTH - PAD} y1={yFor(p)} y2={yFor(p)} stroke="var(--color-gold)" strokeWidth={1} opacity={0.4} strokeDasharray="4 3" />
          ))}
          {levels2.map((p, i) => (
            <line key={`b${i}`} x1={PAD + swing2.endI * xStep} x2={WIDTH - PAD} y1={yFor(p)} y2={yFor(p)} stroke="var(--color-accent)" strokeWidth={1} opacity={0.4} strokeDasharray="4 3" />
          ))}
          <path d={toPath(values, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={PAD} y2={HEIGHT - PAD} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered && (
            <>
              <line x1={PAD} x2={WIDTH - PAD} y1={yFor(confluencePrice)} y2={yFor(confluencePrice)} stroke="var(--color-gold-bright)" strokeWidth={2} />
              <circle cx={PAD + touchI * xStep} cy={yFor(values[touchI])} r={7} fill="var(--color-success)" stroke="var(--color-background)" strokeWidth={2} />
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
                The solid gold line only shows up once you answer — it&apos;s where a level from both
                swings lands at nearly the same price, and the dot is where price actually tested it.
                Your click is the dashed line.
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
