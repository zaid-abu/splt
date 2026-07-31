import type { SplitSource } from "./types";
import { getMaximumSupportedMinorAmount } from "./currency";
import { calculateSplits, minorToMajor, parseMinorInput, validateSplitSources } from "./splits";

function participants(...ids: string[]): SplitSource[] {
  return ids.map((id, i) => ({ userId: id, position: i }));
}

function split(userId: string, amountMinor: number, position: number) {
  return { userId, amountMinor, position };
}

function source(userId: string, position: number, extra: Partial<SplitSource>): SplitSource {
  return { userId, position, ...extra };
}

// ─── parseMinorInput ────────────────────────────────────────────────────────

describe("parseMinorInput", () => {
  it("parses whole number for 2-decimal currency", () => {
    expect(parseMinorInput("10", "USD")).toBe(1000);
  });

  it("parses with 2 decimal places for USD", () => {
    expect(parseMinorInput("10.50", "USD")).toBe(1050);
  });

  it("parses single decimal digit for USD", () => {
    expect(parseMinorInput("1.5", "USD")).toBe(150);
  });

  it("throws for more than 2 decimal places in USD", () => {
    expect(() => parseMinorInput("1.001", "USD")).toThrow("At most 2 decimal places");
  });

  it("throws for 6 decimal places in USD", () => {
    expect(() => parseMinorInput("1.123456", "USD")).toThrow("At most 2 decimal places");
  });

  it("parses whole number for JPY (0 decimals)", () => {
    expect(parseMinorInput("500", "JPY")).toBe(500);
  });

  it("throws for any decimal in JPY", () => {
    expect(() => parseMinorInput("1.50", "JPY")).toThrow("At most 0 decimal places");
  });

  it("throws for decimal in KRW", () => {
    expect(() => parseMinorInput("1.99", "KRW")).toThrow("At most 0 decimal places");
  });

  it("parses negative amount", () => {
    expect(parseMinorInput("-10.50", "USD")).toBe(-1050);
  });

  it("rejects unsafe integer", () => {
    expect(() => parseMinorInput("90071992547409922", "USD")).toThrow("Amount out of range");
  });

  it("rejects unknown currencies and incomplete decimals", () => {
    expect(() => parseMinorInput("1", "XXX")).toThrow("Unknown currency");
    expect(() => parseMinorInput("", "USD")).toThrow("Invalid format");
    expect(() => parseMinorInput("1.", "USD")).toThrow("Invalid format");
  });

  it("trims input and normalizes negative zero", () => {
    expect(parseMinorInput("  -0.00  ", "USD")).toBe(0);
  });

  it("accepts the supported USD and JPY ceilings and rejects one above", () => {
    expect(parseMinorInput("9999999999.99", "USD")).toBe(999999999999);
    expect(() => parseMinorInput("10000000000.00", "USD")).toThrow("Amount out of range");
    expect(parseMinorInput("9999999999", "JPY")).toBe(9999999999);
    expect(() => parseMinorInput("10000000000", "JPY")).toThrow("Amount out of range");
    expect(minorToMajor(getMaximumSupportedMinorAmount("USD"), "USD")).toBe(9999999999.99);
    expect(() => minorToMajor(getMaximumSupportedMinorAmount("USD") + 1, "USD")).toThrow(
      "Amount out of range"
    );
    expect(minorToMajor(getMaximumSupportedMinorAmount("JPY"), "JPY")).toBe(9999999999);
    expect(() => minorToMajor(getMaximumSupportedMinorAmount("JPY") + 1, "JPY")).toThrow(
      "Amount out of range"
    );
  });
});

// ─── minorToMajor ───────────────────────────────────────────────────────────

