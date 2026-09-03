import { formatDuration } from "@/lib/scheduling/duration";

import { formatCivilDate } from "./date";
import { formatServicePrice } from "./format";

export type BookingSummaryData = {
  businessName: string;
  serviceName: string;
  durationMinutes: number;
  technicianName: string;
  /** `YYYY-MM-DD`. */
  date: string;
  /** `HH:MM`. */
  start: string;
  /** `HH:MM`. */
  end: string;
  priceMinor: number;
  /** Catalogue-level ISO code, or null (Scheduling S1 allows no currency). */
  currency: string | null;
  /** Optional extra rows (e.g. the customer's details on the review step). */
  extraRows?: { label: string; value: React.ReactNode }[];
};

/**
 * The concise, read-only booking summary — real selected data only. Used on
 * the review/checkout step and again on the confirmation. Price uses the
 * shared null-safe formatter; no fees, no fabricated currency.
 */
export function BookingSummary({ data }: { data: BookingSummaryData }) {
  const price = formatServicePrice(data.priceMinor, data.currency);

  return (
    <dl className="overflow-hidden rounded-2xl border border-[#E7DAD0] bg-white/70 text-sm dark:border-slate-800 dark:bg-slate-900/50">
      <Row label="Business" value={data.businessName} />
      <Row
        label="Service"
        value={
          <>
            {data.serviceName}
            <span className="block font-normal text-slate-500 dark:text-slate-400">
              {formatDuration(data.durationMinutes)}
            </span>
          </>
        }
      />
      <Row label="Technician" value={data.technicianName} />
      <Row label="Date" value={formatCivilDate(data.date)} />
      <Row label="Time" value={`${data.start} – ${data.end}`} />
      <Row
        label="Price"
        value={
          <>
            <span aria-hidden="true">{price.display}</span>
            <span className="sr-only">{price.accessible}</span>
          </>
        }
      />
      {data.extraRows?.map((row) => (
        <Row key={row.label} label={row.label} value={row.value} />
      ))}
    </dl>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#E7DAD0] p-4 last:border-b-0 dark:border-slate-800">
      <dt className="shrink-0 font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}
