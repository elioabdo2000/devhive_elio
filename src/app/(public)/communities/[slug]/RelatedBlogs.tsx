import Link from "next/link";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";

interface RelatedBlog {
  title: string;
  slug: string;
  excerpt: string;
}

async function getRelatedBlogs(category: string): Promise<RelatedBlog[]> {
  await connectDB();
  const blogs = await Blog.find({ status: "published", tags: category })
    .select("title slug excerpt")
    .limit(4)
    .lean();
  return JSON.parse(JSON.stringify(blogs)) as RelatedBlog[];
}

/**
 * Rendered inside a <Suspense> boundary on the community details page — this
 * section streams in independently so the community header and member list
 * don't wait on it.
 */
export default async function RelatedBlogs({ category }: { category: string }) {
  const relatedBlogs = await getRelatedBlogs(category);

  if (relatedBlogs.length === 0) {
    return <p className="text-sm text-ink-soft">No related blogs yet — tag a post &ldquo;{category}&rdquo; to see it here.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {relatedBlogs.map((b) => (
        <Link
          key={b.slug}
          href={`/blogs/${b.slug}`}
          className="group rounded-lg border border-border p-4 transition hover:border-teal hover:shadow-sm"
        >
          <p className="font-medium text-ink group-hover:text-teal">{b.title}</p>
          <p className="line-clamp-2 text-sm text-ink-soft">{b.excerpt}</p>
        </Link>
      ))}
    </div>
  );
}
