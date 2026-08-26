export type OnboardingStepId = "business_profile";

export type OnboardingStepDefinition = {
  id: OnboardingStepId;
  label: string;
  description: string;
};

/**
 * Canonical, ordered step list — the single source of truth for onboarding
 * step identifiers on the frontend. Must mirror the backend's
 * `knownOnboardingSteps` (internal/tenant/model/onboarding_step.go) exactly
 * — confirmed live only "business_profile" is recognized today. Extend
 * this array (never a second list elsewhere) when a step is genuinely
 * approved; nothing else in the codebase should hardcode a step id string.
 */
export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  {
    id: "business_profile",
    label: "Business profile",
    description: "Tell customers about your business.",
  },
];

const FIRST_STEP_ID = ONBOARDING_STEPS[0].id;

/**
 * Maps the backend's `onboarding_step` (nullable, free-form on the wire) to
 * a step id this build actually knows how to render. `null` — a fresh
 * tenant, since F4.1's creation flow never sets a step — resolves to the
 * first common step. An unrecognized value (e.g. a step a newer backend
 * added that this build doesn't know about yet) fails safely to the first
 * known step rather than crashing, mirroring PermissionsProvider's
 * fail-closed philosophy elsewhere in this codebase.
 */
export function resolveOnboardingStep(step: string | null): OnboardingStepId {
  if (step && ONBOARDING_STEPS.some((candidate) => candidate.id === step)) {
    return step as OnboardingStepId;
  }
  return FIRST_STEP_ID;
}
