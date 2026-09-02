export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-2 h-8 w-48 animate-pulse rounded bg-skeleton" />
      <div className="mb-6 h-4 w-72 animate-pulse rounded bg-skeleton" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-amber-soft" />
        ))}
      </div>
    </div>
  );
}