describe("minorToMajor", () => {
  it("converts USD minor to major", () => {
    expect(minorToMajor(1050, "USD")).toBe(10.5);
  });

  it("converts JPY minor to major (no decimals)", () => {
    expect(minorToMajor(500, "JPY")).toBe(500);
  });

  it("converts zero", () => {
    expect(minorToMajor(0, "USD")).toBe(0);
  });

  it("converts negative", () => {
    expect(minorToMajor(-1050, "USD")).toBe(-10.5);
  });
});

// ─── validateSplitSources ───────────────────────────────────────────────────

describe("validateSplitSources", () => {
  describe("custom", () => {
    it("passes when amounts total matches", () => {
      expect(() =>
        validateSplitSources(100, "custom", [
          source("a", 0, { amountMinor: 60 }),
          source("b", 1, { amountMinor: 40 }),
        ])
      ).not.toThrow();
    });

    it("throws when amounts do not total expected", () => {
      expect(() =>
        validateSplitSources(100, "custom", [source("a", 0, { amountMinor: 99 })])
      ).toThrow("Amounts must total 100");
    });
  });

  describe("percentage", () => {
    it("passes when percentages total 1,000,000", () => {
      expect(() =>
        validateSplitSources(100, "percentage", [
          source("a", 0, { percentageUnits: 500000 }),
          source("b", 1, { percentageUnits: 500000 }),
        ])
      ).not.toThrow();
    });

    it("throws when percentages do not total 1,000,000", () => {
      expect(() =>
        validateSplitSources(100, "percentage", [
          source("a", 0, { percentageUnits: 333333 }),
          source("b", 1, { percentageUnits: 333333 }),
        ])
      ).toThrow("Percentages must total 1,000,000");
    });

    it("throws for negative percentage", () => {
      expect(() =>
        validateSplitSources(100, "percentage", [
          source("a", 0, { percentageUnits: -100000 }),
          source("b", 1, { percentageUnits: 1100000 }),
        ])
      ).toThrow("Percentage must be positive");
    });
  });

  describe("shares", () => {
    it("passes with positive shares", () => {
      expect(() =>
        validateSplitSources(100, "shares", [
          source("a", 0, { shareUnits: 1000000 }),
          source("b", 1, { shareUnits: 2000000 }),
        ])
      ).not.toThrow();
    });

    it("throws for zero shares", () => {
      expect(() =>
        validateSplitSources(100, "shares", [source("a", 0, { shareUnits: 0 })])
      ).toThrow("Share must be positive");
    });

    it("throws for negative shares", () => {
      expect(() =>
        validateSplitSources(100, "shares", [source("a", 0, { shareUnits: -1 })])
      ).toThrow("Share must be positive");
    });
  });

  it("throws with zero participants", () => {
    expect(() => validateSplitSources(100, "equal", [])).toThrow(
      "At least one participant is required"
    );
  });
});

// ─── calculateSplits ────────────────────────────────────────────────────────

