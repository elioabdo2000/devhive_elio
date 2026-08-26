import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import User, { type LeanUser } from "@/models/User";
import Blog from "@/models/Blog";
import Community from "@/models/Community";
import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";

interface PageProps {
  params: Promise<{ username: string }>;
}

interface ProfileUser {
  name: string;
  username: string;
  image?: string;
  headline?: string;
  bio?: string;
  skills: string[];
  githubUrl?: string;
  linkedinUrl?: string;
}

interface ProfileBlog {
  title: string;
  slug: string;
  excerpt: string;
}

interface ProfileCommunity {
  name: string;
  slug: string;
  category: string;
}

interface ProfileData {
  user: ProfileUser;
  blogs: ProfileBlog[];
  communities: ProfileCommunity[];
}

async function getProfileData(username: string): Promise<ProfileData | null> {
  await connectDB();
  const user = await User.findOne({ username })
    .select("name username image headline bio skills githubUrl linkedinUrl")
    .lean<Pick<LeanUser, "_id" | "name" | "username" | "image" | "headline" | "bio" | "skills" | "githubUrl" | "linkedinUrl">>();
  if (!user) return null;

  const [blogs, communities] = await Promise.all([
    Blog.find({ author: user._id, status: "published" }).select("title slug excerpt").limit(10).lean(),
    Community.find({ members: user._id }).select("name slug category").limit(10).lean(),
  ]);

  return JSON.parse(JSON.stringify({ user, blogs, communities })) as ProfileData;
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const data = await getProfileData(username);
  if (!data) notFound();

  const session = await auth();
  const isOwner = session?.user?.username === username;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          {data.user.image ? (
            <Image src={data.user.image} alt={data.user.name} width={72} height={72} className="rounded-full" />
          ) : (
            <div className="h-[72px] w-[72px] rounded-full bg-teal-soft" />
          )}
          <div>
            <h1 className="font-display text-2xl font-semibold">{data.user.name}</h1>
            <p className="text-ink-soft">@{data.user.username}</p>
            {data.user.headline && <p className="mt-1 text-ink">{data.user.headline}</p>}
          </div>
        </div>
        {isOwner && (
          <Link href="/profile/edit" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-paper">
            Edit Profile
          </Link>
        )}
      </div>

      {data.user.bio && <p className="mb-6 text-ink">{data.user.bio}</p>}

      {data.user.skills?.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {data.user.skills.map((skill: string) => (
            <span key={skill} className="rounded-full bg-teal-soft px-3 py-1 text-xs font-medium">
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mb-8 flex gap-4 text-sm">
        {data.user.githubUrl && (
          <a href={data.user.githubUrl} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">GitHub</a>
        )}
        {data.user.linkedinUrl && (
          <a href={data.user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">LinkedIn</a>
        )}
      </div>

      <div className="mb-8 border-t border-border pt-6">
        <h2 className="font-display mb-3 text-lg font-semibold">Communities</h2>
        {data.communities.length === 0 ? (
          <p className="text-sm text-ink-soft">Not part of any communities yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.communities.map((c) => (
              <Link key={c.slug} href={`/communities/${c.slug}`} className="rounded-full border border-border px-3 py-1 text-sm hover:bg-paper">
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="font-display mb-3 text-lg font-semibold">Blogs</h2>
        {data.blogs.length === 0 ? (
          <p className="text-sm text-ink-soft">No published blogs yet.</p>
        ) : (
          <div className="space-y-3">
            {data.blogs.map((b) => (
              <Link key={b.slug} href={`/blogs/${b.slug}`} className="block rounded-lg border border-border p-4 hover:shadow-sm">
                <p className="font-medium">{b.title}</p>
                <p className="line-clamp-2 text-sm text-ink-soft">{b.excerpt}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
