"use client";

import { useId } from "react";

import { Field, ReadOnlyValue, onboardingInputClass } from "@/components/onboarding/field";
import { businessTypeLabel } from "@/lib/tenant/business-type-labels";
import { listTimezones, timezoneLabel } from "@/lib/tenant/timezones";
import type { SubstepId } from "@/modules/onboarding/substeps";
import type { Tenant } from "@/types/tenant";

/**
 * Draft of the editable common-profile fields. Held by the page so a failed
 * save keeps what the user typed; every value is seeded from the persisted
 * tenant, never from browser storage.
 */
export type ProfileDraft = {
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  timezone: string;
};

type BusinessProfileStepProps = {
  substep: SubstepId;
  tenant: Tenant;
  draft: ProfileDraft;
  onChange: (patch: Partial<ProfileDraft>) => void;
  disabled: boolean;
};

// Mirrors the Go service's limits exactly (tenant_service.go UpdateProfile)
// so the UI never promises something the backend will reject, and never
// rejects something the backend would accept.
export const NAME_MAX = 255;
export const DESCRIPTION_MAX = 1000;
export const PHONE_MAX = 20;

/**
 * The real common business profile (Vertical Onboarding F6), rendered one
 * question group at a time. Only fields the existing PATCH
 * /v1/tenants/{id} contract accepts appear here — business type and slug are
 * shown read-only because they are immutable after creation and have no
 * writable field on that endpoint.
 *
 * Contains no vertical-specific questions: services, tables, rooms, and
 * routes belong to later per-vertical features.
 */
export function BusinessProfileStep({
  substep,
  tenant,
  draft,
  onChange,
  disabled,
}: BusinessProfileStepProps) {
  const nameId = useId();
  const descriptionId = useId();
  const emailId = useId();
  const phoneId = useId();
  const timezoneId = useId();
  const timezoneListId = useId();

  if (substep === "about") {
    return (
      <div className="flex flex-col gap-6">
        <Field id={nameId} label="Business name" hint="Changing this does not change your public link.">
          <input
            id={nameId}
            name="name"
            type="text"
            required
            maxLength={NAME_MAX}
            value={draft.name}
            disabled={disabled}
            onChange={(event) => onChange({ name: event.target.value })}
            className={onboardingInputClass}
            aria-describedby={`${nameId}-hint`}
          />
        </Field>

        <Field
          id={descriptionId}
          label="Description"
          optional
          hint={`${draft.description.length}/${DESCRIPTION_MAX} characters`}
        >
          <textarea
            id={descriptionId}
            name="description"
            rows={4}
            maxLength={DESCRIPTION_MAX}
            value={draft.description}
            disabled={disabled}
            onChange={(event) => onChange({ description: event.target.value })}
            placeholder="What do you offer, and what makes it worth booking?"
            className={`${onboardingInputClass} resize-y`}
            aria-describedby={`${descriptionId}-hint`}
          />
        </Field>

        <ReadOnlyValue
          label="Business type"
          value={businessTypeLabel(tenant.business_type)}
          hint="Chosen when you created this workspace and fixed from then on."
        />
      </div>
    );
  }

  if (substep === "contact") {
    return (
      <div className="flex flex-col gap-6">
        <Field
          id={emailId}
          label="Contact email"
          optional
          hint="Where customers should email this business — not necessarily your account email."
        >
          <input
            id={emailId}
            name="contact_email"
            type="email"
            autoComplete="off"
            value={draft.contactEmail}
            disabled={disabled}
            onChange={(event) => onChange({ contactEmail: event.target.value })}
            placeholder="hello@yourbusiness.com"
            className={onboardingInputClass}
            aria-describedby={`${emailId}-hint`}
          />
        </Field>

        <Field id={phoneId} label="Contact phone" optional hint={`Up to ${PHONE_MAX} characters.`}>
          <input
            id={phoneId}
            name="contact_phone"
            type="tel"
            autoComplete="off"
            maxLength={PHONE_MAX}
            value={draft.contactPhone}
            disabled={disabled}
            onChange={(event) => onChange({ contactPhone: event.target.value })}
            placeholder="+234 800 000 0000"
            className={onboardingInputClass}
            aria-describedby={`${phoneId}-hint`}
          />
        </Field>
      </div>
    );
  }

  if (substep === "timezone") {
    return (
      <Field
        id={timezoneId}
        label="Operating timezone"
        hint="Start typing a city or region. This must be a real timezone, e.g. Africa/Lagos."
      >
        {/* A datalist-backed input rather than a 400-option <select>: it is
            searchable, keyboard-native, needs no dependency, and still submits
            a real IANA identifier. */}
        <input
          id={timezoneId}
          name="timezone"
          type="text"
          required
          list={timezoneListId}
          value={draft.timezone}
          disabled={disabled}
          onChange={(event) => onChange({ timezone: event.target.value })}
          placeholder="Africa/Lagos"
          className={onboardingInputClass}
          aria-describedby={`${timezoneId}-hint`}
        />
        <datalist id={timezoneListId}>
          {listTimezones().map((zone) => (
            <option key={zone} value={zone}>
              {timezoneLabel(zone)}
            </option>
          ))}
        </datalist>
      </Field>
    );
  }

  return null;
}
