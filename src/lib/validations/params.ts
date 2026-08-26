import { z } from "zod";

// Validates a MongoDB ObjectId path param (/api/blogs/[id], /api/communities/[id]/membership)
// before it ever reaches a Mongoose query. Without this, a malformed id falls
// through to a Mongoose CastError, which gets caught by the generic
// try/catch and reported as a confusing 500 instead of a clean 400.
export const mongoIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id format"),
});

// Validates a username path param (/api/profile/[username]) against the
// same format enforced at write-time by profileUpdateSchema, so a malformed
// username in the URL returns 400 rather than silently falling through to
// a Mongoose query that will just return null (reported as 404 either way,
// but this gives a more accurate error for genuinely invalid input).
export const usernameParamSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Invalid username format"),
});
