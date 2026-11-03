import Link from "next/link";
import {
  BROKER_CATEGORY_LABELS,
  BROKER_CATEGORY_ORDER,
  BROKER_CATEGORY_PATHS,
  type BrokerCategory,
} from "@/lib/broker-types";

export default function BrokerCategoryNav({
  active,
  counts,
}: {
  active: BrokerCategory;
  counts: Record<BrokerCategory, number>;
}) {
  return (
    <nav aria-label="Broker types" className="mt-6">
      <ul className="flex flex-wrap gap-2">
        {BROKER_CATEGORY_ORDER.map((id) => {
          const selected = id === active;
          const count = counts[id];
          return (
            <li key={id}>
              <Link
                href={BROKER_CATEGORY_PATHS[id]}
                aria-current={selected ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors duration-150 ${
                  selected
                    ? "border-accent bg-accent/15 text-foreground"
                    : "border-border-strong bg-surface text-muted hover:border-subtle hover:text-foreground"
                }`}
              >
                {BROKER_CATEGORY_LABELS[id]}
                {count > 0 && (
                  <span className={`tabular-nums ${selected ? "text-foreground" : "text-subtle"}`}>
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
