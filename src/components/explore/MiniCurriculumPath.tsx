// A small "curriculum" visual for the Learn row — the 9 topics as numbered
// stops along a path, each with a hover tooltip showing its real title.
// Pure CSS hover (group/item), no client JS needed.
export default function MiniCurriculumPath({
  topics,
}: {
  topics: { slug: string; shortTitle: string; readMinutes: number }[];
}) {
  const n = topics.length;
  const width = 320;
  const height = 150;
  const pad = 24;
  const points = topics.map((t, i) => {
    const x = pad + (i * (width - pad * 2)) / (n - 1);
    const y = height / 2 + Math.sin(i * 0.9) * 28;
    return { ...t, x, y };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label="The 9-part Learn curriculum">
      <path d={path} fill="none" stroke="var(--color-border-strong)" strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={p.slug} className="group/node">
          <circle
            cx={p.x}
            cy={p.y}
            r="11"
            className="origin-center fill-surface stroke-gold-fill/70 transition-transform duration-200 group-hover/node:scale-110 group-hover/node:fill-gold-fill/15"
            strokeWidth="1.5"
            style={{ transformBox: "fill-box" }}
          />
          <text x={p.x} y={p.y + 3.5} textAnchor="middle" className="fill-muted font-mono text-[8px] group-hover/node:fill-gold-bright">
            {i + 1}
          </text>
          <g className="pointer-events-none opacity-0 transition-opacity duration-150 group-hover/node:opacity-100">
            <rect
              x={Math.min(Math.max(p.x - 46, 2), width - 94)}
              y={p.y - 38}
              width="92"
              height="24"
              rx="5"
              className="fill-surface-2 stroke-border"
              strokeWidth="1"
            />
            <text
              x={Math.min(Math.max(p.x, 48), width - 48)}
              y={p.y - 22}
              textAnchor="middle"
              className="fill-foreground font-mono text-[7.5px] font-semibold"
            >
              {p.shortTitle.length > 20 ? p.shortTitle.slice(0, 19) + "…" : p.shortTitle}
            </text>
          </g>
        </g>
      ))}
    </svg>
  );
}
