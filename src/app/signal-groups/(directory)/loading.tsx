export default function Loading() {
  return (
    <div aria-busy="true" className="pt-16">
      <p className="sr-only">Loading signal groups</p>
      <div className="h-16 w-2/3 max-w-md animate-pulse rounded-lg bg-surface-2 motion-reduce:animate-none" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-2xl bg-surface-2 motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}
