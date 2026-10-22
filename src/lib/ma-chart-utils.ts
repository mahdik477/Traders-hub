// Shared math for the Moving Average Crossover page's two interactive
// components (the live simulator and the signal-spotting quiz) — kept out of
// both components so the fabricated-data and crossover logic exists in one
// place. Not used anywhere else on the site; this is deliberately specific
// to this one strategy's interactive pieces.

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

/** A fabricated price series — never real market data. Deterministic per
 *  seed so "shuffle" / "new chart" buttons give a fresh but reproducible
 *  run. */
export function genSeries(seed: number, n: number): number[] {
  const rand = seededRandom(seed);
  const closes = [100];
  for (let i = 1; i < n; i++) {
    const drift = Math.sin(i / 14) * 0.35; // gentle wave so crossovers actually happen
    closes.push(closes[i - 1] + drift + (rand() - 0.5) * 1.6);
  }
  return closes;
}

export function sma(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    return sum / period;
  });
}

export type Crossing = { i: number; golden: boolean };

export function findCrossings(fastLine: (number | null)[], slowLine: (number | null)[]): Crossing[] {
  const points: Crossing[] = [];
  for (let i = 1; i < fastLine.length; i++) {
    const f0 = fastLine[i - 1];
    const f1 = fastLine[i];
    const s0 = slowLine[i - 1];
    const s1 = slowLine[i];
    if (f0 == null || f1 == null || s0 == null || s1 == null) continue;
    if (f0 <= s0 && f1 > s1) points.push({ i, golden: true });
    else if (f0 >= s0 && f1 < s1) points.push({ i, golden: false });
  }
  return points;
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
    if (v == null) return;
    const x = pad + i * xStep;
    const y = yFor(v);
    d += drawing ? ` L ${x} ${y}` : `M ${x} ${y}`;
    drawing = true;
  });
  return d;
}
