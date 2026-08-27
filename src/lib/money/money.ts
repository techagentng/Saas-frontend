import { currencyPrefix } from "@/lib/money/currency";

/**
 * The single conversion boundary between what an owner types (major units,
 * "19.99") and what the API stores (integer minor units, 1999).
 *
 * Every function here is exact string/integer arithmetic. There is
 * deliberately no `parseFloat(value) * 100` anywhere: 19.99 is not
 * representable in binary floating point, and `19.99 * 100` evaluates to
 * 1998.9999999999998 — truncating that yields 1998, i.e. a service silently
 * priced one kobo/cent low. This mirrors the backend's own `internal/money`
 * package, whose doc comment forbids floating-point arithmetic for the same
 * reason and provides no Float()/Major() accessor at all.
 */

/**
 * Shared by every currency on the backend allow-list — see
 * `./currency`'s CURRENCY_NAMES doc comment. Not per-currency, because the
 * backend's own `minorUnitExponent` is not per-currency either.
 */
export const MINOR_UNIT_EXPONENT = 2;

/**
 * Mirrors `model.MaxPriceMinor` (100,000,000 minor units = 1,000,000 major)
 * and the `services_price_valid` CHECK constraint. Zero is a legitimate price
 * — a free consultation or patch test — so only the upper bound is a ceiling.
 */
export const MAX_PRICE_MINOR = 100_000_000;

export type MoneyParseError =
  | "EMPTY"
  | "INVALID_FORMAT"
  | "TOO_MANY_DECIMALS"
  | "NEGATIVE"
  | "TOO_LARGE";

export type MoneyParseResult =
  | { ok: true; minor: number }
  | { ok: false; error: MoneyParseError };

/**
 * Human copy for each rejection, so the price field can explain itself without
 * a round-trip to the server. The backend remains authoritative — it revalidates
 * every price — but a locally-detectable mistake should not cost a request.
 */
export const MONEY_PARSE_MESSAGES: Record<MoneyParseError, string> = {
  EMPTY: "Enter a price.",
  INVALID_FORMAT: "Enter a price using digits only, for example 10000.00.",
  TOO_MANY_DECIMALS: "Use at most 2 decimal places.",
  NEGATIVE: "A price can't be negative.",
  TOO_LARGE: "That price is too high.",
};

/**
 * Parses a major-unit string into integer minor units.
 *
 * Accepts the shapes an owner actually types: "10000", "10,000", "10000.5",
 * "10,000.00", ".50". Grouping commas and surrounding whitespace are stripped
 * before parsing — they are display noise, not data. A trailing bare "." is
 * accepted as "no fraction" so the field stays usable mid-typing.
 *
 * Rejects anything else outright rather than salvaging a number from it: a
 * value this function cannot read exactly must not become a price.
 */
export function parseMajorAmountToMinor(input: string): MoneyParseResult {
  const trimmed = input.trim();
  if (trimmed === "") return { ok: false, error: "EMPTY" };

  // Checked before the format test so "-5" reports the actual problem rather
  // than a generic "that isn't a number".
  if (trimmed.startsWith("-")) return { ok: false, error: "NEGATIVE" };

  const withoutGrouping = trimmed.replace(/,/g, "");
  const match = /^(\d*)(?:\.(\d*))?$/.exec(withoutGrouping);
  if (!match) return { ok: false, error: "INVALID_FORMAT" };

  const [, integerDigits = "", fractionDigits = ""] = match;
  // The regex alone would accept "" and "." — both are all-optional matches.
  if (integerDigits === "" && fractionDigits === "") {
    return { ok: false, error: "INVALID_FORMAT" };
  }
  if (fractionDigits.length > MINOR_UNIT_EXPONENT) {
    return { ok: false, error: "TOO_MANY_DECIMALS" };
  }

  // Concatenating digit strings is the conversion: no multiplication, no
  // division, and therefore no rounding step that could drift.
  const minorDigits = `${integerDigits}${fractionDigits.padEnd(MINOR_UNIT_EXPONENT, "0")}`;
  // Guards Number() against a value large enough to lose integer precision,
  // before the ceiling check below (which needs an exact number to compare).
  if (minorDigits.replace(/^0+/, "").length > 15) return { ok: false, error: "TOO_LARGE" };

  const minor = Number(minorDigits);
  if (minor > MAX_PRICE_MINOR) return { ok: false, error: "TOO_LARGE" };

  return { ok: true, minor };
}

/**
 * Integer minor units → a plain major-unit string with a fixed 2 decimals and
 * no grouping ("1999" → "19.99"). This is what pre-fills the price input when
 * editing, so a round-trip through the form cannot alter a price the owner
 * never touched.
 */
export function formatMinorAsMajorInput(minor: number): string {
  const digits = String(Math.abs(Math.trunc(minor))).padStart(MINOR_UNIT_EXPONENT + 1, "0");
  const major = digits.slice(0, -MINOR_UNIT_EXPONENT);
  const fraction = digits.slice(-MINOR_UNIT_EXPONENT);
  return `${minor < 0 ? "-" : ""}${major}.${fraction}`;
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Display form with thousands separators: 1999999 → "19,999.99". */
export function formatMinorAsMajor(minor: number): string {
  const plain = formatMinorAsMajorInput(minor);
  const negative = plain.startsWith("-");
  const [major, fraction] = (negative ? plain.slice(1) : plain).split(".");
  return `${negative ? "-" : ""}${groupThousands(major)}.${fraction}`;
}

/** Full display form for a catalog row: (1999, "NGN") → "₦19.99". */
export function formatPrice(minor: number, currency: string): string {
  return `${currencyPrefix(currency)}${formatMinorAsMajor(minor)}`;
}
