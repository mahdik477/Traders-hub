"use client";

import { useMemo, useState } from "react";
import { genRelativeStrengthSeries, toPath } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-strongest quiz: four fabricated assets, pick the one a
// momentum rotation strategy would actually buy, before the chart marks
// it for you.

const WIDTH = 320;
const HEIGHT = 110;
const PAD = 10;

export default function RelativeStrengthQuiz() {
  const [seed, setSeed] = useState(100);
  const [guessIdx, setGuessIdx] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const series = useMemo(() => genRelativeStrengthSeries(seed, 40), [seed]);
  const finals = series.map((s) => s.values[s.values.length - 1]);
  const winnerIdx = finals.indexOf(Math.max(...finals));

  const answered = guessIdx != null;
  const isCorrect = guessIdx === winnerIdx;

  function pick(i: number) {
    if (answered) return;
    setGuessIdx(i);
    setScore((s) => ({ correct: s.correct + (i === winnerIdx ? 1 : 0), total: s.total + 1 }));
  }

  function nextRound() {
    setSeed((n) => n + 1);
    setGuessIdx(null);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-success/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Spot the strongest</p>
          <p className="meta mt-0.5">Click the asset you&apos;d rotate into — the one with the best relative strength.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5">
        {series.map((s, i) => {
          const isGuess = guessIdx === i;
          const isWinner = answered && i === winnerIdx;
          const min = Math.min(...s.values) - 1;
          const max = Math.max(...s.values) + 1;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => pick(i)}
              disabled={answered}
              className={`rounded-xl border p-3 text-left transition-colors ${
                isWinner
                  ? "border-success bg-success/8"
                  : isGuess
                    ? "border-danger bg-danger/8"
                    : "border-border bg-surface hover:border-accent/50"
              } ${answered ? "cursor-default" : "cursor-pointer"}`}
            >
              <span className="text-sm font-bold text-foreground">{s.label}</span>
              <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-2 w-full" role="img" aria-label={`${s.label} price chart`}>
                <path d={toPath(s.values, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke={isWinner ? "var(--color-success)" : "var(--color-gold-bright)"} strokeWidth={2} />
              </svg>
            </button>
          );
        })}
      </div>

      <div className="px-4 pb-4 sm:px-5">
        {answered ? (
          <div className={`flex items-start gap-3 rounded-xl border p-4 ${isCorrect ? "border-success/30 bg-success/8" : "border-danger/30 bg-danger/8"}`}>
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${isCorrect ? "bg-success text-white" : "bg-danger text-white"}`}>
              <CheckIcon className="size-4" />
            </span>
            <div className="flex-1">
              <p className={`text-lg font-bold ${isCorrect ? "text-success" : "text-danger"}`}>{isCorrect ? "Right on it." : "Not quite."}</p>
              <p className="mt-1 text-base leading-relaxed text-foreground/90">
                {series[winnerIdx].label} actually ended up strongest over the window — that&apos;s
                outlined in green. Your pick is outlined in {isCorrect ? "green" : "red"}.
              </p>
              <button type="button" onClick={nextRound} className="btn btn-primary mt-3">
                <PlayIcon className="size-3.5" />
                Next round
              </button>
            </div>
          </div>
        ) : (
          <p className="meta">Click the card you think is the strongest performer to lock in your answer.</p>
        )}
      </div>
    </div>
  );
}
