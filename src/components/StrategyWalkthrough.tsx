"use client";

import { useState } from "react";
import type { StrategyStep } from "@/lib/strategy-types";
import { ChevronDownIcon } from "@/components/icons";

// Same controlled-accordion pattern as CourseCurriculum.tsx (numbered circles,
// smooth grid-rows height animation, Expand/Collapse all) — adapted for a
// linear "do this, then this" walkthrough instead of nested course modules.
// Step 1 starts open so a visitor sees the shape immediately.
export default function StrategyWalkthrough({ steps }: { steps: StrategyStep[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const allOpen = open.size === steps.length;

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
      <div className="flex justify-end">
        <button type="button" onClick={toggleAll} className="text-xs font-medium text-accent hover:underline">
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>
      <ol className="mt-2 space-y-3">
        {steps.map((step, i) => {
          const isOpen = open.has(i);
          return (
            <li key={step.title} className="rounded-xl border border-border bg-surface">
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-5 py-4 text-left transition-colors hover:bg-surface-2"
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gold-fill text-xs font-bold text-gold-ink">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-foreground">{step.title}</span>
                </span>
                <ChevronDownIcon
                  className={`size-4 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="border-t border-border px-5 py-4 pl-[3.25rem] text-sm leading-relaxed text-muted">
                    {step.detail}
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
