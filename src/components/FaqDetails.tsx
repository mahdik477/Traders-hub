import { ChevronDownIcon } from "@/components/icons";

// The homepage FAQ as native <details>/<summary>: no JavaScript, no
// hydration, keyboard and screen-reader behaviour for free. The first
// answer starts open so a visitor sees the shape of it. Open/close is
// instant (height can't animate without JS); the chevron turn is the only
// motion. Reference "disclosure" pattern in DESIGN.md.
export default function FaqDetails({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface">
      {items.map((item, i) => (
        <details key={item.q} className="group" open={i === 0}>
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-surface-2 sm:px-5 [&::-webkit-details-marker]:hidden">
            <span className="text-base font-semibold text-foreground">{item.q}</span>
            <ChevronDownIcon className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
          </summary>
          <p className="px-4 pb-4 leading-relaxed text-muted sm:px-5">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
