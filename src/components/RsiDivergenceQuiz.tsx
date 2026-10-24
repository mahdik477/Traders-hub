"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genDivergenceSeries, rsi, findDivergence } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: spot the second of the two points that make up
// the divergence — the one that actually confirms it, since the first
// point alone doesn't tell you anything yet.

const WIDTH = 760;
const PAD = 28;
const N = 70;
const TOP = 20;
const BOTTOM = 280;
const HEIGHT = BOTTOM + 20;
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

export default function RsiDivergenceQuiz() {
  const [seed, setSeed] = useState(100);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const bullish = seed % 2 === 0;
  const closes = useMemo(() => genDivergenceSeries(seed, N, bullish), [seed, bullish]);
  const rsiLine = useMemo(() => rsi(closes, 14), [closes]);
  const divergence = useMemo(() => findDivergence(closes, rsiLine, 4), [closes, rsiLine]);

  const { min, max } = useMemo(() => {
    const vals = rsiLine.filter((v): v is number => v != null);
    return { min: 0, max: Math.max(100, ...vals) };
  }, [rsiLine]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yForOsc = (v: number) => BOTTOM - ((v - min) / (max - min)) * (BOTTOM - TOP);
  const indexFor = (x: number) => Math.round((x - PAD) / xStep);

  const answered = guessIndex != null;
  const isCorrect = divergence != null && guessIndex != null && Math.abs(guessIndex - divergence.oscI2) <= TOLERANCE_BARS;

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered || !divergence) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.max(0, Math.min(N - 1, indexFor(svgX)));
    setGuessIndex(idx);
    setScore((s) => ({
      correct: s.correct + (Math.abs(idx - divergence.oscI2) <= TOLERANCE_BARS ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function nextRound() {
    setSeed((n) => n + 1);
    setGuessIndex(null);
  }

  if (!divergence) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <p className="text-muted">That run didn&apos;t confirm cleanly — try another.</p>
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
          <p className="text-lg font-bold text-foreground">Spot the confirmation</p>
          <p className="meta mt-0.5">
            The first swing is marked — click the RSI line where the second one actually confirms the
            {divergence.bullish ? " bullish" : " bearish"} divergence.
          </p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <path d={pathFor(rsiLine, yForOsc, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <circle cx={PAD + divergence.oscI1 * xStep} cy={yForOsc(rsiLine[divergence.oscI1]!)} r={6} fill="var(--color-muted)" stroke="var(--color-background)" strokeWidth={2} />

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={TOP} y2={BOTTOM} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered && (
            <>
              <line x1={PAD + divergence.oscI1 * xStep} x2={PAD + divergence.oscI2 * xStep} y1={yForOsc(rsiLine[divergence.oscI1]!)} y2={yForOsc(rsiLine[divergence.oscI2]!)} stroke={divergence.bullish ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="5 3" />
              <circle cx={PAD + divergence.oscI2 * xStep} cy={yForOsc(rsiLine[divergence.oscI2]!)} r={7} fill={divergence.bullish ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
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
                The solid dot is the second swing — RSI {divergence.bullish ? "held higher" : "fell lower"} there
                even though price went the other way. That disagreement is the divergence. Your click is the
                dashed line.
              </p>
              <button type="button" onClick={nextRound} className="btn btn-primary mt-3">
                <PlayIcon className="size-3.5" />
                Next round
              </button>
            </div>
          </div>
        ) : (
          <p className="meta mt-4">Tap or click anywhere on the RSI line to lock in your answer.</p>
        )}
      </div>
    </div>
  );
}
