"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons";

// A single multiple-choice question reinforcing the topic just covered —
// click an answer, see immediately whether it's right, with a one-line
// explanation either way. Not scored or saved anywhere; it's a check, not
// a test.
export default function MiniQuiz({
  id,
  question,
  options,
  correctIndex,
  explanation,
}: {
  id?: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked != null;
  const isCorrect = picked === correctIndex;

  return (
    <div id={id} className="scroll-mt-24 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-accent">
        <CheckIcon className="size-4" />
        Quick check
      </p>
      <p className="mt-2 text-lg font-semibold text-foreground">{question}</p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((opt, i) => {
          const isPicked = picked === i;
          const showCorrect = answered && i === correctIndex;
          const showWrong = answered && isPicked && i !== correctIndex;
          return (
            <button
              key={opt}
              type="button"
              disabled={answered}
              onClick={() => setPicked(i)}
              className={`min-h-12 rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                showCorrect
                  ? "border-success bg-success/10 text-success"
                  : showWrong
                    ? "border-danger bg-danger/10 text-danger"
                    : "border-border-strong bg-background text-foreground hover:border-accent/50 disabled:cursor-default"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <p className={`mt-4 text-sm leading-relaxed ${isCorrect ? "text-success" : "text-muted"}`}>
          <strong className="font-semibold">{isCorrect ? "Right. " : "Not quite. "}</strong>
          {explanation}
        </p>
      )}
    </div>
  );
}
