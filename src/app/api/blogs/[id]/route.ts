import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import { auth } from "@/auth";
import { blogUpdateSchema } from "@/lib/validations/blog";
import { mongoIdParamSchema } from "@/lib/validations/params";
import { apiSuccess, apiError } from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const parsedId = mongoIdParamSchema.safeParse({ id });
    if (!parsedId.success) {
      return apiError("Invalid blog id", 400, parsedId.error.flatten());
    }

    const blog = await Blog.findById(id).populate("author", "name username image");
    if (!blog || blog.status !== "published") {
      return apiError("Blog not found", 404);
    }

    return apiSuccess(blog);
  } catch (err) {
    console.error("GET /api/blogs/[id] error:", err);
    return apiError("Failed to fetch blog", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Authentication required", 401);
    }

    await connectDB();
    const { id } = await params;
    const parsedId = mongoIdParamSchema.safeParse({ id });
    if (!parsedId.success) {
      return apiError("Invalid blog id", 400, parsedId.error.flatten());
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return apiError("Blog not found", 404);
    }
    if (blog.author.toString() !== session.user.id) {
      return apiError("You do not have permission to edit this blog", 403);
    }

    const body = await req.json();
    const parsed = blogUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    if (parsed.data.slug && parsed.data.slug !== blog.slug) {
      const slugTaken = await Blog.findOne({ slug: parsed.data.slug, _id: { $ne: id } });
      if (slugTaken) {
        return apiError("A blog with this slug already exists", 409);
      }
    }

    Object.assign(blog, parsed.data);
    if (parsed.data.status === "published" && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }
    await blog.save();

    return apiSuccess(blog, "Blog updated successfully");
  } catch (err) {
    console.error("PATCH /api/blogs/[id] error:", err);
    return apiError("Failed to update blog", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Authentication required", 401);
    }

    await connectDB();
    const { id } = await params;
    const parsedId = mongoIdParamSchema.safeParse({ id });
    if (!parsedId.success) {
      return apiError("Invalid blog id", 400, parsedId.error.flatten());
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return apiError("Blog not found", 404);
    }
    if (blog.author.toString() !== session.user.id) {
      return apiError("You do not have permission to delete this blog", 403);
    }

    await blog.deleteOne();
    return apiSuccess(null, "Blog deleted successfully");
  } catch (err) {
    console.error("DELETE /api/blogs/[id] error:", err);
    return apiError("Failed to delete blog", 500);
  }
}
