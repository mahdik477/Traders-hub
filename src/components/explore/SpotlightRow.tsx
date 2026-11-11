"use client";

import { useRef, type ReactNode } from "react";

// A feature row that tracks the cursor: a soft gold spotlight follows the
// pointer and the whole card tilts a few degrees toward it. This is the
// site's reference "cursor-aware card" (see DESIGN.md → Micro-interactions).
//
// Only two CSS custom properties change per pointer move (--spot-x/y for
// the glow, --tilt-x/y for the rotation), both consumed by `transform` or a
// background-position-free radial gradient, so nothing lays out or repaints
// beyond the card itself. Touch devices and reduced-motion users get a
// plain hover border — see .spotlight-row in globals.css.
export default function SpotlightRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--spot-x", `${x}px`);
    el.style.setProperty("--spot-y", `${y}px`);
    // ±3° — enough to feel alive, not enough to make text swim.
    el.style.setProperty("--tilt-x", `${((y / rect.height - 0.5) * -3).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${((x / rect.width - 0.5) * 3).toFixed(2)}deg`);
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.removeProperty("--tilt-x");
    el.style.removeProperty("--tilt-y");
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
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
