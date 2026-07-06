/**
 * Tests for src/features/expenses/services/api.ts (expensesApi)
 *
 * Uses a chainable Supabase mock to test each method in isolation.
 */

jest.mock("@/services/supabase/client");
jest.mock("react-native-url-polyfill/auto", () => ({}));

import { supabase } from "@/services/supabase/client";
import { expensesApi } from "@/features/expenses/services/api";
import { DB_EXPENSE_ROW } from "../setup/fixtures";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockFrom = supabase.from as jest.Mock;

/**
 * Builds a chainable mock for: from(t).select(s).eq(...).order(...).returns().
 * The tail method (single / returns / the last in chain) resolves with `result`.
 */
function makeChain(terminalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, any> = {};
  const methods = ["select", "eq", "in", "or", "order", "returns", "insert", "update", "delete", "single", "maybeSingle", "limit", "range"];
  methods.forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  // Make the chain itself awaitable
  chain.then = jest.fn((resolve) => resolve(terminalResult));
  
  mockFrom.mockReturnValue(chain);
  return chain;
}

// ─── fetchGroupExpenses ───────────────────────────────────────────────────────

describe("expensesApi.fetchGroupExpenses", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns mapped expenses for a group", async () => {
    makeChain({ data: [DB_EXPENSE_ROW], error: null });
    const result = await expensesApi.fetchGroupExpenses("group-1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("exp-1");
    expect(result[0].title).toBe("Dinner");
  });

  it("returns empty array when data is null", async () => {
    makeChain({ data: null, error: null });
    const result = await expensesApi.fetchGroupExpenses("group-1");
    expect(result).toHaveLength(0);
  });

  it("throws when supabase returns an error", async () => {
    makeChain({ data: null, error: new Error("DB error") });
    await expect(expensesApi.fetchGroupExpenses("group-1")).rejects.toThrow("DB error");
  });
});

// ─── fetchUserExpenses ────────────────────────────────────────────────────────

describe("expensesApi.fetchUserExpenses", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns empty array when user has no splits", async () => {
    // First call: expense_splits query → empty
    const splitsChain: Record<string, jest.Mock> = {};
    ["select", "eq", "returns"].forEach((m) => { splitsChain[m] = jest.fn().mockReturnValue(splitsChain); });
    splitsChain["returns"] = jest.fn().mockResolvedValue({ data: [], error: null });
    splitsChain["eq"] = jest.fn().mockReturnValue(splitsChain);
    splitsChain["select"] = jest.fn().mockReturnValue(splitsChain);
    mockFrom.mockReturnValueOnce(splitsChain);

    const result = await expensesApi.fetchUserExpenses("user-1");
    expect(result).toHaveLength(0);
  });

  it("fetches expenses for the IDs found in splits", async () => {
    // First call: expense_splits
    const splitsChain: Record<string, jest.Mock> = {};
    ["select", "eq"].forEach((m) => { splitsChain[m] = jest.fn().mockReturnValue(splitsChain); });
    splitsChain["eq"] = jest.fn().mockResolvedValue({ data: [{ expense_id: "exp-1" }], error: null });
    splitsChain["select"] = jest.fn().mockReturnValue(splitsChain);
    mockFrom.mockReturnValueOnce(splitsChain);

    // Second call: expenses query
    makeChain({ data: [DB_EXPENSE_ROW], error: null });

    const result = await expensesApi.fetchUserExpenses("user-1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("exp-1");
  });

  it("throws when splits query fails", async () => {
    const errorChain: Record<string, jest.Mock> = {};
    ["select", "eq"].forEach((m) => { errorChain[m] = jest.fn().mockReturnValue(errorChain); });
    errorChain["eq"] = jest.fn().mockResolvedValue({ data: null, error: new Error("splits error") });
    errorChain["select"] = jest.fn().mockReturnValue(errorChain);
    mockFrom.mockReturnValueOnce(errorChain);
    await expect(expensesApi.fetchUserExpenses("user-1")).rejects.toThrow("splits error");
  });
});

// ─── fetchExpense ─────────────────────────────────────────────────────────────

describe("expensesApi.fetchExpense", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns a mapped expense by ID", async () => {
    makeChain({ data: DB_EXPENSE_ROW, error: null });
    const result = await expensesApi.fetchExpense("exp-1");
    expect(result.id).toBe("exp-1");
    expect(result.amount).toBe(300);
  });

  it("throws on error", async () => {
    makeChain({ data: null, error: new Error("not found") });
    await expect(expensesApi.fetchExpense("exp-999")).rejects.toThrow("not found");
  });
});

// ─── addExpense ───────────────────────────────────────────────────────────────

