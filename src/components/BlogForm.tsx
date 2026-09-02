"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { blogCreateSchema, blogUpdateSchema } from "@/lib/validations/blog";
import { useToast } from "@/components/Toast";
import ImageUpload from "@/components/ImageUpload";

interface BlogFormProps {
  mode: "create" | "edit";
  blogId?: string;
  initialData?: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage?: string;
    tags: string[];
    status: "draft" | "published";
  };
}

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 transition focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/40";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function BlogForm({ mode, blogId, initialData }: BlogFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    slug: initialData?.slug ?? "",
    excerpt: initialData?.excerpt ?? "",
    content: initialData?.content ?? "",
    coverImage: initialData?.coverImage ?? "",
    tags: initialData?.tags.join(", ") ?? "",
    status: initialData?.status ?? "draft",
  });
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function update(field: string, value: string) {
    if (field === "title" && !slugTouched) {
      setForm((f) => ({ ...f, title: value, slug: slugify(value) }));
      return;
    }
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError("");

    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      coverImage: form.coverImage || undefined,
    };

    // Client-side Zod pass: catches obvious problems (short title, bad slug
    // format, missing tags...) before a round trip. The same schema runs
    // again server-side in the Route Handler — the client check is for
    // usability, not security, so a client bypass changes nothing.
    const schema = mode === "create" ? blogCreateSchema : blogUpdateSchema;
    const validation = schema.safeParse(payload);
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
      const url = mode === "create" ? "/api/blogs" : `/api/blogs/${blogId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
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

      showToast("success", mode === "create" ? "Blog published" : "Blog updated");
      router.push(`/blogs/${json.data.slug}`);
      router.refresh();
    } catch {
      setFormError("Network error — please try again");
      showToast("error", "Network error — please try again");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5 px-4 py-10">
      <h1 className="font-display text-2xl font-semibold">{mode === "create" ? "Write a new blog" : "Edit blog"}</h1>

      {formError && (
        <div role="alert" className="rounded-lg bg-danger-soft px-4 py-2 text-sm text-danger">
          {formError}
        </div>
      )}

      <div>
        <label htmlFor="blog-title" className="mb-1 block text-sm font-medium">
          Title
        </label>
        <input
          id="blog-title"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "blog-title-error" : undefined}
          className={inputClass}
        />
        {errors.title && (
          <p id="blog-title-error" className="mt-1 text-xs text-danger">
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="blog-slug" className="mb-1 block text-sm font-medium">
          Slug
        </label>
        <input
          id="blog-slug"
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            update("slug", e.target.value);
          }}
          placeholder="my-blog-post"
          aria-invalid={!!errors.slug}
          aria-describedby={errors.slug ? "blog-slug-error" : undefined}
          className={inputClass}
        />
        {errors.slug && (
          <p id="blog-slug-error" className="mt-1 text-xs text-danger">
            {errors.slug}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="blog-excerpt" className="mb-1 block text-sm font-medium">
          Excerpt
        </label>
        <textarea
          id="blog-excerpt"
          value={form.excerpt}
          onChange={(e) => update("excerpt", e.target.value)}
          rows={2}
          aria-invalid={!!errors.excerpt}
          aria-describedby={errors.excerpt ? "blog-excerpt-error" : undefined}
          className={inputClass}
        />
        {errors.excerpt && (
          <p id="blog-excerpt-error" className="mt-1 text-xs text-danger">
            {errors.excerpt}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="blog-content" className="mb-1 block text-sm font-medium">
          Content
        </label>
        <textarea
          id="blog-content"
          value={form.content}
          onChange={(e) => update("content", e.target.value)}
          rows={10}
          aria-invalid={!!errors.content}
          aria-describedby={errors.content ? "blog-content-error" : undefined}
          className={inputClass}
        />
        {errors.content && (
          <p id="blog-content-error" className="mt-1 text-xs text-danger">
            {errors.content}
          </p>
        )}
      </div>

      <div>
        <ImageUpload
          label="Cover image (optional)"
          value={form.coverImage}
          onChange={(url) => update("coverImage", url)}
          folder="blog-covers"
          shape="wide"
          error={errors.coverImage}
        />
      </div>

      <div>
        <label htmlFor="blog-tags" className="mb-1 block text-sm font-medium">
          Tags (comma separated)
        </label>
        <input
          id="blog-tags"
          value={form.tags}
          onChange={(e) => update("tags", e.target.value)}
          placeholder="nextjs, react, mongodb"
          aria-invalid={!!errors.tags}
          aria-describedby={errors.tags ? "blog-tags-error" : undefined}
          className={inputClass}
        />
        {errors.tags && (
          <p id="blog-tags-error" className="mt-1 text-xs text-danger">
            {errors.tags}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="blog-status" className="mb-1 block text-sm font-medium">
          Status
        </label>
        <select id="blog-status" value={form.status} onChange={(e) => update("status", e.target.value)} className={inputClass}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-ink px-4 py-2 font-semibold text-white transition hover:bg-teal disabled:opacity-50"
      >
        {submitting ? "Saving..." : mode === "create" ? "Publish" : "Save changes"}
      </button>
    </form>
  );
}
