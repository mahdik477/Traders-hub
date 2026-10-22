// Shared math for every interactive strategy simulator + quiz across the
// Strategies section. Each strategy's interactive page imports only the
// pieces it needs (e.g. the MA page uses sma + a two-line crossover; the RSI
// page uses rsi + threshold crossings). Kept in one place so the fabricated
// price-data generator and the SVG plotting math exist once, not once per
// strategy. None of this is, or uses, real market data — every series here
// is synthetic and deterministic per seed, and every component that renders
// one says so.

export function seededRandom(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fabricated close-price series — never real market data. Deterministic
 *  per seed so "shuffle" buttons give a fresh but reproducible run. */
export function genSeries(
  seed: number,
  n: number,
  opts?: { driftAmplitude?: number; noise?: number },
): number[] {
  const rand = seededRandom(seed);
  const driftAmplitude = opts?.driftAmplitude ?? 0.35;
  const noise = opts?.noise ?? 1.6;
  const closes = [100];
  for (let i = 1; i < n; i++) {
    const drift = Math.sin(i / 14) * driftAmplitude; // gentle wave so signals actually happen
    closes.push(closes[i - 1] + drift + (rand() - 0.5) * noise);
  }
  return closes;
}

export type OHLC = { o: number; h: number; l: number; c: number };

/** A fabricated OHLC candle series, for strategies that need candle shape
 *  (bodies/wicks), not just a close line. Same synthetic-data convention. */
export function genOHLC(seed: number, n: number): OHLC[] {
  const rand = seededRandom(seed);
  const bars: OHLC[] = [];
  let prevClose = 100;
  for (let i = 0; i < n; i++) {
    const drift = Math.sin(i / 14) * 0.35;
    const open = prevClose;
    const close = open + drift + (rand() - 0.5) * 1.8;
    const high = Math.max(open, close) + rand() * 0.9;
    const low = Math.min(open, close) - rand() * 0.9;
    bars.push({ o: open, h: high, l: low, c: close });
    prevClose = close;
  }
  return bars;
}

/** A deliberately-shaped series containing a double top (or, mirrored, a
 *  double bottom) — the one pattern on this page that needs a specific
 *  shape rather than a plain random walk, so the pattern is actually
 *  visible rather than hoped-for. Still synthetic, still labelled as such. */
export function genDoublePattern(seed: number, n: number, top: boolean): number[] {
  const rand = seededRandom(seed);
  const sign = top ? 1 : -1;
  const peakAt = [Math.round(n * 0.3), Math.round(n * 0.62)];
  const peakHeight = 14 + rand() * 2;
  const values: number[] = [100];
  for (let i = 1; i < n; i++) {
    let target = 100;
    for (const p of peakAt) {
      const dist = Math.abs(i - p);
      const width = n * 0.14;
      target += sign * peakHeight * Math.exp(-(dist * dist) / (2 * width * width));
    }
    // neckline dip between the two peaks, and a decline after the second one
    if (i > peakAt[1] + n * 0.08) target -= sign * ((i - peakAt[1]) / n) * peakHeight * 1.3;
    values.push(target + (rand() - 0.5) * 1.1);
  }
  return values;
}

export function sma(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    return sum / period;
  });
}

export function ema(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const out: (number | null)[] = [];
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    if (prev == null) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += values[j];
      prev = sum / period;
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    out.push(prev);
  }
  return out;
}

/** ema() over a series that already has leading nulls (e.g. MACD, which is
 *  only defined once the slow EMA kicks in) — skips the nulls, runs ema on
 *  what's left, then puts the nulls back in their original positions. This
 *  is what a MACD signal line actually is: an EMA of the MACD line. */
export function emaSkipNulls(values: (number | null)[], period: number): (number | null)[] {
  const dense = values.filter((v): v is number => v != null);
  const denseEma = ema(dense, period);
  const out: (number | null)[] = [];
  let j = 0;
  for (const v of values) {
    if (v == null) {
      out.push(null);
    } else {
      out.push(denseEma[j]);
      j++;
    }
  }
  return out;
}

