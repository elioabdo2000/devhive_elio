export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-2 h-5 w-24 animate-pulse rounded-full bg-amber-soft" />
      <div className="mb-3 h-9 w-2/3 animate-pulse rounded bg-slate-200" />
      <div className="mb-6 h-4 w-full animate-pulse rounded bg-slate-100" />
      <div className="mb-8 h-10 w-32 animate-pulse rounded-lg bg-teal-soft" />
      <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-paper" />
        ))}
      </div>
    </div>
  );
}
