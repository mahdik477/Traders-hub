// The maths behind the drawdown explainer: one synthetic equity path, three
// ways a firm might draw the "you're out" line under it. Pure functions so
// the chart component only has to draw. Every number here is made up and
// deterministic per seed — never a real account.

import { seededRandom } from "./strategy-sim-utils";

export type DrawdownRule = "static" | "eod" | "intraday";

export type DrawdownSeries = {
  /** Equity at every intraday tick, flattened across days. */
  equity: number[];
  /** Index of the last tick of each day. */
  dayEnds: number[];
  /** Floor at every tick for each rule. */
  floors: Record<DrawdownRule, number[]>;
  /** First tick where equity dips below the floor, per rule (null = never). */
  breach: Record<DrawdownRule, number | null>;
};

export type DrawdownOptions = {
  startBalance: number;
  /** Max loss as a percentage of the starting balance, e.g. 10. */
  maxLossPct: number;
  days: number;
  ticksPerDay: number;
  /** Trailing floors stop rising once they reach the starting balance —
   *  the way most futures firms describe it. */
  lockAtStart: boolean;
  seed: number;
};

export function simulateDrawdown(o: DrawdownOptions): DrawdownSeries {
  const rand = seededRandom(o.seed);
  const n = o.days * o.ticksPerDay;
  const allowance = (o.maxLossPct / 100) * o.startBalance;
  // A gentle random walk with a mild up-drift and one or two deliberate
  // dips, so each rule has a chance to behave differently on screen.
  const stepSize = allowance * 0.12;
  const equity: number[] = [o.startBalance];
  const dipAt = Math.floor(n * (0.45 + rand() * 0.2));
  for (let i = 1; i < n; i++) {
    const drift = Math.sin(i / (o.ticksPerDay * 1.7)) * stepSize * 0.5 + stepSize * 0.08;
    const dip = i > dipAt && i < dipAt + o.ticksPerDay * 1.5 ? -stepSize * 0.9 : 0;
    equity.push(equity[i - 1] + drift + dip + (rand() - 0.5) * stepSize * 2.2);
  }

  const dayEnds: number[] = [];
  for (let d = 1; d <= o.days; d++) dayEnds.push(Math.min(d * o.ticksPerDay - 1, n - 1));

  const floors: Record<DrawdownRule, number[]> = { static: [], eod: [], intraday: [] };
  const breach: Record<DrawdownRule, number | null> = { static: null, eod: null, intraday: null };

  const staticFloor = o.startBalance - allowance;
  let eodHigh = o.startBalance;
  let intradayHigh = o.startBalance;
  const cap = (floor: number) => (o.lockAtStart ? Math.min(floor, o.startBalance) : floor);

  for (let i = 0; i < n; i++) {
    const e = equity[i];
    intradayHigh = Math.max(intradayHigh, e);
    floors.static.push(staticFloor);
    floors.eod.push(cap(eodHigh - allowance));
    floors.intraday.push(cap(intradayHigh - allowance));
    // End-of-day high-water mark only updates at the close.
    if (dayEnds.includes(i)) eodHigh = Math.max(eodHigh, e);
  }

  for (const rule of ["static", "eod", "intraday"] as DrawdownRule[]) {
    const idx = equity.findIndex((e, i) => e < floors[rule][i]);
    breach[rule] = idx === -1 ? null : idx;
  }

  return { equity, dayEnds, floors, breach };
}

export const DRAWDOWN_RULE_LABELS: Record<DrawdownRule, string> = {
  static: "Static",
  eod: "End-of-day trailing",
  intraday: "Intraday trailing",
};

export const DRAWDOWN_RULE_EXPLAINERS: Record<DrawdownRule, string> = {
  static:
    "The floor is fixed at the starting balance minus the max loss. Profits don't move it. The simplest to track — you always know the number.",
  eod:
    "The floor follows your balance up, but only once a day, at the close. A good day lifts it; a wild swing during the day doesn't. It never comes back down.",
  intraday:
    "The floor follows your highest balance at any moment, including unrealised gains mid-trade. A quick spike up raises the floor immediately, so giving profits back can hit the limit even if you close the day up.",
};
