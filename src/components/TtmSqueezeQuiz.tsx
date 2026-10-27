"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genOHLC, bollinger, ema, atr } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: every bar in a squeeze is shaded — the
// question is only where it actually fires (bands pop back outside the
// channel). It can fire more than once in a run, so any fire counts.

const WIDTH = 760;
const HEIGHT = 300;
const PAD = 28;
const N = 90;
const PERIOD = 20;
const MULT = 1.5;
const TOLERANCE_BARS = 3;

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

export default function TtmSqueezeQuiz() {
  const [seed, setSeed] = useState(100);
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const bars = useMemo(() => genOHLC(seed, N), [seed]);
  const closes = useMemo(() => bars.map((b) => b.c), [bars]);
  const bb = useMemo(() => bollinger(closes, PERIOD, 2), [closes]);
  const kcMid = useMemo(() => ema(closes, PERIOD), [closes]);
  const kcAtrVals = useMemo(() => atr(bars, PERIOD), [bars]);
  const { squeeze, releases } = useMemo(() => {
    const squeeze: boolean[] = [];
    const releases: number[] = [];
    let wasSqueeze = false;
    for (let i = 0; i < closes.length; i++) {
      const m = kcMid[i];
      const a = kcAtrVals[i];
      if (m == null || a == null || bb.upper[i] == null || bb.lower[i] == null) {
        squeeze.push(false);
        wasSqueeze = false;
        continue;
      }
      const u = m + MULT * a;
      const l = m - MULT * a;
      const inSqueeze = bb.upper[i]! < u && bb.lower[i]! > l;
      squeeze.push(inSqueeze);
      if (wasSqueeze && !inSqueeze) releases.push(i);
      wasSqueeze = inSqueeze;
    }
    return { squeeze, releases };
  }, [closes, bb, kcMid, kcAtrVals]);

  const { min, max } = useMemo(() => {
    const vals = [...closes, ...bb.upper, ...bb.lower].filter((v): v is number => v != null);
    return { min: Math.min(...vals) - 1, max: Math.max(...vals) + 1 };
  }, [closes, bb]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);
  const indexFor = (x: number) => Math.round((x - PAD) / xStep);

  const answered = guessIndex != null;
  const isCorrect = guessIndex != null && releases.some((i) => Math.abs(guessIndex - i) <= TOLERANCE_BARS);

  function handleClick(e: MouseEvent<SVGSVGElement>) {
    if (answered || releases.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const idx = Math.max(0, Math.min(N - 1, indexFor(svgX)));
    setGuessIndex(idx);
    setScore((s) => ({
      correct: s.correct + (releases.some((i) => Math.abs(idx - i) <= TOLERANCE_BARS) ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function nextRound() {
    setSeed((n) => n + 1);
    setGuessIndex(null);
  }

  if (releases.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <p className="text-muted">That run didn&apos;t fire cleanly — try another.</p>
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
          <p className="text-lg font-bold text-foreground">Spot the squeeze firing</p>
          <p className="meta mt-0.5">Every squeeze bar is shaded — click where it actually fires. Any fire counts.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <path d={pathFor(bb.upper, yFor, xStep)} fill="none" stroke="var(--color-gold)" strokeWidth={1.5} />
          <path d={pathFor(bb.lower, yFor, xStep)} fill="none" stroke="var(--color-gold)" strokeWidth={1.5} />
          <path d={pathFor(closes, yFor, xStep)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2} />
          {squeeze.map(
            (s, i) =>
              s && (
                <rect key={i} x={PAD + i * xStep - 1.5} y={PAD} width={3} height={HEIGHT - PAD * 2} fill="var(--color-muted)" opacity={0.12} />
              ),
          )}

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={PAD} y2={HEIGHT - PAD} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered &&
            releases.map((i) => (
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
                Every solid dot is a bar where the bands actually popped back outside the channel — any
                of them counted. Your click is the dashed line.
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
