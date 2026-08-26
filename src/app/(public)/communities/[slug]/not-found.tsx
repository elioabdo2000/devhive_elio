import Link from "next/link";

export default function CommunityNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display mb-2 text-2xl font-semibold">Community not found</h1>
      <p className="mb-6 text-ink-soft">This community doesn&apos;t exist.</p>
      <Link href="/communities" className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">
        Back to communities
      </Link>
    </div>
  );
}
