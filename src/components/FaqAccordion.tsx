"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

// A click-to-expand FAQ, one answer open at a time — the first one starts
// open so a visitor immediately sees the shape of it, same convention as
// StrategyWalkthrough's first step.
export default function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-surface-2 sm:px-5"
            >
              <span className="text-base font-semibold text-foreground">{item.q}</span>
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
                <p className="px-4 pb-4 leading-relaxed text-muted sm:px-5">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
