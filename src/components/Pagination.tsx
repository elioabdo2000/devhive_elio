import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** e.g. "/blogs" or "/communities" */
  basePath: string;
  /** Other active query params (search, tag, category) to preserve across page links. */
  searchParams?: Record<string, string | undefined>;
}

/**
 * Plain <Link>-based pagination — no client JS needed since changing pages
 * is just a navigation, not an interactive state update.
 */
export default function Pagination({ currentPage, totalPages, basePath, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  function hrefFor(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  }

  // Keep the page list short: current page +/- 2, plus first/last.
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2
  );

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
      <Link
        href={hrefFor(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={`rounded-lg border border-border px-3 py-1.5 text-sm transition ${
          currentPage === 1 ? "pointer-events-none opacity-40" : "hover:border-teal hover:text-teal"
        }`}
      >
        Prev
      </Link>

      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-ink-soft">...</span>}
          <Link
            href={hrefFor(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={`min-w-[2.25rem] rounded-lg border px-3 py-1.5 text-center text-sm font-medium transition ${
              p === currentPage
                ? "border-teal bg-teal text-white"
                : "border-border text-ink hover:border-teal hover:text-teal"
            }`}
          >
            {p}
          </Link>
        </span>
      ))}

      <Link
        href={hrefFor(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={`rounded-lg border border-border px-3 py-1.5 text-sm transition ${
          currentPage === totalPages ? "pointer-events-none opacity-40" : "hover:border-teal hover:text-teal"
        }`}
      >
        Next
      </Link>
    </nav>
  );
}
