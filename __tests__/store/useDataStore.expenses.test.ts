/**
 * Tests for useDataStore — expense CRUD: add, update, delete, get, getGroupExpenses.
 */

jest.mock("@/config/env", () => ({
  env: {
    EXPO_PUBLIC_SUPABASE_URL: "http://localhost",
    EXPO_PUBLIC_SUPABASE_ANON_KEY: "test-key",
  },
}));
jest.mock("react-native-url-polyfill/auto", () => ({}));

jest.mock("@/store/useUIStore", () => ({
  useUIStore: {
    getState: () => ({
      preferredCurrency: { code: "USD" },
      convertCurrency: (amount: number) => amount,
    }),
  },
}));

import { useDataStore } from "@/store/useDataStore";
import { USER_1, USER_2, USER_3, GROUP_1 } from "../setup/fixtures";
import type { Group } from "@/types";

beforeEach(() => {
  useDataStore.setState({
    groups: [GROUP_1],
    expenses: [],
    activities: [],
    settlements: [],
  });
});

// Shared expense input factory
const makeExpenseInput = (overrides = {}) => ({
  groupId: "group-1",
  title: "Dinner",
  amount: 300,
  currency: "USD",
  category: "food" as const,
  paidBy: "user-1",
  splits: [
    { userId: "user-1", user: USER_1, amount: 100 },
    { userId: "user-2", user: USER_2, amount: 100 },
    { userId: "user-3", user: USER_3, amount: 100 },
  ],
  splitMethod: "equal" as const,
  date: new Date("2025-03-10"),
  ...overrides,
});

// ─── addExpense ───────────────────────────────────────────────────────────────

describe("useDataStore.addExpense", () => {
  it("adds the expense to state", async () => {
    await useDataStore.getState().addExpense(makeExpenseInput(), USER_1);
    expect(useDataStore.getState().expenses).toHaveLength(1);
    expect(useDataStore.getState().expenses[0].title).toBe("Dinner");
  });

  it("correctly sets split.paid based on paidBy", async () => {
    await useDataStore.getState().addExpense(makeExpenseInput(), USER_1);
    const expense = useDataStore.getState().expenses[0];
    const paidByUserSplit = expense.splits.find((s) => s.userId === "user-1");
    const otherSplit = expense.splits.find((s) => s.userId === "user-2");
    expect(paidByUserSplit?.paid).toBe(true);
    expect(otherSplit?.paid).toBe(false);
  });

  it("logs an expense activity", async () => {
    await useDataStore.getState().addExpense(makeExpenseInput(), USER_1);
    const { activities } = useDataStore.getState();
    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe("expense");
    expect(activities[0].amount).toBe(300);
  });

  it("updates the group's totalExpenses", async () => {
    await useDataStore.getState().addExpense(makeExpenseInput(), USER_1);
    const group = useDataStore.getState().getGroup("group-1");
    expect(group?.totalExpenses).toBeGreaterThan(0);
  });

  it("works for non-group expenses (no groupId)", async () => {
    await useDataStore.getState().addExpense(
      makeExpenseInput({ groupId: undefined }),
      USER_1
    );
    expect(useDataStore.getState().expenses).toHaveLength(1);
    expect(useDataStore.getState().expenses[0].groupId).toBeUndefined();
  });

  it("sets paidByUser from splits", async () => {
    await useDataStore.getState().addExpense(makeExpenseInput(), USER_1);
    const expense = useDataStore.getState().expenses[0];
    expect(expense.paidByUser.id).toBe("user-1");
  });
});

// ─── updateExpense ────────────────────────────────────────────────────────────

