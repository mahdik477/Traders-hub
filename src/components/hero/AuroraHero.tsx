"use client";

import { useEffect, useRef, type ReactNode } from "react";

// The homepage hero's background: three slow aurora blobs, a faint glowing
// grid and a price line that draws itself once — all CSS/SVG, no WebGL, no
// animation library. Everything that moves animates only `transform` and
// `opacity`, so a mid-range phone composites it without repainting.
//
// The one bit of JS here is an IntersectionObserver that adds
// `is-offscreen` once the hero has scrolled out of view, which pauses the
// blob animations (see .aurora-blob in globals.css). Reduced-motion users
// get the same composition, perfectly still — handled in CSS, so nothing
// here ever has to decide what the visitor can tolerate.

// A synthetic price walk, fixed (not random) so the HTML is identical on
// every build and there's nothing to hydrate. Purely decorative.
const LINE_POINTS = [
  [0, 300], [60, 288], [120, 296], [180, 262], [240, 270], [300, 236], [360, 248], [420, 206],
  [480, 222], [540, 180], [600, 196], [660, 150], [720, 168], [780, 118], [840, 136], [900, 92],
  [960, 108], [1020, 70], [1080, 84], [1140, 48], [1200, 60],
];
const LINE_PATH = LINE_POINTS.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
const AREA_PATH = `${LINE_PATH} L1200 340 L0 340 Z`;

export default function AuroraHero({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => el.classList.toggle("is-offscreen", !entry.isIntersecting),
      { rootMargin: "80px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} aria-labelledby="hero-heading" className="aurora-hero relative -mx-4 overflow-hidden px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div aria-hidden="true" className="aurora-layer pointer-events-none absolute inset-0">
        <span className="aurora-blob aurora-blob-a" />
        <span className="aurora-blob aurora-blob-b" />
        <span className="aurora-blob aurora-blob-c" />
        <span className="hero-grid absolute inset-0" />
        <svg viewBox="0 0 1200 340" preserveAspectRatio="none" className="hero-line absolute inset-x-0 bottom-0 h-[46%] w-full">
          <defs>
            <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={AREA_PATH} fill="url(#hero-area)" className="hero-line-area" />
          <path d={LINE_PATH} fill="none" stroke="var(--color-gold)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" pathLength={1} className="hero-line-path" />
          <circle cx="1200" cy="60" r="5" fill="var(--color-gold-bright)" className="hero-line-dot" />
        </svg>
        <span className="hero-fade absolute inset-x-0 bottom-0 h-40" />
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}

/** Splits a headline into words that rise into place one after another.
 *  Words are never fully transparent (they start at 35% opacity), so the
 *  text is painted — and counts as rendered — from the very first frame. */
export function WordReveal({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={`hero-words ${className}`}>
      {words.map((word, i) => (
        // The space sits BETWEEN the inline-block spans (a real text node),
        // so the browser can wrap the headline on a narrow phone.
        <span key={`${word}-${i}`}>
          <span className="hero-word" style={{ "--i": i } as React.CSSProperties}>
            {word}
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
