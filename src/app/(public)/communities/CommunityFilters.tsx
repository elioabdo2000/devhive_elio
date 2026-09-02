"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const CATEGORIES = ["Frontend", "Backend", "DevOps", "Career", "Mobile", "Data", "Design"];

export default function CommunityFilters({
  initialSearch,
  initialCategory,
}: {
  initialSearch?: string;
  initialCategory?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch ?? "");

  function applyFilters(nextSearch: string, nextCategory?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSearch) params.set("search", nextSearch);
    else params.delete("search");
    if (nextCategory) params.set("category", nextCategory);
    else params.delete("category");
    params.delete("page");
    router.push(`/communities?${params.toString()}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        applyFilters(search, initialCategory);
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search communities..."
        className="w-full max-w-sm rounded-lg border border-border px-3 py-2 text-sm focus:border-teal focus:outline-none"
      />
      <select
        value={initialCategory ?? ""}
        onChange={(e) => applyFilters(search, e.target.value || undefined)}
        className="rounded-lg border border-border bg-paper-raised px-3 py-2 text-sm focus:border-teal focus:outline-none"
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal"
      >
        Search
      </button>
      {initialCategory && (
        <button
          type="button"
          onClick={() => applyFilters(search, undefined)}
          className="rounded-lg border border-border px-3 py-2 text-sm text-ink-soft transition hover:border-teal hover:text-teal"
        >
          Clear: {initialCategory} ×
        </button>
      )}
    </form>
  );
}
