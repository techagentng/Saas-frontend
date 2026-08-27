import { describe, expect, it } from "vitest";

import {
  MAX_PRICE_MINOR,
  formatMinorAsMajor,
  formatMinorAsMajorInput,
  formatPrice,
  parseMajorAmountToMinor,
} from "@/lib/money/money";

describe("parseMajorAmountToMinor", () => {
  it("converts the canonical two-decimal case without float drift", () => {
    // The whole reason this module exists: parseFloat("19.99") * 100 is
    // 1998.9999999999998, and truncating that prices the service a kobo low.
    expect(parseMajorAmountToMinor("19.99")).toEqual({ ok: true, minor: 1999 });
    expect(19.99 * 100).not.toBe(1999);
  });

  it("accepts zero, which the backend treats as a legitimate price", () => {
    expect(parseMajorAmountToMinor("0.00")).toEqual({ ok: true, minor: 0 });
    expect(parseMajorAmountToMinor("0")).toEqual({ ok: true, minor: 0 });
  });

  it("treats a bare integer as whole major units", () => {
    expect(parseMajorAmountToMinor("10000")).toEqual({ ok: true, minor: 1000000 });
    expect(parseMajorAmountToMinor("7")).toEqual({ ok: true, minor: 700 });
  });

  it("pads a single decimal place to minor units", () => {
    expect(parseMajorAmountToMinor("19.9")).toEqual({ ok: true, minor: 1990 });
    expect(parseMajorAmountToMinor(".5")).toEqual({ ok: true, minor: 50 });
  });

  it("strips grouping separators and surrounding whitespace", () => {
    expect(parseMajorAmountToMinor("10,000.00")).toEqual({ ok: true, minor: 1000000 });
    expect(parseMajorAmountToMinor("  1,234.56  ")).toEqual({ ok: true, minor: 123456 });
  });

  it("survives the classic float-drift values exactly", () => {
    const cases: Array<[string, number]> = [
      ["0.01", 1],
      ["0.07", 7],
      ["0.29", 29],
      ["1.10", 110],
      ["1.15", 115],
      ["2.675", 0], // rejected below; listed to document it is never rounded
      ["8.20", 820],
      ["1234.56", 123456],
    ];

    for (const [input, expected] of cases) {
      const result = parseMajorAmountToMinor(input);
      if (input === "2.675") {
        expect(result).toEqual({ ok: false, error: "TOO_MANY_DECIMALS" });
      } else {
        expect(result, input).toEqual({ ok: true, minor: expected });
      }
    }
  });

  it("rejects more decimals than the currency has minor units", () => {
    expect(parseMajorAmountToMinor("19.999")).toEqual({ ok: false, error: "TOO_MANY_DECIMALS" });
    expect(parseMajorAmountToMinor("0.000")).toEqual({ ok: false, error: "TOO_MANY_DECIMALS" });
  });

  it("rejects a negative amount", () => {
    expect(parseMajorAmountToMinor("-1")).toEqual({ ok: false, error: "NEGATIVE" });
    expect(parseMajorAmountToMinor("-0.01")).toEqual({ ok: false, error: "NEGATIVE" });
  });

  it("rejects empty input", () => {
    expect(parseMajorAmountToMinor("")).toEqual({ ok: false, error: "EMPTY" });
    expect(parseMajorAmountToMinor("   ")).toEqual({ ok: false, error: "EMPTY" });
  });

  it("rejects anything that is not a plain decimal number", () => {
    for (const input of ["abc", "19.99.99", "1e3", "₦19.99", "19 99", "1/2", "."]) {
      expect(parseMajorAmountToMinor(input), input).toEqual({
        ok: false,
        error: "INVALID_FORMAT",
      });
    }
  });

  it("enforces the backend's price ceiling", () => {
    expect(parseMajorAmountToMinor("1000000.00")).toEqual({ ok: true, minor: MAX_PRICE_MINOR });
    expect(parseMajorAmountToMinor("1000000.01")).toEqual({ ok: false, error: "TOO_LARGE" });
    // Large enough that Number() would lose integer precision — refused before
    // it is ever converted, rather than compared as an inexact value.
    expect(parseMajorAmountToMinor("99999999999999999999")).toEqual({
      ok: false,
      error: "TOO_LARGE",
    });
  });
});

describe("formatMinorAsMajorInput", () => {
  it("round-trips through the parser unchanged", () => {
    for (const minor of [0, 1, 50, 700, 1999, 123456, MAX_PRICE_MINOR]) {
      const asInput = formatMinorAsMajorInput(minor);
      expect(parseMajorAmountToMinor(asInput), asInput).toEqual({ ok: true, minor });
    }
  });

  it("always shows both minor digits and no grouping", () => {
    expect(formatMinorAsMajorInput(1999)).toBe("19.99");
    expect(formatMinorAsMajorInput(0)).toBe("0.00");
    expect(formatMinorAsMajorInput(5)).toBe("0.05");
    expect(formatMinorAsMajorInput(1000000)).toBe("10000.00");
  });
});

describe("formatMinorAsMajor", () => {
  it("groups thousands for display", () => {
    expect(formatMinorAsMajor(1999)).toBe("19.99");
    expect(formatMinorAsMajor(1000000)).toBe("10,000.00");
    expect(formatMinorAsMajor(MAX_PRICE_MINOR)).toBe("1,000,000.00");
    expect(formatMinorAsMajor(0)).toBe("0.00");
  });
});

describe("formatPrice", () => {
  it("prefixes a known currency with its symbol", () => {
    expect(formatPrice(1999, "NGN")).toBe("₦19.99");
    expect(formatPrice(1000000, "GBP")).toBe("£10,000.00");
  });

  it("falls back to the code for a currency this build does not recognize", () => {
    // The backend allow-list is expected to grow; showing the code is correct,
    // whereas guessing a symbol would not be.
    expect(formatPrice(1999, "XOF")).toBe("XOF 19.99");
  });
});
