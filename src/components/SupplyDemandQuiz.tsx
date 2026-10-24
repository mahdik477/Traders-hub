"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { genSeries, findPivots, toPath, type Pivot } from "@/lib/strategy-sim-utils";
import { CheckIcon, PlayIcon } from "@/components/icons";

// A click-the-chart quiz: the zones are drawn on from the start (same as
// the simulator) — the question is only where price actually trades back
// into one. A zone can get touched more than once, so any touch counts.

const WIDTH = 760;
const HEIGHT = 300;
const PAD = 28;
const N = 80;
const STRENGTH = 3;
const TOLERANCE_BARS = 3;

type Zone = "supply" | "demand";

function zonesFrom(pivots: Pivot[], padding: number) {
  const highs = pivots.filter((p) => p.high).map((p) => p.value);
  const lows = pivots.filter((p) => !p.high).map((p) => p.value);
  const supply = highs.length ? Math.max(...highs) : null;
  const demand = lows.length ? Math.min(...lows) : null;
  return {
    supply: supply != null ? { hi: supply + padding, lo: supply - padding } : null,
    demand: demand != null ? { hi: demand + padding, lo: demand - padding } : null,
  };
}

export default function SupplyDemandQuiz() {
  const [seed, setSeed] = useState(100);
  const [preferredZone, setPreferredZone] = useState<Zone>("supply");
  const [guessIndex, setGuessIndex] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const closes = useMemo(() => genSeries(seed, N), [seed]);
  const pivots = useMemo(() => findPivots(closes, STRENGTH), [closes]);
  const padding = useMemo(() => (Math.max(...closes) - Math.min(...closes)) * 0.03, [closes]);
  const { supply, demand } = useMemo(() => zonesFrom(pivots, padding), [pivots, padding]);

  const touches = useMemo(() => {
    const out: { i: number; zone: Zone }[] = [];
    closes.forEach((c, i) => {
      if (supply && c >= supply.lo && c <= supply.hi) out.push({ i, zone: "supply" });
      if (demand && c >= demand.lo && c <= demand.hi) out.push({ i, zone: "demand" });
    });
    return out;
  }, [closes, supply, demand]);

  const activeZone: Zone | null = useMemo(() => {
    const hasPreferred = touches.some((t) => t.zone === preferredZone);
    if (hasPreferred) return preferredZone;
    const other = touches.find((t) => t.zone !== preferredZone);
    return other ? other.zone : null;
  }, [touches, preferredZone]);
  const matchingTouches = useMemo(() => touches.filter((t) => t.zone === activeZone), [touches, activeZone]);

  const { min, max } = useMemo(() => {
    const all = closes.concat(supply ? [supply.hi, supply.lo] : [], demand ? [demand.hi, demand.lo] : []);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, supply, demand]);
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
    setPreferredZone((z) => (z === "supply" ? "demand" : "supply"));
  }

  if (!activeZone || matchingTouches.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <p className="text-muted">That run didn&apos;t produce a clean touch — try another.</p>
        <button type="button" onClick={nextRound} className="btn btn-outline mt-3">
          New chart
        </button>
      </div>
    );
  }

  const zoneBox = activeZone === "supply" ? supply! : demand!;

  return (
    <div className="overflow-hidden rounded-2xl border border-success/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Spot the {activeZone} zone touch</p>
          <p className="meta mt-0.5">Click the chart where price trades back into the {activeZone} zone — any touch counts.</p>
        </div>
        <span className="pill">
          Score: {score.correct}/{score.total}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`w-full rounded-lg ${answered ? "" : "cursor-crosshair"}`} role="img" aria-label="Click where you think the signal happens" onClick={handleClick}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--color-background)" opacity={0.3} />
          <rect x={PAD} y={yFor(zoneBox.hi)} width={WIDTH - PAD * 2} height={Math.max(yFor(zoneBox.lo) - yFor(zoneBox.hi), 1)} fill={activeZone === "supply" ? "var(--color-danger)" : "var(--color-success)"} opacity={0.1} />
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />

          {guessIndex != null && (
            <line x1={PAD + guessIndex * xStep} x2={PAD + guessIndex * xStep} y1={PAD} y2={HEIGHT - PAD} stroke={isCorrect ? "var(--color-success)" : "var(--color-danger)"} strokeWidth={2} strokeDasharray="4 3" />
          )}
          {answered &&
            matchingTouches.map((t) => (
              <circle key={t.i} cx={PAD + t.i * xStep} cy={yFor(closes[t.i])} r={7} fill={activeZone === "supply" ? "var(--color-danger)" : "var(--color-success)"} stroke="var(--color-background)" strokeWidth={2} />
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
                The zone box and every solid dot only show up once you answer — each one is a bar
                where price actually traded back into the zone. Your click is the dashed line.
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
