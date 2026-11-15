"use client";

import { useId } from "react";

const PLACEHOLDER = [42, 44, 43, 46, 45, 47, 46, 49, 48, 50, 49, 51, 50, 52];

type PriceChartProps = {
  data: number[];
  color: string;
  variant: "hero" | "small";
  /** Round live dot. Only when the market is open and motion is allowed. */
  live?: boolean;
  placeholder?: boolean;
};

/** One hand-drawn area chart shared by every market tile. */
export default function PriceChart({ data, color, variant, live = false, placeholder = false }: PriceChartProps) {
  const gradientId = `sg-chart-${useId().replace(/:/g, "")}`;
  const values = data.length >= 2 ? data : PLACEHOLDER;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.abs(max) * 0.004 || 1;
  const width = 100;
  const height = variant === "hero" ? 48 : 36;
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / span) * (height - 6) - 3;
    return [x, y] as const;
  });
  const line = points.map((point) => point.join(",")).join(" ");
  const fill = `0,${height} ${line} ${width},${height}`;
  const last = points[points.length - 1];

  return (
    <svg
      className={`sg-chart${placeholder ? " is-placeholder" : ""}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#${gradientId})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {live && (
        <circle
          className="sg-live-dot"
          cx={last[0]}
          cy={last[1]}
          r={variant === "hero" ? 1.15 : 1.35}
          fill={color}
        />
      )}
    </svg>
  );
}
