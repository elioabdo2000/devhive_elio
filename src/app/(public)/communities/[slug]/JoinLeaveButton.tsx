"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function JoinLeaveButton({
  communityId,
  slug,
  isMember,
  isSignedIn,
}: {
  communityId: string;
  slug: string;
  isMember: boolean;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (!isSignedIn) {
      router.push(`/login?callbackUrl=/communities/${slug}`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/communities/${communityId}/membership`, {
        method: isMember ? "DELETE" : "POST",
      });
      const json = await res.json();
      if (res.status === 401) {
        router.push(`/login?callbackUrl=/communities/${slug}`);
        return;
      }
      if (!json.success) throw new Error(json.message);
      showToast("success", isMember ? "Left community" : "Joined community");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`rounded-lg px-5 py-2 text-sm font-semibold transition disabled:opacity-50 ${
          isMember
            ? "border border-border text-ink hover:bg-paper"
            : "bg-ink text-white hover:bg-teal"
        }`}
      >
        {loading ? "..." : isMember ? "Leave community" : "Join community"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
