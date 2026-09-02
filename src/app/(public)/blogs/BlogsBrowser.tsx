"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BlogCard from "@/components/BlogCard";

interface BlogSummary {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  publishedAt?: string;
  author: { name: string; username: string; image?: string };
}

interface BlogsBrowserProps {
  initialBlogs: BlogSummary[];
  initialTotal: number;
  pageSize: number;
}

export default function BlogsBrowser({ initialBlogs, initialTotal, pageSize }: BlogsBrowserProps) {
  const router = useRouter();
  // useSearchParams() requires a <Suspense> boundary around this component
  // when the parent page is statically rendered — see the Suspense wrapper
  // in page.tsx. It does NOT make the parent Server Component dynamic;
  // only reading searchParams there would.
  const urlParams = useSearchParams();
  const urlSearch = urlParams.get("search") ?? "";
  const urlTag = urlParams.get("tag") ?? undefined;

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [search, setSearch] = useState(urlSearch);
  const [tag, setTag] = useState<string | undefined>(urlTag);
  const [page, setPage] = useState(1);

  const [blogs, setBlogs] = useState<BlogSummary[]>(initialBlogs);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Skip the fetch that would otherwise fire on mount when there's nothing
  // to filter by — the server already gave us the unfiltered first page as
  // part of the ISR-cached render. If the URL arrived with ?tag= or
  // ?search= (e.g. from a blog details page link), we do need to fetch.
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      if (!search && !tag) return;
    }

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (tag) params.set("tag", tag);
    router.replace(params.toString() ? `/blogs?${params.toString()}` : "/blogs", { scroll: false });

    const controller = new AbortController();

    async function fetchBlogs() {
      setLoading(true);
      setError("");
      try {
        const apiParams = new URLSearchParams(params);
        apiParams.set("page", String(page));
        apiParams.set("limit", String(pageSize));

        const res = await fetch(`/api/blogs?${apiParams.toString()}`, { signal: controller.signal });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || "Failed to load blogs");

        setBlogs(json.data.blogs);
        setTotal(json.data.pagination.total);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load blogs");
      } finally {
        setLoading(false);
      }
    }

    fetchBlogs();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tag, page, pageSize]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function clearTag() {
    setPage(1);
    setTag(undefined);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <form onSubmit={handleSearchSubmit} className="flex gap-3">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search blogs..."
          className="w-full max-w-sm rounded-lg border border-border px-3 py-2 text-sm focus:border-teal focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-teal"
        >
          Search
        </button>
        {tag && (
          <button
            type="button"
            onClick={clearTag}
            className="rounded-lg border border-border px-3 py-2 text-sm text-ink-soft"
          >
            Clear tag: {tag} ×
          </button>
        )}
      </form>

      {error && (
        <div className="mt-6 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
          {error} —{" "}
          <button type="button" onClick={() => setPage((p) => p)} className="font-medium underline">
            try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-teal-soft" />
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-lg font-medium">No blogs found</p>
          <p className="text-sm text-ink-soft">Try a different search term or check back soon.</p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <BlogCard key={blog.slug} blog={blog} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-border px-3 py-1.5 text-sm transition hover:border-teal hover:text-teal disabled:pointer-events-none disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .map((p, i, arr) => (
                  <span key={p} className="flex items-center gap-1">
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-ink-soft">...</span>}
                    <button
                      type="button"
                      onClick={() => setPage(p)}
                      aria-current={p === page ? "page" : undefined}
                      className={`min-w-[2.25rem] rounded-lg border px-3 py-1.5 text-center text-sm font-medium transition ${
                        p === page
                          ? "border-teal bg-teal text-white"
                          : "border-border text-ink hover:border-teal hover:text-teal"
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-border px-3 py-1.5 text-sm transition hover:border-teal hover:text-teal disabled:pointer-events-none disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
