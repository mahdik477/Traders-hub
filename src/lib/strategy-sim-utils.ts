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

export type BreakoutDemo = {
  bars: OHLC[];
  rangeEndI: number;
  breakoutI: number;
  hi: number;
  lo: number;
  up: boolean;
};

/** A deliberately-shaped OHLC series: a tight, flat consolidation range for
 *  the first chunk of bars, then one clean, decisive breakout candle and a
 *  short continuation in that direction. Like genDoublePattern, this is a
 *  crafted shape rather than a plain random walk — a random walk only
 *  rarely produces one single, unambiguous range with one single,
 *  unambiguous breakout, which is the whole point of the pattern. Still
 *  synthetic, still labelled as such. */
export function genBreakoutDemo(seed: number, n: number): BreakoutDemo {
  const rand = seededRandom(seed);
  const rangeEndI = Math.round(n * 0.6);
  const up = rand() > 0.5;
  const mid = 100;
  const rangeHalf = 1.8;
  const bars: OHLC[] = [];
  let prevClose = mid;
  for (let i = 0; i < n; i++) {
    const open = prevClose;
    let close: number;
    let high: number;
    let low: number;
    if (i <= rangeEndI) {
      const target = mid + (rand() - 0.5) * rangeHalf * 1.5;
      close = Math.max(mid - rangeHalf * 0.95, Math.min(mid + rangeHalf * 0.95, target));
      high = Math.min(mid + rangeHalf, Math.max(open, close) + rand() * 0.4);
      low = Math.max(mid - rangeHalf, Math.min(open, close) - rand() * 0.4);
    } else if (i === rangeEndI + 1) {
      close = up ? mid + rangeHalf + 1.6 + rand() * 0.5 : mid - rangeHalf - 1.6 - rand() * 0.5;
      high = Math.max(open, close) + rand() * 0.3;
      low = Math.min(open, close) - rand() * 0.3;
    } else {
      // Continuation, but not every bar runs the same way — a genuine
      // pullback candle every so often, same as a real breakout, so the
      // answer isn't just "the last bar before the colour changes".
      const pullback = rand() < 0.35;
      const dir = pullback ? -1 : 1;
      const magnitude = pullback ? 0.4 + rand() * 0.3 : 0.7 + rand() * 0.5;
      close = open + (up ? dir : -dir) * magnitude;
      high = Math.max(open, close) + rand() * 0.3;
      low = Math.min(open, close) - rand() * 0.3;
    }
    bars.push({ o: open, h: high, l: low, c: close });
    prevClose = close;
  }
  return { bars, rangeEndI, breakoutI: rangeEndI + 1, hi: mid + rangeHalf, lo: mid - rangeHalf, up };
}

export type CandleReversalDemo = {
  bars: OHLC[];
  patternI: number;
  bullish: boolean;
  kind: "engulfing" | "pinbar";
};

/** A deliberately-shaped OHLC series: plain, calm candles with exactly one
 *  obvious engulfing or pin bar/hammer inserted at a known bar — not a
 *  heuristic scan over a noisy random walk, which can turn up several
 *  marginal, debatable "patterns" at once. There's never more than one
 *  real answer here. Still synthetic, still labelled as such. */
