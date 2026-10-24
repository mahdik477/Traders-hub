"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genSeries, findPivots, toPath, type Pivot } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: the trendline is drawn on from the start (there's
// no guessing which line it is) — the question is only where price actually
// comes back and touches it.

const WIDTH = 760;
const HEIGHT = 300;
const PAD = 28;
const N = 80;
const STRENGTH = 3;
const TOLERANCE_BARS = 3;

function trendlineFrom(pivots: Pivot[]) {
  const lows = pivots.filter((p) => !p.high);
  const highs = pivots.filter((p) => p.high);
  const useLows = lows.length >= 2;
  const points = useLows ? lows.slice(-2) : highs.slice(-2);
  if (points.length < 2) return null;
  const [p1, p2] = points;
  const slope = (p2.value - p1.value) / (p2.i - p1.i);
  const intercept = p1.value - slope * p1.i;
  return { slope, intercept, up: useLows, startI: p1.i };
}

export default function TrendlineQuiz() {
  const [seed, setSeed] = useState(100);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const closes = useMemo(() => genSeries(seed, N), [seed]);
  const pivots = useMemo(() => findPivots(closes, STRENGTH), [closes]);
  const line = useMemo(() => trendlineFrom(pivots), [pivots]);
  const lineValues = useMemo(
    () => (line ? closes.map((_, i) => (i >= line.startI ? line.slope * i + line.intercept : null)) : closes.map(() => null)),
    [closes, line],
  );

  const { min, max } = useMemo(() => {
    const lineVals = lineValues.filter((v): v is number => v != null);
    const all = closes.concat(lineVals);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, lineValues]);

  const tolerance = (max - min) * 0.02;
  const touches = useMemo(() => {
    if (!line) return [];
    const out: number[] = [];
    closes.forEach((c, i) => {
      const lv = lineValues[i];
      if (lv != null && i > line.startI + 3 && Math.abs(c - lv) <= tolerance) out.push(i);
    });
    return out;
  }, [closes, lineValues, line, tolerance]);

  // A trendline usually gets touched more than once — any of those
  // touches is a genuinely correct answer, not just one chosen one.
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);
  const indexFor = (x: number) => Math.round((x - PAD) / xStep);

  const answered = guessIndex != null;
  const isCorrect = guessIndex != null && touches.some((i) => Math.abs(guessIndex - i) <= TOLERANCE_BARS);

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered || touches.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.max(0, Math.min(N - 1, indexFor(svgX)));
    setGuessIndex(idx);
    setScore((s) => ({
      correct: s.correct + (touches.some((i) => Math.abs(idx - i) <= TOLERANCE_BARS) ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function nextRound() {
    setSeed((n) => n + 1);
    setGuessIndex(null);
  }

  if (touches.length === 0 || !line) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <p className="text-muted">That run didn&apos;t produce a clean trendline touch — try another.</p>
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
          <p className="text-lg font-bold text-foreground">Spot the trendline touch</p>
          <p className="meta mt-0.5">
            Click the chart where price comes back and touches the {line.up ? "rising support" : "falling resistance"} line — any touch counts.
          </p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          <path d={toPath(lineValues, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold)" strokeWidth={2} strokeDasharray="7 4" />
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={PAD} y2={HEIGHT - PAD} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered &&
            touches.map((i) => (
              <circle key={i} cx={PAD + i * xStep} cy={yFor(closes[i])} r={7} fill={line.up ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
            ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 border-t-2 border-dashed border-gold" /> Trendline ({line.up ? "rising support" : "falling resistance"})
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
                Every solid dot is a bar where price actually reached the trendline — any of them
                counted. Your click is the dashed vertical line.
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
