"use client";

import { useState } from "react";
import type { CurriculumModule } from "@/lib/course-types";
import { ChevronDownIcon } from "@/components/icons";

// Controlled accordion (not native <details>) so we can offer "Expand all" /
// "Collapse all", and animate height smoothly via the grid-rows trick.
export default function CourseCurriculum({ modules }: { modules: CurriculumModule[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const allOpen = open.size === modules.length;

  function toggle(i: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function toggleAll() {
    setOpen(allOpen ? new Set() : new Set(modules.map((_, i) => i)));
  }

  return (
    <div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs font-medium text-accent hover:underline"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>
      <div className="mt-2 space-y-3">
        {modules.map((module, i) => {
          const isOpen = open.has(i);
          return (
            <div key={module.title} className="rounded-xl border border-border bg-surface">
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
                  <span className="font-semibold text-foreground">{module.title}</span>
                </span>
                <span className="flex items-center gap-3">
                  {module.moduleCount != null && (
                    <span className="pill">{module.moduleCount} lessons</span>
                  )}
                  <ChevronDownIcon
                    className={`size-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </span>
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <ul className="meta space-y-2 border-t border-border px-5 py-4 pl-[3.25rem]">
                    {module.topics.map((topic) => (
                      <li key={topic} className="flex items-start gap-2">
                        <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
