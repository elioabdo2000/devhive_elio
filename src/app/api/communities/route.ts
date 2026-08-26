import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Community from "@/models/Community";
import Membership from "@/models/Membership";
import { auth } from "@/auth";
import { communityCreateSchema, communityQuerySchema } from "@/lib/validations/community";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const parsed = communityQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return apiError("Invalid query parameters", 400, parsed.error.flatten());
    }
    const { search, category, page, limit } = parsed.data;

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (category) {
      filter.category = category;
    }

    const skip = (page - 1) * limit;

    const [communities, total] = await Promise.all([
      Community.find(filter)
        .select("name slug description category image members createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Community.countDocuments(filter),
    ]);

    const withCounts = communities.map((c) => ({
      ...c,
      memberCount: c.members?.length ?? 0,
      members: undefined,
    }));

    return apiSuccess({
      communities: withCounts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET /api/communities error:", err);
    return apiError("Failed to fetch communities", 500);
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
    const parsed = communityCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const existingSlug = await Community.findOne({ slug: parsed.data.slug });
    if (existingSlug) {
      return apiError("A community with this slug already exists", 409);
    }

    const community = await Community.create({
      ...parsed.data,
      createdBy: session.user.id,
      members: [session.user.id],
    });

    // Community.members[] is only a denormalized mirror for display/count —
    // Membership is the actual source of truth everywhere else in the app
    // (join/leave, duplicate-membership checks). Without this, the creator
    // would show as a member on the page but have no real Membership row,
    // so leaving their own community would 404.
    await Membership.create({ user: session.user.id, community: community._id, role: "admin" });

    return apiSuccess(community, "Community created successfully", 201);
  } catch (err) {
    console.error("POST /api/communities error:", err);
    return apiError("Failed to create community", 500);
  }
}
