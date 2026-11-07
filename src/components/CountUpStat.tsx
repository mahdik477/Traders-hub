"use client";

import { useEffect, useRef } from "react";

// A stat figure that's correct from the very first paint — including the
// server-rendered HTML, before any JS has run — and gets a tasteful
// one-time "settle in" animation the first time it scrolls into view.
//
// Earlier version of this component started from 0 and counted up on
// scroll. That meant the real listing counts never actually appeared in
// the HTML sent to the browser (or to anything that doesn't run JS) —
// every stat on the homepage read "0" until the animation fired.
//
// Fixed properly this time: the number itself is always just rendered as
// plain text, full opacity, no React state involved in whether it's
// visible. The entrance motion is a CSS `@keyframes` animation (see
// `.stat-settle-in` in globals.css) added as a class directly to the DOM
// node after mount, only if JS runs and the element has scrolled into
// view. No JS at all → no class is ever added → a plain, fully visible,
// correct number. That's the only way to guarantee it never flashes a
// wrong value and never silently stays invisible.
export default function CountUpStat({
  value,
  suffix = "",
  className = "",
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("stat-settle-in");
        observer.disconnect();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
}