export function genCandleReversalDemo(seed: number, n: number): CandleReversalDemo {
  const rand = seededRandom(seed);
  const patternI = Math.round(n * 0.55);
  const kind: "engulfing" | "pinbar" = rand() > 0.5 ? "engulfing" : "pinbar";
  const bullish = rand() > 0.5;

  const bars: OHLC[] = [];
  let prevClose = 100;
  for (let i = 0; i < n; i++) {
    const open = prevClose;
    let close: number;
    let high: number;
    let low: number;

    if (kind === "engulfing" && i === patternI - 1) {
      // The candle about to be engulfed: a clear, modest body opposite the
      // reversal direction.
      close = open + (bullish ? -1 : 1) * (1.4 + rand() * 0.4);
      high = Math.max(open, close) + rand() * 0.3;
      low = Math.min(open, close) - rand() * 0.3;
    } else if (kind === "engulfing" && i === patternI) {
      // The engulfing candle: fully covers the prior body, clearly, in the
      // reversal direction.
      const priorOpen = bars[i - 1].o;
      close = priorOpen + (bullish ? 1 : -1) * 0.6;
      high = Math.max(open, close) + rand() * 0.3;
      low = Math.min(open, close) - rand() * 0.3;
    } else if (kind === "pinbar" && i === patternI) {
      // A small body with one wick several times the body's length.
      const bodyLen = 0.35 + rand() * 0.15;
      close = bullish ? open + bodyLen : open - bodyLen;
      const wick = 3.2 + rand() * 0.6;
      if (bullish) {
        high = Math.max(open, close) + 0.2;
        low = Math.min(open, close) - wick;
      } else {
        high = Math.max(open, close) + wick;
        low = Math.min(open, close) - 0.2;
      }
    } else {
      // A plain, calm candle — small body, modest wicks.
      close = open + (rand() - 0.5) * 1.0;
      high = Math.max(open, close) + rand() * 0.35;
      low = Math.min(open, close) - rand() * 0.35;
    }

    bars.push({ o: open, h: high, l: low, c: close });
    prevClose = close;
  }

  return { bars, patternI, bullish, kind };
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

/** sma() over a series that already has leading nulls — same reasoning as
 *  emaSkipNulls just below. */
export function smaSkipNulls(values: (number | null)[], period: number): (number | null)[] {
  const dense = values.filter((v): v is number => v != null);
  const denseSma = sma(dense, period);
  const out: (number | null)[] = [];
  let j = 0;
  for (const v of values) {
    if (v == null) {
      out.push(null);
    } else {
      out.push(denseSma[j]);
      j++;
    }
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

// ---------------------------------------------------------------------------
// Everything below is for the intermediate-tier interactive strategies —
// oscillators, trend-flip indicators, bands and the deliberately-shaped
// chart patterns that need their own generator the same way genDoublePattern
// does. Same rules as above throughout: every series is synthetic and
// deterministic per seed, never real market data.

export function trueRange(bars: OHLC[]): number[] {
  return bars.map((b, i) => {
    if (i === 0) return b.h - b.l;
    const prevClose = bars[i - 1].c;
    return Math.max(b.h - b.l, Math.abs(b.h - prevClose), Math.abs(b.l - prevClose));
  });
}

/** Wilder's smoothing — the running average ATR, Supertrend, ADX and
 *  Parabolic SAR are all traditionally built from. */
function wilderSmooth(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return out;
  let avg = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = avg;
  for (let i = period; i < values.length; i++) {
    avg = (avg * (period - 1) + values[i]) / period;
    out[i] = avg;
  }
  return out;
}

export function atr(bars: OHLC[], period: number): (number | null)[] {
  return wilderSmooth(trueRange(bars), period);
}

export function stochastic(
  bars: OHLC[],
  period: number,
  smoothK: number,
  smoothD: number,
): { k: (number | null)[]; d: (number | null)[] } {
  const rawK: (number | null)[] = bars.map((_, i) => {
    if (i < period - 1) return null;
    const window = bars.slice(i - period + 1, i + 1);
    const hi = Math.max(...window.map((b) => b.h));
    const lo = Math.min(...window.map((b) => b.l));
    return hi === lo ? 50 : ((bars[i].c - lo) / (hi - lo)) * 100;
  });
  const k = smaSkipNulls(rawK, smoothK);
  const d = smaSkipNulls(k, smoothD);
  return { k, d };
}

export function cci(bars: OHLC[], period: number): (number | null)[] {
  const typical = bars.map((b) => (b.h + b.l + b.c) / 3);
  const mid = sma(typical, period);
  return typical.map((tp, i) => {
    const m = mid[i];
    if (m == null) return null;
    let deviation = 0;
    for (let j = i - period + 1; j <= i; j++) deviation += Math.abs(typical[j] - m);
    const meanDeviation = deviation / period;
    return meanDeviation === 0 ? 0 : (tp - m) / (0.015 * meanDeviation);
  });
}

export function williamsR(bars: OHLC[], period: number): (number | null)[] {
  return bars.map((_, i) => {
    if (i < period - 1) return null;
    const window = bars.slice(i - period + 1, i + 1);
    const hi = Math.max(...window.map((b) => b.h));
    const lo = Math.min(...window.map((b) => b.l));
    return hi === lo ? -50 : ((hi - bars[i].c) / (hi - lo)) * -100;
  });
}

export function roc(values: number[], period: number): (number | null)[] {
  return values.map((v, i) => (i < period ? null : ((v - values[i - period]) / values[i - period]) * 100));
}

/** A fabricated volume series to go with a close/OHLC series — never real
 *  volume, same synthetic-data convention as everything else here. Shaped
 *  so it's loosely bigger on bigger moves, since that's what OBV/VWAP
 *  actually need to look like anything. */
export function genVolume(seed: number, bars: OHLC[]): number[] {
  const rand = seededRandom(seed + 1);
  return bars.map((b) => Math.round(400 + Math.abs(b.c - b.o) * 300 + rand() * 500));
}

/** Same idea as genVolume, but for a plain close-only series rather than
 *  OHLC bars — what OBV/divergence pages need since they work off
 *  genDivergenceSeries, not genOHLC. */
export function genVolumeFromCloses(seed: number, closes: number[]): number[] {
  const rand = seededRandom(seed + 1);
  return closes.map((c, i) => {
    const move = i === 0 ? 0 : Math.abs(c - closes[i - 1]);
    return Math.round(400 + move * 300 + rand() * 500);
  });
}

export function obv(bars: OHLC[], volumes: number[]): number[] {
  return obvFromCloses(bars.map((b) => b.c), volumes);
}

export function obvFromCloses(closes: number[], volumes: number[]): number[] {
  const out = [0];
  for (let i = 1; i < closes.length; i++) {
    const prev = out[i - 1];
    if (closes[i] > closes[i - 1]) out.push(prev + volumes[i]);
    else if (closes[i] < closes[i - 1]) out.push(prev - volumes[i]);
    else out.push(prev);
  }
  return out;
}

export function vwap(bars: OHLC[], volumes: number[]): number[] {
  let cumPV = 0;
  let cumV = 0;
  return bars.map((b, i) => {
    const typical = (b.h + b.l + b.c) / 3;
    cumPV += typical * volumes[i];
    cumV += volumes[i];
    return cumPV / cumV;
  });
}

export function heikinAshi(bars: OHLC[]): OHLC[] {
  const out: OHLC[] = [];
  bars.forEach((b, i) => {
    const c = (b.o + b.h + b.l + b.c) / 4;
    const o = i === 0 ? (b.o + b.c) / 2 : (out[i - 1].o + out[i - 1].c) / 2;
    const h = Math.max(b.h, o, c);
    const l = Math.min(b.l, o, c);
    out.push({ o, h, l, c });
  });
  return out;
}

export type DmiAdx = { plusDi: (number | null)[]; minusDi: (number | null)[]; adx: (number | null)[] };

export function adxDmi(bars: OHLC[], period: number): DmiAdx {
  const plusDm: number[] = [0];
  const minusDm: number[] = [0];
  for (let i = 1; i < bars.length; i++) {
    const upMove = bars[i].h - bars[i - 1].h;
    const downMove = bars[i - 1].l - bars[i].l;
    plusDm.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDm.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }
  const tr = trueRange(bars);
  const smoothTr = wilderSmooth(tr, period);
  const smoothPlusDm = wilderSmooth(plusDm, period);
  const smoothMinusDm = wilderSmooth(minusDm, period);
  const plusDi = smoothPlusDm.map((v, i) => (v == null || !smoothTr[i] ? null : (v / smoothTr[i]!) * 100));
  const minusDi = smoothMinusDm.map((v, i) => (v == null || !smoothTr[i] ? null : (v / smoothTr[i]!) * 100));
  const dx = plusDi.map((p, i) => {
    const m = minusDi[i];
    if (p == null || m == null || p + m === 0) return null;
    return (Math.abs(p - m) / (p + m)) * 100;
  });
  const dense = dx.filter((v): v is number => v != null);
  const adxDense = wilderSmooth(dense, period);
  const adx: (number | null)[] = [];
  let j = 0;
  for (const v of dx) {
    if (v == null) adx.push(null);
    else {
      adx.push(adxDense[j]);
      j++;
    }
  }
  return { plusDi, minusDi, adx };
}

export type FlipLine = { value: number; up: boolean }[];

/** Supertrend — a trailing line that sits below price in an uptrend, above
 *  it in a downtrend, and flips sides the bar after price closes through
 *  it. The flip is the signal. */
export function supertrend(bars: OHLC[], period: number, mult: number): FlipLine {
  const atrLine = atr(bars, period);
  const out: FlipLine = [];
  let up = true;
  let line = bars[0].c;
  for (let i = 0; i < bars.length; i++) {
    const a = atrLine[i];
    if (a == null) {
      out.push({ value: bars[i].c, up });
      continue;
    }
    const basicUpper = (bars[i].h + bars[i].l) / 2 + mult * a;
    const basicLower = (bars[i].h + bars[i].l) / 2 - mult * a;
    if (up) {
      line = Math.max(line, basicLower);
      if (bars[i].c < line) {
        up = false;
        line = basicUpper;
      }
    } else {
      line = Math.min(line, basicUpper);
      if (bars[i].c > line) {
        up = true;
        line = basicLower;
      }
    }
    out.push({ value: line, up });
  }
  return out;
}

/** Parabolic SAR — dots that sit below price while it rises, above it
 *  while it falls, and flip sides on a reversal. Same signal idea as
 *  Supertrend, different line. */
export function parabolicSar(bars: OHLC[], step = 0.02, maxStep = 0.2): FlipLine {
  const out: FlipLine = [];
  let up = true;
  let sar = bars[0].l;
  let ep = bars[0].h;
  let af = step;
  for (let i = 0; i < bars.length; i++) {
    if (i > 0) {
      sar = sar + af * (ep - sar);
      if (up) {
        sar = Math.min(sar, bars[i - 1].l, i > 1 ? bars[i - 2].l : bars[i - 1].l);
        if (bars[i].l < sar) {
          up = false;
          sar = ep;
          ep = bars[i].l;
          af = step;
        } else if (bars[i].h > ep) {
          ep = bars[i].h;
          af = Math.min(af + step, maxStep);
        }
      } else {
        sar = Math.max(sar, bars[i - 1].h, i > 1 ? bars[i - 2].h : bars[i - 1].h);
        if (bars[i].h > sar) {
          up = true;
          sar = ep;
          ep = bars[i].h;
          af = step;
        } else if (bars[i].l < ep) {
          ep = bars[i].l;
          af = Math.min(af + step, maxStep);
        }
      }
    }
    out.push({ value: sar, up });
  }
  return out;
}

export type PivotLevels = { r2: number; r1: number; p: number; s1: number; s2: number };

/** Classic floor-trader pivots, from the prior period's high/low/close —
 *  a fixed set of horizontal levels, same idea as support/resistance but
 *  computed by formula instead of read off swing points. */
export function classicPivots(prevHigh: number, prevLow: number, prevClose: number): PivotLevels {
  const p = (prevHigh + prevLow + prevClose) / 3;
  const r1 = 2 * p - prevLow;
  const s1 = 2 * p - prevHigh;
  const r2 = p + (prevHigh - prevLow);
  const s2 = p - (prevHigh - prevLow);
  return { r2, r1, p, s1, s2 };
}

export type Divergence = { priceI1: number; priceI2: number; oscI1: number; oscI2: number; bullish: boolean };

/** Divergence: price makes a lower low while the oscillator makes a higher
 *  low (bullish), or price makes a higher high while the oscillator makes a
 *  lower high (bearish) — the two pivot points that actually define it. */
export function findDivergence(values: number[], oscillator: (number | null)[], strength: number): Divergence | null {
  const pivots = findPivots(values, strength);
  const highs = pivots.filter((p) => p.high);
  const lows = pivots.filter((p) => !p.high);
  // Bearish: last two swing highs, price higher but oscillator lower.
  if (highs.length >= 2) {
    const [h1, h2] = highs.slice(-2);
    const o1 = oscillator[h1.i];
    const o2 = oscillator[h2.i];
    if (o1 != null && o2 != null && h2.value > h1.value && o2 < o1) {
      return { priceI1: h1.i, priceI2: h2.i, oscI1: h1.i, oscI2: h2.i, bullish: false };
    }
  }
  // Bullish: last two swing lows, price lower but oscillator higher.
  if (lows.length >= 2) {
    const [l1, l2] = lows.slice(-2);
    const o1 = oscillator[l1.i];
    const o2 = oscillator[l2.i];
    if (o1 != null && o2 != null && l2.value < l1.value && o2 > o1) {
      return { priceI1: l1.i, priceI2: l2.i, oscI1: l1.i, oscI2: l2.i, bullish: true };
    }
  }
  return null;
}

/** A deliberately-shaped series containing one genuine divergence — same
 *  reasoning as genDoublePattern: a plain random walk only rarely lines up
 *  into a clean divergence on demand, so this one is built to contain it.
 *  Two swing lows (or highs) where price goes one way and momentum fades
 *  the other. */
export function genDivergenceSeries(seed: number, n: number, bullish: boolean, warmup = 0): number[] {
  const rand = seededRandom(seed);
  const sign = bullish ? -1 : 1;
  const p1 = Math.max(Math.round(n * 0.3), warmup + 6);
  const p2 = Math.max(Math.round(n * 0.68), p1 + 15);
  const values: number[] = [100];
  for (let i = 1; i < n; i++) {
    // Two swings of decreasing momentum (steeper into p1, shallower into
    // p2) but the second one still reaches further in price — that gap in
    // momentum vs. price is the divergence.
    let target = 100;
    const width = n * 0.1;
    const depth1 = 10;
    const depth2 = 13;
    target += sign * depth1 * Math.exp(-((i - p1) ** 2) / (2 * width * width * 0.6));
    target += sign * depth2 * Math.exp(-((i - p2) ** 2) / (2 * width * width * 1.6));
    values.push(target + (rand() - 0.5) * 1.1);
  }
  return values;
}

export type ObvDivergenceDemo = { closes: number[]; volumes: number[] };

/** OBV is a running total, not a bounded oscillator, so it doesn't
 *  naturally "lose momentum" the way RSI/MACD do on the same crafted
 *  price series — genDivergenceSeries's price shape alone won't produce
 *  a real OBV divergence. This builds price the same way, then chooses
 *  each bar's (fabricated) volume so OBV's own two swings come out with
 *  the depths swapped relative to price's: price's second swing is the
 *  bigger one, OBV's second swing is deliberately the smaller one — that
 *  gap is the actual divergence. Every bar's volume still moves OBV in
 *  the same direction price closed that bar, same as the real formula. */
export function genObvDivergenceDemo(seed: number, n: number, bullish: boolean): ObvDivergenceDemo {
  const closes = genDivergenceSeries(seed, n, bullish);
  const rand = seededRandom(seed + 3);
  const p1 = Math.max(Math.round(n * 0.3), 6);
  const p2 = Math.max(Math.round(n * 0.68), p1 + 15);
  const width = n * 0.12;
  // Rather than trying to shape OBV's cumulative total to hit an exact
  // target (which fights the noisy day-to-day direction baked into
  // price), this just makes volume itself bigger around the first swing
  // and deliberately smaller around the second one. OBV only cares about
  // the sign of each day's move — price decides that — but the relative
  // SIZE of each swing's contribution to the running total is entirely
  // down to volume, so a bigger first swing's worth of volume and a
  // smaller second swing's worth reliably produces a shallower second
  // peak/trough in OBV even though price's second swing is the deeper
  // one. That gap is the divergence.
  const volumes: number[] = [500];
  for (let i = 1; i < n; i++) {
    const envelope1 = Math.exp(-((i - p1) ** 2) / (2 * width * width));
    const envelope2 = Math.exp(-((i - p2) ** 2) / (2 * width * width));
    const base = 40 + rand() * 30;
    volumes.push(base + 650 * envelope1 + 180 * envelope2);
  }
  return { closes, volumes };
}

export type GapDemo = { bars: OHLC[]; gapI: number; up: boolean; filled: boolean; fillI: number | null };

/** A deliberate price gap between one candle's close and the next one's
 *  open — genOHLC never gaps (it always opens at the prior close), so gap
 *  strategies need their own generator. Either fills back to the pre-gap
 *  level within the window (gap fill) or keeps running (gap-and-go). */
export function genGapDemo(seed: number, n: number, fills: boolean): GapDemo {
  const rand = seededRandom(seed);
  const gapI = Math.round(n * 0.45);
  const up = rand() > 0.5;
  const bars: OHLC[] = [];
  let prevClose = 100;
  for (let i = 0; i < n; i++) {
    let open = prevClose;
    if (i === gapI) open = prevClose + (up ? 1 : -1) * (2.2 + rand() * 0.6);
    let close: number;
    if (i === gapI) {
      close = open + (up ? 1 : -1) * (0.6 + rand() * 0.4);
    } else if (fills && i > gapI && i <= gapI + Math.round(n * 0.12)) {
      close = open - (up ? 1 : -1) * (0.5 + rand() * 0.4);
    } else if (!fills && i > gapI) {
      close = open + (up ? 1 : -1) * (0.5 + rand() * 0.4);
    } else {
      close = open + (rand() - 0.5) * 1.0;
    }
    const high = Math.max(open, close) + rand() * 0.3;
    const low = Math.min(open, close) - rand() * 0.3;
    bars.push({ o: open, h: high, l: low, c: close });
    prevClose = close;
  }
  const preGapClose = bars[gapI - 1].c;
  let fillI: number | null = null;
  if (fills) {
    for (let i = gapI; i < bars.length; i++) {
      if ((up && bars[i].c <= preGapClose) || (!up && bars[i].c >= preGapClose)) {
        fillI = i;
        break;
      }
    }
  }
  return { bars, gapI, up, filled: fills && fillI != null, fillI };
}

export type InsideBarDemo = { bars: OHLC[]; motherI: number; insideI: number };

/** A deliberate inside bar: one candle (the "mother bar") followed by one
 *  whose entire high/low range sits inside the mother bar's range — in an
 *  otherwise plain run, same "exactly one real answer" approach as
 *  genCandleReversalDemo. */
export function genInsideBarDemo(seed: number, n: number): InsideBarDemo {
  const rand = seededRandom(seed);
  const motherI = Math.round(n * 0.55);
  const bars: OHLC[] = [];
  let prevClose = 100;
  for (let i = 0; i < n; i++) {
    const open = prevClose;
    let close: number;
    let high: number;
    let low: number;
    if (i === motherI) {
      close = open + (rand() > 0.5 ? 1 : -1) * (1.6 + rand() * 0.5);
      high = Math.max(open, close) + 0.6 + rand() * 0.3;
      low = Math.min(open, close) - 0.6 - rand() * 0.3;
    } else if (i === motherI + 1) {
      const motherHigh = bars[motherI].h;
      const motherLow = bars[motherI].l;
      const mid = (motherHigh + motherLow) / 2;
      const span = (motherHigh - motherLow) * 0.45;
      close = mid + (rand() - 0.5) * span * 0.6;
      high = mid + span / 2;
      low = mid - span / 2;
    } else {
      close = open + (rand() - 0.5) * 1.0;
      high = Math.max(open, close) + rand() * 0.35;
      low = Math.min(open, close) - rand() * 0.35;
    }
    bars.push({ o: open, h: high, l: low, c: close });
    prevClose = close;
  }
  return { bars, motherI, insideI: motherI + 1 };
}

export type ThreePointPattern = { left: number; mid: number; right: number; necklineI: number; necklineV: number; inverse: boolean };

/** A deliberately-shaped head-and-shoulders (or, mirrored, an inverse
 *  head-and-shoulders): three peaks/troughs, the middle one the most
 *  extreme, with a neckline connecting the two troughs/peaks between them.
 *  Same reasoning as genDoublePattern — needs a crafted shape to actually
 *  show the pattern rather than hoping a random walk produces one. */
export function genHeadShouldersPattern(seed: number, n: number, inverse: boolean): number[] {
  const rand = seededRandom(seed);
  const sign = inverse ? -1 : 1;
  const positions = [Math.round(n * 0.22), Math.round(n * 0.5), Math.round(n * 0.78)];
  const heights = [11, 15, 11.5];
  const values: number[] = [100];
  for (let i = 1; i < n; i++) {
    let target = 100;
    positions.forEach((p, idx) => {
      const dist = i - p;
      const width = n * 0.1;
      target += sign * heights[idx] * Math.exp(-(dist * dist) / (2 * width * width));
    });
    if (i > positions[2] + n * 0.06) target -= sign * ((i - positions[2]) / n) * heights[2] * 1.4;
    values.push(target + (rand() - 0.5) * 1.1);
  }
  return values;
}

export function findThreePointPattern(values: number[], inverse: boolean, strength = 4): ThreePointPattern | null {
  const pivots = findPivots(values, strength).filter((p) => p.high === !inverse);
  if (pivots.length < 3) return null;
  const sorted = [...pivots].sort((a, b) => (inverse ? a.value - b.value : b.value - a.value));
  const top3 = sorted.slice(0, 3).sort((a, b) => a.i - b.i);
  const [left, mid, right] = top3;
  if (!(mid.value === (inverse ? Math.min(left.value, mid.value, right.value) : Math.max(left.value, mid.value, right.value)))) {
    return null;
  }
  let necklineI = left.i;
  let necklineV = values[left.i];
  for (let i = left.i; i <= right.i; i++) {
    if (inverse ? values[i] > necklineV : values[i] < necklineV) {
      necklineV = values[i];
      necklineI = i;
    }
  }
  return { left: left.i, mid: mid.i, right: right.i, necklineI, necklineV, inverse };
}

export type FlagDemo = { values: number[]; poleStartI: number; poleEndI: number; flagEndI: number; breakoutI: number; up: boolean };

/** A deliberate flag/pennant: a sharp "flagpole" move, then a tight
 *  consolidation drifting gently against it (the "flag"), then a clean
 *  breakout continuing the pole's direction. */
export function genFlagDemo(seed: number, n: number): FlagDemo {
  const rand = seededRandom(seed);
  const up = rand() > 0.5;
  const sign = up ? 1 : -1;
  const poleStartI = Math.round(n * 0.1);
  const poleEndI = Math.round(n * 0.35);
  const flagEndI = Math.round(n * 0.7);
  const values: number[] = [100];
  for (let i = 1; i < n; i++) {
    const prev = values[i - 1];
    let next: number;
    if (i < poleStartI) {
      next = prev + (rand() - 0.5) * 0.5;
    } else if (i <= poleEndI) {
      next = prev + sign * (0.9 + rand() * 0.3);
    } else if (i <= flagEndI) {
      next = prev - sign * (0.15 + rand() * 0.2);
    } else if (i === flagEndI + 1) {
      next = prev + sign * (1.8 + rand() * 0.4);
    } else {
      next = prev + sign * (0.5 + rand() * 0.4);
    }
    values.push(next);
  }
  return { values, poleStartI, poleEndI, flagEndI, breakoutI: flagEndI + 1, up };
}

export type CupHandleDemo = { values: number[]; cupStartI: number; cupEndI: number; handleEndI: number; breakoutI: number; rimV: number };

/** A deliberate cup and handle: a U-shaped recovery back to its starting
 *  level (the "cup"), a small pullback (the "handle"), then a breakout
 *  above the cup's rim. */
export function genCupHandleDemo(seed: number, n: number): CupHandleDemo {
  const rand = seededRandom(seed);
  const cupStartI = Math.round(n * 0.08);
  const cupEndI = Math.round(n * 0.62);
  const handleEndI = Math.round(n * 0.82);
  const depth = 9 + rand() * 2;
  const rimV = 100;
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    let target: number;
    if (i < cupStartI) {
      target = rimV + (rand() - 0.5) * 0.6;
    } else if (i <= cupEndI) {
      const t = (i - cupStartI) / (cupEndI - cupStartI);
      // A gentle U shape: a sine arc from the rim down to the bottom of
      // the cup and back up to the rim.
      target = rimV - depth * Math.sin(t * Math.PI);
    } else if (i <= handleEndI) {
      target = rimV - depth * 0.22 + (rand() - 0.5) * 0.8;
    } else if (i === handleEndI + 1) {
      target = rimV + 1.6 + rand() * 0.5;
    } else {
      target = values[i - 1] + 0.5 + rand() * 0.4;
    }
    values.push(target + (rand() - 0.5) * 0.5);
  }
  return { values, cupStartI, cupEndI, handleEndI, breakoutI: handleEndI + 1, rimV };
}

/** A deliberate clean trend followed by a reversal — built specifically so
 *  its Heikin-Ashi conversion shows the textbook pattern (a run of
 *  same-colour candles with no opposite wicks, then a flip) clearly rather
 *  than hoping a noisy random walk produces one. Returns plain OHLC; call
 *  heikinAshi() on the result to get the HA candles. */
export function genHeikinAshiTrendDemo(seed: number, n: number): { bars: OHLC[]; flipI: number; up: boolean } {
  const rand = seededRandom(seed);
  const up = rand() > 0.5;
  const sign = up ? 1 : -1;
  const flipI = Math.round(n * 0.58);
  const bars: OHLC[] = [];
  let prevClose = 100;
  for (let i = 0; i < n; i++) {
    const open = prevClose;
    const dir = i < flipI ? sign : -sign;
    const close = open + dir * (0.7 + rand() * 0.4);
    const high = Math.max(open, close) + rand() * 0.25;
    const low = Math.min(open, close) - rand() * 0.25;
    bars.push({ o: open, h: high, l: low, c: close });
    prevClose = close;
  }
  return { bars, flipI, up };
}

export type MtfCandidate = { values: number[]; aligned: boolean };
export type MtfDemo = { htfTrend: number[]; candidates: MtfCandidate[]; correctIdx: number };

/** The higher-timeframe trend, plus three lower-timeframe snippets — only
 *  one of which actually continues in the higher-timeframe's direction
 *  (a pullback that resumes). The other two are a reversal and a
 *  sideways chop, both genuinely plausible-looking entries that just
 *  don't agree with the bigger trend. */
export function genMtfDemo(seed: number, n: number): MtfDemo {
  const rand = seededRandom(seed);
  const up = rand() > 0.5;
  const sign = up ? 1 : -1;
  const htfTrend: number[] = [100];
  for (let i = 1; i < n; i++) {
    htfTrend.push(htfTrend[i - 1] + sign * (0.5 + rand() * 0.3) + (rand() - 0.5) * 0.6);
  }

  const m = Math.round(n * 0.6);
  function pullbackThenContinue(): number[] {
    const vals: number[] = [100];
    for (let i = 1; i < m; i++) {
      const dir = i < m * 0.4 ? -sign : sign;
      vals.push(vals[i - 1] + dir * (0.4 + rand() * 0.3));
    }
    return vals;
  }
  function reversal(): number[] {
    const vals: number[] = [100];
    for (let i = 1; i < m; i++) {
      vals.push(vals[i - 1] - sign * (0.5 + rand() * 0.3));
    }
    return vals;
  }
  function chop(): number[] {
    const vals: number[] = [100];
    for (let i = 1; i < m; i++) {
      vals.push(vals[i - 1] + (rand() - 0.5) * 0.9);
    }
    return vals;
  }

  const options: MtfCandidate[] = [
    { values: pullbackThenContinue(), aligned: true },
    { values: reversal(), aligned: false },
    { values: chop(), aligned: false },
  ];
  // Shuffle the three into a random, seed-stable order.
  const order = [0, 1, 2];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const candidates = order.map((i) => options[i]);
  const correctIdx = candidates.findIndex((c) => c.aligned);
  return { htfTrend, candidates, correctIdx };
}

export type RelativeStrengthSeries = { label: string; values: number[] };

/** Several fabricated return series over the same window — one of them
 *  deliberately the strongest, the rest genuinely mixed (not just flat
 *  losers), so "which one would a momentum rotation buy" has exactly one
 *  real answer without being a trivial pick. */
export function genRelativeStrengthSeries(seed: number, n: number, count = 4): RelativeStrengthSeries[] {
  const rand = seededRandom(seed);
  const winner = Math.floor(rand() * count);
  const labels = ["Asset A", "Asset B", "Asset C", "Asset D"].slice(0, count);
  return labels.map((label, idx) => {
    const drift = idx === winner ? 0.55 + rand() * 0.15 : (rand() - 0.55) * 0.35;
    const values: number[] = [100];
    for (let i = 1; i < n; i++) {
      values.push(values[i - 1] + drift + (rand() - 0.5) * 1.3);
    }
    return { label, values };
  });
}

// ---------------------------------------------------------------------------
// Everything below is for the advanced-tier interactive strategies — same
// rules as the free and intermediate tiers throughout: every series is
// synthetic and deterministic per seed, never real market data, and every
// generated pattern is crafted deliberately where a plain random walk would
// only rarely produce the shape on demand.

export type ConfluenceDemo = { values: number[]; swing1: Swing; swing2: Swing; confluencePrice: number; touchI: number };

/** Two deliberately distinct swings (not detected by pivot strength, which
 *  tends to find the same dominant move twice) — an earlier, smaller one
 *  and a later, bigger one — each with its own fib levels. Confluence is
 *  wherever a level from each swing lands at nearly the same price; this
 *  is built so that always happens, with price then pulling back to
 *  actually test it. */
export function genConfluenceDemo(seed: number, n: number): ConfluenceDemo {
  const rand = seededRandom(seed);
  const up = rand() > 0.5;
  const sign = up ? 1 : -1;
  const s1a = Math.round(n * 0.05);
  const s1b = Math.round(n * 0.3);
  const s2a = Math.round(n * 0.38);
  const s2b = Math.round(n * 0.62);
  const testI = Math.round(n * 0.85);

  const v0 = 100;
  const swing1: Swing = { startI: s1a, startV: v0, endI: s1b, endV: v0 + sign * 9 };
  const swing2: Swing = { startI: s2a, startV: swing1.endV - sign * 2, endI: s2b, endV: swing1.endV + sign * 16 };

  // Find the two levels (one per swing) that land closest together.
  let best = { l1: FIB_LEVELS[0], l2: FIB_LEVELS[0], dist: Infinity };
  for (const l1 of FIB_LEVELS) {
    for (const l2 of FIB_LEVELS) {
      const p1 = fibPrice(swing1, l1);
      const p2 = fibPrice(swing2, l2);
      const dist = Math.abs(p1 - p2);
      if (dist < best.dist) best = { l1, l2, dist };
    }
  }
  const confluencePrice = (fibPrice(swing1, best.l1) + fibPrice(swing2, best.l2)) / 2;

  const values: number[] = [v0];
  for (let i = 1; i < n; i++) {
    let target: number;
    if (i <= s1b) {
      const t = (i - s1a) / (s1b - s1a);
      target = v0 + sign * 9 * Math.max(0, Math.min(1, t));
    } else if (i <= s2a) {
      const t = (i - s1b) / (s2a - s1b);
      target = swing1.endV - sign * 2 * Math.max(0, Math.min(1, t));
    } else if (i <= s2b) {
      const t = (i - s2a) / (s2b - s2a);
      target = swing2.startV + sign * 18 * Math.max(0, Math.min(1, t));
    } else if (i <= testI) {
      const t = (i - s2b) / (testI - s2b);
      target = swing2.endV + (confluencePrice - swing2.endV) * Math.max(0, Math.min(1, t));
    } else {
      target = confluencePrice + sign * ((i - testI) / (n - testI)) * 4;
    }
    values.push(target + (rand() - 0.5) * 0.7);
  }
  return { values, swing1, swing2, confluencePrice, touchI: testI };
}

export type ElderScreenDemo = { htfTrend: number[]; ltf: number[]; oscillator: (number | null)[]; dipI: number; triggerI: number; up: boolean };

/** Elder's three screens, built deliberately: screen 1 is the higher-
 *  timeframe trend (just direction, nothing to click); screen 2 is a
 *  short-period oscillator on the lower timeframe dipping against that
 *  trend (the pullback); screen 3 is the actual entry trigger — the bar
 *  where price breaks back above (or below) its recent short-term range
 *  once the pullback is done. */
export function genElderScreenDemo(seed: number, n: number): ElderScreenDemo {
  const rand = seededRandom(seed);
  const up = rand() > 0.5;
  const sign = up ? 1 : -1;

  const htfTrend: number[] = [100];
  for (let i = 1; i < n; i++) htfTrend.push(htfTrend[i - 1] + sign * (0.4 + rand() * 0.25));

  const pullbackEndI = Math.round(n * 0.65);
  const ltf: number[] = [100];
  for (let i = 1; i < n; i++) {
    const dir = i < pullbackEndI ? -sign : sign;
    ltf.push(ltf[i - 1] + dir * (0.35 + rand() * 0.3));
  }

  const oscillator = rsi(ltf, 5);
  // The dip is the actual low (or high, in a downtrend) the pullback
  // makes — a sustained one-directional pullback saturates a short RSI
  // at 0/100 for most of its length, so price itself is the reliable
  // signal for exactly where it turns.
  let dipI = 0;
  let dipVal = up ? Infinity : -Infinity;
  for (let i = 0; i < pullbackEndI; i++) {
    const v = ltf[i];
    if (up ? v < dipVal : v > dipVal) {
      dipVal = v;
      dipI = i;
    }
  }

  // The trigger is the first bar after the dip whose close breaks the
  // high (or low) of the few bars right before it.
  let triggerI = pullbackEndI;
  for (let i = dipI + 2; i < n; i++) {
    const lookback = ltf.slice(Math.max(0, i - 3), i);
    const edge = up ? Math.max(...lookback) : Math.min(...lookback);
    if (up ? ltf[i] > edge : ltf[i] < edge) {
      triggerI = i;
      break;
    }
  }

  return { htfTrend, ltf, oscillator, dipI, triggerI, up };
}

export type WyckoffDemo = { bars: OHLC[]; rangeEndI: number; hi: number; lo: number; breakI: number; reclaimI: number; spring: boolean };

/** A Wyckoff spring (price breaks below range support, then reclaims back
 *  inside — a false breakdown) or upthrust (the mirror, above resistance).
 *  The reclaim is the actual signal; the break on its own is a trap. */
export function genWyckoffDemo(seed: number, n: number, spring: boolean): WyckoffDemo {
  const rand = seededRandom(seed);
  const rangeEndI = Math.round(n * 0.55);
  const mid = 100;
  const rangeHalf = 1.6;
  const sign = spring ? -1 : 1;
  const bars: OHLC[] = [];
  let prevClose = mid;
  for (let i = 0; i < n; i++) {
    const open = prevClose;
    let close: number;
    let high: number;
    let low: number;
    if (i <= rangeEndI) {
      const target = mid + (rand() - 0.5) * rangeHalf * 1.4;
      close = Math.max(mid - rangeHalf * 0.9, Math.min(mid + rangeHalf * 0.9, target));
      high = Math.min(mid + rangeHalf, Math.max(open, close) + rand() * 0.3);
      low = Math.max(mid - rangeHalf, Math.min(open, close) - rand() * 0.3);
    } else if (i === rangeEndI + 1) {
      // The false break — a decisive poke outside the range.
      close = mid + sign * (rangeHalf + 1.0 + rand() * 0.4);
      high = Math.max(open, close) + rand() * 0.3;
      low = Math.min(open, close) - rand() * 0.3;
    } else if (i === rangeEndI + 2) {
      // The reclaim — a sharp move straight back inside the range, the
      // actual signal.
      close = mid - sign * (0.3 + rand() * 0.3);
      high = Math.max(open, close) + rand() * 0.3;
      low = Math.min(open, close) - rand() * 0.3;
    } else {
      close = open - sign * (0.5 + rand() * 0.4);
      high = Math.max(open, close) + rand() * 0.3;
      low = Math.min(open, close) - rand() * 0.3;
    }
    bars.push({ o: open, h: high, l: low, c: close });
    prevClose = close;
  }
  return { bars, rangeEndI, hi: mid + rangeHalf, lo: mid - rangeHalf, breakI: rangeEndI + 1, reclaimI: rangeEndI + 2, spring };
}

export type VsaDemo = { bars: OHLC[]; volumes: number[]; signalI: number; bullish: boolean };

/** VSA "stopping volume": a bar with a narrow spread (small high-to-low
 *  range) but unusually heavy volume, appearing right after a run in one
 *  direction — read as that move running out of willing sellers (or
 *  buyers), not confirmation of it. */
export function genVsaDemo(seed: number, n: number, bullish: boolean): VsaDemo {
  const rand = seededRandom(seed);
  const sign = bullish ? -1 : 1; // the run is in this direction before the stopping bar
  const signalI = Math.round(n * 0.6);
  const bars: OHLC[] = [];
  const volumes: number[] = [];
  let prevClose = 100;
  for (let i = 0; i < n; i++) {
    const open = prevClose;
    let close: number;
    let high: number;
    let low: number;
    let volume: number;
    if (i === signalI) {
      // Narrow spread, closing mid-range — but about to get heavy volume.
      close = open + (rand() - 0.5) * 0.3;
      high = Math.max(open, close) + 0.15;
      low = Math.min(open, close) - 0.15;
      volume = 1400 + rand() * 300;
    } else if (i < signalI) {
      close = open + sign * (0.5 + rand() * 0.4);
      high = Math.max(open, close) + rand() * 0.3;
      low = Math.min(open, close) - rand() * 0.3;
      volume = 300 + rand() * 200;
    } else {
      close = open - sign * (0.4 + rand() * 0.4);
      high = Math.max(open, close) + rand() * 0.3;
      low = Math.min(open, close) - rand() * 0.3;
      volume = 300 + rand() * 250;
    }
    bars.push({ o: open, h: high, l: low, c: close });
    volumes.push(volume);
    prevClose = close;
  }
  return { bars, volumes, signalI, bullish };
}

export type ProfileLevel = { price: number; volume: number };
export type ProfileDemo = { bars: OHLC[]; levels: ProfileLevel[]; pocPrice: number; lvnPrice: number; breakoutI: number };

/** A volume/market profile: how much time (or volume) price spent at each
 *  price level over the window, built up from the same bars shown on the
 *  chart. The point of control (POC) is the busiest level; a low-volume
 *  node (LVN) is a level price spent hardly any time at — exactly the
 *  level price tends to move through quickly once it gets there. */
export function genProfileDemo(seed: number, n: number): ProfileDemo {
  const rand = seededRandom(seed);
  const bars: OHLC[] = [];
  let prevClose = 100;
  for (let i = 0; i < n; i++) {
    const open = prevClose;
    const close = open + (rand() - 0.5) * 1.0 + Math.sin(i / 10) * 0.15;
    const high = Math.max(open, close) + rand() * 0.4;
    const low = Math.min(open, close) - rand() * 0.4;
    bars.push({ o: open, h: high, l: low, c: close });
    prevClose = close;
  }
  const min = Math.min(...bars.map((b) => b.l));
  const max = Math.max(...bars.map((b) => b.h));
  const buckets = 24;
  const step = (max - min) / buckets;
  const levels: ProfileLevel[] = Array.from({ length: buckets }, (_, i) => ({ price: min + (i + 0.5) * step, volume: 0 }));
  for (const b of bars) {
    const loIdx = Math.max(0, Math.floor((b.l - min) / step));
    const hiIdx = Math.min(buckets - 1, Math.floor((b.h - min) / step));
    for (let idx = loIdx; idx <= hiIdx; idx++) levels[idx].volume += 1;
  }
  const pocIdx = levels.reduce((best, l, i) => (l.volume > levels[best].volume ? i : best), 0);
  // The lowest-volume bucket that isn't at the very edge of the range (an
  // edge is just "price didn't go further", not a real low-volume node).
  let lvnIdx = pocIdx;
  let lvnVol = Infinity;
  for (let i = 2; i < buckets - 2; i++) {
    if (levels[i].volume < lvnVol) {
      lvnVol = levels[i].volume;
      lvnIdx = i;
    }
  }
  // A breakout bar that actually trades through the LVN quickly.
  let breakoutI = bars.length - 1;
  for (let i = 0; i < bars.length; i++) {
    if (bars[i].l <= levels[lvnIdx].price && bars[i].h >= levels[lvnIdx].price) {
      breakoutI = i;
    }
  }
  return { bars, levels, pocPrice: levels[pocIdx].price, lvnPrice: levels[lvnIdx].price, breakoutI };
}

export type DeltaDivergenceDemo = { closes: number[]; delta: number[] };

/** Cumulative delta (buy volume minus sell volume) is a running total like
 *  OBV — so it needs the same envelope trick OBV's divergence generator
 *  uses rather than trying to hit an exact target shape against noisy
 *  day-to-day price direction. */
export function genDeltaDivergenceDemo(seed: number, n: number, bullish: boolean): DeltaDivergenceDemo {
  const closes = genDivergenceSeries(seed, n, bullish);
  const rand = seededRandom(seed + 5);
  const p1 = Math.max(Math.round(n * 0.3), 6);
  const p2 = Math.max(Math.round(n * 0.68), p1 + 15);
  const width = n * 0.12;
  const volumes: number[] = [500];
  for (let i = 1; i < n; i++) {
    const envelope1 = Math.exp(-((i - p1) ** 2) / (2 * width * width));
    const envelope2 = Math.exp(-((i - p2) ** 2) / (2 * width * width));
    const base = 40 + rand() * 30;
    volumes.push(base + 650 * envelope1 + 180 * envelope2);
  }
  const delta = obvFromCloses(closes, volumes);
  return { closes, delta };
}

export type FvgDemo = { bars: OHLC[]; gapI: number; up: boolean; gapTop: number; gapBottom: number };

/** An ICT Fair Value Gap: three candles in a row where the first candle's
 *  wick and the third candle's wick don't overlap, leaving a gap in the
 *  middle candle's range that price never actually traded through — the
 *  "imbalance" ICT material refers to. */
export function genFvgDemo(seed: number, n: number): FvgDemo {
  const rand = seededRandom(seed);
  const up = rand() > 0.5;
  const sign = up ? 1 : -1;
  const gapI = Math.round(n * 0.55);
  const bars: OHLC[] = [];
  let prevClose = 100;
  for (let i = 0; i < n; i++) {
    const open = prevClose;
    let close: number;
    let high: number;
    let low: number;
    if (i === gapI - 1 || i === gapI || i === gapI + 1) {
      // Three decisive candles in the same direction, each one's wick
      // clearing the one two bars back — that's the gap.
      close = open + sign * (1.1 + rand() * 0.3);
      high = Math.max(open, close) + rand() * 0.15;
      low = Math.min(open, close) - rand() * 0.15;
    } else {
      close = open + (rand() - 0.5) * 0.8;
      high = Math.max(open, close) + rand() * 0.3;
      low = Math.min(open, close) - rand() * 0.3;
    }
    bars.push({ o: open, h: high, l: low, c: close });
    prevClose = close;
  }
  const first = bars[gapI - 1];
  const third = bars[gapI + 1];
  const gapTop = up ? third.l : first.l;
  const gapBottom = up ? first.h : third.h;
  return { bars, gapI, up, gapTop: Math.max(gapTop, gapBottom), gapBottom: Math.min(gapTop, gapBottom) };
}

export type ElliottWaveDemo = { values: number[]; waveEnds: number[]; impulseEndI: number; up: boolean };

/** A deliberately-shaped five-wave Elliott impulse (three moves with the
 *  trend, two corrective moves against it) followed by a correction. Wave
 *  3 is the longest leg, same as the textbook rule; the end of wave 5 is
 *  the signal — the whole impulse is done and the correction starts. */
export function genElliottWaveDemo(seed: number, n: number): ElliottWaveDemo {
  const rand = seededRandom(seed);
  const up = rand() > 0.5;
  const sign = up ? 1 : -1;
  // Lengths of waves 1-5 as fractions of the total impulse length, with
  // wave 3 deliberately the longest.
  const lengths = [8, 5, 13, 4, 7].map((l) => l + rand() * 2);
  const total = lengths.reduce((a, b) => a + b, 0);
  const impulseBars = Math.round(n * 0.75);
  const waveEnds: number[] = [];
  let acc = 0;
  for (const l of lengths) {
    acc += l;
    waveEnds.push(Math.round((acc / total) * impulseBars));
  }
  const values: number[] = [100];
  const waveDir = [1, -1, 1, -1, 1];
  for (let i = 1; i < n; i++) {
    const waveIdx = waveEnds.findIndex((w) => i <= w);
    let dir: number;
    if (i > impulseBars) {
      dir = -sign; // the correction after wave 5
    } else {
      dir = sign * (waveIdx === -1 ? waveDir[4] : waveDir[waveIdx]);
    }
    const magnitude = i > impulseBars ? 0.5 + rand() * 0.3 : 0.6 + rand() * 0.4;
    values.push(values[i - 1] + dir * magnitude);
  }
  return { values, waveEnds: waveEnds.slice(0, 4), impulseEndI: waveEnds[4], up };
}

export type HarmonicDemo = { values: number[]; xI: number; aI: number; bI: number; cI: number; dI: number; bullish: boolean };

/** A deliberately-shaped Gartley-style XABCD harmonic pattern: X-A is the
 *  initial leg, A-B retraces it by roughly 61.8%, B-C retraces A-B by
 *  roughly 38-88%, and C-D completes near a 78.6% retracement of X-A —
 *  point D is the pattern's completion and the signal to act on. */
export function genHarmonicDemo(seed: number, n: number): HarmonicDemo {
  const rand = seededRandom(seed);
  const bullish = rand() > 0.5;
  const sign = bullish ? 1 : -1;
  const xI = Math.round(n * 0.08);
  const aI = Math.round(n * 0.28);
  const bI = Math.round(n * 0.46);
  const cI = Math.round(n * 0.64);
  const dI = Math.round(n * 0.86);
  const xV = 100;
  const legXA = 14;
  const aV = xV + sign * legXA;
  const bV = aV - sign * legXA * 0.618;
  const cV = bV + sign * (aV - bV) * 0.5;
  const dV = xV + sign * legXA * (1 - 0.786);

  const points: [number, number][] = [
    [0, xV],
    [xI, xV],
    [aI, aV],
    [bI, bV],
    [cI, cV],
    [dI, dV],
    [n - 1, dV],
  ];
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    let seg = 0;
    while (seg < points.length - 2 && i > points[seg + 1][0]) seg++;
    const [i0, v0] = points[seg];
    const [i1, v1] = points[seg + 1];
    const t = i1 === i0 ? 0 : (i - i0) / (i1 - i0);
    values.push(v0 + (v1 - v0) * t + (rand() - 0.5) * 0.6);
  }
  return { values, xI, aI, bI, cI, dI, bullish };
}

export type CycleDemo = { values: number[]; period: number; priorLows: number[]; nextLowI: number };

/** A deliberately periodic (cyclical) series — the thing cycle analysis is
 *  actually looking for — with a clean, fixed period so "where's the next
 *  low, given the established rhythm" has one genuinely correct answer. */
export function genCycleDemo(seed: number, n: number): CycleDemo {
  const rand = seededRandom(seed);
  const period = 14 + Math.floor(rand() * 5);
  const phase = rand() * period;
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    values.push(100 + 6 * Math.sin(((i + phase) / period) * Math.PI * 2) + (rand() - 0.5) * 0.8);
  }
  const priorLows: number[] = [];
  for (let i = 0; i + period < n - period; i += period) {
    // The trough nearest each expected low, within a small window.
    let bestI = i;
    for (let j = Math.max(0, i - 2); j <= Math.min(n - 1, i + 2); j++) {
      if (values[j] < values[bestI]) bestI = j;
    }
    priorLows.push(bestI);
  }
  const nextLowI = priorLows.length ? priorLows[priorLows.length - 1] + period : null;
  return { values, period, priorLows, nextLowI: nextLowI != null && nextLowI < n ? nextLowI : n - 3 };
}

