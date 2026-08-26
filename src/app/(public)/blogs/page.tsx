import { Suspense } from "react";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import BlogsBrowser from "./BlogsBrowser";

export const revalidate = 120;

const PAGE_SIZE = 9;

// Deliberately no `searchParams` prop here — reading searchParams in a
// Server Component opts the whole route into dynamic (per-request)
// rendering, which would silently cancel the `revalidate` above. Instead
// this renders the unfiltered, first-page list for ISR, and BlogsBrowser
// (a Client Component) takes over search/tag/pagination via fetch calls to
// GET /api/blogs — exactly the "query params + Route Handler" filtering
// pattern the assignment brief allows.
async function getInitialBlogs() {
  await connectDB();

  const [blogs, total] = await Promise.all([
    Blog.find({ status: "published" })
      .populate("author", "name username image")
      .sort({ publishedAt: -1 })
      .limit(PAGE_SIZE)
      .lean(),
    Blog.countDocuments({ status: "published" }),
  ]);

  return { blogs: JSON.parse(JSON.stringify(blogs)), total };
}

export default async function BlogsPage() {
  const { blogs, total } = await getInitialBlogs();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display mb-2 text-3xl font-semibold">Blogs</h1>
      <p className="mb-6 text-ink-soft">Fresh technical writing from the DevHive community.</p>

      <Suspense fallback={<BlogsBrowserFallback blogs={blogs} />}>
        <BlogsBrowser initialBlogs={blogs} initialTotal={total} pageSize={PAGE_SIZE} />
      </Suspense>
    </div>
  );
}

function BlogsBrowserFallback({ blogs }: { blogs: unknown[] }) {
  // Matches BlogsBrowser's shape closely enough to avoid layout shift while
  // the Client Component (which needs useSearchParams) hydrates.
  return (
    <div>
      <div className="h-10 w-full max-w-sm animate-pulse rounded-lg bg-teal-soft/60" />
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {blogs.map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-teal-soft" />
        ))}
      </div>
    </div>
  );
}
