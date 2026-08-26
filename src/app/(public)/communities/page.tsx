import Link from "next/link";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Community, { type LeanCommunity } from "@/models/Community";
import Membership from "@/models/Membership";
import CommunityCard from "@/components/CommunityCard";
import Pagination from "@/components/Pagination";
import CommunityFilters from "./CommunityFilters";
import { auth } from "@/auth";

const PAGE_SIZE = 9;

interface CommunitiesPageProps {
  searchParams: Promise<{ search?: string; category?: string; page?: string }>;
}

interface CommunityListItem {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  memberCount: number;
  isJoined: boolean;
}

async function getCommunities(
  search: string | undefined,
  category: string | undefined,
  page: number,
  userId: string | undefined
): Promise<{ communities: CommunityListItem[]; total: number }> {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }
  if (category) filter.category = category;

  const skip = (page - 1) * PAGE_SIZE;

  const [communities, total, joinedIds] = await Promise.all([
    Community.find(filter)
      .select("name slug description category members")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean<Pick<LeanCommunity, "_id" | "name" | "slug" | "description" | "category" | "members">[]>(),
    Community.countDocuments(filter),
    userId
      ? (Membership.find({ user: userId }).select("community").lean() as unknown as Promise<
          { community: Types.ObjectId }[]
        >)
      : Promise.resolve([] as { community: Types.ObjectId }[]),
  ]);

  const joinedSet = new Set(joinedIds.map((m) => m.community.toString()));

  return {
    communities: communities.map((c) => ({
      ...(JSON.parse(JSON.stringify(c)) as Omit<CommunityListItem, "memberCount" | "isJoined">),
      memberCount: c.members?.length ?? 0,
      isJoined: joinedSet.has(c._id.toString()),
    })),
    total,
  };
}

export default async function CommunitiesPage({ searchParams }: CommunitiesPageProps) {
  const { search, category, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const session = await auth();
  const { communities, total } = await getCommunities(search, category, page, session?.user?.id);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display mb-2 text-3xl font-semibold">Communities</h1>
          <p className="text-ink-soft">Find your people. Join a community and start collaborating.</p>
        </div>
        {session?.user && (
          <Link
            href="/communities/new"
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal"
          >
            + New community
          </Link>
        )}
      </div>

      <CommunityFilters initialSearch={search} initialCategory={category} />

      {communities.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-lg font-medium">No communities found</p>
          <p className="text-sm text-ink-soft">Try a different search or category, or start your own.</p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((c) => (
              <CommunityCard key={c.slug} community={c} />
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/communities"
            searchParams={{ search, category }}
          />
        </>
      )}
    </div>
  );
}
