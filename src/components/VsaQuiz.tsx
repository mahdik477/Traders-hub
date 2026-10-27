"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genVsaDemo } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-bar quiz: spot the "stopping volume" bar — narrow spread,
// unusually heavy volume — before the chart marks it for you.

const WIDTH = 760;
const PAD = 28;
const N = 50;
const PRICE_TOP = 16;
const PRICE_BOTTOM = 230;
const VOL_TOP = 250;
const VOL_BOTTOM = 320;
const HEIGHT = VOL_BOTTOM + 16;

export default function VsaQuiz() {
  const [seed, setSeed] = useState(100);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const bullish = seed % 2 === 0;
  const { bars, volumes, signalI } = useMemo(() => genVsaDemo(seed, N, bullish), [seed, bullish]);

  const { min, max } = useMemo(() => {
    const highs = bars.map((b) => b.h);
    const lows = bars.map((b) => b.l);
    return { min: Math.min(...lows) - 0.3, max: Math.max(...highs) + 0.3 };
  }, [bars]);
  const maxVol = Math.max(...volumes);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const candleWidth = xStep * 0.55;
  const yFor = (v: number) => PRICE_BOTTOM - ((v - min) / (max - min)) * (PRICE_BOTTOM - PRICE_TOP);
  const volY = (v: number) => VOL_BOTTOM - (v / maxVol) * (VOL_BOTTOM - VOL_TOP);
  const indexFor = (x: number) => Math.max(0, Math.min(N - 1, Math.round((x - PAD) / xStep)));

  const answered = guessIndex != null;
  const isCorrect = guessIndex === signalI;

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = indexFor(svgX);
    setGuessIndex(idx);
    setScore((s) => ({ correct: s.correct + (idx === signalI ? 1 : 0), total: s.total + 1 }));
  }

  function nextRound() {
    setSeed((n) => n + 1);
    setGuessIndex(null);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-success/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Spot the stopping volume</p>
          <p className="meta mt-0.5">Click the bar with a narrow spread but unusually heavy volume.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click the bar you think is stopping volume" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          {bars.map((b, i) => {
            const x = PAD + i * xStep;
            const up = b.c > b.o;
            const bodyTop = yFor(Math.max(b.o, b.c));
            const bodyBottom = yFor(Math.min(b.o, b.c));
            const isGuess = guessIndex === i;
            const isTarget = answered && i === signalI;
            const color = up ? "var(--color-success)" : "var(--color-danger)";
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={yFor(b.h)} y2={yFor(b.l)} stroke={color} strokeWidth={1.5} />
                <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={Math.max(bodyBottom - bodyTop, 1.5)} fill={color} opacity={0.75} stroke={isTarget ? "var(--color-success)" : isGuess ? (isCorrect ? "var(--color-success)" : "var(--color-danger)") : "none"} strokeWidth={isTarget || isGuess ? 3 : 0} rx={1} />
                <rect x={x - candleWidth / 2} y={volY(volumes[i])} width={candleWidth} height={VOL_BOTTOM - volY(volumes[i])} fill={color} opacity={0.4} />
              </g>
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
                The outlined bar has the narrowest spread paired with the heaviest volume on the chart
                — that combination is the actual signal. Your click is outlined in{" "}
                {isCorrect ? "green" : "red"}.
              </p>
              <button type="button" onClick={nextRound} className="btn btn-primary mt-3">
                <PlayIcon className="size-3.5" />
                Next round
              </button>
            </div>
          </div>
        ) : (
          <p className="meta mt-4">Tap or click the bar you think is stopping volume to lock in your answer.</p>
        )}
      </div>
    </div>
  );
}