describe("useDataStore.updateExpense", () => {
  let expenseId: string;

  beforeEach(async () => {
    const expense = await useDataStore.getState().addExpense(makeExpenseInput(), USER_1);
    expenseId = expense.id;
  });

  it("updates the expense fields", async () => {
    await useDataStore.getState().updateExpense(
      expenseId,
      makeExpenseInput({ title: "Updated Dinner", amount: 400 }),
      USER_1
    );
    const updated = useDataStore.getState().getExpense(expenseId);
    expect(updated?.title).toBe("Updated Dinner");
    expect(updated?.amount).toBe(400);
  });

  it("logs an update activity", async () => {
    await useDataStore.getState().updateExpense(
      expenseId,
      makeExpenseInput({ title: "Updated" }),
      USER_1
    );
    const { activities } = useDataStore.getState();
    // Should have 2 activities: original add + update
    expect(activities.length).toBeGreaterThan(1);
    expect(activities[0].description).toContain("updated");
  });

  it("throws when expense id does not exist", async () => {
    await expect(
      useDataStore.getState().updateExpense("nonexistent", makeExpenseInput(), USER_1)
    ).rejects.toThrow("Expense not found");
  });

  it("adjusts group totalExpenses (old amount subtracted, new added)", async () => {
    const groupBefore = useDataStore.getState().getGroup("group-1");
    const totalBefore = groupBefore?.totalExpenses ?? 0;

    await useDataStore.getState().updateExpense(
      expenseId,
      makeExpenseInput({ amount: 600 }), // was 300, now 600
      USER_1
    );
    const groupAfter = useDataStore.getState().getGroup("group-1");
    expect((groupAfter?.totalExpenses ?? 0)).toBeCloseTo(totalBefore - 300 + 600);
  });
});

// ─── deleteExpense ────────────────────────────────────────────────────────────

describe("useDataStore.deleteExpense", () => {
  let expenseId: string;

  beforeEach(async () => {
    const expense = await useDataStore.getState().addExpense(makeExpenseInput(), USER_1);
    expenseId = expense.id;
  });

  it("removes the expense from state", async () => {
    await useDataStore.getState().deleteExpense(expenseId);
    expect(useDataStore.getState().expenses).toHaveLength(0);
  });

  it("decrements group totalExpenses", async () => {
    const groupBefore = useDataStore.getState().getGroup("group-1");
    const totalBefore = groupBefore?.totalExpenses ?? 0;
    await useDataStore.getState().deleteExpense(expenseId);
    const groupAfter = useDataStore.getState().getGroup("group-1");
    expect((groupAfter?.totalExpenses ?? 0)).toBeCloseTo(totalBefore - 300);
  });

  it("removes linked expense activities", async () => {
    const actsBefore = useDataStore.getState().activities.length;
    await useDataStore.getState().deleteExpense(expenseId);
    const actsAfter = useDataStore.getState().activities.length;
    expect(actsAfter).toBeLessThan(actsBefore);
  });

  it("does not throw for a non-existent id", async () => {
    await expect(useDataStore.getState().deleteExpense("nonexistent")).resolves.not.toThrow();
  });
});

// ─── getExpense ───────────────────────────────────────────────────────────────

describe("useDataStore.getExpense", () => {
  it("returns expense by id", async () => {
    const expense = await useDataStore.getState().addExpense(makeExpenseInput(), USER_1);
    expect(useDataStore.getState().getExpense(expense.id)).toBeDefined();
  });

  it("returns undefined for unknown id", () => {
    expect(useDataStore.getState().getExpense("nonexistent")).toBeUndefined();
  });
});

// ─── getGroupExpenses ─────────────────────────────────────────────────────────

describe("useDataStore.getGroupExpenses", () => {
  it("returns only expenses for the specified group", async () => {
    await useDataStore.getState().addExpense(makeExpenseInput({ groupId: "group-1" }), USER_1);
    await useDataStore.getState().addExpense(makeExpenseInput({ groupId: undefined }), USER_1);
    const groupExpenses = useDataStore.getState().getGroupExpenses("group-1");
    expect(groupExpenses).toHaveLength(1);
    expect(groupExpenses[0].groupId).toBe("group-1");
  });

  it("returns expenses sorted by date descending", async () => {
    await useDataStore.getState().addExpense(
      makeExpenseInput({ date: new Date("2025-01-01") }),
      USER_1
    );
    await useDataStore.getState().addExpense(
      makeExpenseInput({ date: new Date("2025-06-01") }),
      USER_1
    );
    const expenses = useDataStore.getState().getGroupExpenses("group-1");
    expect(expenses[0].date.getTime()).toBeGreaterThan(expenses[1].date.getTime());
  });
});
