"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genOHLC, ichimoku, findCrossings, toPath } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: Tenkan and Kijun are drawn on from the start —
// the question is only where they actually cross. They can cross more
// than once in a run, so any crossing of the asked-about kind counts.

const WIDTH = 760;
const HEIGHT = 300;
const PAD = 28;
const N = 80;
const TOLERANCE_BARS = 3;

type Mode = "buy" | "sell";

function pickMode(crossings: { up: boolean }[], preferred: Mode): Mode | null {
  const pool = crossings.filter((c) => (preferred === "buy" ? c.up : !c.up));
  if (pool.length > 0) return preferred;
  const fallback = crossings.filter((c) => (preferred === "buy" ? !c.up : c.up));
  return fallback.length > 0 ? (preferred === "buy" ? "sell" : "buy") : null;
}

export default function IchimokuQuiz() {
  const [seed, setSeed] = useState(100);
  const [preferredMode, setPreferredMode] = useState<Mode>("buy");
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const bars = useMemo(() => genOHLC(seed, N), [seed]);
  const closes = useMemo(() => bars.map((b) => b.c), [bars]);
  const { tenkan, kijun } = useMemo(() => ichimoku(bars), [bars]);
  const crossings = useMemo(() => findCrossings(tenkan, kijun), [tenkan, kijun]);
  const mode = useMemo(() => pickMode(crossings, preferredMode), [crossings, preferredMode]);
  const matching = useMemo(() => (mode == null ? [] : crossings.filter((c) => (mode === "buy" ? c.up : !c.up))), [crossings, mode]);

  const { min, max } = useMemo(() => {
    const vals = [tenkan, kijun].flatMap((arr) => arr.filter((v): v is number => v != null));
    const all = closes.concat(vals);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, tenkan, kijun]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);
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
        <p className="text-muted">That run didn&apos;t produce a clean crossover — try another.</p>
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
          <p className="text-lg font-bold text-foreground">Spot the {mode === "buy" ? "bullish" : "bearish"} TK cross</p>
          <p className="meta mt-0.5">
            Click the chart where Tenkan crosses {mode === "buy" ? "above" : "below"} Kijun — any crossing counts.
          </p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <path d={toPath(kijun, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold)" strokeWidth={2} />
          <path d={toPath(tenkan, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2} />

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={PAD} y2={HEIGHT - PAD} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered &&
            matching.map((c) => tenkan[c.i] != null && (
              <circle key={c.i} cx={PAD + c.i * xStep} cy={yFor(tenkan[c.i]!)} r={7} fill={mode === "buy" ? "var(--color-success)" : "var(--color-danger)"} stroke="var(--color-background)" strokeWidth={2} />
            ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold-bright" /> Tenkan-sen
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-gold" /> Kijun-sen
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
                Every solid dot is a bar where Tenkan actually crossed {mode === "buy" ? "above" : "below"} Kijun —
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
