"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genOHLC, classicPivots, toPath } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: the pivot levels are drawn on from the start
// (same as the simulator) — the question is only where price actually
// touches one. A level can get touched more than once, so any touch
// of the asked-about level counts.

const WIDTH = 760;
const HEIGHT = 300;
const PAD = 28;
const N = 80;
const SPLIT = Math.round(N * 0.3);
const TOLERANCE_BARS = 3;

type LevelKey = "r2" | "r1" | "p" | "s1" | "s2";

export default function PivotPointsQuiz() {
  const [seed, setSeed] = useState(100);
  const [preferredLevel, setPreferredLevel] = useState<LevelKey>("r1");
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const bars = useMemo(() => genOHLC(seed, N), [seed]);
  const closes = useMemo(() => bars.map((b) => b.c), [bars]);
  const levels = useMemo(() => {
    const prior = bars.slice(0, SPLIT);
    const prevHigh = Math.max(...prior.map((b) => b.h));
    const prevLow = Math.min(...prior.map((b) => b.l));
    const prevClose = prior[prior.length - 1].c;
    return classicPivots(prevHigh, prevLow, prevClose);
  }, [bars]);
  const levelList = useMemo(
    () =>
      (["r2", "r1", "p", "s1", "s2"] as LevelKey[]).map((key) => ({
        key,
        label: key.toUpperCase(),
        value: levels[key],
        color: key === "p" ? "var(--color-gold)" : key.startsWith("r") ? "var(--color-danger)" : "var(--color-success)",
      })),
    [levels],
  );

  const tolerance = useMemo(() => (Math.max(...closes) - Math.min(...closes)) * 0.012, [closes]);
  const touches = useMemo(() => {
    const out: { i: number; key: LevelKey }[] = [];
    for (let i = SPLIT + 1; i < closes.length; i++) {
      for (const lvl of levelList) {
        if (Math.abs(closes[i] - lvl.value) <= tolerance) {
          out.push({ i, key: lvl.key });
          break;
        }
      }
    }
    return out;
  }, [closes, levelList, tolerance]);

  const activeKey: LevelKey | null = useMemo(() => {
    const hasPreferred = touches.some((t) => t.key === preferredLevel);
    if (hasPreferred) return preferredLevel;
    return touches.length ? touches[0].key : null;
  }, [touches, preferredLevel]);
  const matchingTouches = useMemo(() => touches.filter((t) => t.key === activeKey), [touches, activeKey]);
  const activeLevel = levelList.find((l) => l.key === activeKey);

  const { min, max } = useMemo(() => {
    const all = closes.concat(levelList.map((l) => l.value));
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, levelList]);
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
    setPreferredLevel((k) => (["r2", "r1", "p", "s1", "s2"] as LevelKey[])[(["r2", "r1", "p", "s1", "s2"] as LevelKey[]).indexOf(k) + 1] ?? "r2");
  }

  if (!activeLevel || matchingTouches.length === 0) {
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
          <p className="text-lg font-bold text-foreground">Spot the {activeLevel.label} touch</p>
          <p className="meta mt-0.5">Click the chart where price reaches the {activeLevel.label} level — any touch counts.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <rect x={PAD} y={PAD} width={SPLIT * xStep} height={HEIGHT - PAD * 2} fill="var(--color-border)" opacity={0.15} />
          {levelList.map((lvl) => (
            <line key={lvl.key} x1={PAD + SPLIT * xStep} x2={WIDTH - PAD} y1={yFor(lvl.value)} y2={yFor(lvl.value)} stroke={lvl.color} strokeWidth={1.5} strokeDasharray="5 3" opacity={0.85} />
          ))}
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={PAD} y2={HEIGHT - PAD} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered &&
            matchingTouches.map((t) => (
              <circle key={t.i} cx={PAD + t.i * xStep} cy={yFor(closes[t.i])} r={7} fill={activeLevel.color} stroke="var(--color-background)" strokeWidth={2} />
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
                Every solid dot is a bar where price actually reached {activeLevel.label} — any of them
                counted. Your click is the dashed line.
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
