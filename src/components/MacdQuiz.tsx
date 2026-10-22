"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genSeries, ema, emaSkipNulls, findCrossings, type Crossing } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: spot where MACD actually crosses the signal
// line, before the chart marks it for you.

const WIDTH = 760;
const PAD = 28;
const N = 90;
const FAST = 12;
const SLOW = 26;
const SIGNAL_PERIOD = 9;
const TOP = 20;
const BOTTOM = 280;
const HEIGHT = BOTTOM + 20;
const TOLERANCE_BARS = 3;

type Mode = "buy" | "sell";

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

function pickTarget(crossings: Crossing[], preferred: Mode): { mode: Mode; crossing: Crossing } | null {
  const bull = crossings.filter((c) => c.up);
  const bear = crossings.filter((c) => !c.up);
  const pool = preferred === "buy" ? bull : bear;
  const fallback = preferred === "buy" ? bear : bull;
  const chosen = pool.length > 0 ? pool : fallback;
  if (chosen.length === 0) return null;
  const crossing = chosen[Math.floor(chosen.length / 2)];
  return { mode: crossing.up ? "buy" : "sell", crossing };
}

export default function MacdQuiz() {
  const [seed, setSeed] = useState(100);
  const [preferredMode, setPreferredMode] = useState<Mode>("buy");
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const closes = useMemo(() => genSeries(seed, N), [seed]);
  const macdLine = useMemo(() => {
    const fastE = ema(closes, FAST);
    const slowE = ema(closes, SLOW);
    return fastE.map((v, i) => (v != null && slowE[i] != null ? v - slowE[i]! : null));
  }, [closes]);
  const signalLine = useMemo(() => emaSkipNulls(macdLine, SIGNAL_PERIOD), [macdLine]);
  const crossings = useMemo(() => findCrossings(macdLine, signalLine), [macdLine, signalLine]);
  const target = useMemo(() => pickTarget(crossings, preferredMode), [crossings, preferredMode]);

  const { mmin, mmax } = useMemo(() => {
    const all = macdLine.concat(signalLine).filter((v): v is number => v != null);
    const m = Math.max(Math.abs(Math.min(...all)), Math.abs(Math.max(...all))) * 1.15 || 1;
    return { mmin: -m, mmax: m };
  }, [macdLine, signalLine]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yForMacd = (v: number) => BOTTOM - ((v - mmin) / (mmax - mmin)) * (BOTTOM - TOP);
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
          <p className="text-lg font-bold text-foreground">Spot the {target.mode} signal</p>
          <p className="meta mt-0.5">
            Click the chart where MACD {target.mode === "buy" ? "crosses above" : "crosses below"} the
            signal line.
          </p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <line x1={PAD} x2={WIDTH - PAD} y1={yForMacd(0)} y2={yForMacd(0)} stroke="var(--color-border)" strokeWidth={1.5} />
          <path d={pathFor(signalLine, yForMacd, xStep)} fill="none" stroke="var(--color-gold)" strokeWidth={2.5} />
          <path d={pathFor(macdLine, yForMacd, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={TOP} y2={BOTTOM} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered && macdLine[target.crossing.i] != null && (
            <circle cx={PAD + target.crossing.i * xStep} cy={yForMacd(macdLine[target.crossing.i]!)} r={7} fill={target.mode === "buy" ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
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
                The solid dot marks the bar where MACD actually {target.mode === "buy" ? "closed above" : "closed below"} the
                signal line. Your click is the dashed line.
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
