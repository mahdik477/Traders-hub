export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading signal group</p>
      <div className="h-11 w-44 animate-pulse rounded-lg bg-surface-2 motion-reduce:animate-none" />
      <div className="mt-4 h-36 animate-pulse rounded-lg border border-border bg-surface motion-reduce:animate-none" />
      <div className="mt-6 h-16 max-w-3xl animate-pulse rounded-lg bg-surface-2 motion-reduce:animate-none" />
      <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border sm:grid-cols-2">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-16 animate-pulse bg-surface motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}
