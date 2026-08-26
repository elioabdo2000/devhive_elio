"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function BlogFilters({
  initialSearch,
  initialTag,
}: {
  initialSearch?: string;
  initialTag?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch ?? "");

  function applyFilters(nextSearch: string, nextTag?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSearch) params.set("search", nextSearch);
    else params.delete("search");
    if (nextTag) params.set("tag", nextTag);
    else params.delete("tag");
    router.push(`/blogs?${params.toString()}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        applyFilters(search, initialTag);
      }}
      className="flex gap-3"
    >
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search blogs..."
        className="w-full max-w-sm rounded-lg border border-border px-3 py-2 text-sm focus:border-teal focus:outline-none"
      />
      <button
        type="submit"
        className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-teal"
      >
        Search
      </button>
      {initialTag && (
        <button
          type="button"
          onClick={() => applyFilters(search, undefined)}
          className="rounded-lg border border-border px-3 py-2 text-sm text-ink-soft"
        >
          Clear tag: {initialTag} ×
        </button>
      )}
    </form>
  );
}
