"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { signupSchema } from "@/lib/validations/auth";
import { oauthPreAuthSchema } from "@/lib/validations/auth";
import { useToast } from "@/components/Toast";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Couldn't start the sign-in request. Please try again.",
  OAuthCallback: "Something went wrong completing sign-in with the provider. Please try again.",
  OAuthCreateAccount: "We couldn't create an account from that provider. Please try again.",
  OAuthAccountNotLinked: "That email is already registered a different way. Log in with your email and password instead.",
  AccessDenied: "Sign-in was cancelled or the account is missing a public email address.",
  Configuration: "Sign-in is temporarily unavailable. Please try again shortly.",
  Default: "Sign-in failed. Please try again.",
};

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="#181717">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.42.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .31.21.67.8.56C20.71 21.38 24 17.08 24 12c0-6.35-5.15-11.5-12-11.5z" />
    </svg>
  );
}

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm transition focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/40";

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageFallback />}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageFallback() {
  return (
    <div className="w-full max-w-[400px] rounded-2xl border border-border bg-white p-8 shadow-lg">
      <div className="h-80 animate-pulse rounded-lg bg-teal-soft/40" />
    </div>
  );
}

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [formError, setFormError] = useState(() => {
    const code = searchParams.get("error");
    return code ? OAUTH_ERROR_MESSAGES[code] ?? OAUTH_ERROR_MESSAGES.Default : "";
  });

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const result = signupSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }

  // Gates the OAuth buttons: same email + terms check as /login, run before
  // initiating the redirect. Password is irrelevant for OAuth.
  function validateOAuthGate() {
    const result = oauthPreAuthSchema.safeParse({ email: form.email, termsAccepted: form.termsAccepted });
    if (!result.success) {
      setErrors((prev) => {
        const next = { ...prev };
        for (const issue of result.error.issues) {
          next[issue.path[0] as string] = issue.message;
        }
        return next;
      });
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

      // Account created — sign them straight in with the same credentials.
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setFormError("Account created, but automatic login failed — please log in.");
        showToast("error", "Account created, but automatic login failed — please log in.");
        setSubmitting(false);
        router.push("/login");
        return;
      }

      showToast("success", "Account created — welcome to DevHive!");
      router.push(callbackUrl === "/" ? "/profile/edit" : callbackUrl);
      router.refresh();
    } catch {
      setFormError("Network error — please try again");
      showToast("error", "Network error — please try again");
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!validateOAuthGate()) return;
    setFormError("");
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl, redirect: true });
    } catch {
      setFormError("Sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  async function handleGithubSignIn() {
    if (!validateOAuthGate()) return;
    setFormError("");
    setGithubLoading(true);
    try {
      await signIn("github", { callbackUrl, redirect: true });
    } catch {
      setFormError("Sign-in failed. Please try again.");
      setGithubLoading(false);
    }
  }

  const anyLoading = submitting || googleLoading || githubLoading;

  return (
    <div className="w-full max-w-[400px] rounded-2xl border border-border bg-white p-8 shadow-lg">
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-ink">
          <span className="h-2.5 w-2.5 rounded-full bg-teal" />
        </span>
        <h1 className="font-display text-xl font-semibold text-ink">Join DevHive</h1>
        <p className="mt-1 text-sm text-ink-soft">Create an account to start writing.</p>
      </div>

      {formError && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="signup-name" className="mb-1 block text-sm font-medium text-ink">
            Name
          </label>
          <input
            id="signup-name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Ada Lovelace"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "signup-name-error" : undefined}
            className={inputClass}
          />
          {errors.name && (
            <p id="signup-name-error" className="mt-1 text-xs text-red-600">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="signup-email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            type="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "signup-email-error" : undefined}
            className={inputClass}
          />
          {errors.email && (
            <p id="signup-email-error" className="mt-1 text-xs text-red-600">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="signup-password" className="mb-1 block text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="signup-password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            type="password"
            placeholder="At least 8 characters"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "signup-password-error" : undefined}
            className={inputClass}
          />
          {errors.password && (
            <p id="signup-password-error" className="mt-1 text-xs text-red-600">
              {errors.password}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="signup-confirm-password" className="mb-1 block text-sm font-medium text-ink">
            Confirm password
          </label>
          <input
            id="signup-confirm-password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            type="password"
            placeholder="Re-enter your password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "signup-confirm-password-error" : undefined}
            className={inputClass}
          />
          {errors.confirmPassword && (
            <p id="signup-confirm-password-error" className="mt-1 text-xs text-red-600">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <label htmlFor="signup-terms" className="flex items-start gap-2 text-sm text-ink-soft">
          <input
            id="signup-terms"
            type="checkbox"
            checked={form.termsAccepted}
            onChange={(e) => update("termsAccepted", e.target.checked)}
            aria-invalid={!!errors.termsAccepted}
            aria-describedby={errors.termsAccepted ? "signup-terms-error" : undefined}
            className="mt-0.5 accent-teal"
          />
          <span>I agree to the Terms of Service and Privacy Policy</span>
        </label>
        {errors.termsAccepted && (
          <p id="signup-terms-error" className="text-xs text-red-600">
            {errors.termsAccepted}
          </p>
        )}

        <button
          type="submit"
          disabled={anyLoading}
          className="w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-paper transition hover:bg-teal disabled:opacity-50"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-ink-soft">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-3">
        <button
          onClick={handleGoogleSignIn}
          disabled={anyLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-ink transition hover:border-teal disabled:opacity-50"
        >
          <GoogleMark />
          {googleLoading ? "Redirecting..." : "Continue with Google"}
        </button>

        <button
          onClick={handleGithubSignIn}
          disabled={anyLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-ink transition hover:border-teal disabled:opacity-50"
        >
          <GitHubMark />
          {githubLoading ? "Redirecting..." : "Continue with GitHub"}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-teal hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
