"use client";

import { useMemo, useState } from "react";
import { genSeries, findPivots, toPath, type Pivot } from "@/lib/strategy-sim-utils";

// A live supply/demand zone simulator — same idea as support/resistance,
// but each level is drawn as a band (a "zone") rather than a single line,
// since that's how supply/demand is actually taught. Same synthetic-data
// convention as every other interactive strategy page.

const WIDTH = 760;
const HEIGHT = 320;
const PAD = 28;
const N = 90;

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

export default function SupplyDemandSimulator() {
  const [seed, setSeed] = useState(1);
  const [strength, setStrength] = useState(3);

  const closes = useMemo(() => genSeries(seed, N), [seed]);
  const pivots = useMemo(() => findPivots(closes, strength), [closes, strength]);
  const padding = useMemo(() => (Math.max(...closes) - Math.min(...closes)) * 0.03, [closes]);
  const { supply, demand } = useMemo(() => zonesFrom(pivots, padding), [pivots, padding]);

  const touches = useMemo(() => {
    const out: { i: number; zone: "supply" | "demand" }[] = [];
    closes.forEach((c, i) => {
      if (supply && c >= supply.lo && c <= supply.hi) out.push({ i, zone: "supply" });
      if (demand && c >= demand.lo && c <= demand.hi) out.push({ i, zone: "demand" });
    });
    return out;
  }, [closes, supply, demand]);

  const { min, max } = useMemo(() => {
    const all = closes.concat(supply ? [supply.hi, supply.lo] : [], demand ? [demand.hi, demand.lo] : []);
    return { min: Math.min(...all) - 1, max: Math.max(...all) + 1 };
  }, [closes, supply, demand]);
  const xStep = (WIDTH - PAD * 2) / (N - 1);
  const yFor = (v: number) => HEIGHT - PAD - ((v - min) / (max - min)) * (HEIGHT - PAD * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Drag the slider — the supply/demand zones redraw live.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interactive supply and demand zones chart">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={WIDTH - PAD} y1={PAD + f * (HEIGHT - PAD * 2)} y2={PAD + f * (HEIGHT - PAD * 2)} stroke="var(--color-border)" strokeWidth={1} />
          ))}
          {supply && (
            <rect x={PAD} y={yFor(supply.hi)} width={WIDTH - PAD * 2} height={Math.max(yFor(supply.lo) - yFor(supply.hi), 1)} fill="var(--color-danger)" opacity={0.1} />
          )}
          {demand && (
            <rect x={PAD} y={yFor(demand.hi)} width={WIDTH - PAD * 2} height={Math.max(yFor(demand.lo) - yFor(demand.hi), 1)} fill="var(--color-success)" opacity={0.1} />
          )}
          <path d={toPath(closes, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
          {touches.map((t) => (
            <circle key={`${t.zone}${t.i}`} cx={PAD + t.i * xStep} cy={yFor(closes[t.i])} r={5} fill={t.zone === "supply" ? "var(--color-danger)" : "var(--color-success)"} stroke="var(--color-background)" strokeWidth={2} />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-danger opacity-40" /> Supply zone
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm bg-success opacity-40" /> Demand zone
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-muted" /> Zone touch
          </span>
        </div>

        <div className="mt-5">
          <label className="block">
            <span className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Pivot strength</span>
              <span className="figure text-accent">{strength}</span>
            </span>
            <input type="range" min={2} max={6} value={strength} onChange={(e) => setStrength(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-gold-bright)]" />
          </label>
        </div>

        <p className="meta mt-4">
          {touches.length} zone touch{touches.length === 1 ? "" : "es"} on this run. Synthetic price
          data, regenerated each shuffle — not a real historical chart.
        </p>
      </div>
    </div>
  );
}
