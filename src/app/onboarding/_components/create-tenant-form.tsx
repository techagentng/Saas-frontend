"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { FormEvent } from "react";

import { isApiError } from "@/lib/api/errors";
import { useCreateTenant } from "@/modules/tenant/queries";
import { useTenant } from "@/providers/tenant-provider";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function errorMessageFor(error: unknown): string {
  if (isApiError(error)) {
    if (error.code === "TENANT_SLUG_TAKEN") {
      return "That URL is already taken. Try a different slug.";
    }
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function CreateTenantForm() {
  const createTenantMutation = useCreateTenant();
  const { setCurrentTenant } = useTenant();
  const router = useRouter();
  const nameId = useId();
  const slugId = useId();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugTouched, setIsSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!isSlugTouched) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const tenant = await createTenantMutation.mutateAsync({ name, slug });
      setCurrentTenant(tenant);
      router.push("/dashboard");
    } catch (err) {
      setError(errorMessageFor(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Business name
        </label>
        <input
          id={nameId}
          name="name"
          type="text"
          required
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-white"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={slugId} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Slug
        </label>
        <input
          id={slugId}
          name="slug"
          type="text"
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          title="Lowercase letters, numbers, and hyphens only"
          value={slug}
          onChange={(event) => {
            setIsSlugTouched(true);
            setSlug(slugify(event.target.value));
          }}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-white"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={createTenantMutation.isPending}
        className="mt-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {createTenantMutation.isPending ? "Creating…" : "Create"}
      </button>
    </form>
  );
}
