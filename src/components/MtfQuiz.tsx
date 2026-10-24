"use client";

import { useMemo, useState } from "react";
import { genMtfDemo, toPath } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-aligned-entry quiz: given the higher-timeframe trend, pick
// which of the three lower-timeframe candidates actually continues in
// its direction, before the chart marks it for you.

const HTF_WIDTH = 760;
const HTF_HEIGHT = 140;
const PAD = 16;
const CAND_WIDTH = 320;
const CAND_HEIGHT = 110;

export default function MtfQuiz() {
  const [seed, setSeed] = useState(100);
  const [guessIdx, setGuessIdx] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const { htfTrend, candidates, correctIdx } = useMemo(() => genMtfDemo(seed, 40), [seed]);
  const htfMin = Math.min(...htfTrend) - 1;
  const htfMax = Math.max(...htfTrend) + 1;

  const answered = guessIdx != null;
  const isCorrect = guessIdx === correctIdx;

  function pick(i: number) {
    if (answered) return;
    setGuessIdx(i);
    setScore((s) => ({ correct: s.correct + (i === correctIdx ? 1 : 0), total: s.total + 1 }));
  }

  function nextRound() {
    setSeed((n) => n + 1);
    setGuessIdx(null);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-success/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Spot the aligned entry</p>
          <p className="meta mt-0.5">Click the lower-timeframe candidate that actually agrees with the higher-timeframe trend.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <p className="eyebrow">Higher timeframe (the trend)</p>
        <svg viewBox={`0 0 ${HTF_WIDTH} ${HTF_HEIGHT}`} className="mt-2 w-full" role="img" aria-label="Higher timeframe trend chart">
          <path d={toPath(htfTrend, htfMin, htfMax, HTF_WIDTH, HTF_HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
        </svg>

        <p className="eyebrow mt-5">Lower timeframe — which one agrees?</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {candidates.map((c, i) => {
            const min = Math.min(...c.values) - 1;
            const max = Math.max(...c.values) + 1;
            const isGuess = guessIdx === i;
            const isTarget = answered && i === correctIdx;
            return (
              <button
                key={i}
                type="button"
                onClick={() => pick(i)}
                disabled={answered}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  isTarget ? "border-success bg-success/8" : isGuess ? "border-danger bg-danger/8" : "border-border bg-surface hover:border-accent/50"
                } ${answered ? "cursor-default" : "cursor-pointer"}`}
              >
                <svg viewBox={`0 0 ${CAND_WIDTH} ${CAND_HEIGHT}`} className="w-full" role="img" aria-label={`Lower timeframe candidate ${i + 1}`}>
                  <path d={toPath(c.values, min, max, CAND_WIDTH, CAND_HEIGHT, PAD)} fill="none" stroke={isTarget ? "var(--color-success)" : "var(--color-gold-bright)"} strokeWidth={2} />
                </svg>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {answered ? (
            <div className={`flex items-start gap-3 rounded-xl border p-4 ${isCorrect ? "border-success/30 bg-success/8" : "border-danger/30 bg-danger/8"}`}>
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${isCorrect ? "bg-success text-white" : "bg-danger text-white"}`}>
                <CheckIcon className="size-4" />
              </span>
              <div className="flex-1">
                <p className={`text-lg font-bold ${isCorrect ? "text-success" : "text-danger"}`}>{isCorrect ? "Right on it." : "Not quite."}</p>
                <p className="mt-1 text-base leading-relaxed text-foreground/90">
                  The outlined candidate pulls back and then actually resumes in the higher-timeframe&apos;s
                  direction — the other two are a reversal and sideways chop that just don&apos;t agree
                  with the bigger trend. Your pick is outlined in {isCorrect ? "green" : "red"}.
                </p>
                <button type="button" onClick={nextRound} className="btn btn-primary mt-3">
                  <PlayIcon className="size-3.5" />
                  Next round
                </button>
              </div>
            </div>
          ) : (
            <p className="meta">Click the candidate you think agrees with the trend to lock in your answer.</p>
          )}
        </div>
      </div>
    </div>
  );
}
