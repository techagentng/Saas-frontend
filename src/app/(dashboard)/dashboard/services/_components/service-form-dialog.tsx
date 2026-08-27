"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { Field, fieldInputClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { currencyPrefix } from "@/lib/money/currency";
import {
  MONEY_PARSE_MESSAGES,
  formatMinorAsMajorInput,
  parseMajorAmountToMinor,
} from "@/lib/money/money";
import {
  DURATION_PRESETS_MINUTES,
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  formatDuration,
  isValidDurationMinutes,
} from "@/lib/scheduling/duration";
import { useCreateService, useUpdateService } from "@/modules/services/queries";
import type { Service } from "@/modules/services/types";

const MAX_NAME_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 1000;

type ServiceFormDialogProps = {
  tenantId: string;
  currency: string;
  /** Absent for a create, present for an edit — the only difference between the two flows. */
  service?: Service;
  onClose: () => void;
};

/**
 * Create and edit share one dialog because they submit the same four fields
 * under the same rules; splitting them would duplicate the money and duration
 * handling with nothing gained.
 *
 * Currency is not a field. It is inherited from the workspace, write-once, and
 * shown read-only beside the price. Status is not a field either — a new
 * service is ACTIVE server-side, and the only transition away from that is the
 * archive endpoint.
 *
 * Every bound below (name/description length, duration range, price ceiling)
 * mirrors the backend's own validation, which stays authoritative: this exists
 * to spare a round-trip, never to replace the server's check.
 */
