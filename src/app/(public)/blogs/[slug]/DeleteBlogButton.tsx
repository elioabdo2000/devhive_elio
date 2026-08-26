"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function DeleteBlogButton({ blogId }: { blogId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!confirm("Delete this blog? This cannot be undone.")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/blogs/${blogId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      showToast("success", "Blog deleted");
      router.push("/blogs");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      setError(message);
      showToast("error", message);
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg border border-danger/30 px-4 py-2 text-sm font-medium text-danger transition hover:bg-danger-soft disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