export type Ichimoku = {
  tenkan: (number | null)[];
  kijun: (number | null)[];
  senkouA: (number | null)[];
  senkouB: (number | null)[];
};

function midpoint(bars: OHLC[], i: number, period: number): number | null {
  if (i < period - 1) return null;
  const window = bars.slice(i - period + 1, i + 1);
  const hi = Math.max(...window.map((b) => b.h));
  const lo = Math.min(...window.map((b) => b.l));
  return (hi + lo) / 2;
}

/** Ichimoku's lines, un-shifted for simplicity (a real chart plots the
 *  cloud 26 bars ahead and Chikou 26 bars back — shown here lined up with
 *  the price that produced them instead, so the crossovers are easy to
 *  read against the bars that caused them). */
export function ichimoku(bars: OHLC[]): Ichimoku {
  const tenkan = bars.map((_, i) => midpoint(bars, i, 9));
  const kijun = bars.map((_, i) => midpoint(bars, i, 26));
  const senkouA = tenkan.map((t, i) => (t != null && kijun[i] != null ? (t + kijun[i]!) / 2 : null));
  const senkouB = bars.map((_, i) => midpoint(bars, i, 52));
  return { tenkan, kijun, senkouA, senkouB };
}

export type RenkoBrick = { i: number; close: number; up: boolean };

