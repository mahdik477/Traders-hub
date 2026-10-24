"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genOHLC, williamsR, findCrossings, type Crossing } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: spot where Williams %R actually crosses back
// out of overbought/oversold. %R can cross a threshold more than once in
// a run, so any crossing of the asked-about kind counts, not just one.

const WIDTH = 760;
const PAD = 28;
const N = 80;
const PERIOD = 14;
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

function pickMode(buy: Crossing[], sell: Crossing[], preferred: Mode): Mode | null {
  const pool = preferred === "buy" ? buy : sell;
  if (pool.length > 0) return preferred;
  const fallback = preferred === "buy" ? sell : buy;
  return fallback.length > 0 ? (preferred === "buy" ? "sell" : "buy") : null;
}

export default function WilliamsRQuiz() {
  const [seed, setSeed] = useState(100);
  const [preferredMode, setPreferredMode] = useState<Mode>("buy");
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const bars = useMemo(() => genOHLC(seed, N), [seed]);
  const wr = useMemo(() => williamsR(bars, PERIOD), [bars]);
  const minus20 = useMemo(() => wr.map(() => -20), [wr]);
  const minus80 = useMemo(() => wr.map(() => -80), [wr]);
  const buySignals = useMemo(() => findCrossings(wr, minus80).filter((c) => c.up), [wr, minus80]);
  const sellSignals = useMemo(() => findCrossings(wr, minus20).filter((c) => !c.up), [wr, minus20]);
  const mode = useMemo(() => pickMode(buySignals, sellSignals, preferredMode), [buySignals, sellSignals, preferredMode]);
  const matching = useMemo(() => (mode === "buy" ? buySignals : mode === "sell" ? sellSignals : []), [mode, buySignals, sellSignals]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yForOsc = (v: number) => BOTTOM - ((v + 100) / 100) * (BOTTOM - TOP);
  const indexFor = (x: number) => Math.round((x - PAD) / xStep);

  const answered = guessIndex != null;
  const isCorrect = guessIndex != null && matching.some((c) => Math.abs(guessIndex - c.i) <= TOLERANCE_BARS);

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered || matching.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.max(0, Math.min(N - 1, indexFor(svgX)));
    setGuessIndex(idx);
    setScore((s) => ({
      correct: s.correct + (matching.some((c) => Math.abs(idx - c.i) <= TOLERANCE_BARS) ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function nextRound() {
    setSeed((n) => n + 1);
    setGuessIndex(null);
    setPreferredMode((m) => (m === "buy" ? "sell" : "buy"));
  }

  if (!mode || matching.length === 0) {
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
          <p className="text-lg font-bold text-foreground">Spot the {mode} signal</p>
          <p className="meta mt-0.5">
            Click the %R line where it crosses back {mode === "buy" ? "above −80" : "below −20"} — any crossing counts.
          </p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <line x1={PAD} x2={WIDTH - PAD} y1={yForOsc(-20)} y2={yForOsc(-20)} stroke="var(--color-danger)" strokeWidth={1.5} strokeDasharray="5 3" />
          <line x1={PAD} x2={WIDTH - PAD} y1={yForOsc(-80)} y2={yForOsc(-80)} stroke="var(--color-success)" strokeWidth={1.5} strokeDasharray="5 3" />
          <path d={pathFor(wr, yForOsc, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={TOP} y2={BOTTOM} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered &&
            matching.map((c) => wr[c.i] != null && (
              <circle key={c.i} cx={PAD + c.i * xStep} cy={yForOsc(wr[c.i]!)} r={7} fill={mode === "buy" ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
            ))}
        </svg>

        {answered ? (
          <div className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${isCorrect ? "border-success/30 bg-success/8" : "border-danger/30 bg-danger/8"}`}>
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${isCorrect ? "bg-success text-white" : "bg-danger text-white"}`}>
              <CheckIcon className="size-4" />
            </span>
            <div className="flex-1">
              <p className={`text-lg font-bold ${isCorrect ? "text-success" : "text-danger"}`}>{isCorrect ? "Right on it." : "Not quite."}</p>
              <p className="mt-1 text-base leading-relaxed text-foreground/90">
                Every solid dot is a bar where %R actually {mode === "buy" ? "closed back above −80" : "closed back below −20"} —
                any of them counted. Your click is the dashed line.
              </p>
              <button type="button" onClick={nextRound} className="btn btn-primary mt-3">
                <PlayIcon className="size-3.5" />
                Next round
              </button>
            </div>
          </div>
        ) : (
          <p className="meta mt-4">Tap or click anywhere on the %R line to lock in your answer.</p>
        )}
      </div>
    </div>
  );
}
