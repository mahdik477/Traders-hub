"use client";

import { useMemo, useState } from "react";
import { genRelativeStrengthSeries, toPath } from "@/lib/strategy-sim-utils";

// A live relative-strength simulator — four fabricated assets over the
// same window, one of them genuinely the strongest, highlighted. This
// isn't a single price chart the way the other pages are — a rotation
// strategy is inherently about comparing several things at once, so the
// "chart" here is four small ones side by side. Same synthetic-data
// convention as every other interactive strategy page.

const WIDTH = 320;
const HEIGHT = 110;
const PAD = 10;

export default function RelativeStrengthSimulator() {
  const [seed, setSeed] = useState(1);

  const series = useMemo(() => genRelativeStrengthSeries(seed, 40), [seed]);
  const finals = series.map((s) => s.values[s.values.length - 1]);
  const winnerIdx = finals.indexOf(Math.max(...finals));

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle — the strongest performer over the window is always outlined.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle returns
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5">
        {series.map((s, i) => {
          const isWinner = i === winnerIdx;
          const start = s.values[0];
          const end = s.values[s.values.length - 1];
          const pct = ((end - start) / start) * 100;
          const min = Math.min(...s.values) - 1;
          const max = Math.max(...s.values) + 1;
          return (
            <div
              key={s.label}
              className={`rounded-xl border p-3 transition-colors ${isWinner ? "border-success bg-success/8" : "border-border bg-surface"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{s.label}</span>
                <span className={`figure text-sm ${pct >= 0 ? "text-success" : "text-danger"}`}>
                  {pct >= 0 ? "+" : ""}
                  {pct.toFixed(1)}%
                </span>
              </div>
              <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-2 w-full" role="img" aria-label={`${s.label} price chart`}>
                <path d={toPath(s.values, min, max, WIDTH, HEIGHT, PAD)} fill="none" stroke={isWinner ? "var(--color-success)" : "var(--color-gold-bright)"} strokeWidth={2} />
              </svg>
              {isWinner && <p className="meta mt-1 text-success">Strongest — this is what a rotation strategy would buy</p>}
            </div>
          );
        })}
      </div>
      <p className="meta border-t border-border px-4 py-3 sm:px-5">
        Fabricated return series, regenerated each shuffle — not real asset prices.
      </p>
    </div>
  );
}
