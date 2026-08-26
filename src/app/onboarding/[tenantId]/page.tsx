"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { BusinessProfileStep } from "@/components/onboarding/business-profile-step";
import type { ProfileDraft } from "@/components/onboarding/business-profile-step";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import type { SaveStatus } from "@/components/onboarding/onboarding-shell";
import { ProfileReview } from "@/components/onboarding/profile-review";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { detectTimezone, isValidTimezone } from "@/lib/tenant/timezones";
import { useCompleteOnboarding, useSaveOnboardingProgress } from "@/modules/onboarding/queries";
import { resolveOnboardingStep } from "@/modules/onboarding/steps";
import { PROFILE_SUBSTEPS, substepIndex } from "@/modules/onboarding/substeps";
import type { SubstepId } from "@/modules/onboarding/substeps";
import { useTenantPermissions } from "@/modules/permissions/queries";
import type { UpdateTenantProfileInput } from "@/modules/tenant/api";
import { useTenantDetail, useUpdateTenantProfile } from "@/modules/tenant/queries";
import { useTenant } from "@/providers/tenant-provider";
import type { Tenant } from "@/types/tenant";

function errorMessageFor(error: unknown): string {
  return apiErrorMessage(error, {
    PERMISSION_DENIED: "You don't have permission to change this workspace.",
    TENANT_ACCESS_DENIED: "This workspace is no longer available to you.",
    // Only this screen knows which profile fields were submitted, so it can
    // point at them instead of repeating the backend's blanket wording.
    VALIDATION_FAILED:
      "Check your details: a business name is required, and the timezone must be a real one such as Africa/Lagos.",
  });
}

function draftFromTenant(tenant: Tenant): ProfileDraft {
  return {
    name: tenant.name,
    description: tenant.description ?? "",
    contactEmail: tenant.contact_email ?? "",
    contactPhone: tenant.contact_phone ?? "",
    // A never-configured workspace gets the visitor's own zone as a visible
    // suggestion on the timezone question — it is only ever persisted if the
    // user advances past that screen, never silently behind their back.
    timezone: tenant.timezone ?? detectTimezone() ?? "",
  };
}

/**
 * F6 — the real common business setup, running inside F5's shell.
 *
 * Backend workflow state stays a single step (`business_profile`); the four
 * screens here are presentation substeps only (modules/onboarding/substeps.ts).
 * Profile data is persisted through the EXISTING tenant profile endpoint
 * (PATCH /v1/tenants/{id}, Feature 4) via the existing `useUpdateTenantProfile`
 * mutation — onboarding orchestrates, the tenant module still owns profile
 * data and its cache.
 */
