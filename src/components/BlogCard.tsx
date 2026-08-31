import Link from "next/link";

interface BlogCardProps {
  blog: {
    slug: string;
    title: string;
    excerpt: string;
    tags: string[];
    publishedAt?: string;
    author: { name: string; username: string; image?: string };
  };
}

function readingTime(excerpt: string) {
  return Math.max(1, Math.ceil(excerpt.split(" ").length / 40));
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function BlogCard({ blog }: BlogCardProps) {
  return (
    <Link
      href={`/blogs/${blog.slug}`}
      className="gutter-card block rounded-r-lg bg-white p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="font-mono mb-3 flex items-center gap-2 text-xs text-ink-soft">
        <span className="text-teal">@{blog.author.username}</span>
        <span>·</span>
        <span>{blog.publishedAt && formatDate(blog.publishedAt)}</span>
        <span>·</span>
        <span>{readingTime(blog.excerpt)} min read</span>
      </div>
      <h3 className="font-display mb-2 text-lg font-semibold leading-snug text-ink">{blog.title}</h3>
      <p className="mb-4 line-clamp-2 text-sm text-ink-soft">{blog.excerpt}</p>
      <div className="flex flex-wrap gap-2">
        {blog.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="font-mono rounded bg-teal-soft px-2 py-0.5 text-xs text-teal">
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}