export function rsi(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length <= period) return out;
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gainSum += diff;
    else lossSum -= diff;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

export function bollinger(values: number[], period: number, mult: number) {
  const mid = sma(values, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    const m = mid[i];
    if (m == null) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) variance += (values[j] - m) ** 2;
    const sd = Math.sqrt(variance / period);
    upper.push(m + mult * sd);
    lower.push(m - mult * sd);
  }
  return { mid, upper, lower };
}

export type Crossing = { i: number; up: boolean }; // up = line a crosses above line b

/** Generic two-line crossover detector — a golden/death cross, a MACD/signal
 *  cross, an RSI/threshold cross: anywhere one line passes another. */
export function findCrossings(a: (number | null)[], b: (number | null)[]): Crossing[] {
  const out: Crossing[] = [];
  for (let i = 1; i < a.length; i++) {
    const a0 = a[i - 1];
    const a1 = a[i];
    const b0 = b[i - 1];
    const b1 = b[i];
    if (a0 == null || a1 == null || b0 == null || b1 == null) continue;
    if (a0 <= b0 && a1 > b1) out.push({ i, up: true });
    else if (a0 >= b0 && a1 < b1) out.push({ i, up: false });
  }
  return out;
}

export type Pivot = { i: number; value: number; high: boolean };

/** Swing highs/lows: a bar is a swing high if it's the highest point within
 *  `strength` bars either side (and the mirror for swing lows). This is what
 *  support/resistance levels and trendlines are actually drawn from. */
export function findPivots(values: number[], strength: number): Pivot[] {
  const pivots: Pivot[] = [];
  for (let i = strength; i < values.length - strength; i++) {
    const window = values.slice(i - strength, i + strength + 1);
    const v = values[i];
    if (v === Math.max(...window)) pivots.push({ i, value: v, high: true });
    else if (v === Math.min(...window)) pivots.push({ i, value: v, high: false });
  }
  return pivots;
}

export type Breakout = { i: number; hi: number; lo: number; up: boolean };

/** The first point where price closes outside the high/low range of the
 *  previous `lookback` bars — the actual definition of a range breakout. */
export function findBreakout(values: number[], lookback: number): Breakout | null {
  for (let i = lookback; i < values.length; i++) {
    const window = values.slice(i - lookback, i);
    const hi = Math.max(...window);
    const lo = Math.min(...window);
    if (values[i] > hi) return { i, hi, lo, up: true };
    if (values[i] < lo) return { i, hi, lo, up: false };
  }
  return null;
}

export type Swing = { startI: number; startV: number; endI: number; endV: number };

/** The largest swing (biggest single move between a pivot low and a later
 *  pivot high, or vice versa) — what a fib retracement is actually measured
 *  from. */
export function findBiggestSwing(values: number[], strength: number): Swing | null {
  const pivots = findPivots(values, strength);
  let best: Swing | null = null;
  let bestSize = 0;
  for (let a = 0; a < pivots.length; a++) {
    for (let b = a + 1; b < pivots.length; b++) {
      if (pivots[a].high === pivots[b].high) continue;
      const size = Math.abs(pivots[b].value - pivots[a].value);
      if (size > bestSize) {
        bestSize = size;
        best = { startI: pivots[a].i, startV: pivots[a].value, endI: pivots[b].i, endV: pivots[b].value };
      }
    }
  }
  return best;
}

export const FIB_LEVELS = [0.236, 0.382, 0.5, 0.618, 0.786];

export function fibPrice(swing: Swing, level: number): number {
  return swing.endV - (swing.endV - swing.startV) * level;
}

export type CandlePattern = { i: number; bullish: boolean; kind: "engulfing" | "pinbar" };

/** Simplified textbook heuristics — not a production pattern scanner, just
 *  enough to light up a genuine example of each so the quiz has a real
 *  answer: engulfing = this candle's body fully covers the prior candle's
 *  body in the opposite direction; pin bar = a small body with a wick at
 *  least twice the body length on one side. */