export function ServiceFormDialog({
  tenantId,
  currency,
  service,
  onClose,
}: ServiceFormDialogProps) {
  const isEdit = service !== undefined;
  const createService = useCreateService(tenantId);
  const updateService = useUpdateService(tenantId);
  const mutation = isEdit ? updateService : createService;

  const nameId = useId();
  const descriptionId = useId();
  const durationId = useId();
  const priceId = useId();

  const [name, setName] = useState(service?.name ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [durationMinutes, setDurationMinutes] = useState<number>(service?.duration_minutes ?? 60);
  // Price lives in state as the *string* the owner typed, never as a number.
  // Parsing to minor units happens once, at submit — a float in component
  // state is exactly the drift this boundary exists to prevent.
  const [price, setPrice] = useState(service ? formatMinorAsMajorInput(service.price_minor) : "");

  const [nameError, setNameError] = useState<string | null>(null);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const isCustomDuration = !DURATION_PRESETS_MINUTES.includes(
    durationMinutes as (typeof DURATION_PRESETS_MINUTES)[number]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    const nextNameError =
      trimmedName === ""
        ? "Enter a service name."
        : trimmedName.length > MAX_NAME_LENGTH
          ? `Keep the name under ${MAX_NAME_LENGTH} characters.`
          : null;

    const nextDurationError = isValidDurationMinutes(durationMinutes)
      ? null
      : `Enter a duration between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes.`;

    const parsedPrice = parseMajorAmountToMinor(price);
    const nextPriceError = parsedPrice.ok ? null : MONEY_PARSE_MESSAGES[parsedPrice.error];

    setNameError(nextNameError);
    setDurationError(nextDurationError);
    setPriceError(nextPriceError);

    // Entered values are never cleared on a validation failure — the form
    // keeps exactly what was typed, so one bad field doesn't cost the other
    // three.
    if (nextNameError || nextDurationError || !parsedPrice.ok) return;

    const trimmedDescription = description.trim();

    try {
      if (isEdit) {
        await updateService.mutateAsync({
          serviceId: service.id,
          input: {
            name: trimmedName,
            // Sent as "" rather than null when cleared: the backend keeps
            // "cleared to empty" and "never set" distinguishable, and an edit
            // that empties the box means the former.
            description: trimmedDescription,
            duration_minutes: durationMinutes,
            price_minor: parsedPrice.minor,
          },
        });
      } else {
        await createService.mutateAsync({
          name: trimmedName,
          description: trimmedDescription === "" ? null : trimmedDescription,
          duration_minutes: durationMinutes,
          price_minor: parsedPrice.minor,
        });
      }
      onClose();
    } catch (err) {
      setFormError(
        apiErrorMessage(err, {
          VALIDATION_FAILED:
            "Check the details: a service needs a name, a duration between 1 and 480 minutes, and a price of zero or more.",
          SERVICE_NOT_FOUND: "That service no longer exists. Refresh to see the current catalog.",
        })
      );
    }
  }

  const formId = `${nameId}-form`;

  return (
    <Dialog
      title={isEdit ? "Edit service" : "Add service"}
      description={
        isEdit
          ? "Changes apply to this service everywhere it appears."
          : "Add a service customers will be able to book."
      }
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="btn-secondary h-10 px-4 text-sm disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={mutation.isPending}
            className="btn-primary h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending
              ? isEdit
                ? "Saving…"
                : "Adding…"
              : isEdit
                ? "Save changes"
                : "Add service"}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field id={nameId} label="Name" error={nameError}>
          <input
            id={nameId}
            name="name"
            type="text"
            required
            maxLength={MAX_NAME_LENGTH}
            value={name}
            placeholder="Gel Manicure"
            disabled={mutation.isPending}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? `${nameId}-error` : undefined}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(null);
            }}
            className={fieldInputClass}
          />
        </Field>

        <Field id={descriptionId} label="Description" optional>
          <textarea
            id={descriptionId}
            name="description"
            rows={3}
            maxLength={MAX_DESCRIPTION_LENGTH}
            value={description}
            placeholder="What is included, and anything a customer should know."
            disabled={mutation.isPending}
            onChange={(event) => setDescription(event.target.value)}
            className={`${fieldInputClass} resize-y`}
          />
        </Field>

        <fieldset className="flex flex-col gap-1.5" disabled={mutation.isPending}>
          <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Duration</legend>
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS_MINUTES.map((preset) => {
              const isSelected = durationMinutes === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setDurationMinutes(preset);
                    setDurationError(null);
                  }}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
                >
                  {formatDuration(preset)}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <label htmlFor={durationId} className="text-xs text-zinc-500 dark:text-zinc-400">
              Or enter minutes
            </label>
            <input
              id={durationId}
              name="duration_minutes"
              type="number"
              inputMode="numeric"
              min={MIN_DURATION_MINUTES}
              max={MAX_DURATION_MINUTES}
              step={1}
              value={Number.isNaN(durationMinutes) ? "" : durationMinutes}
              aria-invalid={durationError ? true : undefined}
              aria-describedby={durationError ? `${durationId}-error` : undefined}
              onChange={(event) => {
                setDurationMinutes(event.target.value === "" ? NaN : Number(event.target.value));
                setDurationError(null);
              }}
              className={`${fieldInputClass} w-28`}
            />
            {isCustomDuration && isValidDurationMinutes(durationMinutes) && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatDuration(durationMinutes)}
              </span>
            )}
          </div>
          {durationError && (
            <p
              id={`${durationId}-error`}
              className="text-xs font-medium text-rose-600 dark:text-rose-400"
            >
              {durationError}
            </p>
          )}
        </fieldset>

        <Field
          id={priceId}
          label="Price"
          error={priceError}
          hint={`Priced in ${currency}. Enter 0 for a free service.`}
        >
          <div className="flex items-stretch">
            <span
              aria-hidden="true"
              className="inline-flex shrink-0 items-center rounded-l-xl border border-r-0 border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
            >
              {currencyPrefix(currency).trim() || currency}
            </span>
            <input
              id={priceId}
              name="price"
              type="text"
              inputMode="decimal"
              required
              value={price}
              placeholder="10000.00"
              disabled={mutation.isPending}
              aria-invalid={priceError ? true : undefined}
              aria-describedby={priceError ? `${priceId}-error` : `${priceId}-hint`}
              onChange={(event) => {
                setPrice(event.target.value);
                setPriceError(null);
              }}
              className={`${fieldInputClass} rounded-l-none`}
            />
          </div>
        </Field>

        {formError && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
          >
            {formError}
          </p>
        )}
      </form>
    </Dialog>
  );
}
