"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

// One hoverable (and tap-able, for phones) technical term inside a block
// of strategy prose. Opens on hover/focus for mouse/keyboard users, and
// toggles on tap for touch — closes on Escape, an outside tap, or losing
// focus. See GlossaryText.tsx for how prose gets split into these.

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
  const [align, setAlign] = useState<"center" | "left" | "right">("center");
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
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

  useEffect(() => {
    if (!open || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const halfTooltip = 150;
    if (rect.left < halfTooltip) setAlign("left");
    else if (window.innerWidth - rect.right < halfTooltip) setAlign("right");
    else setAlign("center");
  }, [open]);

  return (
    <span
      ref={wrapRef}
      className="glossary-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        role="button"
        tabIndex={0}
        className="glossary-term"
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
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
      {open && (
        <span id={tooltipId} role="tooltip" className={`glossary-tooltip glossary-tooltip-${align}`}>
          <strong className="glossary-tooltip-term">{term}</strong>
          <span className="glossary-tooltip-def">{definition}</span>
        </span>
      )}
    </span>
  );
}
