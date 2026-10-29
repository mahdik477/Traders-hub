"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// One hoverable (and tap-able, for phones) technical term inside a block
// of strategy prose. The definition itself is rendered into a portal at
// the end of <body>, positioned from the term's actual on-screen
// coordinates — not as a child of the term. Cards all over this page use
// `overflow-hidden` (the hero header, the chart figure, video thumbnails)
// to clip their own rounded corners, which would silently clip or bury a
// tooltip nested inside them; a portal sidesteps that instead of patching
// z-index on every ancestor.
//
// Opens on hover/focus for mouse/keyboard users, and toggles on tap for
// touch — closes on Escape, an outside tap, or losing focus.
export default function GlossaryTerm({
  term,
  definition,
  children,
}: {
  term: string;
  definition: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; placement: "above" | "below" } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    // The portal needs document.body, which only exists client-side — same
    // unavoidable post-mount setState as StrategyWalkthrough's localStorage read.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    function updatePosition() {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const margin = 8;
      const width = Math.min(300, window.innerWidth - margin * 2);
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
      const spaceBelow = window.innerHeight - rect.bottom;
      const placement = spaceBelow < 130 && rect.top > 130 ? "above" : "below";
      const top = placement === "below" ? rect.bottom + 8 : rect.top - 8;
      setPos({ top, left, width, placement });
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: PointerEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <>
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        className="glossary-term"
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        {children}
      </span>
      {mounted &&
        open &&
        pos &&
        createPortal(
          <span
            id={tooltipId}
            role="tooltip"
            className="glossary-tooltip"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
              transform: pos.placement === "above" ? "translateY(-100%)" : undefined,
            }}
          >
            <strong className="glossary-tooltip-term">{term}</strong>
            <span className="glossary-tooltip-def">{definition}</span>
          </span>,
          document.body,
        )}
    </>
  );
}
