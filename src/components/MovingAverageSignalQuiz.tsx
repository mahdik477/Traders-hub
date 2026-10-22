"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genSeries, sma, findCrossings, toPath, type Crossing } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: spot where the fast MA actually crosses the slow
// one, for a buy signal (golden cross) or a sell signal (death cross).
// Deliberately doesn't mark the crossings on the chart the way the
// simulator above does — the whole point here is testing whether you can
// read the two lines yourself before the page tells you the answer.

const WIDTH = 760;
const HEIGHT = 300;
const PAD = 28;
const N = 70;
const FAST = 9;
const SLOW = 26;
const TOLERANCE_BARS = 3;

type Mode = "buy" | "sell";

function pickTarget(crossings: Crossing[], preferred: Mode): { mode: Mode; crossing: Crossing } | null {
  const golden = crossings.filter((c) => c.up);
  const death = crossings.filter((c) => !c.up);
  const wantGolden = preferred === "buy";
  const pool = wantGolden ? golden : death;
  const fallback = wantGolden ? death : golden;
  const chosenPool = pool.length > 0 ? pool : fallback;
  if (chosenPool.length === 0) return null;
  const crossing = chosenPool[Math.floor(chosenPool.length / 2)];
  return { mode: crossing.up ? "buy" : "sell", crossing };
}

export default function MovingAverageSignalQuiz() {
  const [seed, setSeed] = useState(100);
  const [preferredMode, setPreferredMode] = useState<Mode>("buy");
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const closes = useMemo(() => genSeries(seed, N), [seed]);
  const fastLine = useMemo(() => sma(closes, FAST), [closes]);
  const slowLine = useMemo(() => sma(closes, SLOW), [closes]);
  const crossings = useMemo(() => findCrossings(fastLine, slowLine), [fastLine, slowLine]);
  const target = useMemo(() => pickTarget(crossings, preferredMode), [crossings, preferredMode]);

  const { min, max } = useMemo(() => {
    const all = closes.concat(
      fastLine.filter((v): v is number => v != null),
      slowLine.filter((v): v is number => v != null),
    );
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, fastLine, slowLine]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);
  const indexFor = (x: number) => Math.round((x - PAD) / xStep);

  const answered = guessIndex != null;
  const isCorrect = target != null && guessIndex != null && Math.abs(guessIndex - target.crossing.i) <= TOLERANCE_BARS;

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered || !target) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.max(0, Math.min(N - 1, indexFor(svgX)));
    setGuessIndex(idx);
    setScore((s) => ({
      correct: s.correct + (Math.abs(idx - target.crossing.i) <= TOLERANCE_BARS ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function nextRound() {
    setSeed((n) => n + 1);
    setGuessIndex(null);
    setPreferredMode((m) => (m === "buy" ? "sell" : "buy"));
  }

  if (!target) {
    // Vanishingly rare with these settings, but a flat-enough run could have
    // no crossings of either kind — just deal a new hand rather than show a
    // broken quiz.
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <p className="text-muted">That run didn&apos;t produce a clean signal — try another.</p>
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
          <p className="text-lg font-bold text-foreground">
            Spot the {target.mode === "buy" ? "buy" : "sell"} signal
          </p>
          <p className="meta mt-0.5">
            Click the chart where the fast line {target.mode === "buy" ? "crosses above" : "crosses below"}{" "}
            the slow line.
          </p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`}
          role="img"
          aria-label="Click where you think the signal happens"
          onClick={handleClick}
        >
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={PAD}
              x2={WIDTH - PAD}
              y1={PAD + f * (HEIGHT - PAD * 2)}
              y2={PAD + f * (HEIGHT - PAD * 2)}
              stroke="var(--color-border)"
              strokeWidth={1}
            />
          ))}
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-muted)" strokeWidth={1.5} opacity={0.5} />
          <path d={toPath(slowLine, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold)" strokeWidth={2.5} />
          <path d={toPath(fastLine, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />

          {guessIndex != null && fastLine[guessIndex] != null && (
            <line
              x1={PAD + guessIndex * xStep}
              x2={PAD + guessIndex * xStep}
              y1={PAD}
              y2={HEIGHT - PAD}
              stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"}
              strokeWidth={2}
              strokeDasharray="4 3"
            />
          )}
          {answered && fastLine[target.crossing.i] != null && (
            <circle
              cx={PAD + target.crossing.i * xStep}
              cy={yFor(fastLine[target.crossing.i]!)}
              r={7}
              fill="var(--color-success)"
              stroke="var(--color-background)"
              strokeWidth={2}
            />
          )}
        </svg>

        {answered ? (
          <div
            className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${
              isCorrect ? "border-success/30 bg-success/8" : "border-danger/30 bg-danger/8"
            }`}
          >
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                isCorrect ? "bg-success text-white" : "bg-danger text-white"
              }`}
            >
              <CheckIcon className="size-4" />
            </span>
            <div className="flex-1">
              <p className={`text-lg font-bold ${isCorrect ? "text-success" : "text-danger"}`}>
                {isCorrect ? "Right on it." : "Not quite."}
              </p>
              <p className="mt-1 text-base leading-relaxed text-foreground/90">
                The real {target.mode === "buy" ? "golden cross" : "death cross"} is marked with the
                solid gold dot — that&apos;s the bar where the fast line actually{" "}
                {target.mode === "buy" ? "closed above" : "closed below"} the slow one. Your click is
                the dashed line.
              </p>
              <button type="button" onClick={nextRound} className="btn btn-primary mt-3">
                <PlayIcon className="size-3.5" />
                Next round
              </button>
            </div>
          </div>
        ) : (
          <p className="meta mt-4">Tap or click anywhere on the chart to lock in your answer.</p>
        )}
      </div>
    </div>
  );
}
