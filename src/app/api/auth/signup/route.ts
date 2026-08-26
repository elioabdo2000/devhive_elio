import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signupSchema } from "@/lib/validations/auth";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { name, email, password } = parsed.data;

    const existing = await User.findOne({ email });
    if (existing) {
      return apiError("An account with this email already exists", 409);
    }

    const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    let username = base;
    let suffix = 1;
    while (await User.findOne({ username })) {
      username = `${base}${suffix}`;
      suffix++;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      skills: [],
      providerIds: {},
    });

    // Never return the hash — only what the client needs to trigger sign-in next.
    return apiSuccess({ email }, "Account created successfully", 201);
  } catch (err) {
    console.error("POST /api/auth/signup error:", err);
    return apiError("Failed to create account", 500);
  }
}
