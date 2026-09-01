"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { apiErrorMessage, messageForCode } from "@/lib/api/error-messages";
import { googleSignInUrl } from "@/modules/auth/api";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

function errorMessageFor(error: unknown): string {
  return apiErrorMessage(error, {
    VALIDATION_FAILED: "Enter a valid email address and your password.",
  });
}

/**
 * Copy for a failed Google sign-in. The backend callback has no response body
 * to fail into - it is a browser redirect - so it reports the failure as an
 * `auth_error` code on this page's URL. Unknown codes fall back to generic
 * wording rather than rendering the raw parameter, which is untrusted input.
 */
function googleErrorMessageFor(code: string): string {
  return (
    messageForCode(code) ?? "We couldn't complete sign-in with Google. Please try again."
  );
}

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailId = useId();
  const passwordId = useId();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preserved through the OAuth round trip so someone bounced to /login from a
  // deep link lands back there after signing in with Google, exactly as they
  // would after a password login. The backend re-validates it.
  const redirectTo = searchParams.get("redirect");
  const googleError = searchParams.get("auth_error");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      await login({ email, password });
      router.replace(redirectTo || "/dashboard");
    } catch (err) {
      setError(errorMessageFor(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputBase =
    "w-full rounded-xl border bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600/40 focus:border-brand-500 disabled:opacity-60 disabled:cursor-not-allowed";
  const inputBorder = "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700";

  return (
    <div className="card w-full max-w-md p-6 sm:p-8 shadow-card">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Sign in to your account
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Welcome back. Please enter your details.
        </p>
      </div>

      {googleError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 animate-fade-in"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{googleErrorMessageFor(googleError)}</span>
        </div>
      )}

      {/* Google OAuth Button. A plain anchor, deliberately: the flow is a chain
          of top-level redirects the browser must follow itself, and no
          authorization code is ever exchanged in this JavaScript. */}
      <div className="mb-6">
        <a
          href={googleSignInUrl(redirectTo)}
          className="btn-secondary h-11 w-full text-sm"
        >
          <GoogleIcon className="h-4 w-4" />
          Continue with Google
        </a>
      </div>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-slate-900 px-2 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Or
          </span>
        </div>
      </div>

      {/* Manual Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor={emailId}
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Email address
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="alex@yourbusiness.com"
            className={cn(inputBase, inputBorder)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor={passwordId}
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id={passwordId}
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className={cn(inputBase, inputBorder)}
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 animate-fade-in"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary mt-2 h-11 w-full text-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700"
        >
          Get started
        </Link>
      </p>
    </div>
  );
}

// Standard Google "G" Logo SVG
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}