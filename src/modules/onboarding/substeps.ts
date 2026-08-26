/**
 * PRESENTATION-ONLY substeps that live inside the single backend onboarding
 * step `business_profile`.
 *
 * This distinction is deliberate and load-bearing: the backend's controlled
 * step vocabulary (internal/tenant/model/onboarding_step.go) knows only
 * `business_profile`, and it must stay that way — these micro-questions are
 * a UI pacing decision, not workflow state. Nothing here is ever sent as
 * `current_step`, and no backend field exists to persist which one the user
 * is on (see the plan's §27: Typeform animation state must not leak into the
 * schema).
 *
 * Losing the current substep on reload is therefore safe and expected: the
 * authoritative resume point is the backend's `business_profile` plus the
 * saved profile values themselves, which repopulate the fields.
 */
export type SubstepId = "about" | "contact" | "timezone" | "review";

export type SubstepDefinition = {
  id: SubstepId;
  /** The Typeform-style question shown as the page heading. */
  title: string;
  description: string;
};

export const PROFILE_SUBSTEPS: SubstepDefinition[] = [
  {
    id: "about",
    title: "Tell us about your business",
    description: "This is what customers see first when they open your booking page.",
  },
  {
    id: "contact",
    title: "How should customers reach you?",
    description: "Optional — add these if you want them shown publicly. You can change them later.",
  },
  {
    id: "timezone",
    title: "What timezone do you operate in?",
    description: "Every booking, opening hour, and reminder is scheduled against this.",
  },
  {
    id: "review",
    title: "You're ready to launch",
    description: "Check everything over, then finish setting up your workspace.",
  },
];

export function substepIndex(id: SubstepId): number {
  const index = PROFILE_SUBSTEPS.findIndex((substep) => substep.id === id);
  return index < 0 ? 0 : index;
}
