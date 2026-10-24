"use client";

import { useState } from "react";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A written multiple-choice quiz — used for the handful of strategies on
// this page that aren't really a chart pattern at all (a framework like
// Dow Theory, or a comparison of holding periods like trading styles).
// Same "test yourself" slot as every chart-click quiz elsewhere, just
// without a chart to click, since forcing one here would mean inventing a
// signal that isn't actually there.

export type WrittenQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export default function WrittenQuiz({ questions }: { questions: WrittenQuestion[] }) {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const q = questions[round % questions.length];
  const answered = picked != null;
  const isCorrect = picked === q.correctIndex;

  function pick(i: number) {
    if (answered) return;
    setPicked(i);
    setScore((s) => ({ correct: s.correct + (i === q.correctIndex ? 1 : 0), total: s.total + 1 }));
  }

  function nextRound() {
    setRound((r) => r + 1);
    setPicked(null);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-success/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <p className="text-lg font-bold text-foreground">Test yourself</p>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-lg font-semibold leading-snug text-foreground">{q.prompt}</p>
        <div className="mt-4 grid grid-cols-1 gap-2.5">
          {q.options.map((opt, i) => {
            const isPicked = picked === i;
            const isRight = answered && i === q.correctIndex;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => pick(i)}
                disabled={answered}
                className={`rounded-xl border p-3 text-left text-base transition-colors ${
                  isRight
                    ? "border-success bg-success/8 text-foreground"
                    : isPicked
                      ? "border-danger bg-danger/8 text-foreground"
                      : "border-border-strong bg-surface text-foreground/90 hover:border-accent/50"
                } ${answered ? "cursor-default" : "cursor-pointer"}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {answered ? (
          <div className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${isCorrect ? "border-success/30 bg-success/8" : "border-danger/30 bg-danger/8"}`}>
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${isCorrect ? "bg-success text-white" : "bg-danger text-white"}`}>
              <CheckIcon className="size-4" />
            </span>
            <div className="flex-1">
              <p className={`text-lg font-bold ${isCorrect ? "text-success" : "text-danger"}`}>{isCorrect ? "Right on it." : "Not quite."}</p>
              <p className="mt-1 text-base leading-relaxed text-foreground/90">{q.explanation}</p>
              <button type="button" onClick={nextRound} className="btn btn-primary mt-3">
                <PlayIcon className="size-3.5" />
                Next question
              </button>
            </div>
          </div>
        ) : (
          <p className="meta mt-4">Pick an answer to lock it in.</p>
        )}
      </div>
    </div>
  );
}
