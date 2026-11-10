"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// A short fade-and-rise each time the route changes. Keying the wrapper on
// the pathname remounts it per page, which re-runs the CSS animation; the
// animation itself is motion-safe only (see .page-enter in globals.css), so
// with reduced motion the page simply appears. No JS timers, no layout
// work — the cheapest possible transition on a low-end phone.
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
