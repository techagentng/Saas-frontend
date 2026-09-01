import { businessTypeLabel } from "@/lib/tenant/business-type-labels";
import type { Tenant } from "@/types/tenant";

/**
 * Final review of what was actually persisted. Reads from the saved tenant,
 * not the in-memory draft, so it shows the real state completion will be
 * judged against rather than what the user typed but has not saved.
 */
export function ProfileReview({ tenant }: { tenant: Tenant }) {
  const rows: { label: string; value: string; muted?: boolean }[] = [
    { label: "Business name", value: tenant.name },
    { label: "Business type", value: businessTypeLabel(tenant.business_type) },
    { label: "Timezone", value: tenant.timezone ?? "Not set", muted: !tenant.timezone },
    {
      label: "Description",
      value: tenant.description?.trim() ? tenant.description : "Not added",
      muted: !tenant.description?.trim(),
    },
    {
      label: "Contact email",
      value: tenant.contact_email ?? "Not added",
      muted: !tenant.contact_email,
    },
    {
      label: "Contact phone",
      value: tenant.contact_phone ?? "Not added",
      muted: !tenant.contact_phone,
    },
    { label: "Public link", value: `/book/${tenant.slug}` },
  ];

  return (
    <div className="card overflow-hidden">
      <dl className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:gap-6">
            <dt className="w-40 shrink-0 text-sm font-medium text-slate-500 dark:text-slate-400">{row.label}</dt>
            <dd
              className={`min-w-0 break-words text-sm ${row.muted ? "text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-white"}`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
