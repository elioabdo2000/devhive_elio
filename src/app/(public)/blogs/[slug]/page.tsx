import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import Link from "next/link";
import OwnerActions from "./OwnerActions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const revalidate = 120;

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface BlogAuthor {
  _id: string;
  name: string;
  username: string;
  image?: string;
  bio?: string;
}

interface SerializedBlog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags: string[];
  author: BlogAuthor;
  status: "draft" | "published";
  publishedAt?: string;
}

interface RelatedPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
}

async function getBlog(slug: string): Promise<SerializedBlog | null> {
  await connectDB();
  const blog = await Blog.findOne({ slug, status: "published" })
    .populate("author", "name username image bio")
    .lean();
  return blog ? (JSON.parse(JSON.stringify(blog)) as SerializedBlog) : null;
}

async function getRelated(tags: string[], excludeId: string): Promise<RelatedPost[]> {
  await connectDB();
  const related = await Blog.find({
    status: "published",
    tags: { $in: tags },
    _id: { $ne: excludeId },
  })
    .limit(2)
    .select("title slug excerpt")
    .lean();
  return JSON.parse(JSON.stringify(related)) as RelatedPost[];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) return { title: "Blog not found" };
  return {
    title: `${blog.title} · DevHive`,
    description: blog.excerpt,
  };
}

export default async function BlogDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) notFound();

  const related = await getRelated(blog.tags, blog._id);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-4 flex flex-wrap gap-2">
        {blog.tags.map((tag: string) => (
          <Link
            key={tag}
            href={`/blogs?tag=${tag}`}
            className="rounded-full bg-teal-soft px-2 py-0.5 text-xs font-medium text-teal"
          >
            {tag}
          </Link>
        ))}
      </div>

      <h1 className="font-display mb-3 text-3xl font-semibold">{blog.title}</h1>

      <div className="mb-6 flex items-center justify-between text-sm text-ink-soft">
        <Link href={`/profile/${blog.author.username}`} className="font-medium text-ink hover:text-teal">
          {blog.author.name}
        </Link>
        <span>
          {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : "Draft"} · {Math.ceil(blog.content.split(" ").length / 200)} min read
        </span>
      </div>

      {blog.coverImage && (
        <img src={blog.coverImage} alt={blog.title} className="mb-6 w-full rounded-xl object-cover" />
      )}

      {/* react-markdown never renders raw HTML by default (no rehype-raw plugin
          wired in), so user-submitted content can't inject markup — it's
          rendered purely as Markdown-derived elements. */}
      <div className="md-content max-w-none space-y-4 leading-relaxed text-ink">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: (props) => <h2 className="font-display mt-8 mb-3 text-xl font-semibold text-ink" {...props} />,
            h3: (props) => <h3 className="font-display mt-6 mb-2 text-lg font-semibold text-ink" {...props} />,
            p: (props) => <p className="text-ink-soft" {...props} />,
            a: (props) => <a className="text-teal underline underline-offset-2 hover:text-ink" {...props} />,
            ul: (props) => <ul className="list-disc space-y-1 pl-5 text-ink-soft" {...props} />,
            ol: (props) => <ol className="list-decimal space-y-1 pl-5 text-ink-soft" {...props} />,
            blockquote: (props) => (
              <blockquote className="border-l-2 border-teal pl-4 italic text-ink-soft" {...props} />
            ),
          }}
        >
          {blog.content}
        </ReactMarkdown>
      </div>

      <OwnerActions authorId={blog.author._id} slug={blog.slug} blogId={blog._id} />

      {related.length > 0 && (
        <div className="mt-10 border-t border-border pt-6">
          <h2 className="font-display mb-3 text-lg font-semibold">Related posts</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blogs/${r.slug}`}
                className="rounded-lg border border-border p-4 hover:shadow-sm"
              >
                <p className="font-medium">{r.title}</p>
                <p className="line-clamp-2 text-sm text-ink-soft">{r.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