export function findCandlePatterns(bars: OHLC[]): CandlePattern[] {
  const avgRange = bars.reduce((sum, b) => sum + (b.h - b.l), 0) / bars.length;
  const out: CandlePattern[] = [];
  for (let i = 1; i < bars.length; i++) {
    const prev = bars[i - 1];
    const cur = bars[i];
    const prevBody = [Math.min(prev.o, prev.c), Math.max(prev.o, prev.c)];
    const curBody = [Math.min(cur.o, cur.c), Math.max(cur.o, cur.c)];
    const prevBodyLen = prevBody[1] - prevBody[0];
    const prevBullish = prev.c > prev.o;
    const curBullish = cur.c > cur.o;
    // Engulfing needs a real reversal: the prior body has to be a
    // meaningful size (not a doji) for "engulfing it" to mean anything.
    if (
      curBullish !== prevBullish &&
      prevBodyLen > avgRange * 0.3 &&
      curBody[0] <= prevBody[0] &&
      curBody[1] >= prevBody[1]
    ) {
      out.push({ i, bullish: curBullish, kind: "engulfing" });
      continue;
    }
    const bodyLen = Math.max(Math.abs(cur.c - cur.o), avgRange * 0.08);
    const upperWick = cur.h - Math.max(cur.o, cur.c);
    const lowerWick = Math.min(cur.o, cur.c) - cur.l;
    // Pin bar / hammer: a small body with one wick at least 3x the body and
    // clearly the dominant feature of the candle.
    if (lowerWick > bodyLen * 3 && lowerWick > upperWick * 2 && lowerWick > avgRange * 0.5) {
      out.push({ i, bullish: true, kind: "pinbar" });
    } else if (upperWick > bodyLen * 3 && upperWick > lowerWick * 2 && upperWick > avgRange * 0.5) {
      out.push({ i, bullish: false, kind: "pinbar" });
    }
  }
  return out;
}

export type DoublePattern = { top: boolean; peak1: number; peak2: number; necklineI: number; necklineV: number };

/** Finds the two most prominent matching swing points (two peaks for a
 *  double top, two troughs for a double bottom) and the neckline between
 *  them — detected from the actual pivots, not just read off the
 *  generator's own parameters, the same way a trader would mark it up. */
export function findDoublePattern(values: number[], top: boolean, strength = 4): DoublePattern | null {
  const pivots = findPivots(values, strength).filter((p) => p.high === top);
  if (pivots.length < 2) return null;
  const sorted = [...pivots].sort((a, b) => (top ? b.value - a.value : a.value - b.value));
  const [p1, p2] = [sorted[0], sorted[1]].sort((a, b) => a.i - b.i);
  let necklineI = p1.i;
  let necklineV = values[p1.i];
  for (let i = p1.i; i <= p2.i; i++) {
    if (top ? values[i] < necklineV : values[i] > necklineV) {
      necklineV = values[i];
      necklineI = i;
    }
  }
  return { top, peak1: p1.i, peak2: p2.i, necklineI, necklineV };
}

export function toPath(
  values: (number | null)[],
  min: number,
  max: number,
  width: number,
  height: number,
  pad: number,
): string {
  const n = values.length;
  const xStep = (width - pad * 2) / (n - 1);
  const yFor = (v: number) => height - pad - ((v - min) / (max - min)) * (height - pad * 2);
  let d = "";
  let drawing = false;
  values.forEach((v, i) => {
    if (v == null) {
      drawing = false;
      return;
    }
    const x = pad + i * xStep;
    const y = yFor(v);
    d += drawing ? ` L ${x} ${y}` : `M ${x} ${y}`;
    drawing = true;
  });
  return d;
}

export function xStepFor(n: number, width: number, pad: number): number {
  return (width - pad * 2) / (n - 1);
}

export function yForFn(min: number, max: number, height: number, pad: number) {
  return (v: number) => height - pad - ((v - min) / (max - min)) * (height - pad * 2);
}
