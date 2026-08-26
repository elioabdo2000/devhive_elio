"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { communityCreateSchema } from "@/lib/validations/community";
import { useToast } from "@/components/Toast";
import ImageUpload from "@/components/ImageUpload";

const CATEGORIES = ["Frontend", "Backend", "DevOps", "Career", "Mobile", "Data", "Design"];

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 transition focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/40";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CommunityForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    category: CATEGORIES[0],
    image: "",
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === "name" && !slugTouched) {
      setForm((f) => ({ ...f, name: value, slug: slugify(value) }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError("");

    const payload = { ...form, image: form.image || undefined };

    const validation = communityCreateSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) {
        if (json.errors?.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(json.errors.fieldErrors)) {
            if (Array.isArray(msgs) && msgs.length) fieldErrors[key] = msgs[0] as string;
          }
          setErrors(fieldErrors);
        }
        setFormError(json.message ?? "Something went wrong");
        showToast("error", json.message ?? "Something went wrong");
        setSubmitting(false);
        return;
      }

      showToast("success", "Community created");
      router.push(`/communities/${json.data.slug}`);
      router.refresh();
    } catch {
      setFormError("Network error — please try again");
      showToast("error", "Network error — please try again");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5 px-4 py-10">
      <h1 className="font-display text-2xl font-semibold">Start a new community</h1>
      <p className="text-sm text-ink-soft">
        You&apos;ll automatically become its first member and can invite others once it&apos;s live.
      </p>

      {formError && (
        <div role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {formError}
        </div>
      )}

      <div>
        <label htmlFor="community-name" className="mb-1 block text-sm font-medium">
          Name
        </label>
        <input
          id="community-name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "community-name-error" : undefined}
          className={inputClass}
        />
        {errors.name && (
          <p id="community-name-error" className="mt-1 text-xs text-red-600">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="community-slug" className="mb-1 block text-sm font-medium">
          Slug
        </label>
        <input
          id="community-slug"
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            update("slug", e.target.value);
          }}
          placeholder="react-builders"
          aria-invalid={!!errors.slug}
          aria-describedby={errors.slug ? "community-slug-error" : undefined}
          className={`${inputClass} font-mono`}
        />
        {errors.slug && (
          <p id="community-slug-error" className="mt-1 text-xs text-red-600">
            {errors.slug}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="community-description" className="mb-1 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="community-description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          placeholder="What's this community for, and who should join?"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "community-description-error" : undefined}
          className={inputClass}
        />
        {errors.description && (
          <p id="community-description-error" className="mt-1 text-xs text-red-600">
            {errors.description}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="community-category" className="mb-1 block text-sm font-medium">
          Category
        </label>
        <select
          id="community-category"
          value={form.category}
          onChange={(e) => update("category", e.target.value)}
          className={`${inputClass} bg-white`}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
      </div>

      <div>
        <ImageUpload
          label="Cover image (optional)"
          value={form.image}
          onChange={(url) => update("image", url)}
          folder="community-covers"
          shape="wide"
          error={errors.image}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-ink px-4 py-2 font-semibold text-white transition hover:bg-teal disabled:opacity-50"
      >
        {submitting ? "Creating..." : "Create community"}
      </button>
    </form>
  );
}
