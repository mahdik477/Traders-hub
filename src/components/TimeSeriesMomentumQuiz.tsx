"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genSeries, roc, findCrossings } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: the momentum oscillator is drawn on from the
// start — the question is only where it actually flips across zero. It
// can flip more than once in a run, so any flip of the asked-about kind
// counts.

const WIDTH = 760;
const PRICE_TOP = 16;
const PRICE_BOTTOM = 140;
const OSC_TOP = 176;
const OSC_BOTTOM = 300;
const HEIGHT = 316;
const PAD = 28;
const N = 80;
const PERIOD = 20;
const TOLERANCE_BARS = 3;

type Mode = "long" | "short";

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
    d += drawing ? ` L ${x} ${y}` : ` M ${x} ${y}`;
    drawing = true;
  });
  return d;
}

function pickMode(crossings: { up: boolean }[], preferred: Mode): Mode | null {
  const pool = crossings.filter((c) => (preferred === "long" ? c.up : !c.up));
  if (pool.length > 0) return preferred;
  const fallback = crossings.filter((c) => (preferred === "long" ? !c.up : c.up));
  return fallback.length > 0 ? (preferred === "long" ? "short" : "long") : null;
}

export default function TimeSeriesMomentumQuiz() {
  const [seed, setSeed] = useState(100);
  const [preferredMode, setPreferredMode] = useState<Mode>("long");
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const closes = useMemo(() => genSeries(seed, N), [seed]);
  const momentum = useMemo(() => roc(closes, PERIOD), [closes]);
  const zeroLine = useMemo(() => momentum.map((v) => (v == null ? null : 0)), [momentum]);
  const crossings = useMemo(() => findCrossings(momentum, zeroLine), [momentum, zeroLine]);
  const mode = useMemo(() => pickMode(crossings, preferredMode), [crossings, preferredMode]);
  const matching = useMemo(() => (mode == null ? [] : crossings.filter((c) => (mode === "long" ? c.up : !c.up))), [crossings, mode]);

  const priceRange = useMemo(() => ({ min: Math.min(...closes) - 1, max: Math.max(...closes) + 1 }), [closes]);
  const oscVals = momentum.filter((v): v is number => v != null);
  const oscRange = useMemo(() => {
    const maxAbs = Math.max(...oscVals.map((v) => Math.abs(v)), 1);
    return { min: -maxAbs * 1.1, max: maxAbs * 1.1 };
  }, [oscVals]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yForPrice = (v: number) => PRICE_BOTTOM - ((v - priceRange.min) / (priceRange.max - priceRange.min)) * (PRICE_BOTTOM - PRICE_TOP);
  const yForOsc = (v: number) => OSC_BOTTOM - ((v - oscRange.min) / (oscRange.max - oscRange.min)) * (OSC_BOTTOM - OSC_TOP);
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
    setPreferredMode((m) => (m === "long" ? "short" : "long"));
  }

  if (!mode || matching.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <p className="text-muted">That run didn&apos;t produce a clean flip — try another.</p>
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
          <p className="text-lg font-bold text-foreground">Spot the flip to {mode}</p>
          <p className="meta mt-0.5">Click the chart where momentum crosses {mode === "long" ? "above" : "below"} zero — any flip counts.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <path d={pathFor(closes, yForPrice, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <line x1={PAD} x2={WIDTH - PAD} y1={yForOsc(0)} y2={yForOsc(0)} stroke="var(--color-border)" strokeWidth={1.5} />
          <path d={pathFor(momentum, yForOsc, xStep)} fill="none" stroke="var(--color-accent)" strokeWidth={2} />

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={PRICE_TOP} y2={OSC_BOTTOM} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered &&
            matching.map((c) => momentum[c.i] != null && (
              <circle key={c.i} cx={PAD + c.i * xStep} cy={yForOsc(momentum[c.i]!)} r={6} fill={mode === "long" ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
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
                Every solid dot is a bar where momentum actually flipped {mode === "long" ? "positive" : "negative"} —
                any of them counted. Your click is the dashed line.
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
