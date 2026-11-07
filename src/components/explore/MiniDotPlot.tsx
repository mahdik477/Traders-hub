// Where real course prices actually fall on a line, cheapest to most
// expensive — hover a dot for the name and price. Nothing here ranks a
// course as "better"; it's a price readout, same honesty rule as the
// directory page itself.
export default function MiniDotPlot({ items }: { items: { name: string; price: number; display: string }[] }) {
  const sorted = [...items].sort((a, b) => a.price - b.price);
  const min = sorted[0]?.price ?? 0;
  const max = sorted[sorted.length - 1]?.price ?? 1;
  // A square-root scale, not linear — one annual-plan outlier shouldn't
  // squash every monthly price into an unreadable cluster at one end. The
  // real $ figures are still shown on every dot and at both ends of the
  // line, so nothing about the actual numbers is hidden, only the spacing
  // is adjusted for legibility.
  const scale = (v: number) => Math.sqrt(Math.max(v - min, 0));
  const span = Math.max(scale(max), 1);
  const width = 320;
  const pad = 20;

  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-subtle">Where prices fall</p>
      <svg viewBox={`0 0 ${width} 70`} className="w-full overflow-visible">
        <line x1={pad} y1="40" x2={width - pad} y2="40" stroke="var(--color-border)" strokeWidth="2" />
        {sorted.map((item, i) => {
          const x = pad + (scale(item.price) / span) * (width - pad * 2);
          return (
            <g key={item.name + i} className="group/dot cursor-default">
              <circle
                cx={x}
                cy="40"
                r="6"
                className="origin-center fill-gold-fill stroke-background transition-transform duration-150 group-hover/dot:scale-125"
                strokeWidth="2"
                style={{ transformBox: "fill-box" }}
              />
              <g className="pointer-events-none opacity-0 transition-opacity duration-150 group-hover/dot:opacity-100">
                <rect
                  x={Math.min(Math.max(x - 50, 2), width - 102)}
                  y="2"
                  width="100"
                  height="24"
                  rx="5"
                  className="fill-surface-2 stroke-border"
                  strokeWidth="1"
                />
                <text
                  x={Math.min(Math.max(x, 52), width - 52)}
                  y="18"
                  textAnchor="middle"
                  className="fill-foreground font-mono text-[7.5px] font-semibold"
                >
                  {item.name.length > 14 ? item.name.slice(0, 13) + "…" : item.name} · {item.display}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between font-mono text-[0.65rem] text-subtle">
        <span>{sorted[0]?.display}</span>
        <span>{sorted[sorted.length - 1]?.display}</span>
      </div>
    </div>
  );
}
