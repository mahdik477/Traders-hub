"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genProfileDemo } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-candle quiz: the profile, the point of control and the
// low-volume node are all drawn on from the start — the question is
// which candle actually trades through the thin level.

const WIDTH = 760;
const HEIGHT = 300;
const PAD = 28;
const PROFILE_WIDTH = 110;
const CHART_RIGHT = WIDTH - PROFILE_WIDTH - 10;
const N = 60;

export default function VolumeProfileQuiz() {
  const [seed, setSeed] = useState(100);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const { bars, levels, pocPrice, lvnPrice, breakoutI } = useMemo(() => genProfileDemo(seed, N), [seed]);

  const { min, max } = useMemo(() => {
    const highs = bars.map((b) => b.h);
    const lows = bars.map((b) => b.l);
    return { min: Math.min(...lows) - 0.3, max: Math.max(...highs) + 0.3 };
  }, [bars]);
  const maxVol = Math.max(...levels.map((l) => l.volume));

  const xStep = (CHART_RIGHT - PAD) / (N - 1);
  const candleWidth = xStep * 0.55;
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);
  const indexFor = (x: number) => Math.max(0, Math.min(N - 1, Math.round((x - PAD) / xStep)));

  const answered = guessIndex != null;
  const isCorrect = guessIndex === breakoutI;

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    if (svgX > CHART_RIGHT) return;
    const idx = indexFor(svgX);
    setGuessIndex(idx);
    setScore((s) => ({ correct: s.correct + (idx === breakoutI ? 1 : 0), total: s.total + 1 }));
  }

  function nextRound() {
    setSeed((n) => n + 1);
    setGuessIndex(null);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-success/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Spot the LVN breakout</p>
          <p className="meta mt-0.5">Click the candle that actually trades through the low-volume node (red line).</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click the candle you think trades through the LVN" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <line x1={CHART_RIGHT} x2={CHART_RIGHT} y1={PAD} y2={HEIGHT - PAD} stroke="var(--color-border)" strokeWidth={1} />
          <line x1={PAD} x2={CHART_RIGHT} y1={yFor(pocPrice)} y2={yFor(pocPrice)} stroke="var(--color-gold)" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
          <line x1={PAD} x2={CHART_RIGHT} y1={yFor(lvnPrice)} y2={yFor(lvnPrice)} stroke="var(--color-danger)" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
          {bars.map((b, i) => {
            const x = PAD + i * xStep;
            const up = b.c > b.o;
            const bodyTop = yFor(Math.max(b.o, b.c));
            const bodyBottom = yFor(Math.min(b.o, b.c));
            const isGuess = guessIndex === i;
            const isTarget = answered && i === breakoutI;
            const color = up ? "var(--color-success)" : "var(--color-danger)";
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={yFor(b.h)} y2={yFor(b.l)} stroke={color} strokeWidth={1.2} />
                <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={Math.max(bodyBottom - bodyTop, 1.2)} fill={color} opacity={0.75} stroke={isTarget ? "var(--color-success)" : isGuess ? (isCorrect ? "var(--color-success)" : "var(--color-danger)") : "none"} strokeWidth={isTarget || isGuess ? 3 : 0} rx={1} />
              </g>
            );
          })}
          {levels.map((l, i) => {
            const barWidth = (l.volume / maxVol) * (PROFILE_WIDTH - 10);
            const isPoc = l.price === pocPrice;
            const isLvn = l.price === lvnPrice;
            return (
              <rect key={i} x={CHART_RIGHT + 4} y={yFor(l.price) - 3} width={Math.max(barWidth, 1)} height={6} fill={isPoc ? "var(--color-gold-bright)" : isLvn ? "var(--color-danger)" : "var(--color-gold)"} opacity={isPoc || isLvn ? 1 : 0.4} />
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
                The outlined candle&apos;s range actually covers the low-volume node — that&apos;s the
                real crossing. Your click is outlined in {isCorrect ? "green" : "red"}.
              </p>
              <button type="button" onClick={nextRound} className="btn btn-primary mt-3">
                <PlayIcon className="size-3.5" />
                Next round
              </button>
            </div>
          </div>
        ) : (
          <p className="meta mt-4">Tap or click the candle you think crosses the LVN to lock in your answer.</p>
        )}
      </div>
    </div>
  );
}
