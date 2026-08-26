/**
 * Populates MongoDB Atlas with sample data for local dev / grading.
 * Run with: npm run seed
 *
 * All seeded users share one password (see SEED_PASSWORD below) so graders
 * can log in via the Credentials provider without setting up Google OAuth.
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User";
import Blog from "../src/models/Blog";
import Community from "../src/models/Community";
import Membership from "../src/models/Membership";

const SEED_PASSWORD = "DevHive123!";

const USERS = [
  {
    name: "Amara Chen",
    username: "amarachen",
    email: "amara@devhive.dev",
    headline: "Frontend engineer, React & design systems",
    bio: "I build accessible component libraries and write about the boring parts of frontend that actually matter.",
    skills: ["React", "TypeScript", "Design Systems", "Accessibility"],
    githubUrl: "https://github.com/amarachen",
    linkedinUrl: "https://linkedin.com/in/amarachen",
  },
  {
    name: "Diego Ramirez",
    username: "diegoramirez",
    email: "diego@devhive.dev",
    headline: "Backend engineer, distributed systems",
    bio: "Ex-infra team lead. Currently deep in event-driven architectures and Postgres internals.",
    skills: ["Node.js", "PostgreSQL", "Kafka", "System Design"],
    githubUrl: "https://github.com/diegoramirez",
    linkedinUrl: "https://linkedin.com/in/diegoramirez",
  },
  {
    name: "Priya Nair",
    username: "priyanair",
    email: "priya@devhive.dev",
    headline: "Full-stack developer & DevRel",
    bio: "Building in public, mostly with Next.js and MongoDB. Occasional conference speaker.",
    skills: ["Next.js", "MongoDB", "DevRel", "Technical Writing"],
    githubUrl: "https://github.com/priyanair",
    linkedinUrl: "https://linkedin.com/in/priyanair",
  },
];

const COMMUNITIES = [
  {
    name: "React Builders",
    slug: "react-builders",
    description: "For people shipping real products with React — hooks, RSC, performance, and the occasional rant about state management.",
    category: "Frontend",
  },
  {
    name: "Backend Systems",
    slug: "backend-systems",
    description: "APIs, databases, queues, and everything that keeps a product running when nobody's looking at the UI.",
    category: "Backend",
  },
  {
    name: "DevOps & Deploys",
    slug: "devops-deploys",
    description: "CI/CD, containers, infra-as-code, and war stories from production incidents.",
    category: "DevOps",
  },
  {
    name: "Career & Growth",
    slug: "career-growth",
    description: "Interviews, promotions, portfolio reviews, and honest talk about the non-technical side of being a developer.",
    category: "Career",
  },
];

const BLOG_CONTENT = (topic: string) => `
## Why this matters

${topic} is one of those areas that looks simple until you have to run it in production. This post walks through the approach I've settled on after a few rounds of getting it wrong.

## The approach

Start small. Get the simplest version working end to end before optimizing anything. Most of the pain in ${topic.toLowerCase()} comes from solving problems you don't have yet.

\`\`\`
// pseudocode, not a real snippet
function handle(input) {
  validate(input);
  return process(input);
}
\`\`\`

## What I'd do differently

Hindsight is generous. If I were starting over, I'd spend less time on abstraction and more time on the actual failure modes — the ones that show up at 2am, not the ones in the design doc.

## Takeaways

- Ship the boring version first
- Measure before you optimize
- Write down the decision you made and why, future-you will thank you
`.trim();

const BLOGS = [
  { title: "Rethinking React Server Components in 2026", tags: ["react", "frontend"], communityIdx: 0, authorIdx: 0, status: "published" },
  { title: "A Practical Guide to Optimistic UI", tags: ["react", "ux"], communityIdx: 0, authorIdx: 0, status: "published" },
  { title: "Designing Idempotent API Endpoints", tags: ["backend", "api"], communityIdx: 1, authorIdx: 1, status: "published" },
  { title: "Postgres Indexing Mistakes I Kept Making", tags: ["backend", "database"], communityIdx: 1, authorIdx: 1, status: "published" },
  { title: "Zero-Downtime Deploys with Vercel and MongoDB Atlas", tags: ["devops", "deployment"], communityIdx: 2, authorIdx: 2, status: "published" },
  { title: "A Minimal CI Pipeline That Actually Catches Bugs", tags: ["devops", "ci"], communityIdx: 2, authorIdx: 1, status: "published" },
  { title: "How I Prepared for Staff Engineer Interviews", tags: ["career"], communityIdx: 3, authorIdx: 0, status: "published" },
  { title: "Writing a Portfolio That Doesn't Read Like a Resume", tags: ["career"], communityIdx: 3, authorIdx: 2, status: "published" },
  { title: "Draft: Notes on Auth.js v5 Migration", tags: ["backend", "auth"], communityIdx: 1, authorIdx: 2, status: "draft" },
  { title: "Draft: Component Library Versioning Strategy", tags: ["frontend"], communityIdx: 0, authorIdx: 0, status: "draft" },
];

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set — check your .env.local");

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  await Promise.all([
    User.deleteMany({}),
    Blog.deleteMany({}),
    Community.deleteMany({}),
    Membership.deleteMany({}),
  ]);
  console.log("Cleared existing collections");

  const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);
  const users = await User.create(
    USERS.map((u) => ({ ...u, password: hashedPassword, providerIds: {} }))
  );
  console.log(`Created ${users.length} users`);

  const communities = await Community.create(
    COMMUNITIES.map((c, i) => ({ ...c, createdBy: users[i % users.length]._id, members: [] }))
  );
  console.log(`Created ${communities.length} communities`);

  const blogs = await Blog.create(
    BLOGS.map((b) => ({
      title: b.title,
      slug: slugify(b.title),
      excerpt: `A practical look at ${b.title.toLowerCase()}, with real trade-offs and a few things that only became obvious in production.`,
      content: BLOG_CONTENT(b.title),
      tags: b.tags,
      author: users[b.authorIdx]._id,
      status: b.status,
      publishedAt: b.status === "published" ? new Date() : undefined,
    }))
  );
  console.log(`Created ${blogs.length} blogs (${BLOGS.filter((b) => b.status === "published").length} published, ${BLOGS.filter((b) => b.status === "draft").length} draft)`);

  // Every user joins at least two communities so join/leave and membership
  // dedup logic all have real data to exercise.
  const membershipPairs: { user: string; community: string }[] = [];
  users.forEach((user, ui) => {
    communities.forEach((community, ci) => {
      if ((ui + ci) % 2 === 0) {
        membershipPairs.push({ user: user._id.toString(), community: community._id.toString() });
      }
    });
  });

  await Membership.create(membershipPairs);
  for (const { user, community } of membershipPairs) {
    await Community.updateOne({ _id: community }, { $addToSet: { members: user } });
  }
  console.log(`Created ${membershipPairs.length} memberships`);

  console.log("\nSeed complete. Log in with any seeded email + this password:");
  console.log(`  Password: ${SEED_PASSWORD}`);
  console.log("  Emails:", USERS.map((u) => u.email).join(", "));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
