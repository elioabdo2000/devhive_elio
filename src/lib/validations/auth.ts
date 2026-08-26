import { z } from "zod";

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/[0-9]/, "Must include a number"),
    confirmPassword: z.string(),
    termsAccepted: z.literal(true, { message: "You must accept the terms" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  termsAccepted: z.literal(true, { message: "You must accept the terms" }),
});

// Gates the OAuth buttons only — confirms the visitor's email and terms
// acceptance with Zod before initiating the redirect. Deliberately excludes
// `password`: OAuth credentials are handled entirely by Google/GitHub, and
// this app must never collect them.
export const oauthPreAuthSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  termsAccepted: z.literal(true, { message: "You must accept the terms" }),
});

export type OAuthPreAuthInput = z.infer<typeof oauthPreAuthSchema>;

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
