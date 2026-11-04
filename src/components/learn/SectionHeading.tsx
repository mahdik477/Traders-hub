import type { ReactNode } from "react";

// A consistent in-prose section heading, matching the id the jump-nav links
// to. Kept separate from strategies' SectionHeading (which carries an icon
// chip sized for that page's denser layout) — this one is lighter, for the
// longer, more essay-like Learn pages.
export default function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="section-title scroll-mt-24 text-2xl sm:text-3xl">
      {children}
    </h2>
  );
}
