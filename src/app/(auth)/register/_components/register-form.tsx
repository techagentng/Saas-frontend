"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, ArrowRight } from "lucide-react";

import { apiErrorMessage } from "@/lib/api/error-messages";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

// Matches the backend's own bounds (identity/model: 8–128 characters).
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

function errorMessageFor(error: unknown): string {
  return apiErrorMessage(error, {
    // The backend returns one opaque "The request failed validation." for
    // every rejected field. Registration only sends an email and a password,
    // so both possibilities can be named honestly rather than guessing.
    VALIDATION_FAILED: `Check your details: enter a valid email address and a password between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
  });
}

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    // Checked client-side so the user gets a precise message instead of the
    // backend's single opaque VALIDATION_FAILED for every bad field.
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      setError(`Your password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don't match. Re-enter them and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ email, password });
      // A brand-new account provably has no tenants — POST /v1/users creates
      // only the user row, never a membership — so go straight to onboarding
      // instead of bouncing through /dashboard just to have TenantGate send
      // us here anyway. That bounce showed a bare "Loading…" screen during
      // the extra hop. An explicit ?redirect= still wins.
      const redirectTo = searchParams.get("redirect") || "/onboarding";
      router.replace(redirectTo);
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
    <div className="card w-full max-w-md p-6 shadow-card sm:p-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create your account</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Set up your business in a couple of minutes.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
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
          <label htmlFor={passwordId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
          </label>
          <PasswordInput
            id={passwordId}
            name="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            placeholder="••••••••"
            className={cn(inputBase, inputBorder)}
            disabled={isSubmitting}
            aria-describedby={`${passwordId}-hint`}
          />
          <p id={`${passwordId}-hint`} className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            At least {MIN_PASSWORD_LENGTH} characters.
          </p>
        </div>

        <div>
          <label htmlFor={confirmPasswordId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Confirm password
          </label>
          <PasswordInput
            id={confirmPasswordId}
            name="confirmPassword"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
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

        <button type="submit" disabled={isSubmitting} className="btn-primary mt-2 h-11 w-full text-sm">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
