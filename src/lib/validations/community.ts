import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const communityCreateSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(80)
    .regex(slugRegex, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(500),
  category: z.string().trim().min(2).max(50),
  image: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
});

export const communityQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type CommunityCreateInput = z.infer<typeof communityCreateSchema>;
