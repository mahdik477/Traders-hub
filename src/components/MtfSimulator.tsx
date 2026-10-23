"use client";

import { useMemo, useState } from "react";
import { genMtfDemo, toPath } from "@/lib/strategy-sim-utils";

// A live multi-timeframe simulator. This isn't a single price chart the
// way most of the other pages are — MTFA is inherently about comparing a
// bigger-picture trend against a smaller-timeframe entry, so the "chart"
// here is a higher-timeframe trend plus three lower-timeframe candidates,
// only one of which actually continues in the bigger trend's direction.
// Same synthetic-data convention as every other interactive strategy
// page.

const HTF_WIDTH = 760;
const HTF_HEIGHT = 140;
const PAD = 16;
const CAND_WIDTH = 320;
const CAND_HEIGHT = 110;

export default function MtfSimulator() {
  const [seed, setSeed] = useState(1);

  const { htfTrend, candidates, correctIdx } = useMemo(() => genMtfDemo(seed, 40), [seed]);
  const htfMin = Math.min(...htfTrend) - 1;
  const htfMax = Math.max(...htfTrend) + 1;

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Try it yourself</p>
          <p className="meta mt-0.5">Shuffle — the lower-timeframe entry that actually agrees with the trend is always outlined.</p>
        </div>
        <button type="button" onClick={() => setSeed((n) => n + 1)} className="btn btn-outline">
          Shuffle price data
        </button>
      </div>

      <div className="p-4 sm:p-5">
        <p className="eyebrow">Higher timeframe (the trend)</p>
        <svg viewBox={`0 0 ${HTF_WIDTH} ${HTF_HEIGHT}`} className="mt-2 w-full" role="img" aria-label="Higher timeframe trend chart">
          <path d={toPath(htfTrend, htfMin, htfMax, HTF_WIDTH, HTF_HEIGHT, PAD)} fill="none" stroke="var(--color-gold-bright)" strokeWidth={2.5} />
        </svg>

        <p className="eyebrow mt-5">Lower timeframe (three candidate entries)</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {candidates.map((c, i) => {
            const min = Math.min(...c.values) - 1;
            const max = Math.max(...c.values) + 1;
            const isCorrect = i === correctIdx;
            return (
              <div key={i} className={`rounded-xl border p-3 ${isCorrect ? "border-success bg-success/8" : "border-border bg-surface"}`}>
                <svg viewBox={`0 0 ${CAND_WIDTH} ${CAND_HEIGHT}`} className="w-full" role="img" aria-label={`Lower timeframe candidate ${i + 1}`}>
                  <path d={toPath(c.values, min, max, CAND_WIDTH, CAND_HEIGHT, PAD)} fill="none" stroke={isCorrect ? "var(--color-success)" : "var(--color-gold-bright)"} strokeWidth={2} />
                </svg>
                {isCorrect && <p className="meta mt-1 text-success">Agrees with the higher-timeframe trend</p>}
              </div>
            );
          })}
        </div>

        <p className="meta mt-4">
          Only one of the three continues in the same direction as the bigger trend after its pullback
          — the other two are a reversal and sideways chop, both plausible on their own, just not
          aligned. Fabricated price series, regenerated each shuffle — not real market data.
        </p>
      </div>
    </div>
  );
}