/** Converts a close series into Renko bricks of a fixed size — only a new
 *  brick when price has moved a full brick size, and a reversal needs two
 *  bricks the other way, same as the real charting method. */
export function toRenko(closes: number[], brickSize: number): RenkoBrick[] {
  const bricks: RenkoBrick[] = [];
  let level = closes[0];
  let up = true;
  for (let i = 1; i < closes.length; i++) {
    while (true) {
      if (up) {
        if (closes[i] >= level + brickSize) {
          level += brickSize;
          bricks.push({ i, close: level, up: true });
          continue;
        }
        if (closes[i] <= level - brickSize * 2) {
          up = false;
          level -= brickSize * 2;
          bricks.push({ i, close: level, up: false });
          continue;
        }
      } else {
        if (closes[i] <= level - brickSize) {
          level -= brickSize;
          bricks.push({ i, close: level, up: false });
          continue;
        }
        if (closes[i] >= level + brickSize * 2) {
          up = true;
          level += brickSize * 2;
          bricks.push({ i, close: level, up: true });
          continue;
        }
      }
      break;
    }
  }
  return bricks;
}

export type PairsDemo = { a: number[]; b: number[]; spread: number[]; peakI: number; reversionI: number };

/** Two correlated series and the (fabricated) spread between them — the
 *  spread is built to stretch away from zero, then drift back, since
 *  mean reversion is the entire premise of the strategy. Both the peak
 *  stretch and the actual reversion point are found from the generated
 *  data rather than assumed from fixed indices, so they're right even
 *  with the noise added on top. */
