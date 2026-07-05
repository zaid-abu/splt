/**
 * Unit tests for src/features/expenses/utils/splits.ts
 *
 * All functions are pure — no mocking required.
 */
import {
  calculateEqualShare,
  calculateCustomSum,
  calculatePercentSum,
  generateSplits,
  type SplitUser,
} from "@/features/expenses/utils/splits";
import type { User } from "@/types";
import { USER_1, USER_2, USER_3 } from "../setup/fixtures";

const members: SplitUser[] = [
  { id: "user-1" },
  { id: "user-2" },
  { id: "user-3" },
];

const fullMembers: User[] = [USER_1, USER_2, USER_3];

// ─── calculateEqualShare ──────────────────────────────────────────────────────

describe("calculateEqualShare", () => {
  it("divides amount equally among members", () => {
    expect(calculateEqualShare(members, 300)).toBeCloseTo(100);
  });

  it("handles 2 members", () => {
    expect(calculateEqualShare([{ id: "a" }, { id: "b" }], 50)).toBeCloseTo(25);
  });

  it("returns 0 when no members to avoid division by zero", () => {
    expect(calculateEqualShare([], 300)).toBe(0);
  });

  it("handles non-integer results (floating point)", () => {
    // 100 / 3 = 33.333...
    const share = calculateEqualShare(members, 100);
    expect(share).toBeCloseTo(33.33, 2);
  });

  it("handles single member — full amount", () => {
    expect(calculateEqualShare([{ id: "a" }], 200)).toBe(200);
  });
});

// ─── calculateCustomSum ───────────────────────────────────────────────────────

describe("calculateCustomSum", () => {
  it("sums custom amounts for all included members", () => {
    const customAmounts = { "user-1": "100", "user-2": "80", "user-3": "70" };
    expect(calculateCustomSum(members, customAmounts)).toBeCloseTo(250);
  });

  it("falls back to 0 for missing keys", () => {
    const customAmounts = { "user-1": "100" };
    expect(calculateCustomSum(members, customAmounts)).toBeCloseTo(100);
  });

  it("handles empty members array", () => {
    expect(calculateCustomSum([], { "user-1": "100" })).toBe(0);
  });

  it("handles non-numeric string values gracefully (parseFloat returns NaN → 0)", () => {
    const customAmounts = { "user-1": "abc", "user-2": "50" };
    expect(calculateCustomSum(members, customAmounts)).toBeCloseTo(50);
  });

  it("handles decimal amounts", () => {
    const customAmounts = { "user-1": "33.33", "user-2": "33.33", "user-3": "33.34" };
    expect(calculateCustomSum(members, customAmounts)).toBeCloseTo(100);
  });
});

// ─── calculatePercentSum ──────────────────────────────────────────────────────

describe("calculatePercentSum", () => {
  it("sums percentages for all members", () => {
    const percentages = { "user-1": "40", "user-2": "30", "user-3": "30" };
    expect(calculatePercentSum(members, percentages)).toBeCloseTo(100);
  });

  it("falls back to 0 for missing keys", () => {
    const percentages = { "user-1": "60" };
    expect(calculatePercentSum(members, percentages)).toBeCloseTo(60);
  });

  it("handles empty members array", () => {
    expect(calculatePercentSum([], { "user-1": "50" })).toBe(0);
  });

  it("handles non-numeric values (returns 0)", () => {
    const percentages = { "user-1": "abc", "user-2": "40" };
    expect(calculatePercentSum(members, percentages)).toBeCloseTo(40);
  });
});

// ─── generateSplits ───────────────────────────────────────────────────────────

describe("generateSplits", () => {
  describe("equal split method", () => {
    it("returns equal share for each member", () => {
      const splits = generateSplits(fullMembers, 300, "equal", {}, {});
      expect(splits).toHaveLength(3);
      splits.forEach((s) => {
        expect(s.amount).toBeCloseTo(100);
      });
    });

    it("includes userId and user object", () => {
      const splits = generateSplits([USER_1, USER_2], 200, "equal", {}, {});
      expect(splits[0].userId).toBe("user-1");
      expect(splits[0].user).toEqual(USER_1);
      expect(splits[1].userId).toBe("user-2");
      expect(splits[1].user).toEqual(USER_2);
    });

    it("returns single split when only 1 member", () => {
      const splits = generateSplits([USER_1], 150, "equal", {}, {});
      expect(splits).toHaveLength(1);
      expect(splits[0].amount).toBe(150);
    });
  });

  describe("custom split method", () => {
    it("assigns each member their custom amount", () => {
      const customAmounts = { "user-1": "120", "user-2": "100", "user-3": "80" };
      const splits = generateSplits(fullMembers, 300, "custom", customAmounts, {});

      expect(splits.find((s) => s.userId === "user-1")?.amount).toBeCloseTo(120);
      expect(splits.find((s) => s.userId === "user-2")?.amount).toBeCloseTo(100);
      expect(splits.find((s) => s.userId === "user-3")?.amount).toBeCloseTo(80);
    });

    it("returns 0 for members with no custom amount", () => {
      const splits = generateSplits(fullMembers, 100, "custom", { "user-1": "100" }, {});
      expect(splits.find((s) => s.userId === "user-2")?.amount).toBe(0);
      expect(splits.find((s) => s.userId === "user-3")?.amount).toBe(0);
    });
  });

  describe("percentage split method", () => {
    it("computes amount as (total * pct / 100)", () => {
      const customPercentages = { "user-1": "50", "user-2": "30", "user-3": "20" };
      const splits = generateSplits(fullMembers, 200, "percentage", {}, customPercentages);

      expect(splits.find((s) => s.userId === "user-1")?.amount).toBeCloseTo(100);
      expect(splits.find((s) => s.userId === "user-2")?.amount).toBeCloseTo(60);
      expect(splits.find((s) => s.userId === "user-3")?.amount).toBeCloseTo(40);
    });

    it("returns 0 for members with missing percentage", () => {
      const splits = generateSplits(fullMembers, 100, "percentage", {}, { "user-1": "100" });
      expect(splits.find((s) => s.userId === "user-2")?.amount).toBe(0);
    });
  });

  it("returns empty array when no members", () => {
    const splits = generateSplits([], 300, "equal", {}, {});
    expect(splits).toHaveLength(0);
  });
});
