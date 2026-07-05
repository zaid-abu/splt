/**
 * Unit tests for src/features/groups/utils/calculations.ts
 */
import { calculateTotalGroupExpenses } from "@/features/groups/utils/calculations";
import { identityConverter, mockConverter, EXPENSE_EQUAL, EXPENSE_2 } from "../setup/fixtures";
import type { Expense } from "@/types";

describe("calculateTotalGroupExpenses", () => {
  it("returns 0 for empty expenses array", () => {
    expect(calculateTotalGroupExpenses([], "USD", identityConverter)).toBe(0);
  });

  it("sums expenses in the same currency without conversion", () => {
    const expenses: Expense[] = [EXPENSE_EQUAL, EXPENSE_2]; // 300 + 50 = 350
    expect(calculateTotalGroupExpenses(expenses, "USD", identityConverter)).toBeCloseTo(350);
  });

  it("converts expenses from different currencies", () => {
    // EXPENSE_EQUAL is 300 USD, EXPENSE_2 is 50 USD
    // With mockConverter: if group currency is EUR, USD → EUR is *2
    const total = calculateTotalGroupExpenses(
      [EXPENSE_EQUAL, EXPENSE_2],
      "EUR",
      mockConverter
    );
    // 300 * 2 + 50 * 2 = 700
    expect(total).toBeCloseTo(700);
  });

  it("handles a single expense", () => {
    expect(calculateTotalGroupExpenses([EXPENSE_EQUAL], "USD", identityConverter)).toBeCloseTo(300);
  });

  it("calls convertCurrency for each expense", () => {
    const converter = jest.fn((amount: number) => amount);
    calculateTotalGroupExpenses([EXPENSE_EQUAL, EXPENSE_2], "USD", converter);
    expect(converter).toHaveBeenCalledTimes(2);
    expect(converter).toHaveBeenCalledWith(300, "USD", "USD");
    expect(converter).toHaveBeenCalledWith(50, "USD", "USD");
  });
});
