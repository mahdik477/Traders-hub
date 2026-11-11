"use client";

import { useEffect, useState } from "react";
import { OPEN_SEARCH_EVENT } from "@/components/BottomNav";
import { SearchIcon } from "@/components/icons";

// The big search box in the hero. It looks like an input but is a button:
// pressing it opens the real site-wide search dialog (SiteSearch.tsx, the
// same one behind Ctrl+K), so there's one search on the site, not two. The
// placeholder cycles through example queries — text only, opacity only.

const EXAMPLES = ["Search 29 prop firms…", "Try “FTMO”", "Try “RSI divergence”", "Try “drawdown”", "Search courses, tools, signal groups…"];

export default function HeroSearchButton() {
  const [i, setI] = useState(0);
  const [mac, setMac] = useState(false);

  useEffect(() => {
    // Platform sniff for the shortcut hint, browser-only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % EXAMPLES.length), 3200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
      aria-label="Search the site"
      aria-keyshortcuts="Control+K Meta+K"
      className="hero-search group flex h-14 w-full max-w-xl items-center gap-3 rounded-2xl border border-border-strong bg-surface px-4 text-left shadow-glow transition-[border-color,transform] duration-200 hover:border-accent focus-visible:border-accent sm:h-16 sm:px-5"
    >
      <SearchIcon className="size-5 shrink-0 text-accent" />
      <span className="relative min-w-0 flex-1 overflow-hidden text-base text-muted sm:text-lg" aria-hidden="true">
        {EXAMPLES.map((t, n) => (
          <span key={t} className={`hero-search-example block truncate ${n === i ? "is-on" : ""}`}>
            {t}
          </span>
        ))}
      </span>
      <kbd className="hidden shrink-0 rounded-lg border border-border-strong bg-surface-2 px-2 py-1 font-mono text-xs text-subtle sm:inline">
        {mac ? "⌘" : "Ctrl"} K
      </kbd>
    </button>
  );
}
