"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="font-mono mb-3 text-sm text-danger">{"// error"}</p>
      <h1 className="font-display mb-2 text-2xl font-semibold">Something went wrong</h1>
      <p className="mb-6 text-ink-soft">{error.message || "An unexpected error occurred."}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal"
      >
        Try again
      </button>
    </div>
  );
}
