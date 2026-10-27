"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genOHLC, genVolume, vwap, findPivots, toPath } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: anchored VWAP is drawn on from the start (same
// as the simulator) — the question is only where price actually comes
// back and touches it. It can get touched more than once, so any touch
// counts.

const WIDTH = 760;
const HEIGHT = 300;
const PAD = 28;
const N = 80;
const TOLERANCE_BARS = 3;

export default function AnchoredVwapQuiz() {
  const [seed, setSeed] = useState(100);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const bars = useMemo(() => genOHLC(seed, N), [seed]);
  const closes = useMemo(() => bars.map((b) => b.c), [bars]);
  const volumes = useMemo(() => genVolume(seed, bars), [seed, bars]);
  const pivots = useMemo(() => findPivots(closes, 4), [closes]);
  const anchorI = useMemo(() => {
    const lows = pivots.filter((p) => !p.high);
    return lows.length ? lows[0].i : 10;
  }, [pivots]);

  const anchoredVwap = useMemo(() => {
    const barsFromAnchor = bars.slice(anchorI);
    const volsFromAnchor = volumes.slice(anchorI);
    const vw = vwap(barsFromAnchor, volsFromAnchor);
    return bars.map((_, i) => (i < anchorI ? null : vw[i - anchorI]));
  }, [bars, volumes, anchorI]);

  const tolerance = useMemo(() => (Math.max(...closes) - Math.min(...closes)) * 0.025, [closes]);
  const touches = useMemo(() => {
    const out: number[] = [];
    closes.forEach((c, i) => {
      const v = anchoredVwap[i];
      if (v != null && i > anchorI + 3 && Math.abs(c - v) <= tolerance) out.push(i);
    });
    return out;
  }, [closes, anchoredVwap, anchorI, tolerance]);

  const { min, max } = useMemo(() => {
    const vwapVals = anchoredVwap.filter((v): v is number => v != null);
    const all = closes.concat(vwapVals);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, anchoredVwap]);
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

  if (touches.length === 0) {
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
          <p className="text-lg font-bold text-foreground">Spot the reversion</p>
          <p className="meta mt-0.5">Click the chart where price comes back and touches the anchored VWAP — any touch counts.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <path d={toPath(anchoredVwap, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold)" strokeWidth={2} strokeDasharray="6 4" />
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          <circle cx={PAD + anchorI * xStep} cy={yFor(closes[anchorI])} r={5} fill="var(--color-muted)" stroke="var(--color-background)" strokeWidth={2} />

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={PAD} y2={HEIGHT - PAD} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered &&
            touches.map((i) => (
              <circle key={i} cx={PAD + i * xStep} cy={yFor(closes[i])} r={7} fill="var(--color-success)" stroke="var(--color-background)" strokeWidth={2} />
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
                Every solid dot is a bar where price actually came back and touched the anchored VWAP —
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
