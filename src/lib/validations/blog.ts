import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const blogCreateSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(150),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(150)
    .regex(slugRegex, "Slug must be lowercase letters, numbers, and hyphens only"),
  excerpt: z.string().trim().min(20, "Excerpt must be at least 20 characters").max(300),
  content: z.string().trim().min(100, "Content must be at least 100 characters"),
  coverImage: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1)).min(1, "At least one tag is required").max(10),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const blogUpdateSchema = blogCreateSchema.partial();

export const blogQuerySchema = z.object({
  search: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type BlogCreateInput = z.infer<typeof blogCreateSchema>;
export type BlogUpdateInput = z.infer<typeof blogUpdateSchema>;
