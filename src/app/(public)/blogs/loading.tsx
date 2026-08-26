export default function Loading() {
  return (
    <div>
      <section className="border-b border-border bg-white px-4 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-6 h-6 w-48 animate-pulse rounded-full bg-teal-soft" />
            <div className="mb-4 h-12 w-full animate-pulse rounded bg-slate-200" />
            <div className="mb-4 h-12 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="mb-8 h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="flex gap-3">
              <div className="h-11 w-32 animate-pulse rounded-lg bg-ink/20" />
              <div className="h-11 w-32 animate-pulse rounded-lg bg-slate-100" />
            </div>
          </div>
          <div className="h-72 w-full animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-6 h-7 w-56 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-amber-soft/40" />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-6 h-7 w-40 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-teal-soft/30" />
          ))}
        </div>
      </section>
    </div>
  );
}
