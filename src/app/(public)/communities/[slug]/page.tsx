import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Community from "@/models/Community";
import { auth } from "@/auth";
import JoinLeaveButton from "./JoinLeaveButton";
import RelatedBlogs from "./RelatedBlogs";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface CommunityMember {
  _id: string;
  name: string;
  username: string;
  image?: string;
}

interface CommunityDetails {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  members: CommunityMember[];
}

async function getCommunity(slug: string): Promise<CommunityDetails | null> {
  await connectDB();
  const community = await Community.findOne({ slug }).populate("members", "name username image").lean();
  return community ? (JSON.parse(JSON.stringify(community)) as CommunityDetails) : null;
}

function RelatedBlogsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-paper" />
      ))}
    </div>
  );
}

export default async function CommunityDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const community = await getCommunity(slug);
  if (!community) notFound();

  const session = await auth();
  const isMember = session?.user
    ? community.members.some((m) => m._id === session.user.id)
    : false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <span className="mb-2 inline-block rounded-full bg-amber-soft px-2 py-0.5 text-xs font-medium text-amber">
        {community.category}
      </span>
      <h1 className="font-display mb-3 text-3xl font-semibold">{community.name}</h1>
      <p className="mb-6 text-ink-soft">{community.description}</p>

      <JoinLeaveButton
        communityId={community._id}
        slug={community.slug}
        isMember={isMember}
        isSignedIn={!!session?.user}
      />

      <div className="mt-8 border-t border-border pt-6">
        <h2 className="font-display mb-3 text-lg font-semibold">Members ({community.members.length})</h2>
        {community.members.length === 0 ? (
          <p className="text-sm text-ink-soft">No members yet — be the first to join.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {community.members.slice(0, 12).map((m) => (
              <Link
                key={m._id}
                href={`/profile/${m.username}`}
                className="rounded-full border border-border px-3 py-1 text-sm transition hover:border-teal hover:text-teal"
              >
                {m.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <h2 className="font-display mb-3 text-lg font-semibold">Related blogs</h2>
        <Suspense fallback={<RelatedBlogsSkeleton />}>
          <RelatedBlogs category={community.category} />
        </Suspense>
      </div>
    </div>
  );
}
