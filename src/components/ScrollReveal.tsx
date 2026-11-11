"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Fades a section up into place as it scrolls into view.
//
// Two engines, picked by the browser:
//  1. CSS scroll-driven animation (`animation-timeline: view()`) — zero JS,
//     runs on the compositor, the reveal is tied to scroll position. See
//     `.scroll-reveal` in globals.css.
//  2. Fallback for browsers without it: one IntersectionObserver per
//     section that adds `is-visible` the first time it crosses into view.
//
// Either way the content is fully visible with no JS at all (the hidden
// start state only applies under `@supports` / once the observer attaches),
// and reduced-motion users see everything immediately. A hard timeout
// guarantees the fallback reveals itself even if the observer never fires.
const REVEAL_TIMEOUT_MS = 1800;

function supportsScrollTimeline() {
  return typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("animation-timeline: view()");
}

export default function ScrollReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  /** Stagger siblings slightly, in ms (fallback engine only). */
  delay?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || supportsScrollTimeline() || typeof IntersectionObserver === "undefined" || !ref.current) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    const timeout = setTimeout(() => setVisible(true), REVEAL_TIMEOUT_MS);
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
