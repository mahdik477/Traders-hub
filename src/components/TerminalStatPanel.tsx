import type { ReactNode } from "react";
import CountUpStat from "@/components/CountUpStat";

// The small "live data" widget used in every hero on the site (homepage,
// strategies, courses) — a bordered panel styled like a trading terminal
// readout, tabular-numeral counts, an optional decorative icon backdrop
// unique to that page. One shared component so the three heroes read as
// the same design language, not three different ideas.
export type TerminalStat = { label: string; value: number; suffix?: string };

export default function TerminalStatPanel({
  caption,
  stats,
  footnote,
  backdrop,
}: {
  caption: string;
  stats: TerminalStat[];
  footnote?: string;
  backdrop?: ReactNode;
}) {
  return (
    <div className="terminal-panel relative overflow-hidden rounded-2xl border border-border-strong bg-surface p-5 shadow-glow sm:p-6">
      {backdrop}
      <div className="relative flex items-center gap-2 border-b border-border pb-3">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full rounded-full bg-success opacity-75 motion-safe:animate-ping" />
          <span className="relative inline-flex size-2 rounded-full bg-success" />
        </span>
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted">{caption}</span>
      </div>
      <dl className="relative mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <dd className="figure-lg font-mono text-3xl text-foreground sm:text-4xl">
              <CountUpStat value={s.value} suffix={s.suffix} />
            </dd>
            <dt className="eyebrow mt-1">{s.label}</dt>
          </div>
        ))}
      </dl>
      {footnote && <p className="relative mt-5 border-t border-border pt-4 font-mono text-[0.7rem] leading-relaxed text-subtle">{footnote}</p>}
    </div>
  );
}
