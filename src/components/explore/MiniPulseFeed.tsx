// A small "live feed" look for Signal Groups — real group names with a
// pulsing dot each, suggesting active communities without claiming any
// performance or activity numbers we haven't actually published elsewhere.
export default function MiniPulseFeed({
  items,
}: {
  items: { name: string; priceLabel: string; memberCount: string | null }[];
}) {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-subtle">In the directory</p>
      {items.map((item, i) => (
        <div
          key={item.name}
          className="flex items-center gap-3 rounded-lg border border-border bg-surface-2/60 px-3 py-2 transition-colors hover:border-gold-fill/40"
        >
          <span className="relative flex size-1.5 shrink-0">
            <span
              className="absolute inline-flex size-full rounded-full bg-success opacity-75 motion-safe:animate-ping"
              style={{ animationDelay: `${i * 400}ms` }}
            />
            <span className="relative inline-flex size-1.5 rounded-full bg-success" />
          </span>
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{item.name}</span>
          <span className="meta shrink-0 font-mono text-[0.65rem]">{item.priceLabel}</span>
        </div>
      ))}
    </div>
  );
}
