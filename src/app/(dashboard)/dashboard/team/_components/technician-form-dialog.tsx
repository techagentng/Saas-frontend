"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { Field, fieldInputClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { useCreateStaff, useUpdateStaff } from "@/modules/staff/queries";
import type { StaffProfile } from "@/modules/staff/types";
import { useAuth } from "@/providers/auth-provider";

const MAX_NAME_LENGTH = 255;
const MAX_BIO_LENGTH = 1000;

type TechnicianFormDialogProps = {
  tenantId: string;
  /** Absent for a create, present for an edit — the only difference between the two flows. */
  staff?: StaffProfile;
  onClose: () => void;
};

/**
 * Create and edit share one dialog because they submit overlapping fields
 * under the same rules; splitting them would duplicate the validation with
 * nothing gained — the same reasoning `ServiceFormDialog` documents.
 *
 * The one field that does NOT carry over to edit is the account link: the
 * backend's `UpdateStaffInput` has no `user_id` field at all — "re-pointing a
 * profile at a different person is not an edit" — so the checkbox below is
 * create-only, and editing an already-linked profile simply shows that fact
 * as read-only text instead of a control that would silently do nothing.
 *
 * Self-linking (business owner as technician) is real, not fabricated: it
 * sets `user_id` to the signed-in user's own id from `useAuth`, which the
 * backend already accepts and validates (an ACTIVE membership check).
 * Linking a DIFFERENT teammate has no picker here — there is no backend
 * endpoint that lists tenant members to choose from, so building one would
 * mean inventing data the API cannot supply.
 */
export function TechnicianFormDialog({ tenantId, staff, onClose }: TechnicianFormDialogProps) {
  const isEdit = staff !== undefined;
  const { user } = useAuth();
  const createStaff = useCreateStaff(tenantId);
  const updateStaff = useUpdateStaff(tenantId);
  const mutation = isEdit ? updateStaff : createStaff;

  const nameId = useId();
  const bioId = useId();
  const bookableId = useId();
  const selfLinkId = useId();

  const [displayName, setDisplayName] = useState(staff?.display_name ?? "");
  const [bio, setBio] = useState(staff?.bio ?? "");
  const [isBookable, setIsBookable] = useState(staff?.is_bookable ?? true);
  // Only meaningful on create — see the file comment above.
  const [linkMyAccount, setLinkMyAccount] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const trimmedName = displayName.trim();
    const nextNameError =
      trimmedName === ""
        ? "Enter a name."
        : trimmedName.length > MAX_NAME_LENGTH
          ? `Keep the name under ${MAX_NAME_LENGTH} characters.`
          : null;

    setNameError(nextNameError);

    // Entered values are never cleared on a validation failure — the form
    // keeps exactly what was typed.
    if (nextNameError) return;

    const trimmedBio = bio.trim();

    try {
      if (isEdit) {
        await updateStaff.mutateAsync({
          staffId: staff.id,
          input: {
            display_name: trimmedName,
            // Sent as "" rather than null when cleared: the backend keeps
            // "cleared to empty" and "never set" distinguishable.
            bio: trimmedBio,
            is_bookable: isBookable,
          },
        });
      } else {
        await createStaff.mutateAsync({
          display_name: trimmedName,
          bio: trimmedBio === "" ? null : trimmedBio,
          is_bookable: isBookable,
          user_id: linkMyAccount && user ? user.id : null,
        });
      }
      onClose();
    } catch (err) {
      setFormError(
        apiErrorMessage(err, {
          VALIDATION_FAILED:
            "Check the details: a team member needs a name, and if you're linking an account, it must be an active member of this workspace.",
          STAFF_NOT_FOUND: "That team member no longer exists. Refresh to see the current roster.",
        })
      );
    }
  }

  const formId = `${nameId}-form`;

  return (
    <Dialog
      title={isEdit ? "Edit technician" : "Add technician"}
      description={
        isEdit
          ? "Changes apply to this team member everywhere they appear."
          : "Add someone who provides services for your business."
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
                : "Add technician"}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field id={nameId} label="Name" error={nameError}>
          <input
            id={nameId}
            name="display_name"
            type="text"
            required
            maxLength={MAX_NAME_LENGTH}
            value={displayName}
            placeholder="Ada Okafor"
            disabled={mutation.isPending}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? `${nameId}-error` : undefined}
            onChange={(event) => {
              setDisplayName(event.target.value);
              setNameError(null);
            }}
            className={fieldInputClass}
          />
        </Field>

        <Field id={bioId} label="Bio" optional>
          <textarea
            id={bioId}
            name="bio"
            rows={3}
            maxLength={MAX_BIO_LENGTH}
            value={bio}
            placeholder="A short introduction customers will see."
            disabled={mutation.isPending}
            onChange={(event) => setBio(event.target.value)}
            className={`${fieldInputClass} resize-y`}
          />
        </Field>

        <label htmlFor={bookableId} className="flex items-start gap-2.5">
          <input
            id={bookableId}
            name="is_bookable"
            type="checkbox"
            checked={isBookable}
            disabled={mutation.isPending}
            onChange={(event) => setIsBookable(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-600/40 dark:border-slate-700 dark:bg-slate-800"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Bookable
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Customers can be booked with this person. Turn off for someone on the roster who
              isn&apos;t currently taking appointments.
            </span>
          </span>
        </label>

        {isEdit ? (
          staff.user_id && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This profile is linked to a user account. The link can&apos;t be changed after
              creation.
            </p>
          )
        ) : (
          <label htmlFor={selfLinkId} className="flex items-start gap-2.5">
            <input
              id={selfLinkId}
              name="link_my_account"
              type="checkbox"
              checked={linkMyAccount}
              disabled={mutation.isPending || !user}
              onChange={(event) => setLinkMyAccount(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-2 focus:ring-brand-600/40 dark:border-slate-700 dark:bg-slate-800"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              This is me
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Link this profile to your own account — for a business owner who also performs
                services. This can&apos;t be changed after creation.
              </span>
            </span>
          </label>
        )}

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
