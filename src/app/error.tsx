"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/Button";

/** Root rendering-error boundary. Not the ApiError/backend-error UX — see F18. */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div className="card max-w-md px-8 py-10">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          An unexpected error occurred. You can try again, or head back to the homepage.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={retry} className="btn-primary h-11 px-5 text-sm">
            Try again
          </button>
          <Button href="/" variant="secondary">
            Go home
          </Button>
        </div>
      </div>
    </main>
  );
}
