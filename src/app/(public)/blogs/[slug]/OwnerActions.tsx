"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import DeleteBlogButton from "./DeleteBlogButton";

export default function OwnerActions({
  authorId,
  slug,
  blogId,
}: {
  authorId: string;
  slug: string;
  blogId: string;
}) {
  const { data: session, status } = useSession();

  if (status !== "authenticated" || session.user.id !== authorId) return null;

  return (
    <div className="mt-8 flex gap-3 border-t border-border pt-6">
      <Link
        href={`/blogs/${slug}/edit`}
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-paper"
      >
        Edit
      </Link>
      <DeleteBlogButton blogId={blogId} />
    </div>
  );
}
