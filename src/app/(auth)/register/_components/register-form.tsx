"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, ArrowRight } from "lucide-react";

import { isApiError } from "@/lib/api/errors";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

const MIN_PASSWORD_LENGTH = 8;

function errorMessageFor(error: unknown): string {
  if (isApiError(error)) {
    if (error.code === "USER_ALREADY_EXISTS") return "An account with this email already exists.";
    return error.message;
  }
  return "Something went wrong. Please try again.";
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

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ email, password });
      const redirectTo = searchParams.get("redirect") || "/dashboard";
      router.replace(redirectTo);
    } catch (err) {
      setError(errorMessageFor(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputBase =
    "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600/40 focus:border-brand-500 disabled:opacity-60 disabled:cursor-not-allowed";
  const inputBorder = "border-slate-200 hover:border-slate-300";

  return (
    <div className="card w-full max-w-md p-6 shadow-card sm:p-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
        <p className="mt-2 text-sm text-slate-600">Set up your business in a couple of minutes.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium text-slate-700">
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
          <label htmlFor={passwordId} className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            placeholder="••••••••"
            className={cn(inputBase, inputBorder)}
            disabled={isSubmitting}
          />
          <p className="mt-1.5 text-xs text-slate-500">At least {MIN_PASSWORD_LENGTH} characters.</p>
        </div>

        <div>
          <label htmlFor={confirmPasswordId} className="mb-1.5 block text-sm font-medium text-slate-700">
            Confirm password
          </label>
          <input
            id={confirmPasswordId}
            name="confirmPassword"
            type="password"
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

      <p className="mt-8 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
