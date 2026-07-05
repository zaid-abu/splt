/**
 * Unit tests for src/features/settlements/utils/balances.ts
 *
 * All functions are pure — no mocking required.
 */
import {
  getGroupBalances,
  getSimplifiedDebts,
  getExactPairwiseDebts,
  getUserBalances,
  getTotalOwedToMe,
  getTotalIOwe,
} from "@/features/settlements/utils/balances";
import {
  GROUP_1,
  GROUP_SIMPLIFY,
  USER_1,
  USER_2,
  USER_3,
  EXPENSE_EQUAL,
  EXPENSE_2,
  SETTLEMENT_1,
  USD_CURRENCY,
  identityConverter,
} from "../setup/fixtures";
import type { Expense, Group, Settlement } from "@/types";

// ─── getGroupBalances ─────────────────────────────────────────────────────────

describe("getGroupBalances", () => {
  it("returns an empty map when there are no expenses or settlements", () => {
    const result = getGroupBalances("group-1", [], [], GROUP_1, USD_CURRENCY, identityConverter);
    expect(result.size).toBe(0);
  });

  it("credits the payer and debits non-payers for each split", () => {
    // EXPENSE_EQUAL: user-1 paid $300; user-2 & user-3 each owe $100
    // user-1 is NOT debited for their own split (s.userId !== exp.paidBy)
    const balances = getGroupBalances(
      "group-1",
      [EXPENSE_EQUAL],
      [],
      GROUP_1,
      USD_CURRENCY,
      identityConverter
    );
    // user-1 (payer) should be owed 200 (100 from each of user-2 and user-3)
    expect(balances.get("user-1")).toBeCloseTo(200);
    // user-2 owes 100
    expect(balances.get("user-2")).toBeCloseTo(-100);
    // user-3 owes 100
    expect(balances.get("user-3")).toBeCloseTo(-100);
  });

  it("settlement reduces debt (toUserId -= amount, fromUserId += amount)", () => {
    // After expense: user-1 owed 200, user-2 owes 100, user-3 owes 100
    // After settlement (user-2 pays user-1 $100):
    //   user-1 balance: 200 - 100 = 100
    //   user-2 balance: -100 + 100 = 0
    const balances = getGroupBalances(
      "group-1",
      [EXPENSE_EQUAL],
      [SETTLEMENT_1],
      GROUP_1,
      USD_CURRENCY,
      identityConverter
    );
    expect(balances.get("user-1")).toBeCloseTo(100);
    expect(balances.get("user-2")).toBeCloseTo(0);
    expect(balances.get("user-3")).toBeCloseTo(-100);
  });

  it("filters to the specified groupId only", () => {
    const otherExpense: Expense = { ...EXPENSE_EQUAL, id: "exp-other", groupId: "group-other" };
    const balances = getGroupBalances(
      "group-1",
      [otherExpense],
      [],
      GROUP_1,
      USD_CURRENCY,
      identityConverter
    );
    // No balances for group-1 because the expense belongs to a different group
    expect(balances.size).toBe(0);
  });

  it("uses group currency as target when group is provided", () => {
    const converter = jest.fn((amount: number) => amount);
    getGroupBalances("group-1", [EXPENSE_EQUAL], [], GROUP_1, USD_CURRENCY, converter);
    // Should convert using group.currency (USD) as target
    expect(converter).toHaveBeenCalledWith(expect.any(Number), "USD", "USD");
  });
});

// ─── getSimplifiedDebts ───────────────────────────────────────────────────────

