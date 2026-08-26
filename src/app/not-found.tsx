import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="font-mono mb-3 text-sm text-teal">{"// 404"}</p>
      <h1 className="font-display mb-2 text-2xl font-semibold">Page not found</h1>
      <p className="mb-6 text-ink-soft">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="inline-block rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal"
      >
        Go home
      </Link>
    </div>
  );
}