export function genPairsDemo(seed: number, n: number): PairsDemo {
  const rand = seededRandom(seed);
  const stretchI = Math.round(n * 0.5);
  const reversionI = Math.round(n * 0.75);
  const a: number[] = [100];
  const b: number[] = [100];
  const spread: number[] = [0];
  for (let i = 1; i < n; i++) {
    const common = (rand() - 0.5) * 1.2;
    let idio = (rand() - 0.5) * 0.25;
    if (i >= stretchI && i < reversionI) idio += 0.4;
    else if (i >= reversionI) idio -= 0.35;
    a.push(a[i - 1] + common + idio);
    b.push(b[i - 1] + common - idio * 0.2);
    spread.push(a[i] - b[i]);
  }
  let peakI = 0;
  for (let i = 1; i < n; i++) if (Math.abs(spread[i]) > Math.abs(spread[peakI])) peakI = i;
  let revealedReversionI = n - 2;
  for (let i = peakI + 1; i < n; i++) {
    if (Math.abs(spread[i]) <= Math.abs(spread[peakI]) * 0.5) {
      revealedReversionI = i;
      break;
    }
  }
  return { a, b, spread, peakI, reversionI: revealedReversionI };
}

export type IntermarketDemo = { market1: number[]; market2: number[]; divergeI: number; bullish: boolean };

