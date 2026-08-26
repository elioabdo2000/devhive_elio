export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-4">
        <div className="h-[72px] w-[72px] animate-pulse rounded-full bg-teal-soft" />
        <div>
          <div className="mb-2 h-6 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="mb-8 h-16 w-full animate-pulse rounded bg-slate-100" />
      <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-paper" />
        ))}
      </div>
    </div>
  );
}
