import { z } from "zod";

export const profileUpdateSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
  image: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  headline: z.string().trim().max(120).optional().or(z.literal("")),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
  skills: z.array(z.string().trim().min(1)).max(20).default([]),
  githubUrl: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  linkedinUrl: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
});
