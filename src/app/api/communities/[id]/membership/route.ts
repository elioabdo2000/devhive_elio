import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Community from "@/models/Community";
import Membership from "@/models/Membership";
import { auth } from "@/auth";
import { mongoIdParamSchema } from "@/lib/validations/params";
import { apiSuccess, apiError } from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Authentication required", 401);
    }

    await connectDB();
    const { id } = await params;
    const parsedId = mongoIdParamSchema.safeParse({ id });
    if (!parsedId.success) {
      return apiError("Invalid community id", 400, parsedId.error.flatten());
    }

    const community = await Community.findById(id);
    if (!community) {
      return apiError("Community not found", 404);
    }

    try {
      await Membership.create({ user: session.user.id, community: id });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && err.code === 11000) {
        return apiError("You are already a member of this community", 409);
      }
      throw err;
    }

    await Community.updateOne({ _id: id }, { $addToSet: { members: session.user.id } });

    return apiSuccess(null, "Joined community successfully", 201);
  } catch (err) {
    console.error("POST /api/communities/[id]/membership error:", err);
    return apiError("Failed to join community", 500);
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
      return apiError("Invalid community id", 400, parsedId.error.flatten());
    }

    const membership = await Membership.findOneAndDelete({
      user: session.user.id,
      community: id,
    });

    if (!membership) {
      return apiError("You are not a member of this community", 404);
    }

    await Community.updateOne({ _id: id }, { $pull: { members: session.user.id } });

    return apiSuccess(null, "Left community successfully");
  } catch (err) {
    console.error("DELETE /api/communities/[id]/membership error:", err);
    return apiError("Failed to leave community", 500);
  }
}
