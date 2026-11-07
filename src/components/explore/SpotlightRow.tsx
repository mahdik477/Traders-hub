"use client";

import { useRef, type ReactNode } from "react";

// A feature row that tracks the cursor and glows a soft gold spotlight from
// wherever the pointer actually is — the one piece of "Everything we offer"
// that needs real client JS (reading live pointer position has no pure-CSS
// equivalent yet). Everything else about these rows — the mini chart, the
// snapshot list, the hover tooltips on the chart itself — is plain CSS.
export default function SpotlightRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      className={`spotlight-row group/row relative overflow-hidden rounded-2xl border border-border bg-surface transition-colors duration-300 hover:border-gold-fill/40 ${className}`}
    >
      <div
        aria-hidden="true"
        className="spotlight-glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/row:opacity-100"
      />
      <div className="relative">{children}</div>
    </div>
  );
}
