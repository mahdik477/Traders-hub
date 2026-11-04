// A grid of term + definition cards — used anywhere a topic needs to
// introduce several pieces of vocabulary at once (order types, candle
// patterns, key metrics) without it reading as a dense glossary wall.
export type DefinitionItem = { term: string; definition: string; tag?: string };

export default function DefinitionGrid({ items, columns = 2 }: { items: DefinitionItem[]; columns?: 2 | 3 }) {
  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : ""}`}>
      {items.map((item) => (
        <div
          key={item.term}
          className="rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/40 hover:shadow-glow"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-foreground">{item.term}</h3>
            {item.tag && <span className="pill shrink-0 text-xs">{item.tag}</span>}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.definition}</p>
        </div>
      ))}
    </div>
  );
}