describe("getSimplifiedDebts", () => {
  it("returns empty array when no debts", () => {
    const result = getSimplifiedDebts(
      "group-1",
      [],
      [],
      GROUP_1,
      USD_CURRENCY,
      identityConverter
    );
    expect(result).toHaveLength(0);
  });

  it("returns a single payment for a simple 2-person debt", () => {
    // user-1 paid $300, only user-2 in split (user-2 owes $100 to user-1)
    const expense: Expense = {
      ...EXPENSE_EQUAL,
      splits: [
        { userId: "user-1", user: USER_1, amount: 200, paid: true },
        { userId: "user-2", user: USER_2, amount: 100, paid: false },
      ],
    };
    const debts = getSimplifiedDebts(
      "group-1",
      [expense],
      [],
      GROUP_1,
      USD_CURRENCY,
      identityConverter
    );
    expect(debts).toHaveLength(1);
    expect(debts[0]).toMatchObject({
      fromUserId: "user-2",
      toUserId: "user-1",
      amount: expect.closeTo(100, 2),
    });
  });

  it("minimizes transactions for 2 debtors and 1 creditor", () => {
    // user-1 paid $300; user-2 owes 100, user-3 owes 100 → 2 transactions
    const debts = getSimplifiedDebts(
      "group-1",
      [EXPENSE_EQUAL],
      [],
      GROUP_1,
      USD_CURRENCY,
      identityConverter
    );
    // user-1 is owed 200; user-2 owes 100, user-3 owes 100
    expect(debts).toHaveLength(2);
    debts.forEach((d) => expect(d.toUserId).toBe("user-1"));
    const fromIds = debts.map((d) => d.fromUserId);
    expect(fromIds).toContain("user-2");
    expect(fromIds).toContain("user-3");
  });

  it("returns empty when debt is fully settled", () => {
    // user-1 owed 200, user-2 settles 100, user-3 settles 100
    const settle2: Settlement = { ...SETTLEMENT_1, fromUserId: "user-2", amount: 100 };
    const settle3: Settlement = {
      ...SETTLEMENT_1,
      id: "settle-2",
      fromUserId: "user-3",
      amount: 100,
    };
    const debts = getSimplifiedDebts(
      "group-1",
      [EXPENSE_EQUAL],
      [settle2, settle3],
      GROUP_1,
      USD_CURRENCY,
      identityConverter
    );
    expect(debts).toHaveLength(0);
  });
});

// ─── getExactPairwiseDebts ────────────────────────────────────────────────────

describe("getExactPairwiseDebts", () => {
  it("returns empty array for no expenses", () => {
    const result = getExactPairwiseDebts(
      "group-1",
      [],
      [],
      GROUP_1,
      USD_CURRENCY,
      identityConverter
    );
    expect(result).toHaveLength(0);
  });

  it("tracks exact per-pair debt", () => {
    // EXPENSE_EQUAL: user-1 paid 300, user-2 owes 100, user-3 owes 100
    // EXPENSE_2: user-2 paid 50, user-1 owes 25
    const debts = getExactPairwiseDebts(
      "group-1",
      [EXPENSE_EQUAL, EXPENSE_2],
      [],
      GROUP_1,
      USD_CURRENCY,
      identityConverter
    );
    // user-2 owes user-1 100, but user-1 owes user-2 25 → net: user-2 owes user-1 75
    const u2u1 = debts.find((d) => d.fromUserId === "user-2" && d.toUserId === "user-1");
    expect(u2u1?.amount).toBeCloseTo(75);
    // user-3 owes user-1 100 (net, no reciprocal)
    const u3u1 = debts.find((d) => d.fromUserId === "user-3" && d.toUserId === "user-1");
    expect(u3u1?.amount).toBeCloseTo(100);
  });

  it("applies settlement to reduce exact pairwise debt", () => {
    const debts = getExactPairwiseDebts(
      "group-1",
      [EXPENSE_EQUAL],
      [SETTLEMENT_1], // user-2 pays user-1 $100
      GROUP_1,
      USD_CURRENCY,
      identityConverter
    );
    // user-2 owed 100, paid 100 → net 0 → not included
    const u2u1 = debts.find((d) => d.fromUserId === "user-2" && d.toUserId === "user-1");
    expect(u2u1).toBeUndefined();
    // user-3 still owes 100
    const u3u1 = debts.find((d) => d.fromUserId === "user-3" && d.toUserId === "user-1");
    expect(u3u1?.amount).toBeCloseTo(100);
  });

  it("is sorted by amount descending", () => {
    const debts = getExactPairwiseDebts(
      "group-1",
      [EXPENSE_EQUAL, EXPENSE_2],
      [],
      GROUP_1,
      USD_CURRENCY,
      identityConverter
    );
    for (let i = 1; i < debts.length; i++) {
      expect(debts[i - 1].amount).toBeGreaterThanOrEqual(debts[i].amount);
    }
  });
});