/** Two markets that normally move together — until one of them stops
 *  confirming the other's new high/low, which is the actual intermarket
 *  signal (not just "they moved the same amount"). */
export function genIntermarketDemo(seed: number, n: number, bullish: boolean): IntermarketDemo {
  const market1 = genDivergenceSeries(seed, n, bullish);
  const rand = seededRandom(seed + 7);
  const sign = bullish ? -1 : 1;
  const p1 = Math.max(Math.round(n * 0.3), 6);
  const p2 = Math.max(Math.round(n * 0.68), p1 + 15);
  // Market 2 moves with market 1 — same two swings, same timing — but its
  // SECOND swing is deliberately the shallower one (market1's is the
  // deeper one), so it fails to confirm market1's more extreme move.
  // That gap between the two markets is the actual signal.
  const market2: number[] = [100];
  for (let i = 1; i < n; i++) {
    let target = 100;
    const width = n * 0.1;
    target += sign * 13 * Math.exp(-((i - p1) ** 2) / (2 * width * width * 0.6));
    target += sign * 8 * Math.exp(-((i - p2) ** 2) / (2 * width * width * 1.6));
    market2.push(target + (rand() - 0.5) * 1.1);
  }
  return { market1, market2, divergeI: p2, bullish };
}

export type GannAngleDemo = { values: number[]; anchorI: number; anchorV: number; slope: number; touches: number[] };

/** A classic Gann 1x1 angle: a straight line rising (or falling) from a
 *  significant swing at a fixed, conventional rate, acting as support or
 *  resistance on the way back. The exact "right" slope depends on a
 *  price-per-bar scaling convention that varies by instrument — this uses
 *  one fixed, clearly-labelled scale for illustration, same spirit as
 *  every other synthetic chart here. */
export function genGannAngleDemo(seed: number, n: number): GannAngleDemo {
  const values = genSeries(seed, n, { driftAmplitude: 0.5 });
  const pivots = findPivots(values, 4);
  const lows = pivots.filter((p) => !p.high);
  const anchor = lows.length ? lows[0] : { i: 5, value: values[5] };
  const slope = (Math.max(...values) - Math.min(...values)) / n / 2;
  const line = values.map((_, i) => (i >= anchor.i ? anchor.value + slope * (i - anchor.i) : null));
  const tolerance = (Math.max(...values) - Math.min(...values)) * 0.02;
  const touches: number[] = [];
  values.forEach((v, i) => {
    const lv = line[i];
    if (lv != null && i > anchor.i + 3 && Math.abs(v - lv) <= tolerance) touches.push(i);
  });
  return { values, anchorI: anchor.i, anchorV: anchor.value, slope, touches };
}
