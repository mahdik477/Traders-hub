import type { JSX } from "react";

// The real tool categories as a small hoverable cluster — what's actually
// in the directory, not a decorative icon pattern standing in for nothing.
export default function MiniIconCluster({
  items,
}: {
  items: { label: string; icon: (p: { className?: string }) => JSX.Element }[];
}) {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-subtle">What&apos;s in here</p>
      <div className="grid grid-cols-4 gap-2.5">
        {items.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="group/icon flex flex-col items-center gap-1.5 rounded-lg border border-border bg-surface-2/60 px-1.5 py-2.5 text-center transition-colors hover:border-gold-fill/50 hover:bg-gold-fill/10"
          >
            <Icon className="size-4 text-accent transition-transform duration-150 group-hover/icon:scale-110" />
            <span className="font-mono text-[0.58rem] leading-tight text-muted group-hover/icon:text-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
