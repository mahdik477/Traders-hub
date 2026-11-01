import type { JSX } from "react";

// A faint tiled pattern of icons behind a hero's terminal panel — one
// page's worth of visual identity (which icons) without a new design
// system for every page. Purely decorative.
export default function IconPatternBackdrop({
  icons,
  className = "",
}: {
  icons: ((p: { className?: string }) => JSX.Element)[];
  className?: string;
}) {
  const tiles = Array.from({ length: 12 }, (_, i) => icons[i % icons.length]);
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -right-8 -top-8 -z-10 grid grid-cols-4 gap-4 rotate-[8deg] text-accent opacity-[0.08] ${className}`}
    >
      {tiles.map((Icon, i) => (
        <Icon key={i} className="size-7" />
      ))}
    </div>
  );
}
