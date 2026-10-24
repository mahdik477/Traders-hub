"use client";

import { useState } from "react";

// Trading styles are a comparison of holding periods, not a chart pattern
// — there's nothing to click a signal on. This lets you drag along the
// actual holding-period spectrum and see which style you land on and
// what that implies, using the same facts stated on this page rather
// than a chart.

const STOPS = [
  { label: "Seconds–minutes", style: "Scalping", detail: "Costs dominate at this speed — it needs top-tier execution to even break even on fees and spread." },
  { label: "Minutes–hours", style: "Day trading", detail: "No overnight risk, but base rates are poor: 97% of persistent Brazilian day traders lost money, with no evidence of learning over time." },
  { label: "Days–weeks", style: "Swing trading", detail: "Carries overnight and weekend gap risk in exchange for fewer, larger moves per trade." },
  { label: "Weeks–months", style: "Position trading", detail: "Fewer trades and larger drawdowns — closest of the four to the documented trend-following evidence." },
];

export default function TradingStylesSimulator() {
  const [idx, setIdx] = useState(1);
  const current = STOPS[idx];

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <p className="text-lg font-bold text-foreground">Try it yourself</p>
        <p className="meta mt-0.5">Drag along the holding-period spectrum and see what style that actually is.</p>
      </div>

      <div className="p-4 sm:p-5">
        <input
          type="range"
          min={0}
          max={STOPS.length - 1}
          step={1}
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          className="w-full accent-[var(--color-gold-bright)]"
        />
        <div className="mt-1 flex justify-between text-xs text-subtle">
          {STOPS.map((s) => (
            <span key={s.label}>{s.label}</span>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-accent/30 bg-accent/5 p-5">
          <p className="figure text-2xl text-accent">{current.style}</p>
          <p className="mt-2 text-base leading-relaxed text-foreground/90">{current.detail}</p>
        </div>
      </div>
    </div>
  );
}
