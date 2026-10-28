"use client";

import { useEffect, useState } from "react";
import type { StrategyStep } from "@/lib/strategy-types";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";
import GlossaryText from "@/components/GlossaryText";

// Same controlled-accordion pattern as CourseCurriculum.tsx (numbered circles,
// smooth grid-rows height animation, Expand/Collapse all) — adapted for a
// linear "do this, then this" walkthrough instead of nested course modules.
// Step 1 starts open so a visitor sees the shape immediately.
//
// Each step also gets a "mark as done" checkbox. This is a per-viewer
// convenience (remembered locally so a half-read walkthrough doesn't lose
// your place), not a reliable record — see the Artifact browser-storage
// guidance this mirrors: localStorage can come back empty or throw in a
// private window, so every read/write is wrapped in try/catch and the page
// works fine even if it's unavailable.
export default function StrategyWalkthrough({ slug, steps }: { slug: string; steps: StrategyStep[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const [done, setDone] = useState<Set<number>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const allOpen = open.size === steps.length;
  const storageKey = `strategy-progress:${slug}`;

  useEffect(() => {
    // Reading localStorage has to happen client-side after mount (it doesn't exist during SSR,
    // and reading it during render would mismatch the server-rendered HTML) — so a single
    // setState here is the correct, unavoidable way to hydrate from it, not a pattern to avoid.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDone(() => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        return raw ? new Set(JSON.parse(raw)) : new Set();
      } catch {
        return new Set(); // Private window, blocked storage, etc. — just start with nothing checked.
      }
    });
    setHydrated(true);
    // storageKey only changes if the strategy itself changes, which remounts the page anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(next: Set<number>) {
    setDone(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...next]));
    } catch {
      // Fine — the checkbox still works for this visit, it just won't be remembered.
    }
  }

  function toggleDone(i: number) {
    const next = new Set(done);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    persist(next);
  }

  function toggle(i: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function toggleAll() {
    setOpen(allOpen ? new Set() : new Set(steps.map((_, i) => i)));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="meta" aria-live="polite">
          {hydrated && done.size > 0 ? (
            <>
              <span className="font-semibold text-foreground">{done.size}</span> of {steps.length} steps
              checked off
            </>
          ) : (
            `${steps.length} steps`
          )}
        </p>
        <button type="button" onClick={toggleAll} className="text-xs font-medium text-accent hover:underline">
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {hydrated && done.size > 0 && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-bright transition-all duration-300"
            style={{ width: `${(done.size / steps.length) * 100}%` }}
          />
        </div>
      )}

      <ol className="mt-3 space-y-3">
        {steps.map((step, i) => {
          const isOpen = open.has(i);
          const isDone = done.has(i);
          return (
            <li
              key={step.title}
              className={`rounded-xl border bg-surface transition-colors ${
                isDone ? "border-success/40" : "border-border"
              }`}
            >
              <div className="flex items-center gap-2 px-2">
                <button
                  type="button"
                  onClick={() => toggleDone(i)}
                  aria-pressed={isDone}
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    isDone
                      ? "border-success bg-success/15 text-success"
                      : "border-border-strong text-transparent hover:border-subtle"
                  }`}
                >
                  <CheckIcon className="size-3.5" />
                  <span className="sr-only">Mark step {i + 1} as done</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="flex flex-1 cursor-pointer items-center justify-between gap-3 rounded-xl py-4 text-left transition-colors hover:bg-surface-2"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gold-fill text-xs font-bold text-gold-ink">
                      {i + 1}
                    </span>
                    <span className={`font-semibold ${isDone ? "text-muted line-through decoration-success/60" : "text-foreground"}`}>
                      {step.title}
                    </span>
                  </span>
                  <ChevronDownIcon
                    className={`size-4 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="border-t border-border px-5 py-4 pl-[3.75rem] text-sm leading-relaxed text-muted">
                    <GlossaryText text={step.detail} />
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
