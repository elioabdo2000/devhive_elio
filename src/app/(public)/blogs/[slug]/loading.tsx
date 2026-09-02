export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-6 w-16 animate-pulse rounded-full bg-teal-soft" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-teal-soft" />
      </div>
      <div className="mb-3 h-10 w-full animate-pulse rounded bg-skeleton" />
      <div className="mb-6 h-10 w-2/3 animate-pulse rounded bg-skeleton" />

      <div className="mb-8 flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-skeleton" />
        <div className="space-y-2">
          <div className="h-3.5 w-32 animate-pulse rounded bg-skeleton" />
          <div className="h-3 w-24 animate-pulse rounded bg-skeleton" />
        </div>
      </div>

      <div className="mb-8 h-64 w-full animate-pulse rounded-xl bg-skeleton" />

      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-skeleton" />
        ))}
        <div className="h-4 w-3/4 animate-pulse rounded bg-skeleton" />
      </div>
    </div>
  );
}
