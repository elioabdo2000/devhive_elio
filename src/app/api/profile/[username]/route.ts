import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { usernameParamSchema } from "@/lib/validations/params";
import { apiSuccess, apiError } from "@/lib/api-response";

interface Params {
  params: Promise<{ username: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { username } = await params;
    const parsedParams = usernameParamSchema.safeParse({ username });
    if (!parsedParams.success) {
      return apiError("Invalid username", 400, parsedParams.error.flatten());
    }

    const user = await User.findOne({ username: parsedParams.data.username }).select(
      "name username image headline bio skills githubUrl linkedinUrl"
    );
    if (!user) return apiError("Profile not found", 404);

    return apiSuccess(user);
  } catch (err) {
    console.error("GET /api/profile/[username] error:", err);
    return apiError("Failed to fetch profile", 500);
  }
}
