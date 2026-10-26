"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genGapDemo } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-candle quiz: the gap itself is marked (it's not the thing
// being tested) — the question is which later candle actually pulls back
// and fills it, closing back at or past the pre-gap level.

const WIDTH = 760;
const HEIGHT = 300;
const PAD = 28;
const N = 50;

export default function GapFillQuiz() {
  const [seed, setSeed] = useState(100);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Always a filling run here — there's nothing to "spot filling" in a
  // gap-and-go round.
  const { bars, gapI, up, fillI } = useMemo(() => genGapDemo(seed, N, true), [seed]);

  const { min, max } = useMemo(() => {
    const highs = bars.map((b) => b.h);
    const lows = bars.map((b) => b.l);
    return { min: Math.min(...lows) - 0.5, max: Math.max(...highs) + 0.5 };
  }, [bars]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const candleWidth = xStep * 0.55;
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);
  const indexFor = (x: number) => Math.max(0, Math.min(N - 1, Math.round((x - PAD) / xStep)));
  const preGapClose = bars[gapI - 1].c;

  const answered = guessIndex != null;
  const isCorrect = fillI != null && guessIndex === fillI;

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered || fillI == null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = indexFor(svgX);
    setGuessIndex(idx);
    setScore((s) => ({ correct: s.correct + (idx === fillI ? 1 : 0), total: s.total + 1 }));
  }

  function nextRound() {
    setSeed((n) => n + 1);
    setGuessIndex(null);
  }

  if (fillI == null) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <p className="text-muted">That run didn&apos;t fill cleanly — try another.</p>
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
          <p className="text-lg font-bold text-foreground">Spot the fill</p>
          <p className="meta mt-0.5">The gap is marked — click the candle that actually pulls back and fills it.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click the candle you think fills the gap" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <line x1={PAD} x2={WIDTH - PAD} y1={yFor(preGapClose)} y2={yFor(preGapClose)} stroke="var(--color-gold)" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
          {bars.map((b, i) => {
            const x = PAD + i * xStep;
            const bullish = b.c > b.o;
            const bodyTop = yFor(Math.max(b.o, b.c));
            const bodyBottom = yFor(Math.min(b.o, b.c));
            const isGap = i === gapI;
            const isGuess = guessIndex === i;
            const isTarget = answered && i === fillI;
            const color = bullish ? "var(--color-success)" : "var(--color-danger)";
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={yFor(b.h)} y2={yFor(b.l)} stroke={color} strokeWidth={1.5} />
                <rect
                  x={x - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={Math.max(bodyBottom - bodyTop, 1.5)}
                  fill={color}
                  opacity={isGap ? 1 : 0.75}
                  stroke={isTarget ? "var(--color-success)" : isGap ? "var(--color-gold-bright)" : isGuess ? (isCorrect ? "var(--color-success)" : "var(--color-danger)") : "none"}
                  strokeWidth={isTarget || isGap || isGuess ? 3 : 0}
                  rx={1}
                />
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 border-t border-dashed border-gold" /> Pre-gap close
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm border-2 border-gold-bright" /> The gap
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
                The green-outlined candle is the one that actually closes back at the pre-gap level
                (the dashed line) after gapping {up ? "up" : "down"}. Your click is outlined in{" "}
                {isCorrect ? "green" : "red"}.
              </p>
              <button type="button" onClick={nextRound} className="btn btn-primary mt-3">
                <PlayIcon className="size-3.5" />
                Next round
              </button>
            </div>
          </div>
        ) : (
          <p className="meta mt-4">Tap or click the candle you think fills the gap to lock in your answer.</p>
        )}
      </div>
    </div>
  );
}
