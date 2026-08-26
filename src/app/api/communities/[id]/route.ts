import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Community from "@/models/Community";
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
      return apiError("Invalid community id", 400, parsedId.error.flatten());
    }

    const community = await Community.findById(id).populate("members", "name username image");
    if (!community) {
      return apiError("Community not found", 404);
    }

    return apiSuccess(community);
  } catch (err) {
    console.error("GET /api/communities/[id] error:", err);
    return apiError("Failed to fetch community", 500);
  }
}
