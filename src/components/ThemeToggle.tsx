"use client";

import { useSyncExternalStore } from "react";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// Dark is the site default (see globals.css). This is the floating toggle
// that lets a visitor switch to light mode; it remembers their choice and
// matches whatever the blocking script in layout.tsx already applied, so
// there's no mismatch on load. The button reads the theme straight from the
// <html data-theme> attribute, so it always shows the right icon.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const readIsLight = () => document.documentElement.getAttribute("data-theme") === "light";

export default function ThemeToggle() {
  // On the server we can't know the visitor's choice, so render the default
  // (dark) and let the browser correct it straight after loading.
  const isLight = useSyncExternalStore(subscribe, readIsLight, () => false);

  function toggle() {
    const next = isLight ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private browsing / storage blocked — theme just won't persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:border-accent hover:text-accent"
    >
      {isLight ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
