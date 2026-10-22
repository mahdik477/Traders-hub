"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genSeries, findPivots, toPath, type Pivot } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: the support and resistance lines are drawn on
// from the start (there's no guessing where they are) — the question is
// only where price actually comes back and touches one.

const WIDTH = 760;
const HEIGHT = 300;
const PAD = 28;
const N = 80;
const STRENGTH = 3;
const TOLERANCE_BARS = 3;

type Mode = "support" | "resistance";

function levelsFrom(pivots: Pivot[]) {
  const highs = pivots.filter((p) => p.high).map((p) => p.value);
  const lows = pivots.filter((p) => !p.high).map((p) => p.value);
  return {
    resistance: highs.length ? Math.max(...highs) : null,
    support: lows.length ? Math.min(...lows) : null,
  };
}

export default function SupportResistanceQuiz() {
  const [seed, setSeed] = useState(100);
  const [preferredMode, setPreferredMode] = useState<Mode>("resistance");
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const closes = useMemo(() => genSeries(seed, N), [seed]);
  const pivots = useMemo(() => findPivots(closes, STRENGTH), [closes]);
  const { resistance, support } = useMemo(() => levelsFrom(pivots), [pivots]);

  const { min, max } = useMemo(() => {
    const all = closes.concat([resistance, support].filter((v): v is number => v != null));
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, resistance, support]);

  const tolerance = (max - min) * 0.02;
  const touches = useMemo(() => {
    const out: { i: number; level: Mode }[] = [];
    closes.forEach((c, i) => {
      if (resistance != null && Math.abs(c - resistance) <= tolerance) out.push({ i, level: "resistance" });
      if (support != null && Math.abs(c - support) <= tolerance) out.push({ i, level: "support" });
    });
    return out;
  }, [closes, resistance, support, tolerance]);

  const target = useMemo(() => {
    const pool = touches.filter((t) => t.level === preferredMode);
    const fallback = touches.filter((t) => t.level !== preferredMode);
    const chosen = pool.length > 0 ? pool : fallback;
    if (chosen.length === 0) return null;
    const touch = chosen[Math.floor(chosen.length / 2)];
    return { mode: touch.level, touch };
  }, [touches, preferredMode]);

  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);
  const indexFor = (x: number) => Math.round((x - PAD) / xStep);

  const answered = guessIndex != null;
  const isCorrect = target != null && guessIndex != null && Math.abs(guessIndex - target.touch.i) <= TOLERANCE_BARS;

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered || !target) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.max(0, Math.min(N - 1, indexFor(svgX)));
    setGuessIndex(idx);
    setScore((s) => ({
      correct: s.correct + (Math.abs(idx - target.touch.i) <= TOLERANCE_BARS ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function nextRound() {
    setSeed((n) => n + 1);
    setGuessIndex(null);
    setPreferredMode((m) => (m === "support" ? "resistance" : "support"));
  }

  if (!target) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <p className="text-muted">That run didn&apos;t produce a clean level — try another.</p>
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
            Spot the {target.mode === "support" ? "support" : "resistance"} touch
          </p>
          <p className="meta mt-0.5">
            Click the chart where price comes back down to {target.mode === "support" ? "support and bounces" : "the ceiling and gets rejected"}.
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
          {resistance != null && (
            <line x1={PAD} x2={WIDTH - PAD} y1={yFor(resistance)} y2={yFor(resistance)} stroke="var(--color-danger)" strokeWidth={2} strokeDasharray="6 4" />
          )}
          {support != null && (
            <line x1={PAD} x2={WIDTH - PAD} y1={yFor(support)} y2={yFor(support)} stroke="var(--color-success)" strokeWidth={2} strokeDasharray="6 4" />
          )}
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />

          {guessIndex != null && (
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
          {answered && (
            <circle
              cx={PAD + target.touch.i * xStep}
              cy={yFor(closes[target.touch.i])}
              r={7}
              fill={target.mode === "support" ? "var(--color-success)" : "var(--color-danger)"}
              stroke="var(--color-background)"
              strokeWidth={2}
            />
          )}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 border-t-2 border-dashed border-danger" /> Resistance
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 border-t-2 border-dashed border-success" /> Support
          </span>
        </div>

        {answered ? (
          <div className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${isCorrect ? "border-success/30 bg-success/8" : "border-danger/30 bg-danger/8"}`}>
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${isCorrect ? "bg-success text-white" : "bg-danger text-white"}`}>
              <CheckIcon className="size-4" />
            </span>
            <div className="flex-1">
              <p className={`text-lg font-bold ${isCorrect ? "text-success" : "text-danger"}`}>
                {isCorrect ? "Right on it." : "Not quite."}
              </p>
              <p className="mt-1 text-base leading-relaxed text-foreground/90">
                The real touch is marked with the solid dot, on the dashed level line — that&apos;s
                the bar where price actually reached the level. Your click is the dashed vertical
                line.
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
