import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/auth";
import { profileUpdateSchema } from "@/lib/validations/profile";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Authentication required", 401);
    }

    await connectDB();
    const body = await req.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    if (parsed.data.username) {
      const usernameTaken = await User.findOne({
        username: parsed.data.username,
        _id: { $ne: session.user.id },
      });
      if (usernameTaken) {
        return apiError("Username is already taken", 409);
      }
    }

    const updated = await User.findByIdAndUpdate(session.user.id, parsed.data, { new: true }).select(
      "-providerIds"
    );
    // `password` is already excluded by the schema's `select: false`; explicitly
    // dropping `providerIds` here too — the raw OAuth account IDs have no
    // reason to reach the browser once sign-in is done.
    return apiSuccess(updated, "Profile updated successfully");
  } catch (err) {
    console.error("PATCH /api/profile error:", err);
    return apiError("Failed to update profile", 500);
  }
}
