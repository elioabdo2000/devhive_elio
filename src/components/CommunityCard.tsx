import Link from "next/link";

interface CommunityCardProps {
  community: {
    slug: string;
    name: string;
    description: string;
    category: string;
    memberCount: number;
    isJoined?: boolean;
  };
}

export default function CommunityCard({ community }: CommunityCardProps) {
  return (
    <Link
      href={`/communities/${community.slug}`}
      className="gutter-card gutter-card--amber block rounded-r-lg bg-paper-raised p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="font-mono mb-3 flex items-center gap-2 text-xs text-ink-soft">
        <span className="rounded bg-amber-soft px-2 py-0.5 text-amber">{community.category}</span>
        <span>·</span>
        <span className="diff-plus">{community.memberCount} members</span>
        {community.isJoined && (
          <>
            <span>·</span>
            <span className="rounded bg-teal-soft px-2 py-0.5 font-medium text-teal">Joined</span>
          </>
        )}
      </div>
      <h3 className="font-display mb-2 text-lg font-semibold leading-snug text-ink">{community.name}</h3>
      <p className="line-clamp-2 text-sm text-ink-soft">{community.description}</p>
    </Link>
  );
}
