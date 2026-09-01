"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import type { FormEvent } from "react";

import { apiErrorMessage } from "@/lib/api/error-messages";
import { businessTypeLabel } from "@/lib/tenant/business-type-labels";
import { useCreateTenant } from "@/modules/tenant/queries";
import { useTenant } from "@/providers/tenant-provider";
import type { BusinessType } from "@/types/tenant";

/**
 * Canonical order, matching the backend's own `business_type.go` const
 * order — not alphabetized, not reordered for UX preference.
 */
const BUSINESS_TYPES: BusinessType[] = ["NAIL_TECHNICIAN", "RESTAURANT", "HOTEL", "TRANSPORT"];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function errorMessageFor(error: unknown): string {
  return apiErrorMessage(error, {
    // Only this screen knows the request carried a name, slug, and business
    // type, so it can name them instead of the backend's blanket wording.
    VALIDATION_FAILED:
      "Check your details: your business needs a name, a business type, and a URL using lowercase letters, numbers, and hyphens.",
  });
}

export function CreateTenantForm() {
  const createTenantMutation = useCreateTenant();
  const { setCurrentTenant } = useTenant();
  const router = useRouter();
  const nameId = useId();
  const slugId = useId();
  const businessTypeId = useId();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugTouched, setIsSlugTouched] = useState(false);
  // No default vertical — business_type materially affects future
  // onboarding/dashboard/public-booking behavior, so it must be a
  // deliberate choice, never silently defaulted.
  const [businessType, setBusinessType] = useState<BusinessType | "">("");
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

    if (businessType === "") {
      setError("Choose a business type.");
      return;
    }

    try {
      const tenant = await createTenantMutation.mutateAsync({ name, slug, business_type: businessType });
      setCurrentTenant(tenant);
      // Always /dashboard: the tenant is always created IN_PROGRESS, and
      // TenantGate (F4) is the single source of routing truth — it will
      // redirect to /onboarding/{id} itself rather than this form
      // duplicating that decision.
      router.push("/dashboard");
    } catch (err) {
      setError(errorMessageFor(err));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Business name
        </label>
        <input
          id={nameId}
          name="name"
          type="text"
          required
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white transition-colors hover:border-slate-300 dark:hover:border-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={businessTypeId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Business type
        </label>
        <select
          id={businessTypeId}
          name="business_type"
          required
          value={businessType}
          onChange={(event) => setBusinessType(event.target.value as BusinessType)}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white transition-colors hover:border-slate-300 dark:hover:border-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/40"
        >
          <option value="" disabled>
            Select a business type
          </option>
          {BUSINESS_TYPES.map((type) => (
            <option key={type} value={type}>
              {businessTypeLabel(type)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={slugId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white transition-colors hover:border-slate-300 dark:hover:border-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/40"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={createTenantMutation.isPending}
        className="btn-primary mt-2 h-11 w-full text-sm disabled:opacity-60"
      >
        {createTenantMutation.isPending ? "Creating…" : "Create workspace"}
      </button>
    </form>
  );
}
