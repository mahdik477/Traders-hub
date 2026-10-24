"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genOHLC, ema, atr, toPath } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: the channel is drawn on from the start (same as
// the simulator) — the question is only where price actually touches it.

const WIDTH = 760;
const HEIGHT = 300;
const PAD = 28;
const N = 80;
const PERIOD = 20;
const MULT = 2;
const TOLERANCE_BARS = 3;

type Mode = "upper" | "lower";

export default function KeltnerQuiz() {
  const [seed, setSeed] = useState(100);
  const [preferredMode, setPreferredMode] = useState<Mode>("upper");
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const bars = useMemo(() => genOHLC(seed, N), [seed]);
  const closes = useMemo(() => bars.map((b) => b.c), [bars]);
  const mid = useMemo(() => ema(closes, PERIOD), [closes]);
  const atrLine = useMemo(() => atr(bars, PERIOD), [bars]);
  const upper = useMemo(() => mid.map((m, i) => (m != null && atrLine[i] != null ? m + MULT * atrLine[i]! : null)), [mid, atrLine]);
  const lower = useMemo(() => mid.map((m, i) => (m != null && atrLine[i] != null ? m - MULT * atrLine[i]! : null)), [mid, atrLine]);

  const touches = useMemo(() => {
    const out: { i: number; band: Mode }[] = [];
    closes.forEach((c, i) => {
      if (upper[i] != null && c >= upper[i]!) out.push({ i, band: "upper" });
      else if (lower[i] != null && c <= lower[i]!) out.push({ i, band: "lower" });
    });
    return out;
  }, [closes, upper, lower]);

  const mode: Mode | null = useMemo(() => {
    const hasPreferred = touches.some((t) => t.band === preferredMode);
    if (hasPreferred) return preferredMode;
    const other = touches.find((t) => t.band !== preferredMode);
    return other ? other.band : null;
  }, [touches, preferredMode]);
  const matchingTouches = useMemo(() => touches.filter((t) => t.band === mode), [touches, mode]);

  const { min, max } = useMemo(() => {
    const all = closes.concat(upper.filter((v): v is number => v != null), lower.filter((v): v is number => v != null));
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, upper, lower]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);
  const indexFor = (x: number) => Math.round((x - PAD) / xStep);

  const answered = guessIndex != null;
  const isCorrect = guessIndex != null && matchingTouches.some((t) => Math.abs(guessIndex - t.i) <= TOLERANCE_BARS);

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered || matchingTouches.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.max(0, Math.min(N - 1, indexFor(svgX)));
    setGuessIndex(idx);
    setScore((s) => ({
      correct: s.correct + (matchingTouches.some((t) => Math.abs(idx - t.i) <= TOLERANCE_BARS) ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function nextRound() {
    setSeed((n) => n + 1);
    setGuessIndex(null);
    setPreferredMode((m) => (m === "upper" ? "lower" : "upper"));
  }

  if (!mode || matchingTouches.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <p className="text-muted">That run didn&apos;t produce a clean touch — try another.</p>
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
          <p className="text-lg font-bold text-foreground">Spot the {mode} channel touch</p>
          <p className="meta mt-0.5">Click the chart where price reaches the {mode} channel line — any touch counts.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <path d={toPath(upper, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-danger)" strokeWidth={1.5} opacity={0.75} />
          <path d={toPath(lower, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-success)" strokeWidth={1.5} opacity={0.75} />
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={PAD} y2={HEIGHT - PAD} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered &&
            matchingTouches.map((t) => (
              <circle key={t.i} cx={PAD + t.i * xStep} cy={yFor(closes[t.i])} r={7} fill={mode === "upper" ? "var(--color-danger)" : "var(--color-success)"} stroke="var(--color-background)" strokeWidth={2} />
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
                Every solid dot is a bar where price actually reached the {mode} channel line — any of
                them counted. Your click is the dashed line.
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
