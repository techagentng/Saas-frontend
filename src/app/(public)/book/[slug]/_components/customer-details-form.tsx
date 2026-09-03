"use client";

import { useId, useRef, useState } from "react";

export type CustomerDetails = {
  name: string;
  phone?: string;
  email?: string;
};

const MAX_NAME = 255;
const MAX_PHONE = 40;
const MAX_EMAIL = 320;

// A friendly, non-exhaustive shape check. The backend runs the authoritative
// `net/mail.ParseAddress`; this only catches the obvious "no @" mistake before
// a round trip.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<"name" | "phone" | "email", string>>;

/**
 * The public booking customer form — minimal PII: a required name, an optional
 * phone, an optional email. No account, no address, nothing the backend does
 * not accept.
 *
 * Validation is customer-friendly and never surfaces backend wording. On a
 * validation failure, focus moves to the first invalid field and each error is
 * associated with its input via `aria-describedby`. The submit button is the
 * form's own, so Enter submits; it disables and shows a pending label while
 * the booking request is in flight (UX-only double-submit guard — the backend
 * owns real concurrency safety).
 */
export function CustomerDetailsForm({
  onSubmit,
  isPending,
  serverError,
}: {
  onSubmit: (customer: CustomerDetails) => void;
  isPending: boolean;
  /** A already-mapped, customer-safe message for a failure that isn't field-level. */
  serverError?: string | null;
}) {
  const nameId = useId();
  const phoneId = useId();
  const emailId = useId();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const trimmedName = name.trim();
    if (trimmedName === "") next.name = "Enter your name so the salon knows who's booking.";
    else if (trimmedName.length > MAX_NAME) next.name = "That name is too long.";

    const trimmedPhone = phone.trim();
    if (trimmedPhone.length > MAX_PHONE) next.phone = "That phone number is too long.";

    const trimmedEmail = email.trim();
    if (trimmedEmail !== "") {
      if (trimmedEmail.length > MAX_EMAIL || !EMAIL_SHAPE.test(trimmedEmail)) {
        next.email = "Enter a valid email address, or leave it blank.";
      }
    }
    return next;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const firstInvalid = found.name ? nameRef : found.phone ? phoneRef : emailRef;
      firstInvalid.current?.focus();
      return;
    }

    onSubmit({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Field
        id={nameId}
        label="Your name"
        error={errors.name}
        inputRef={nameRef}
        value={name}
        onChange={(v) => {
          setName(v);
          if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
        }}
        required
        autoComplete="name"
        maxLength={MAX_NAME}
        disabled={isPending}
      />
      <Field
        id={phoneId}
        label="Phone"
        optionalHint="Optional"
        error={errors.phone}
        inputRef={phoneRef}
        value={phone}
        onChange={(v) => {
          setPhone(v);
          if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
        }}
        type="tel"
        autoComplete="tel"
        maxLength={MAX_PHONE}
        disabled={isPending}
      />
      <Field
        id={emailId}
        label="Email"
        optionalHint="Optional"
        error={errors.email}
        inputRef={emailRef}
        value={email}
        onChange={(v) => {
          setEmail(v);
          if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
        }}
        type="email"
        autoComplete="email"
        maxLength={MAX_EMAIL}
        disabled={isPending}
      />

      {serverError && (
        <p
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
        >
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-slate-900 px-7 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {isPending ? "Booking…" : "Book appointment"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  optionalHint,
  error,
  inputRef,
  value,
  onChange,
  ...input
}: {
  id: string;
  label: string;
  optionalHint?: string;
  error?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange">) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-baseline gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {optionalHint && (
          <span className="text-xs font-normal text-slate-400 dark:text-slate-500">{optionalHint}</span>
        )}
      </label>
      <input
        {...input}
        id={id}
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`block w-full rounded-2xl border bg-white/80 px-4 py-3 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-900/60 dark:text-white ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-700"
            : "border-[#E0D0C5] focus:border-slate-400 focus:ring-slate-900/10 dark:border-slate-800"
        }`}
      />
      {error && (
        <p id={errorId} className="text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
