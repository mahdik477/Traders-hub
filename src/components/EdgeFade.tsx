"use client";

import { useEffect, useRef, type ReactNode } from "react";

// A row that scrolls sideways (header nav, the prop-firm quick links) with
// no scrollbar and a soft fade on whichever edge still has more to show.
// The fades are toggled by data attributes written straight to the DOM, so
// scrolling never re-renders React. If `activeSelector` matches something
// inside, that item is scrolled into view (e.g. the current nav link).
export default function EdgeFade({
  children,
  className = "",
  scrollClassName = "",
  activeSelector,
  watch,
}: {
  children: ReactNode;
  className?: string;
  scrollClassName?: string;
  activeSelector?: string;
  /** Re-centre the active item when this changes (e.g. the pathname). */
  watch?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const el = scrollRef.current;
    if (!wrap || !el) return;
    function update() {
      if (!wrap || !el) return;
      const max = el.scrollWidth - el.clientWidth;
      wrap.dataset.fadeStart = String(el.scrollLeft > 4);
      wrap.dataset.fadeEnd = String(el.scrollLeft < max - 4);
    }
    update();
    el.addEventListener("scroll", update, { passive: true });
    const obs = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    obs?.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      obs?.disconnect();
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !activeSelector) return;
    const item = el.querySelector<HTMLElement>(activeSelector);
    if (!item) return;
    // Centre it by setting scrollLeft (scrollIntoView would also move the page).
    const left = item.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft;
    const target = left - (el.clientWidth - item.offsetWidth) / 2;
    el.scrollLeft = Math.max(0, target);
  }, [activeSelector, watch]);

  return (
    <div ref={wrapRef} className={`edge-fade ${className}`}>
      <div ref={scrollRef} className={`edge-fade-scroll ${scrollClassName}`}>
        {children}
      </div>
    </div>
  );
}
