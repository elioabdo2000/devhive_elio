import Link from "next/link";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import Community from "@/models/Community";
import User from "@/models/User";
import Membership from "@/models/Membership";
import BlogCard from "@/components/BlogCard";
import CommunityCard from "@/components/CommunityCard";

// Explicitly dynamic: stats, recent blogs, and recent joins should reflect
// the current DB state on every request (see README rendering table). This
// used to happen implicitly because the root layout read the session
// cookie; now that Navbar resolves the session client-side, Home needs its
// own opt-in to stay fresh rather than being statically generated once.
export const dynamic = "force-dynamic";

interface HomeBlog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  publishedAt?: string;
  author: { name: string; username: string };
}

interface HomeCommunity {
  slug: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
}

interface RecentJoin {
  _id: string;
  user?: { username: string };
  community?: { slug: string };
}

async function getHomeData() {
  await connectDB();
  const [recentBlogs, featuredCommunities, blogCount, communityCount, userCount, recentJoins] =
    await Promise.all([
      Blog.find({ status: "published" })
        .populate("author", "name username")
        .sort({ publishedAt: -1 })
        .limit(3)
        .lean(),
      Community.find({}).select("name slug description category members").limit(3).lean(),
      Blog.countDocuments({ status: "published" }),
      Community.countDocuments({}),
      User.countDocuments({}),
      Membership.find({})
        .populate("user", "username")
        .populate("community", "slug")
        .sort({ joinedAt: -1 })
        .limit(2)
        .lean(),
    ]);

  return {
    recentBlogs: JSON.parse(JSON.stringify(recentBlogs)) as HomeBlog[],
    featuredCommunities: featuredCommunities.map((c) => ({
      ...(JSON.parse(JSON.stringify(c)) as Omit<HomeCommunity, "memberCount">),
      memberCount: c.members?.length ?? 0,
    })) as HomeCommunity[],
    stats: { blogCount, communityCount, userCount },
    recentJoins: JSON.parse(JSON.stringify(recentJoins)) as RecentJoin[],
  };
}

export default async function HomePage() {
  const { recentBlogs, featuredCommunities, stats, recentJoins } = await getHomeData();
  const latestBlog = recentBlogs[0];

  return (
    <div>
      <section className="border-b border-border bg-white px-4 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="font-mono mb-6 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" />
              {stats.userCount} developers already here
            </div>
            <h1 className="font-display mb-5 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
              Where developers write, learn, and ship together
            </h1>
            <p className="mb-8 max-w-md text-base leading-relaxed text-ink-soft">
              Publish technical write-ups, join focused communities, and keep a
              public profile that tracks what you have actually built and shipped.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/blogs"
                className="rounded-md bg-ink px-6 py-3 text-sm font-medium text-paper transition hover:bg-teal"
              >
                Explore blogs
              </Link>
              <Link
                href="/communities"
                className="rounded-md border border-border px-6 py-3 text-sm font-medium text-ink transition hover:border-teal hover:text-teal"
              >
                Browse communities
              </Link>
            </div>
          </div>

          {/* Signature element: a terminal window showing genuinely live
              platform activity, not decorative fake data. */}
          <div className="term-window font-mono text-xs">
            <div className="term-titlebar">
              <span className="term-dot bg-[#ff5f56]/80" />
              <span className="term-dot bg-[#ffbd2e]/80" />
              <span className="term-dot bg-[#27c93f]/80" />
              <span className="ml-2 text-[11px] text-white/50">devhive — activity</span>
            </div>
            <div className="p-5 text-ink-soft">
              <p className="text-ink-faint"># recent activity</p>

              {latestBlog ? (
                <p className="diff-plus mt-2 text-ink-soft">
                  <span className="text-teal">@{latestBlog.author?.username ?? "someone"}</span> published{" "}
                  <span className="text-amber">&quot;{latestBlog.title}&quot;</span>
                </p>
              ) : (
                <p className="mt-2 text-ink-faint">No blogs published yet — be the first.</p>
              )}

              {recentJoins.map((m) => (
                <p key={m._id} className="diff-plus mt-1 text-ink-soft">
                  <span className="text-teal">@{m.user?.username ?? "someone"}</span> joined{" "}
                  <span className="text-amber">{m.community?.slug ?? "a community"}</span>
                </p>
              ))}

              <p className="mt-3 grid grid-cols-3 gap-3 border-t border-border pt-3 text-[11px] text-ink-faint">
                <span>{stats.userCount} devs</span>
                <span>{stats.blogCount} posts</span>
                <span>{stats.communityCount} communities</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="font-mono mb-1 text-xs text-teal">/communities</p>
            <h2 className="font-display text-2xl font-semibold text-ink">Featured communities</h2>
          </div>
          <Link href="/communities" className="text-sm font-medium text-teal hover:underline">
            View all →
          </Link>
        </div>
        {featuredCommunities.length === 0 ? (
          <p className="text-sm text-ink-soft">No communities yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCommunities.map((c) => (
              <CommunityCard key={c.slug} community={c} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="font-mono mb-1 text-xs text-teal">/blogs</p>
            <h2 className="font-display text-2xl font-semibold text-ink">Recent blogs</h2>
          </div>
          <Link href="/blogs" className="text-sm font-medium text-teal hover:underline">
            View all →
          </Link>
        </div>
        {recentBlogs.length === 0 ? (
          <p className="text-sm text-ink-soft">No blogs published yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recentBlogs.map((b) => (
              <BlogCard key={b.slug} blog={b} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
