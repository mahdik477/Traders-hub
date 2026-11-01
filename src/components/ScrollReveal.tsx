"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Fades a section up into place the first time it scrolls into view —
// cheap, dependency-free polish instead of everything just appearing at
// once. Respects prefers-reduced-motion (renders fully visible immediately,
// no observer needed) and degrades safely if IntersectionObserver is ever
// unavailable.
//
// Belt and suspenders: IntersectionObserver's first callback can land
// before layout has fully settled (fonts/images still loading, a Suspense
// boundary still resolving above it) and, on some real devices, never
// re-fire after that if nothing else triggers a layout change — leaving
// the content stuck invisible until something unrelated forces a
// re-render. A hard timeout guarantees it reveals itself regardless, so a
// purely decorative animation can never block real content from showing.
const REVEAL_TIMEOUT_MS = 1800;

export default function ScrollReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  /** Stagger siblings slightly, in ms. */
  delay?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || typeof IntersectionObserver === "undefined" || !ref.current) {
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