// ─── getUserBalances ──────────────────────────────────────────────────────────

describe("getUserBalances", () => {
  const groups: Group[] = [GROUP_1];

  it("returns empty map when user has no debts", () => {
    const result = getUserBalances(
      "user-1",
      undefined,
      [GROUP_1],
      [],
      [],
      USD_CURRENCY,
      identityConverter
    );
    expect(result.size).toBe(0);
  });

  it("shows positive balance for users who owe the current user", () => {
    // user-1 paid 300; user-2 and user-3 owe 100 each
    const balances = getUserBalances(
      "user-1",
      undefined,
      groups,
      [EXPENSE_EQUAL],
      [],
      USD_CURRENCY,
      identityConverter
    );
    // Positive = they owe me
    expect((balances.get("user-2") ?? 0)).toBeGreaterThan(0);
    expect((balances.get("user-3") ?? 0)).toBeGreaterThan(0);
  });

  it("shows negative balance when current user owes someone", () => {
    // user-2's perspective: user-2 owes user-1 100
    const balances = getUserBalances(
      "user-2",
      undefined,
      groups,
      [EXPENSE_EQUAL],
      [],
      USD_CURRENCY,
      identityConverter
    );
    // Negative = I owe them
    expect((balances.get("user-1") ?? 0)).toBeLessThan(0);
  });

  it("scopes to specific group when groupId is provided", () => {
    const group2: Group = { ...GROUP_1, id: "group-2" };
    const expInGroup2: Expense = { ...EXPENSE_2, groupId: "group-2" };

    const balances = getUserBalances(
      "user-1",
      "group-1", // scoped to group-1
      [GROUP_1, group2],
      [EXPENSE_EQUAL, expInGroup2],
      [],
      USD_CURRENCY,
      identityConverter
    );
    // Only group-1 expenses apply; user-1 paid in group-1 so they are owed
    expect(balances.size).toBeGreaterThan(0);
  });

  it("includes non-group expenses when no groupId filter", () => {
    // user-1 pays for a non-group expense, user-2 is in the split
    const nonGroupExp: Expense = {
      ...EXPENSE_EQUAL,
      groupId: undefined,
      splits: [
        { userId: "user-1", user: USER_1, amount: 50, paid: true },
        { userId: "user-2", user: USER_2, amount: 50, paid: false },
      ],
    };
    const balances = getUserBalances(
      "user-1",
      undefined,
      [], // no groups
      [nonGroupExp],
      [],
      USD_CURRENCY,
      identityConverter
    );
    expect((balances.get("user-2") ?? 0)).toBeGreaterThan(0);
  });
});

// ─── getTotalOwedToMe & getTotalIOwe ──────────────────────────────────────────

describe("getTotalOwedToMe", () => {
  it("returns 0 when user has no active debts", () => {
    const total = getTotalOwedToMe(
      "user-1",
      [GROUP_1],
      [],
      [],
      USD_CURRENCY,
      identityConverter
    );
    expect(total).toBe(0);
  });

  it("sums only positive balances (others owe me)", () => {
    // user-1 is owed 100 by user-2 and 100 by user-3 → total = 200
    const total = getTotalOwedToMe(
      "user-1",
      [GROUP_1],
      [EXPENSE_EQUAL],
      [],
      USD_CURRENCY,
      identityConverter
    );
    expect(total).toBeGreaterThan(0);
  });
});

describe("getTotalIOwe", () => {
  it("returns 0 when user owes nobody", () => {
    const total = getTotalIOwe("user-1", [GROUP_1], [], [], USD_CURRENCY, identityConverter);
    expect(total).toBe(0);
  });

  it("sums only negative balances (I owe others)", () => {
    // user-2 owes user-1 100
    const total = getTotalIOwe(
      "user-2",
      [GROUP_1],
      [EXPENSE_EQUAL],
      [],
      USD_CURRENCY,
      identityConverter
    );
    expect(total).toBeLessThan(0);
  });
});
