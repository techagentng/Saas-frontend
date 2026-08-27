/**
 * The backend's currency allow-list, mirrored exactly.
 *
 * Source of truth: `internal/money/money.go` — `supportedCurrencies` /
 * `SupportedCurrencies()`. The order below is that function's order, not
 * alphabetical, so the two lists are diffable by eye. The allow-list is not
 * exposed by any HTTP endpoint (the Go doc comment says so explicitly), so it
 * cannot be fetched at runtime; this constant is the one permitted copy, and
 * it is a copy of a verified contract rather than a speculative second list.
 *
 * Sending a code that is not on this list returns VALIDATION_FAILED
 * ("unsupported currency"), and the backend rejects rather than normalizes —
 * "ngn" and " NGN" are refused, not upcased or trimmed. Nothing here
 * normalizes user input for the same reason.
 */
export const SUPPORTED_CURRENCIES = ["NGN", "USD", "EUR", "GBP", "GHS", "KES", "ZAR"] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Every currency on the allow-list has an ISO 4217 minor-unit exponent of 2,
 * which the backend's `minorUnitExponent` constant depends on and documents.
 * Adding a currency with a different exponent (JPY at 0, KWD at 3) is a
 * backend change to `Format` first; this module would then need a per-currency
 * exponent rather than the single constant in `./money`.
 */
export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  NGN: "Nigerian Naira",
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  GHS: "Ghanaian Cedi",
  KES: "Kenyan Shilling",
  ZAR: "South African Rand",
};

/** Presentational only — never sent to the backend, which speaks only in codes. */
export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
};

export function isSupportedCurrency(value: string | null | undefined): value is CurrencyCode {
  return value != null && (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

/** e.g. "NGN — Nigerian Naira". Used in the one-time currency picker. */
export function currencyOptionLabel(code: CurrencyCode): string {
  return `${code} — ${CURRENCY_NAMES[code]}`;
}

/**
 * Symbol when this build recognizes the code, otherwise the code itself
 * followed by a space. A tenant row could in principle hold a code this
 * frontend release doesn't know yet (the backend allow-list is expected to
 * grow); showing "XOF 1,000.00" is correct and honest, whereas falling back to
 * a wrong symbol would not be.
 */
export function currencyPrefix(code: string): string {
  return isSupportedCurrency(code) ? CURRENCY_SYMBOLS[code] : `${code} `;
}
