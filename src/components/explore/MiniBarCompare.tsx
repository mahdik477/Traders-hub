// A small horizontal bar comparison — real figures for a handful of real
// listings, longest bar first. Used for Funded Accounts (profit split %)
// and Brokers (minimum deposit), with different data and formatting but
// the same honest shape: this is never a ranking, just a readout of
// published numbers, same as everywhere else on the site.
export type BarItem = { name: string; value: number; display: string };

export default function MiniBarCompare({ items, label }: { items: BarItem[]; label: string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-subtle">{label}</p>
      {items.map((item) => (
        <div key={item.name} className="group/bar relative">
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-semibold text-foreground">{item.name}</span>
            <span className="meta shrink-0 font-mono group-hover/bar:text-gold-bright">{item.display}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-bright transition-[filter] duration-200 group-hover/bar:brightness-125"
              style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
