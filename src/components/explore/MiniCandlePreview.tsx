// A small, honest preview of what the real strategy simulators look like —
// hand-placed candles (not simulated data, same convention as every other
// decorative chart on the site) plus a moving-average line that gently
// redraws itself on a loop. Not draggable here; the real, interactive
// version lives on every strategy page, which is what the CTA links to.
const CANDLES = [
  { x: 10, open: 58, close: 48, high: 44, low: 62 },
  { x: 36, open: 48, close: 52, high: 42, low: 58 },
  { x: 62, open: 52, close: 40, high: 36, low: 56 },
  { x: 88, open: 40, close: 44, high: 34, low: 50 },
  { x: 114, open: 44, close: 30, high: 26, low: 48 },
  { x: 140, open: 30, close: 34, high: 24, low: 40 },
  { x: 166, open: 34, close: 22, high: 18, low: 38 },
  { x: 192, open: 22, close: 28, high: 16, low: 34 },
  { x: 218, open: 28, close: 20, high: 14, low: 32 },
  { x: 244, open: 20, close: 26, high: 12, low: 30 },
  { x: 270, open: 26, close: 16, high: 10, low: 28 },
  { x: 296, open: 16, close: 22, high: 8, low: 26 },
];

const MA_PATH = "M10,55 L36,53 L62,50 L88,46 L114,40 L140,34 L166,29 L192,27 L218,23 L244,24 L270,20 L296,22";

export default function MiniCandlePreview() {
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-subtle">A preview, not a prediction</p>
      <svg viewBox="0 0 310 70" className="w-full overflow-visible" aria-hidden="true">
        {CANDLES.map((c, i) => {
          const bullish = c.close < c.open; // svg y grows downward; "close above open" visually = smaller y
          return (
            <g key={i}>
              <line x1={c.x} x2={c.x} y1={c.high} y2={c.low} stroke={bullish ? "var(--color-success)" : "var(--color-danger)"} strokeWidth="1.5" opacity="0.8" />
              <rect
                x={c.x - 4}
                y={Math.min(c.open, c.close)}
                width="8"
                height={Math.max(2, Math.abs(c.close - c.open))}
                fill={bullish ? "var(--color-success)" : "var(--color-danger)"}
                opacity="0.85"
                rx="1"
              />
            </g>
          );
        })}
        <path
          d={MA_PATH}
          fill="none"
          stroke="var(--color-gold-bright)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ma-preview-line"
        />
      </svg>
    </div>
  );
}
