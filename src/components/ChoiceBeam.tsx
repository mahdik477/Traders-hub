"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * One gold sweep around an Our choice card, then a quiet gold edge.
 * Runs once when the card first comes into view. Reduced motion skips
 * the sweep and shows the settled edge immediately.
 */
export default function ChoiceBeam({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "run" | "settled">("idle");

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    if (typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setPhase("settled"));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setPhase("run");
        observer.disconnect();
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [active]);

  useEffect(() => {
    if (phase !== "run") return;
    const el = ref.current;
    if (!el) return;
    const finish = (event: AnimationEvent) => {
      if (event.target !== el.querySelector(".choice-beam")) return;
      setPhase("settled");
    };
    el.addEventListener("animationend", finish);
    const backup = window.setTimeout(() => setPhase("settled"), 2600);
    return () => {
      el.removeEventListener("animationend", finish);
      window.clearTimeout(backup);
    };
  }, [phase]);

  if (!active) return children;

  return (
    <div
      ref={ref}
      className={`choice-shell h-full ${phase === "run" ? "is-running" : ""} ${phase === "settled" ? "is-settled" : ""}`}
    >
      <div className="choice-ring">
        {phase === "run" && <span className="choice-beam" aria-hidden="true" />}
        {children}
      </div>
    </div>
  );
}
