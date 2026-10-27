"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genProfileDemo } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-level quiz: the profile is drawn on from the start (there's
// no way to tell where it is otherwise) — the question is which level is
// actually the point of control.

const WIDTH = 760;
const HEIGHT = 300;
const PAD = 28;
const PROFILE_WIDTH = 110;
const CHART_RIGHT = WIDTH - PROFILE_WIDTH - 10;
const N = 60;

export default function MarketProfileQuiz() {
  const [seed, setSeed] = useState(100);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const { bars, levels, pocPrice } = useMemo(() => genProfileDemo(seed, N), [seed]);
  const pocIndex = useMemo(() => levels.findIndex((l) => l.price === pocPrice), [levels, pocPrice]);

  const { min, max } = useMemo(() => {
    const highs = bars.map((b) => b.h);
    const lows = bars.map((b) => b.l);
    return { min: Math.min(...lows) - 0.3, max: Math.max(...highs) + 0.3 };
  }, [bars]);
  const maxVol = Math.max(...levels.map((l) => l.volume));

  const xStep = (CHART_RIGHT - PAD) / (N - 1);
  const candleWidth = xStep * 0.55;
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  const answered = guessIndex != null;
  const isCorrect = guessIndex === pocIndex;

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgY = ((e.clientY - rect.top) / rect.height) * HEIGHT;
    // Find the nearest level bucket to the clicked y position.
    let best = 0;
    let bestDist = Infinity;
    levels.forEach((l, i) => {
      const dist = Math.abs(yFor(l.price) - svgY);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setGuessIndex(best);
    setScore((s) => ({ correct: s.correct + (best === pocIndex ? 1 : 0), total: s.total + 1 }));
  }

  function nextRound() {
    setSeed((n) => n + 1);
    setGuessIndex(null);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-success/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Spot the point of control</p>
          <p className="meta mt-0.5">Click the profile level you think is the busiest one.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click the level you think is the point of control" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <line x1={CHART_RIGHT} x2={CHART_RIGHT} y1={PAD} y2={HEIGHT - PAD} stroke="var(--color-border)" strokeWidth={1} />
          {bars.map((b, i) => {
            const x = PAD + i * xStep;
            const up = b.c > b.o;
            const bodyTop = yFor(Math.max(b.o, b.c));
            const bodyBottom = yFor(Math.min(b.o, b.c));
            const color = up ? "var(--color-success)" : "var(--color-danger)";
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={yFor(b.h)} y2={yFor(b.l)} stroke={color} strokeWidth={1.2} />
                <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={Math.max(bodyBottom - bodyTop, 1.2)} fill={color} opacity={0.75} rx={1} />
              </g>
            );
          })}
          {levels.map((l, i) => {
            const barWidth = (l.volume / maxVol) * (PROFILE_WIDTH - 10);
            const isTarget = answered && i === pocIndex;
            const isGuess = guessIndex === i;
            return (
              <rect
                key={i}
                x={CHART_RIGHT + 4}
                y={yFor(l.price) - 3}
                width={Math.max(barWidth, 1)}
                height={6}
                fill={isTarget ? "var(--color-success)" : isGuess ? (isCorrect ? "var(--color-success)" : "var(--color-danger)") : "var(--color-gold)"}
                opacity={isTarget || isGuess ? 1 : 0.45}
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
                The green bar is the level with the most time (volume) built up at it over the whole
                window — that&apos;s the point of control. Your click is outlined in{" "}
                {isCorrect ? "green" : "red"}.
              </p>
              <button type="button" onClick={nextRound} className="btn btn-primary mt-3">
                <PlayIcon className="size-3.5" />
                Next round
              </button>
            </div>
          </div>
        ) : (
          <p className="meta mt-4">Tap or click the profile level you think is busiest to lock in your answer.</p>
        )}
      </div>
    </div>
  );
}