describe("calculateSplits", () => {
  it("conserves a maximum-size percentage allocation with safe integers", () => {
    const total = 999_999_999_999;
    const result = calculateSplits(total, "percentage", [
      source("a", 0, { percentageUnits: 333333 }),
      source("b", 1, { percentageUnits: 333333 }),
      source("c", 2, { percentageUnits: 333334 }),
    ]);
    expect(result.reduce((sum, splitResult) => sum + splitResult.amountMinor, 0)).toBe(total);
    expect(result.every((splitResult) => Number.isSafeInteger(splitResult.amountMinor))).toBe(true);
  });

  it("conserves a maximum-size shares allocation with safe integers", () => {
    const total = 999_999_999_999;
    const result = calculateSplits(total, "shares", [
      source("a", 0, { shareUnits: 333333333333 }),
      source("b", 1, { shareUnits: 333333333333 }),
      source("c", 2, { shareUnits: 333333333333 }),
    ]);
    expect(result.reduce((sum, splitResult) => sum + splitResult.amountMinor, 0)).toBe(total);
    expect(result.every((splitResult) => Number.isSafeInteger(splitResult.amountMinor))).toBe(true);
  });

  describe("equal", () => {
    it("splits equally with remainder to lowest position", () => {
      expect(calculateSplits(100, "equal", participants("a", "b", "c"))).toEqual([
        split("a", 34, 0),
        split("b", 33, 1),
        split("c", 33, 2),
      ]);
    });

    it("splits exactly when divisible", () => {
      expect(calculateSplits(100, "equal", participants("a", "b"))).toEqual([
        split("a", 50, 0),
        split("b", 50, 1),
      ]);
    });

    it("throws for no participants", () => {
      expect(() => calculateSplits(100, "equal", [])).toThrow(
        "At least one participant is required"
      );
    });

    it("handles zero total", () => {
      expect(calculateSplits(0, "equal", participants("a", "b"))).toEqual([
        split("a", 0, 0),
        split("b", 0, 1),
      ]);
    });

    it("distributes remainder by position then userId", () => {
      const result = calculateSplits(10, "equal", [source("z", 0), source("a", 1), source("m", 2)]);
      // floors: 3, 3, 3; remainder: 1
      // sorted by contiguous position: z, a, m; z gets the remainder
      expect(result).toEqual([split("z", 4, 0), split("a", 3, 1), split("m", 3, 2)]);
    });

    it("handles single participant", () => {
      expect(calculateSplits(50, "equal", participants("a"))).toEqual([split("a", 50, 0)]);
    });
  });

  describe("percentage", () => {
    it("allocates by percentage with remainder distribution", () => {
      const result = calculateSplits(101, "percentage", [
        source("a", 0, { percentageUnits: 333333 }),
        source("b", 1, { percentageUnits: 333333 }),
        source("c", 2, { percentageUnits: 333334 }),
      ]);
      expect(result.map((s) => s.amountMinor)).toEqual([34, 34, 33]);
    });

    it("handles exact percentage split", () => {
      const result = calculateSplits(
        200,
        "percentage",
        participants("a", "b").map((p, i) => ({
          ...p,
          percentageUnits: i === 0 ? 250000 : 750000,
        }))
      );
      // a: 200 * 250000 / 1_000_000 = 50
      // b: 200 * 750000 / 1_000_000 = 150
      expect(result).toEqual([split("a", 50, 0), split("b", 150, 1)]);
    });
  });

  describe("shares", () => {
    it("allocates by share ratio with remainder distribution", () => {
      const result = calculateSplits(5, "shares", [
        source("a", 0, { shareUnits: 1000000 }),
        source("b", 1, { shareUnits: 2000000 }),
      ]);
      expect(result.map((s) => s.amountMinor)).toEqual([2, 3]);
    });

    it("handles equal shares", () => {
      const result = calculateSplits(10, "shares", [
        source("a", 0, { shareUnits: 1000000 }),
        source("b", 1, { shareUnits: 1000000 }),
        source("c", 2, { shareUnits: 1000000 }),
      ]);
      // each: floor(10 * 1M / 3M) = 3; remainder = 1
      // sorted by pos: a,b,c → a gets extra
      expect(result).toEqual([split("a", 4, 0), split("b", 3, 1), split("c", 3, 2)]);
    });
  });

  describe("custom", () => {
    it("returns exact amounts from participants", () => {
      const result = calculateSplits(100, "custom", [
        source("a", 0, { amountMinor: 60 }),
        source("b", 1, { amountMinor: 40 }),
      ]);
      expect(result).toEqual([split("a", 60, 0), split("b", 40, 1)]);
    });
  });

  describe("remainder distribution edge cases", () => {
    it("ties broken by position ascending then userId ascending", () => {
      const result = calculateSplits(7, "equal", [source("b", 0), source("a", 1), source("c", 2)]);
      // floors: 2, 2, 2; remainder: 1 goes to position zero
      expect(result).toEqual([split("b", 3, 0), split("a", 2, 1), split("c", 2, 2)]);
    });
  });
});