describe("expensesApi.addExpense", () => {
  beforeEach(() => jest.clearAllMocks());

  it("inserts core expense and returns fetched expense (no splits)", async () => {
    // First from(): expenses insert → single
    const insertChain: Record<string, jest.Mock> = {};
    ["insert", "select"].forEach((m) => { insertChain[m] = jest.fn().mockReturnValue(insertChain); });
    insertChain["single"] = jest.fn().mockResolvedValue({ data: { id: "exp-new" }, error: null });
    insertChain["select"] = jest.fn().mockReturnValue(insertChain);
    insertChain["insert"] = jest.fn().mockReturnValue(insertChain);
    mockFrom.mockReturnValueOnce(insertChain);

    // Second from(): fetchExpense → single
    makeChain({ data: DB_EXPENSE_ROW, error: null });

    const result = await expensesApi.addExpense({
      title: "Dinner",
      amount: 300,
      currency: "USD",
      category: "food",
      paidBy: "user-1",
      splitMethod: "equal",
      date: new Date("2025-03-10"),
    });
    expect(result.id).toBe("exp-1"); // from mock fetch
  });

  it("inserts splits when provided", async () => {
    // expense insert
    const insertChain: Record<string, jest.Mock> = {};
    ["insert", "select"].forEach((m) => { insertChain[m] = jest.fn().mockReturnValue(insertChain); });
    insertChain["single"] = jest.fn().mockResolvedValue({ data: { id: "exp-new" }, error: null });
    insertChain["select"] = jest.fn().mockReturnValue(insertChain);
    insertChain["insert"] = jest.fn().mockReturnValue(insertChain);
    mockFrom.mockReturnValueOnce(insertChain);

    // splits insert
    const splitsChain: Record<string, jest.Mock> = {};
    splitsChain["insert"] = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValueOnce(splitsChain);

    // fetchExpense
    makeChain({ data: DB_EXPENSE_ROW, error: null });

    const splits = [{ userId: "user-1", user: { id: "user-1" } as any, amount: 100, paid: true }];
    const result = await expensesApi.addExpense({ title: "Dinner", splits });
    expect(result.id).toBe("exp-1");
  });

  it("throws when core insert fails", async () => {
    const insertChain: Record<string, jest.Mock> = {};
    ["insert", "select"].forEach((m) => { insertChain[m] = jest.fn().mockReturnValue(insertChain); });
    insertChain["single"] = jest.fn().mockResolvedValue({ data: null, error: new Error("insert error") });
    insertChain["select"] = jest.fn().mockReturnValue(insertChain);
    insertChain["insert"] = jest.fn().mockReturnValue(insertChain);
    mockFrom.mockReturnValueOnce(insertChain);

    await expect(expensesApi.addExpense({ title: "Dinner" })).rejects.toThrow("insert error");
  });
});

// ─── updateExpense ────────────────────────────────────────────────────────────

describe("expensesApi.updateExpense", () => {
  beforeEach(() => jest.clearAllMocks());

  it("updates core expense and re-fetches", async () => {
    // update chain
    const updateChain: Record<string, jest.Mock> = {};
    ["update", "eq"].forEach((m) => { updateChain[m] = jest.fn().mockReturnValue(updateChain); });
    updateChain["eq"] = jest.fn().mockResolvedValue({ error: null });
    updateChain["update"] = jest.fn().mockReturnValue(updateChain);
    mockFrom.mockReturnValueOnce(updateChain);

    // delete splits chain
    const deleteChain: Record<string, jest.Mock> = {};
    deleteChain["delete"] = jest.fn().mockReturnValue(deleteChain);
    deleteChain["eq"] = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValueOnce(deleteChain);

    // fetchExpense chain
    makeChain({ data: DB_EXPENSE_ROW, error: null });

    const result = await expensesApi.updateExpense("exp-1", {
      title: "Updated Dinner",
      splits: [],
    });
    expect(result.id).toBe("exp-1");
  });

  it("throws when update fails", async () => {
    const updateChain: Record<string, jest.Mock> = {};
    ["update", "eq"].forEach((m) => { updateChain[m] = jest.fn().mockReturnValue(updateChain); });
    updateChain["eq"] = jest.fn().mockResolvedValue({ error: new Error("update error") });
    updateChain["update"] = jest.fn().mockReturnValue(updateChain);
    mockFrom.mockReturnValueOnce(updateChain);

    await expect(
      expensesApi.updateExpense("exp-1", { title: "Updated" })
    ).rejects.toThrow("update error");
  });
});

// ─── deleteExpense ────────────────────────────────────────────────────────────

describe("expensesApi.deleteExpense", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls delete on the expenses table", async () => {
    const deleteChain: Record<string, jest.Mock> = {};
    deleteChain["delete"] = jest.fn().mockReturnValue(deleteChain);
    deleteChain["eq"] = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue(deleteChain);

    await expect(expensesApi.deleteExpense("exp-1")).resolves.not.toThrow();
  });

  it("throws when delete fails", async () => {
    const deleteChain: Record<string, jest.Mock> = {};
    deleteChain["delete"] = jest.fn().mockReturnValue(deleteChain);
    deleteChain["eq"] = jest.fn().mockResolvedValue({ error: new Error("delete error") });
    mockFrom.mockReturnValue(deleteChain);

    await expect(expensesApi.deleteExpense("exp-1")).rejects.toThrow("delete error");
  });
});
