"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genElderScreenDemo } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: screens 1 and 2 (the bigger trend and the
// pullback low) are marked — the question is only where screen 3's
// entry trigger actually fires, once the pullback is genuinely over.

const WIDTH = 760;
const PAD = 28;
const N = 80;
const HTF_TOP = 10;
const HTF_BOTTOM = 70;
const LTF_TOP = 96;
const LTF_BOTTOM = 280;
const HEIGHT = LTF_BOTTOM + 16;
const TOLERANCE_BARS = 3;

function pathFor(values: (number | null)[], yFn: (v: number) => number, xStep: number) {
  let d = "";
  let drawing = false;
  values.forEach((v, i) => {
    if (v == null) {
      drawing = false;
      return;
    }
    const x = PAD + i * xStep;
    const y = yFn(v);
    d += drawing ? ` L ${x} ${y}` : `M ${x} ${y}`;
    drawing = true;
  });
  return d;
}

export default function ElderScreenQuiz() {
  const [seed, setSeed] = useState(100);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const { htfTrend, ltf, dipI, triggerI, up } = useMemo(() => genElderScreenDemo(seed, N), [seed]);

  const htfRange = useMemo(() => ({ min: Math.min(...htfTrend) - 1, max: Math.max(...htfTrend) + 1 }), [htfTrend]);
  const ltfRange = useMemo(() => ({ min: Math.min(...ltf) - 1, max: Math.max(...ltf) + 1 }), [ltf]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yForHtf = (v: number) => HTF_BOTTOM - ((v - htfRange.min) / (htfRange.max - htfRange.min)) * (HTF_BOTTOM - HTF_TOP);
  const yForLtf = (v: number) => LTF_BOTTOM - ((v - ltfRange.min) / (ltfRange.max - ltfRange.min)) * (LTF_BOTTOM - LTF_TOP);
  const indexFor = (x: number) => Math.round((x - PAD) / xStep);

  const answered = guessIndex != null;
  const isCorrect = guessIndex != null && Math.abs(guessIndex - triggerI) <= TOLERANCE_BARS;

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.max(0, Math.min(N - 1, indexFor(svgX)));
    setGuessIndex(idx);
    setScore((s) => ({
      correct: s.correct + (Math.abs(idx - triggerI) <= TOLERANCE_BARS ? 1 : 0),
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
          <p className="text-lg font-bold text-foreground">Spot the entry trigger</p>
          <p className="meta mt-0.5">The trend and the pullback low are marked — click where the entry trigger actually fires.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <text x={PAD} y={HTF_TOP - 1} fontSize={11} fill="var(--color-muted)">
            Screen 1 — higher timeframe trend
          </text>
          <path d={pathFor(htfTrend, yForHtf, xStep)} fill="none" stroke="var(--color-gold)" strokeWidth={2} />

          <text x={PAD} y={LTF_TOP - 1} fontSize={11} fill="var(--color-muted)">
            Screen 2 — lower timeframe pullback
          </text>
          <path d={pathFor(ltf, yForLtf, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <circle cx={PAD + dipI * xStep} cy={yForLtf(ltf[dipI])} r={5} fill="var(--color-muted)" stroke="var(--color-background)" strokeWidth={2} />

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={LTF_TOP} y2={LTF_BOTTOM} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered && (
            <circle cx={PAD + triggerI * xStep} cy={yForLtf(ltf[triggerI])} r={7} fill={up ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
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
                The solid dot is where price breaks back out of its short-term range in the trend&apos;s
                direction — screen 3&apos;s confirmation. Your click is the dashed line.
              </p>
              <button type="button" onClick={nextRound} className="btn btn-primary mt-3">
                <PlayIcon className="size-3.5" />
                Next round
              </button>
            </div>
          </div>
        ) : (
          <p className="meta mt-4">Tap or click anywhere on the lower panel to lock in your answer.</p>
        )}
      </div>
    </div>
  );
}
