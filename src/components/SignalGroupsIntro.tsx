import { formatSignalDate } from "@/lib/signal-group-types";

export default function SignalGroupsIntro({
  count,
  marketCount,
  updated,
}: {
  count?: number;
  marketCount?: number;
  /** ISO date (YYYY-MM-DD) of the newest check across the directory. */
  updated?: string | null;
}) {
  const updatedLabel = formatSignalDate(updated);

  return (
    <header className="grid grid-cols-12 gap-x-4">
      <div className="col-span-12 max-w-3xl">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-[2rem] sm:leading-10">
          Signal Groups
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted sm:text-[0.9375rem]">
          Telegram signal groups you can filter by market, style, price and language. Open a group for its
          full listing.
        </p>
        {count == null ? (
          <div className="mt-3 flex h-5 items-center gap-2" aria-hidden="true">
            <span className="h-3 w-16 animate-pulse rounded bg-surface-2 motion-reduce:animate-none" />
            <span className="h-3 w-16 animate-pulse rounded bg-surface-2 motion-reduce:animate-none" />
            <span className="h-3 w-24 animate-pulse rounded bg-surface-2 motion-reduce:animate-none" />
          </div>
        ) : (
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-muted">
            <span>
              <span className="font-medium text-foreground tabular-nums">{count}</span> groups
            </span>
            <Sep />
            <span>
              <span className="font-medium text-foreground tabular-nums">{marketCount}</span> markets
            </span>
            <Sep />
            <span>Links checked</span>
            {updatedLabel && updated && (
              <>
                <Sep />
                <span>
                  Updated <time dateTime={updated}>{updatedLabel}</time>
                </span>
              </>
            )}
          </p>
        )}
      </div>
    </header>
  );
}

function Sep() {
  return (
    <span aria-hidden="true" className="text-subtle">
      ·
    </span>
  );
}
