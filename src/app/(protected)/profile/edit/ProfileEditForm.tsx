"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { profileUpdateSchema } from "@/lib/validations/profile";
import { useToast } from "@/components/Toast";
import ImageUpload from "@/components/ImageUpload";

interface ProfileEditFormProps {
  initialData: {
    username: string;
    image: string;
    headline: string;
    bio: string;
    skills: string[];
    githubUrl: string;
    linkedinUrl: string;
  };
  isNewProfile?: boolean;
}

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 transition focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/40";

export default function ProfileEditForm({ initialData, isNewProfile }: ProfileEditFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    ...initialData,
    skills: initialData.skills.join(", "),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fieldsFilled = [form.headline, form.bio, form.skills, form.githubUrl].filter(Boolean).length;
  const progress = Math.round((fieldsFilled / 4) * 100);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError("");

    const payload = {
      ...form,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
    };

    const validation = profileUpdateSchema.safeParse(payload);
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
      const res = await fetch("/api/profile", {
        method: "PATCH",
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

      showToast("success", "Profile updated");
      router.push(`/profile/${json.data.username}`);
      router.refresh();
    } catch {
      setFormError("Network error — please try again");
      showToast("error", "Network error — please try again");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="rounded-2xl border border-border bg-paper-raised p-8 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="font-mono mb-1 text-xs text-teal">{isNewProfile ? "one last step" : "/profile/edit"}</p>
            <h1 className="font-display text-xl font-semibold text-ink">
              {isNewProfile ? "Complete your profile" : "Edit profile"}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {isNewProfile
                ? "Tell the community a bit about yourself before you dive in."
                : "Update how other developers see you."}
            </p>
          </div>
          {isNewProfile && (
            <div className="font-mono flex flex-col items-end text-xs text-ink-soft">
              <span className="text-teal">{progress}%</span>
              <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-teal-soft">
                <div className="h-full bg-teal transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {formError && (
          <div role="alert" className="mb-4 rounded-lg bg-danger-soft px-4 py-2 text-sm text-danger">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <ImageUpload
            label="Profile picture"
            value={form.image}
            onChange={(url) => update("image", url)}
            folder="avatars"
            shape="square"
            error={errors.image}
          />

          <div>
            <label htmlFor="profile-username" className="mb-1 block text-sm font-medium text-ink">
              Username
            </label>
            <div className="flex items-center rounded-lg border border-border transition focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/40">
              <span className="font-mono pl-3 text-sm text-ink-soft">@</span>
              <input
                id="profile-username"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? "profile-username-error" : undefined}
                className="w-full rounded-lg px-2 py-2 focus:outline-none"
              />
            </div>
            {errors.username && (
              <p id="profile-username-error" className="mt-1 text-xs text-danger">
                {errors.username}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="profile-headline" className="mb-1 block text-sm font-medium text-ink">
              Headline
            </label>
            <input
              id="profile-headline"
              value={form.headline}
              onChange={(e) => update("headline", e.target.value)}
              placeholder="Full-stack developer"
              aria-invalid={!!errors.headline}
              aria-describedby={errors.headline ? "profile-headline-error" : undefined}
              className={inputClass}
            />
            {errors.headline && (
              <p id="profile-headline-error" className="mt-1 text-xs text-danger">
                {errors.headline}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="profile-bio" className="mb-1 block text-sm font-medium text-ink">
              Bio
            </label>
            <textarea
              id="profile-bio"
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              rows={4}
              placeholder="What are you building? What do you care about?"
              aria-invalid={!!errors.bio}
              aria-describedby={errors.bio ? "profile-bio-error" : undefined}
              className={inputClass}
            />
            {errors.bio && (
              <p id="profile-bio-error" className="mt-1 text-xs text-danger">
                {errors.bio}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="profile-skills" className="mb-1 block text-sm font-medium text-ink">
              Skills
            </label>
            <input
              id="profile-skills"
              value={form.skills}
              onChange={(e) => update("skills", e.target.value)}
              placeholder="Next.js, TypeScript, MongoDB"
              aria-describedby="profile-skills-hint"
              className={inputClass}
            />
            <p id="profile-skills-hint" className="font-mono mt-1 text-xs text-ink-soft">
              comma separated
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="profile-github" className="mb-1 block text-sm font-medium text-ink">
                GitHub URL
              </label>
              <input
                id="profile-github"
                value={form.githubUrl}
                onChange={(e) => update("githubUrl", e.target.value)}
                placeholder="https://github.com/you"
                aria-invalid={!!errors.githubUrl}
                aria-describedby={errors.githubUrl ? "profile-github-error" : undefined}
                className={inputClass}
              />
              {errors.githubUrl && (
                <p id="profile-github-error" className="mt-1 text-xs text-danger">
                  {errors.githubUrl}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="profile-linkedin" className="mb-1 block text-sm font-medium text-ink">
                LinkedIn URL
              </label>
              <input
                id="profile-linkedin"
                value={form.linkedinUrl}
                onChange={(e) => update("linkedinUrl", e.target.value)}
                placeholder="https://linkedin.com/in/you"
                aria-invalid={!!errors.linkedinUrl}
                aria-describedby={errors.linkedinUrl ? "profile-linkedin-error" : undefined}
                className={inputClass}
              />
              {errors.linkedinUrl && (
                <p id="profile-linkedin-error" className="mt-1 text-xs text-danger">
                  {errors.linkedinUrl}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-paper transition hover:bg-teal disabled:opacity-50"
          >
            {submitting ? "Saving..." : isNewProfile ? "Finish setup" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
