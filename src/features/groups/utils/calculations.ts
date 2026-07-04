import type { Expense } from "@/types";
import type { CurrencyConverter } from "@/features/settlements/utils/balances";

export function calculateTotalGroupExpenses(
  expenses: Expense[],
  groupCurrency: string,
  convertCurrency: CurrencyConverter
): number {
  return expenses.reduce(
    (sum, exp) => sum + convertCurrency(exp.amount, exp.currency, groupCurrency),
    0
  );
}