export default function OnboardingResumePage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const router = useRouter();
  const { setCurrentTenant } = useTenant();

  // Keyed to the tenant in the URL rather than read from PermissionsProvider,
  // which is scoped to `currentTenant` — that is only set by the effect below,
  // so the provider's set would still be empty on first render and would
  // briefly deny a legitimate owner.
  const permissionsQuery = useTenantPermissions(tenantId);
  const tenantQuery = useTenantDetail(tenantId);
  const updateProfile = useUpdateTenantProfile(tenantId);
  const saveProgress = useSaveOnboardingProgress(tenantId);
  const completeOnboarding = useCompleteOnboarding(tenantId);

  const [substep, setSubstep] = useState<SubstepId>("about");
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [seededTenantId, setSeededTenantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const tenant = tenantQuery.data;

  useEffect(() => {
    if (!tenant) return;

    if (tenant.onboarding_status === "COMPLETED") {
      router.replace("/dashboard");
      return;
    }

    setCurrentTenant(tenant);
  }, [tenant, router, setCurrentTenant]);

  // Seed the editable draft from persisted values, once per tenant. This is
  // what makes resume work: reload, or sign in tomorrow, and the fields come
  // back populated from the server rather than from local storage. Adjusted
  // during render (React's documented pattern for resetting state when a
  // prop changes, as DashboardShell already does) instead of in an effect,
  // which would cost an extra render and briefly show empty fields.
  if (tenant && seededTenantId !== tenant.id) {
    setSeededTenantId(tenant.id);
    setDraft(draftFromTenant(tenant));
  }

  // Only a resolved permission set counts as a denial — an unresolved query
  // must never be rendered as "you can't do this".
  const canEdit = permissionsQuery.isSuccess
    ? permissionsQuery.data.includes("tenant.update")
    : null;
  const substepDefinition = useMemo(
    () => PROFILE_SUBSTEPS[substepIndex(substep)],
    [substep]
  );

  if (
    tenantQuery.isLoading ||
    permissionsQuery.isLoading ||
    (tenant && tenant.onboarding_status === "COMPLETED") ||
    !draft
  ) {
    return (
      <div className="flex flex-1 items-center justify-center py-24" role="status" aria-live="polite">
        <span className="text-sm text-slate-500">Loading…</span>
      </div>
    );
  }

  if (tenantQuery.isError || !tenant) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-24">
        <div className="card max-w-md p-8 text-center shadow-card">
          <h1 className="text-lg font-semibold text-slate-900">Workspace unavailable</h1>
          <p className="mt-2 text-sm text-slate-600" role="alert">
            {tenantQuery.isError ? errorMessageFor(tenantQuery.error) : "This workspace isn't available."}
          </p>
          <button type="button" onClick={() => router.push("/dashboard")} className="btn-primary mt-6 h-11 px-5 text-sm">
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  // Fail closed on capability: the backend requires tenant.update on every
  // onboarding mutation and remains authoritative, so rather than showing an
  // editable form whose every save would 403, show why it can't be used.
  if (canEdit === false) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-24">
        <div className="card max-w-md p-8 text-center shadow-card">
          <h1 className="text-lg font-semibold text-slate-900">Setup isn&apos;t available to you</h1>
          <p className="mt-2 text-sm text-slate-600">
            {tenant.name} is still being set up, and your account doesn&apos;t have permission to change this
            workspace. Ask an owner to finish setup.
          </p>
          <button type="button" onClick={() => router.push("/dashboard")} className="btn-primary mt-6 h-11 px-5 text-sm">
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  /** Only the fields owned by the given substep, and only those the backend will accept. */
  function profilePatchFor(step: SubstepId, current: ProfileDraft): UpdateTenantProfileInput | null {
    if (step === "about") {
      // Description accepts an empty string (the backend treats "no
      // description" as a legitimate state); name must never be blank.
      return { name: current.name.trim(), description: current.description.trim() };
    }
    if (step === "contact") {
      const patch: UpdateTenantProfileInput = {};
      // The backend rejects an empty-but-present contact value, so a field
      // the user left blank is omitted entirely rather than sent as "".
      if (current.contactEmail.trim()) patch.contact_email = current.contactEmail.trim();
      if (current.contactPhone.trim()) patch.contact_phone = current.contactPhone.trim();
      // Nothing to send: skip the request instead of triggering the
      // backend's "no fields to update" validation error.
      return Object.keys(patch).length > 0 ? patch : null;
    }
    if (step === "timezone") {
      return { timezone: current.timezone.trim() };
    }
    return null;
  }

  function localValidationError(step: SubstepId, current: ProfileDraft): string | null {
    // Mirrors the Go service's rules rather than inventing stricter ones.
    if (step === "about" && !current.name.trim()) return "Business name can't be empty.";
    if (step === "timezone" && !isValidTimezone(current.timezone.trim())) {
      return "Choose a valid timezone, for example Africa/Lagos.";
    }
    return null;
  }

  async function handleContinue() {
    if (!draft || !tenant) return;
    setError(null);

    const nextIndex = substepIndex(substep) + 1;
    const nextSubstep = PROFILE_SUBSTEPS[nextIndex]?.id;

    if (substep === "review") {
      await handleFinish();
      return;
    }

    const validationError = localValidationError(substep, draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaveStatus("saving");
    try {
      // Checkpoint save: persist this substep's fields before advancing, so
      // progress survives a reload without a request per keystroke.
      const patch = profilePatchFor(substep, draft);
      if (patch) {
        await updateProfile.mutateAsync(patch);
      }

      // Timezone is the last data screen, so the workflow step is recorded
      // only once the profile itself is genuinely saved (never before).
      // A failure here leaves the saved profile data intact and reports that
      // only the progress marker is unconfirmed.
      if (substep === "timezone") {
        try {
          await saveProgress.mutateAsync({ current_step: resolveOnboardingStep(tenant.onboarding_step) });
        } catch (progressError) {
          setSaveStatus("idle");
          setError(
            `Your details were saved, but we couldn't record your progress. ${errorMessageFor(progressError)}`
          );
          return;
        }
      }

      setSaveStatus("saved");
      if (nextSubstep) setSubstep(nextSubstep);
    } catch (err) {
      // Stay on the question and keep what was typed — a failed save is a
      // retry, not a navigation.
      setSaveStatus("idle");
      setError(errorMessageFor(err));
    }
  }

  async function handleFinish() {
    setError(null);
    setSaveStatus("saving");
    try {
      // The backend alone decides whether completion is allowed; this only
      // requests it, and COMPLETED is never set locally ahead of the response.
      await completeOnboarding.mutateAsync();
      router.replace("/dashboard");
    } catch (err) {
      setSaveStatus("idle");
      setError(errorMessageFor(err));
    }
  }

  function handleBack() {
    const previous = PROFILE_SUBSTEPS[substepIndex(substep) - 1];
    if (previous) {
      setError(null);
      setSaveStatus("idle");
      setSubstep(previous.id);
      return;
    }
    // First question: leave onboarding rather than going back into workspace
    // creation. TenantGate decides what /dashboard resolves to.
    router.push("/dashboard");
  }

  const isReview = substep === "review";

  return (
    <OnboardingShell
      tenant={tenant}
      title={substepDefinition.title}
      description={substepDefinition.description}
      stepIndex={substepIndex(substep)}
      stepTotal={PROFILE_SUBSTEPS.length}
      screenKey={substep}
      onBack={handleBack}
      onContinue={handleContinue}
      continueLabel={isReview ? "Finish setup" : "Continue"}
      isFinalAction={isReview}
      saveStatus={saveStatus}
      error={error}
    >
      {isReview ? (
        <ProfileReview tenant={tenant} />
      ) : (
        <BusinessProfileStep
          substep={substep}
          tenant={tenant}
          draft={draft}
          onChange={(patch) => setDraft((current) => (current ? { ...current, ...patch } : current))}
          disabled={saveStatus === "saving"}
        />
      )}
    </OnboardingShell>
  );
}
