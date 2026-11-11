// Loading placeholders used by each section's loading.tsx — shown for the
// instant between tapping a link and the page arriving. Shapes roughly
// match the real layouts (title, filter bar, a grid of cards) so nothing
// jumps when the content lands. All decorative: aria-hidden, with a
// single screen-reader "Loading" line.

function Bar({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function DirectorySkeleton({ cards = 6, filters = true }: { cards?: number; filters?: boolean }) {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading
      </p>
      <div aria-hidden="true">
        <Bar className="h-10 w-64 max-w-full" />
        <Bar className="mt-4 h-5 w-96 max-w-full" />
        {filters && <Bar className="mt-6 h-20 w-full rounded-xl" />}
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cards }).map((_, i) => (
            <li key={i} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3">
                <Bar className="size-11 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Bar className="h-4 w-3/4" />
                  <Bar className="h-3 w-1/2" />
                </div>
              </div>
              <Bar className="mt-5 h-8 w-28" />
              <Bar className="mt-5 h-11 w-full" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading
      </p>
      <div aria-hidden="true">
        <Bar className="h-5 w-32" />
        <div className="mt-5 rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center gap-4">
            <Bar className="size-14 shrink-0" />
            <Bar className="h-9 w-72 max-w-full" />
          </div>
          <Bar className="mt-4 h-4 w-full max-w-2xl" />
          <Bar className="mt-2 h-4 w-2/3 max-w-xl" />
        </div>
        <Bar className="mt-8 h-40 w-full rounded-xl" />
        <Bar className="mt-6 h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
