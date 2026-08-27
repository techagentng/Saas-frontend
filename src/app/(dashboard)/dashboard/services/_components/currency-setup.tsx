"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";

import { Field, fieldInputClass } from "@/components/ui/field";
import { apiErrorMessage } from "@/lib/api/error-messages";
import { SUPPORTED_CURRENCIES, currencyOptionLabel } from "@/lib/money/currency";
import { useSetTenantCurrency } from "@/modules/tenant/queries";
import { useCan } from "@/providers/permissions-provider";
import type { CurrencyCode } from "@/lib/money/currency";

/**
 * The one-time workspace currency declaration, shown in place of the catalog
 * while `tenant.currency` is null — the backend refuses to price a service
 * without it ("tenant currency must be set before a service can be priced"),
 * so this is a genuine prerequisite rather than a nag.
 *
 * There is deliberately no default selection and no inference from browser
 * locale or geography. The value is write-once and reinterprets every price
 * stored afterwards; a guess the owner did not make is not a guess this screen
 * is entitled to make for them.
 */
export function CurrencySetup({ tenantId }: { tenantId: string }) {
  const canSetCurrency = useCan("tenant.update");
  const setCurrency = useSetTenantCurrency(tenantId);
  const selectId = useId();

  const [selected, setSelected] = useState<CurrencyCode | "">("");
  const [error, setError] = useState<string | null>(null);

  if (!canSetCurrency) {
    return (
      <section className="card p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
          Currency not set yet
        </h2>
        <p className="mt-2 max-w-prose text-sm text-slate-600 dark:text-slate-400">
          Services can&apos;t be priced until this workspace has a currency. Ask an owner to set
          it in workspace settings.
        </p>
      </section>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (selected === "") {
      setError("Choose a currency.");
      return;
    }

    try {
      await setCurrency.mutateAsync(selected);
    } catch (err) {
      setError(
        apiErrorMessage(err, {
          // The generic copy for this code is deliberately vague; only this
          // screen knows the request carried a currency code.
          VALIDATION_FAILED:
            "That currency couldn't be set. It may not be supported, or this workspace may already have one.",
        })
      );
    }
  }

  return (
    <section className="card max-w-xl p-6">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
        Set your business currency
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Prices for all services in this workspace will use this currency.
      </p>

      <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
        Choose carefully. Your workspace currency cannot be changed after it is set.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4" noValidate>
        <Field id={selectId} label="Currency" error={error}>
          <select
            id={selectId}
            name="currency"
            required
            value={selected}
            disabled={setCurrency.isPending}
            aria-describedby={error ? `${selectId}-error` : undefined}
            onChange={(event) => setSelected(event.target.value as CurrencyCode)}
            className={fieldInputClass}
          >
            <option value="" disabled>
              Select a currency
            </option>
            {SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencyOptionLabel(code)}
              </option>
            ))}
          </select>
        </Field>

        <button
          type="submit"
          disabled={setCurrency.isPending || selected === ""}
          className="btn-primary h-11 w-full text-sm disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start sm:px-6"
        >
          {setCurrency.isPending ? "Setting currency…" : "Set currency"}
        </button>
      </form>
    </section>
  );
}
