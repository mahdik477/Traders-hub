// Hand-drawn (not simulated) candlestick diagrams — deliberately exact
// shapes for teaching purposes, same "synthetic, never real market data"
// convention as every chart elsewhere on the site, just with coordinates
// placed by hand instead of generated from a seeded random walk.

type CandleSpec = { x: number; open: number; close: number; high: number; low: number; width?: number };

function Candle({ x, open, close, high, low, width = 16 }: CandleSpec) {
  const bullish = close < open; // lower y value = higher price
  const bodyTop = Math.min(open, close);
  const bodyBottom = Math.max(open, close);
  const color = bullish ? "var(--color-success)" : "var(--color-danger)";
  return (
    <g>
      <line x1={x} x2={x} y1={high} y2={low} stroke={color} strokeWidth={2} />
      <rect
        x={x - width / 2}
        y={bodyTop}
        width={width}
        height={Math.max(bodyBottom - bodyTop, 2.5)}
        fill={color}
        rx={1.5}
      />
    </g>
  );
}

// One large, labelled candle — the vocabulary every pattern below is built
// from.
export function CandleAnatomyDiagram() {
  const x = 150;
  const open = 70;
  const close = 35;
  const high = 15;
  const low = 85;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <svg viewBox="0 0 300 100" className="mx-auto w-full max-w-sm" role="img" aria-label="Anatomy of a candlestick">
        <Candle x={x} open={open} close={close} high={high} low={low} width={22} />

        {/* High */}
        <line x1={x} x2={x + 60} y1={high} y2={high} stroke="var(--color-border-strong)" strokeDasharray="2 2" />
        <text x={x + 64} y={high + 3} fontSize="9" fill="var(--color-muted)">
          High
        </text>

        {/* Low */}
        <line x1={x} x2={x + 60} y1={low} y2={low} stroke="var(--color-border-strong)" strokeDasharray="2 2" />
        <text x={x + 64} y={low + 3} fontSize="9" fill="var(--color-muted)">
          Low
        </text>

        {/* Open */}
        <line x1={x - 80} x2={x - 11} y1={open} y2={open} stroke="var(--color-border-strong)" strokeDasharray="2 2" />
        <text x={x - 84} y={open + 3} fontSize="9" fill="var(--color-muted)" textAnchor="end">
          Open
        </text>

        {/* Close */}
        <line x1={x - 80} x2={x - 11} y1={close} y2={close} stroke="var(--color-border-strong)" strokeDasharray="2 2" />
        <text x={x - 84} y={close + 3} fontSize="9" fill="var(--color-muted)" textAnchor="end">
          Close
        </text>

        {/* Body + wick labels */}
        <text x={x} y={96} fontSize="9" fill="var(--color-subtle)" textAnchor="middle">
          Body
        </text>
      </svg>
      <p className="meta mt-3 text-center">
        This one&apos;s bullish (close above open) — green/body-up here, but the colours a platform
        uses are just a convention, always check the legend.
      </p>
    </div>
  );
}

export type CandlePattern = {
  name: string;
  type: "Bullish" | "Bearish" | "Neutral";
  description: string;
  candles: CandleSpec[];
};

export const COMMON_PATTERNS: CandlePattern[] = [
  {
    name: "Doji",
    type: "Neutral",
    description: "Open and close land almost on top of each other — neither side won. Often read as hesitation after a move.",
    candles: [{ x: 60, open: 48, close: 51, high: 15, low: 85 }],
  },
  {
    name: "Hammer",
    type: "Bullish",
    description: "A small body near the top with a long lower wick — sellers pushed it down, buyers dragged it back. Usually read after a decline.",
    candles: [{ x: 60, open: 35, close: 25, high: 20, low: 85 }],
  },
  {
    name: "Shooting Star",
    type: "Bearish",
    description: "The mirror of a hammer — a small body near the bottom with a long upper wick, usually read after a rally.",
    candles: [{ x: 60, open: 65, close: 75, high: 15, low: 80 }],
  },
  {
    name: "Bullish Engulfing",
    type: "Bullish",
    description: "A down candle followed by an up candle whose body fully covers the first one — a sudden swing from sellers to buyers.",
    candles: [
      { x: 42, open: 40, close: 60, high: 30, low: 70, width: 14 },
      { x: 78, open: 68, close: 32, high: 22, low: 78, width: 14 },
    ],
  },
  {
    name: "Bearish Engulfing",
    type: "Bearish",
    description: "The mirror case — an up candle followed by a down candle that fully covers it, a swing from buyers to sellers.",
    candles: [
      { x: 42, open: 60, close: 40, high: 30, low: 70, width: 14 },
      { x: 78, open: 32, close: 68, high: 22, low: 78, width: 14 },
    ],
  },
  {
    name: "Inside Bar",
    type: "Neutral",
    description: "A candle whose entire range sits inside the one before it — a pause, often read as the market deciding its next move.",
    candles: [
      { x: 42, open: 25, close: 70, high: 15, low: 80, width: 14 },
      { x: 78, open: 40, close: 55, high: 32, low: 65, width: 14 },
    ],
  },
];

export function CandlePatternGallery() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {COMMON_PATTERNS.map((p) => (
        <div key={p.name} className="overflow-hidden rounded-xl border border-border bg-surface">
          <svg viewBox="0 0 120 100" className="w-full bg-background" role="img" aria-label={`${p.name} candlestick pattern`}>
            {p.candles.map((c, i) => (
              <Candle key={i} {...c} />
            ))}
          </svg>
          <div className="p-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-foreground">{p.name}</h3>
              <span
                className={`pill text-xs ${
                  p.type === "Bullish" ? "text-success" : p.type === "Bearish" ? "text-danger" : ""
                }`}
              >
                {p.type}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
