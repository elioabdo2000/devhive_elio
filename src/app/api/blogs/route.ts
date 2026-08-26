import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import { auth } from "@/auth";
import { blogCreateSchema, blogQuerySchema } from "@/lib/validations/blog";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const parsed = blogQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return apiError("Invalid query parameters", 400, parsed.error.flatten());
    }
    const { search, tag, page, limit } = parsed.data;

    const filter: Record<string, unknown> = { status: "published" };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }
    if (tag) {
      filter.tags = tag;
    }

    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate("author", "name username image")
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return apiSuccess({
      blogs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET /api/blogs error:", err);
    return apiError("Failed to fetch blogs", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Authentication required", 401);
    }

    await connectDB();
    const body = await req.json();
    const parsed = blogCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const existingSlug = await Blog.findOne({ slug: parsed.data.slug });
    if (existingSlug) {
      return apiError("A blog with this slug already exists", 409);
    }

    const blog = await Blog.create({
      ...parsed.data,
      author: session.user.id,
      publishedAt: parsed.data.status === "published" ? new Date() : undefined,
    });

    return apiSuccess(blog, "Blog created successfully", 201);
  } catch (err) {
    console.error("POST /api/blogs error:", err);
    return apiError("Failed to create blog", 500);
  }
}
