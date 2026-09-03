import { formatMinorAsMajor, formatPrice } from "@/lib/money/money";

/**
 * Customer-facing price for one service.
 *
 * `currency` is the catalog-level ISO 4217 code, or `null` when the business
 * has not declared one (Scheduling S1 permits this). With a currency we reuse
 * the same `formatPrice` the owner dashboard uses, so a price reads
 * identically on both sides ("₦8,000.00"). Without one we show the bare
 * grouped amount ("8,000.00") — never guessing NGN, never crashing.
 *
 * Returns a visible string and a screen-reader string separately: the symbol
 * is decorative, so assistive tech gets the amount followed by the spelled or
 * literal currency code instead, matching `ServiceRow` in the dashboard.
 */
export function formatServicePrice(
  priceMinor: number,
  currency: string | null
): { display: string; accessible: string } {
  const amount = formatMinorAsMajor(priceMinor);

  if (currency) {
    return { display: formatPrice(priceMinor, currency), accessible: `${amount} ${currency}` };
  }

  return { display: amount, accessible: amount };
}
