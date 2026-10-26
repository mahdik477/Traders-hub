"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genSeries, roc, findCrossings, type Crossing } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: spot where ROC actually crosses the zero line.
// It can cross more than once in a run, so any crossing in the
// asked-about direction counts, not just one.

const WIDTH = 760;
const PAD = 28;
const N = 80;
const PERIOD = 10;
const TOP = 20;
const BOTTOM = 280;
const HEIGHT = BOTTOM + 20;
const TOLERANCE_BARS = 3;

type Mode = "up" | "down";

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

function pickMode(crossings: Crossing[], preferred: Mode): Mode | null {
  const pool = crossings.filter((c) => (preferred === "up" ? c.up : !c.up));
  if (pool.length > 0) return preferred;
  const fallback = crossings.filter((c) => (preferred === "up" ? !c.up : c.up));
  return fallback.length > 0 ? (preferred === "up" ? "down" : "up") : null;
}

export default function RocQuiz() {
  const [seed, setSeed] = useState(100);
  const [preferredMode, setPreferredMode] = useState<Mode>("up");
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const closes = useMemo(() => genSeries(seed, N), [seed]);
  const rocLine = useMemo(() => roc(closes, PERIOD), [closes]);
  const zero = useMemo(() => rocLine.map(() => 0), [rocLine]);
  const crossings = useMemo(() => findCrossings(rocLine, zero), [rocLine, zero]);
  const mode = useMemo(() => pickMode(crossings, preferredMode), [crossings, preferredMode]);
  const matching = useMemo(() => (mode == null ? [] : crossings.filter((c) => (mode === "up" ? c.up : !c.up))), [crossings, mode]);

  const { omin, omax } = useMemo(() => {
    const vals = rocLine.filter((v): v is number => v != null);
    const m = Math.max(2, Math.max(...vals.map(Math.abs)) * 1.15);
    return { omin: -m, omax: m };
  }, [rocLine]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yForOsc = (v: number) => BOTTOM - ((v - omin) / (omax - omin)) * (BOTTOM - TOP);
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
    setPreferredMode((m) => (m === "up" ? "down" : "up"));
  }

  if (!mode || matching.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <p className="text-muted">That run didn&apos;t produce a clean crossing — try another.</p>
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
          <p className="text-lg font-bold text-foreground">Spot the momentum shift</p>
          <p className="meta mt-0.5">
            Click the ROC line where it crosses {mode === "up" ? "above" : "below"} zero — any crossing counts.
          </p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <line x1={PAD} x2={WIDTH - PAD} y1={yForOsc(0)} y2={yForOsc(0)} stroke="var(--color-border)" strokeWidth={1.5} />
          <path d={pathFor(rocLine, yForOsc, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={TOP} y2={BOTTOM} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered &&
            matching.map((c) => rocLine[c.i] != null && (
              <circle key={c.i} cx={PAD + c.i * xStep} cy={yForOsc(rocLine[c.i]!)} r={7} fill={mode === "up" ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
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
                Every solid dot is a bar where ROC actually crossed {mode === "up" ? "above" : "below"} zero —
                any of them counted. Your click is the dashed line.
              </p>
              <button type="button" onClick={nextRound} className="btn btn-primary mt-3">
                <PlayIcon className="size-3.5" />
                Next round
              </button>
            </div>
          </div>
        ) : (
          <p className="meta mt-4">Tap or click anywhere on the ROC line to lock in your answer.</p>
        )}
      </div>
    </div>
  );
}
