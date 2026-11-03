"use client";

import Link from "next/link";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  BROKER_CATEGORY_LABELS,
  BROKER_CATEGORY_ORDER,
  BROKER_CATEGORY_PATHS,
  type BrokerCategory,
} from "@/lib/broker-types";

export default function BrokerCategoryNav({ active }: { active: BrokerCategory }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const current = list.querySelector<HTMLElement>('[aria-current="page"]');
    if (!current) return;
    setIndicator({ left: current.offsetLeft, width: current.offsetWidth });
  }, []);

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, active]);

  return (
    <nav aria-label="Broker types" className="mt-8">
      <ul ref={listRef} className="nav-scroll relative flex gap-8 overflow-x-auto border-b border-border">
        {BROKER_CATEGORY_ORDER.map((id) => {
          const selected = id === active;
          return (
            <li key={id} className="shrink-0">
              <Link
                href={BROKER_CATEGORY_PATHS[id]}
                aria-current={selected ? "page" : undefined}
                className={`inline-flex min-h-11 items-center pb-3 text-[15px] tracking-tight ${
                  selected ? "font-medium text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {BROKER_CATEGORY_LABELS[id]}
              </Link>
            </li>
          );
        })}
        <span
          aria-hidden="true"
          className="broker-tab-indicator"
          style={
            indicator
              ? { left: indicator.left, width: indicator.width }
              : { left: 0, width: 0, opacity: 0 }
          }
        />
      </ul>
    </nav>
  );
}
