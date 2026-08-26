import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Blog, { type LeanBlog } from "@/models/Blog";
import BlogForm from "@/components/BlogForm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditBlogPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { slug } = await params;
  await connectDB();
  const blog = await Blog.findOne({ slug }).lean<LeanBlog>();

  if (!blog) notFound();
  if (blog.author.toString() !== session.user.id) {
    redirect(`/blogs/${slug}`);
  }

  return (
    <BlogForm
      mode="edit"
      blogId={blog._id.toString()}
      initialData={{
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        coverImage: blog.coverImage,
        tags: blog.tags,
        status: blog.status,
      }}
    />
  );
}
