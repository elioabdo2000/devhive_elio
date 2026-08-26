import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({ email: (credentials.email as string).toLowerCase() }).select(
          "+password"
        );

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.password);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Credentials sign-ins are already validated + already exist in the DB
      // (created via /api/auth/signup) — only OAuth providers need the
      // create-or-update step below.
      const oauthProviders = ["google", "github"] as const;
      const provider = account?.provider as (typeof oauthProviders)[number] | undefined;
      if (!account || !provider || !oauthProviders.includes(provider)) return true;

      // GitHub only returns an email if the account has a public/primary
      // email and the user granted the user:email scope (requested by
      // default by next-auth's GitHub provider). Without it we can't link
      // to a User document, so reject rather than creating an email-less user.
      if (!user.email) return false;

      await connectDB();
      const existing = await User.findOne({ email: user.email });

      if (!existing) {
        const base = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
        let username = base;
        let suffix = 1;
        while (await User.findOne({ username })) {
          username = `${base}${suffix}`;
          suffix++;
        }

        await User.create({
          name: user.name ?? username,
          username,
          email: user.email,
          image: user.image,
          skills: [],
          providerIds: { [provider]: account.providerAccountId },
        });
      } else {
        const updates: Record<string, unknown> = {};
        if (user.image && user.image !== existing.image) updates.image = user.image;
        if (!existing.providerIds?.[provider]) {
          updates[`providerIds.${provider}`] = account.providerAccountId;
        }
        if (Object.keys(updates).length > 0) {
          await User.updateOne({ _id: existing._id }, { $set: updates });
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.username = dbUser.username;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
});
