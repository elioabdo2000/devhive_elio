import { NextRequest } from "next/server";
import { UTApi } from "uploadthing/server";
import { auth } from "@/auth";
import { apiSuccess, apiError } from "@/lib/api-response";

// UTApi reads UPLOADTHING_TOKEN from the environment automatically — no
// explicit config needed. This file is server-only; the token must never
// be referenced from a Client Component or a NEXT_PUBLIC_ variable.
const utapi = new UTApi();

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_FOLDERS = ["blog-covers", "community-covers", "avatars"] as const;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Authentication required", 401);
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const folderInput = formData.get("folder");

    if (!(file instanceof File)) {
      return apiError("No file provided", 400);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError("Only JPEG, PNG, WebP, and GIF images are allowed", 400);
    }
    if (file.size > MAX_BYTES) {
      return apiError("Image must be under 5MB", 400);
    }

    const folder = ALLOWED_FOLDERS.includes(folderInput as (typeof ALLOWED_FOLDERS)[number])
      ? (folderInput as (typeof ALLOWED_FOLDERS)[number])
      : "misc";

    // UploadThing doesn't have Cloudinary-style folders, so the scoping
    // lives in the filename instead — still keeps uploads traceable to a
    // user and use-case in the UploadThing dashboard.
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const renamed = new File([file], `${folder}-${session.user.id}-${Date.now()}.${ext}`, {
      type: file.type,
    });

    const response = await utapi.uploadFiles(renamed);

    if (response.error || !response.data) {
      console.error("UploadThing upload error:", response.error);
      return apiError("Failed to upload image", 500);
    }

    return apiSuccess({ url: response.data.ufsUrl }, "Image uploaded successfully", 201);
  } catch (err) {
    console.error("POST /api/upload error:", err);
    return apiError("Failed to upload image", 500);
  }
}
