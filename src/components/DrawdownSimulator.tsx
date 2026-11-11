"use client";

import { useMemo, useState } from "react";
import {
  DRAWDOWN_RULE_EXPLAINERS,
  DRAWDOWN_RULE_LABELS,
  simulateDrawdown,
  type DrawdownRule,
} from "@/lib/drawdown-sim";
import { moneyRound } from "@/lib/format-money";
import Picker from "@/components/Picker";

// The same synthetic account under three drawdown rules, on one chart. Built
// in the style of the strategy simulators (BreakoutSimulator etc.): header
// bar, shuffle button, SVG, legend, a plain-English note. An illustration of
// how the rules behave — never a real account or a prediction.

const WIDTH = 760;
const HEIGHT = 340;
const PAD = { top: 20, right: 20, bottom: 28, left: 64 };
const DAYS = 10;
const TICKS = 24;

const RULES: DrawdownRule[] = ["static", "eod", "intraday"];
const COLOR: Record<DrawdownRule, string> = {
  static: "var(--color-success)",
  eod: "var(--color-gold)",
  intraday: "var(--color-danger)",
};

const SIZES = [25_000, 50_000, 100_000];
const LOSS_PCTS = [4, 5, 6, 8, 10];

export default function DrawdownSimulator() {
  const [seed, setSeed] = useState(7);
  const [size, setSize] = useState(100_000);
  const [lossPct, setLossPct] = useState(6);
  const [lockAtStart, setLockAtStart] = useState(true);
  const [visible, setVisible] = useState<Record<DrawdownRule, boolean>>({ static: true, eod: true, intraday: true });

  const sim = useMemo(
    () => simulateDrawdown({ startBalance: size, maxLossPct: lossPct, days: DAYS, ticksPerDay: TICKS, lockAtStart, seed }),
    [seed, size, lossPct, lockAtStart],
  );

  const { min, max } = useMemo(() => {
    const all = [...sim.equity, ...RULES.flatMap((r) => sim.floors[r])];
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const padY = (hi - lo) * 0.08;
    return { min: lo - padY, max: hi + padY };
  }, [sim]);

  const n = sim.equity.length;
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const xFor = (i: number) => PAD.left + (i / (n - 1)) * plotW;
  const yFor = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * plotH;
  const path = (values: number[]) => values.map((v, i) => `${i === 0 ? "M" : "L"}${xFor(i).toFixed(1)},${yFor(v).toFixed(1)}`).join(" ");

  const allowance = (lossPct / 100) * size;
  const gridValues = [0.2, 0.4, 0.6, 0.8].map((f) => min + f * (max - min));

  return (
    <div className="overflow-hidden rounded-2xl border border-accent/30 bg-surface shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-lg font-bold text-foreground">Three rules, one account</p>
          <p className="meta mt-0.5">Same made-up equity path — watch where each rule&apos;s floor ends up.</p>
        </div>
        <button type="button" onClick={() => setSeed((s) => s + 1)} className="btn btn-outline">
          Shuffle the path
        </button>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2 text-xs">
          <span className="eyebrow" aria-hidden="true">
            Account
          </span>
          <Picker
            className="w-32"
            ariaLabel="Account"
            value={String(size)}
            onChange={(v) => setSize(Number(v))}
            options={SIZES.map((s) => ({ value: String(s), label: moneyRound(s) }))}
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="eyebrow" aria-hidden="true">
            Max loss
          </span>
          <Picker
            className="w-40"
            ariaLabel="Max loss"
            value={String(lossPct)}
            onChange={(v) => setLossPct(Number(v))}
            options={LOSS_PCTS.map((p) => ({ value: String(p), label: `${p}% · ${moneyRound((p / 100) * size)}` }))}
          />
        </div>
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={lockAtStart} onChange={(e) => setLockAtStart(e.target.checked)} className="size-4 accent-[var(--color-gold-fill)]" />
          Trailing floors stop at the starting balance
        </label>
      </div>

      <div className="p-4 sm:p-5">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Chart of one synthetic equity path with a static, an end-of-day trailing and an intraday trailing drawdown floor">
          {gridValues.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={yFor(v)} y2={yFor(v)} stroke="var(--color-border)" strokeWidth={1} />
              <text x={PAD.left - 8} y={yFor(v) + 4} textAnchor="end" fontSize={11} fill="var(--color-subtle)" fontFamily="var(--font-mono)">
                {moneyRound(v)}
              </text>
            </g>
          ))}
          {sim.dayEnds.slice(0, -1).map((i, d) => (
            <g key={i}>
              <line x1={xFor(i)} x2={xFor(i)} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="var(--color-border)" strokeDasharray="2 4" />
              <text x={xFor(i)} y={HEIGHT - 10} textAnchor="middle" fontSize={10} fill="var(--color-subtle)">
                Day {d + 1} close
              </text>
            </g>
          ))}
          {/* Starting balance */}
          <line x1={PAD.left} x2={WIDTH - PAD.right} y1={yFor(size)} y2={yFor(size)} stroke="var(--color-subtle)" strokeWidth={1} strokeDasharray="6 4" />
          <text x={WIDTH - PAD.right} y={yFor(size) - 5} textAnchor="end" fontSize={10} fill="var(--color-subtle)">
            Start {moneyRound(size)}
          </text>

          {RULES.filter((r) => visible[r]).map((r) => (
            <path key={r} d={path(sim.floors[r])} fill="none" stroke={COLOR[r]} strokeWidth={2} strokeDasharray={r === "static" ? "0" : r === "eod" ? "8 4" : "3 3"} className="dd-floor" />
          ))}
          <path d={path(sim.equity)} fill="none" stroke="var(--color-foreground)" strokeWidth={2} className="dd-equity" />

          {RULES.filter((r) => visible[r] && sim.breach[r] != null).map((r) => {
            const i = sim.breach[r]!;
            return (
              <g key={r}>
                <circle cx={xFor(i)} cy={yFor(sim.equity[i])} r={7} fill={COLOR[r]} opacity={0.25} />
                <circle cx={xFor(i)} cy={yFor(sim.equity[i])} r={3.5} fill={COLOR[r]} />
              </g>
            );
          })}
        </svg>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {RULES.map((r) => {
            const breach = sim.breach[r];
            const finalFloor = sim.floors[r][n - 1];
            return (
              <button
                key={r}
                type="button"
                aria-pressed={visible[r]}
                onClick={() => setVisible((v) => ({ ...v, [r]: !v[r] }))}
                className={`rounded-xl border p-3 text-left transition-colors ${visible[r] ? "border-border-strong bg-background" : "border-border bg-surface opacity-60"}`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="inline-block h-0.5 w-5 rounded" style={{ background: COLOR[r] }} aria-hidden="true" />
                  {DRAWDOWN_RULE_LABELS[r]}
                </span>
                <span className="mt-1 block text-xs text-muted">
                  Floor ends at <span className="font-mono text-foreground">{moneyRound(finalFloor)}</span>
                  {breach != null ? (
                    <span className="block" style={{ color: COLOR[r] }}>
                      Breached on day {Math.floor(breach / TICKS) + 1} — account would be closed
                    </span>
                  ) : (
                    <span className="block">Never breached on this path</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <p className="meta mt-4">
          Illustration only: a synthetic {moneyRound(size)} account with a {lossPct}% ({moneyRound(allowance)}) max loss
          over {DAYS} made-up trading days, regenerated each shuffle. Real firms add daily loss limits, consistency
          rules and their own definitions — read the firm&apos;s rules, not this chart, before buying.
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-px border-t border-border bg-border sm:grid-cols-3">
        {RULES.map((r) => (
          <div key={r} className="bg-surface p-4">
            <dt className="flex items-center gap-2 text-sm font-bold text-foreground">
              <span className="inline-block size-2.5 rounded-full" style={{ background: COLOR[r] }} aria-hidden="true" />
              {DRAWDOWN_RULE_LABELS[r]}
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-muted">{DRAWDOWN_RULE_EXPLAINERS[r]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
