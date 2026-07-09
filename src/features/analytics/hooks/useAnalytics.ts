import { useMemo } from "react";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import type { Expense, ExpenseCategory, AnalyticsPeriod, CategoryData, TrendData } from "@/types";
import dayjs from "dayjs";

export type AnalyticsExpense = Expense & { myShareInPrefCurrency: number };

export function useAnalytics(
  userId: string | undefined,
  period: AnalyticsPeriod,
  preferredCurrencyCode: string,
  convertCurrency: (amount: number, from: string, to: string) => number
) {
  const { data: expenses = [], isLoading, refetch } = useUserExpenses(userId);

  return useMemo(() => {
    if (!userId)
      return {
        totalSpent: 0,
        expenseCount: 0,
        categoryData: [],
        trendData: [],
        topExpenses: [],
        isLoading,
        refetch,
      };

    // 1. Filter by date & extract user's share
    const now = dayjs();
    let startDate: dayjs.Dayjs | null = null;

    switch (period) {
      case "week":
        startDate = now.subtract(7, "day");
        break;
      case "month":
        startDate = now.subtract(30, "day");
        break;
      case "3mo":
        startDate = now.subtract(3, "month");
        break;
      case "year":
        startDate = now.subtract(1, "year");
        break;
      case "all":
        startDate = null;
        break;
    }

    const relevantExpenses = expenses
      .filter((e) => {
        if (startDate && dayjs(e.date).isBefore(startDate)) return false;
        return true;
      })
      .map((e) => {
        let myShare = 0;
        const mySplit = e.splits.find((s) => s.userId === userId);
        if (mySplit) {
          myShare = mySplit.amount;
        }
        return {
          ...e,
          myShareInPrefCurrency: convertCurrency(myShare, e.currency, preferredCurrencyCode),
        };
      })
      .filter((e) => e.myShareInPrefCurrency > 0);

    // 2. Calculate Total
    const totalSpent = relevantExpenses.reduce((sum, e) => sum + e.myShareInPrefCurrency, 0);
    const expenseCount = relevantExpenses.length;

    // 3. Category Breakdown
    const catMap = new Map<ExpenseCategory, number>();
    relevantExpenses.forEach((e) => {
      catMap.set(e.category, (catMap.get(e.category) || 0) + e.myShareInPrefCurrency);
    });

    const categoryData: CategoryData[] = Array.from(catMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // 4. Trend Data
    const trendMap = new Map<string, number>();
    const isDaily = period === "week" || period === "month";

    // Initialize buckets so we have a continuous timeline
    if (startDate && period !== "all") {
      let current = startDate.clone();
      while (current.isBefore(now) || current.isSame(now, "day")) {
        const key = isDaily ? current.format("MMM D") : current.format("MMM YYYY");
        if (!trendMap.has(key)) trendMap.set(key, 0);
        current = isDaily ? current.add(1, "day") : current.add(1, "month");
      }
    } else {
      // For 'all', just add the buckets as they appear, but sort them later
    }

    relevantExpenses.forEach((e) => {
      const d = dayjs(e.date);
      const key = isDaily ? d.format("MMM D") : d.format("MMM YYYY");
      trendMap.set(key, (trendMap.get(key) || 0) + e.myShareInPrefCurrency);
    });

    // If 'all', we need to sort the map by actual dates since we didn't pre-initialize
    let finalTrendData: TrendData[] = [];
    if (period === "all") {
      const sortedKeys = Array.from(trendMap.keys()).sort((a, b) => {
        return dayjs(a, "MMM YYYY").valueOf() - dayjs(b, "MMM YYYY").valueOf();
      });
      finalTrendData = sortedKeys.map((k) => ({ label: k, value: trendMap.get(k)! }));
    } else {
      finalTrendData = Array.from(trendMap.entries()).map(([label, value]) => ({ label, value }));
    }

    // 5. Top Expenses
    const topExpenses: AnalyticsExpense[] = [...relevantExpenses]
      .sort((a, b) => b.myShareInPrefCurrency - a.myShareInPrefCurrency)
      .slice(0, 5);

    return {
      totalSpent,
      expenseCount,
      categoryData,
      trendData: finalTrendData,
      topExpenses,
      isLoading,
      refetch,
    };
  }, [expenses, userId, period, preferredCurrencyCode, convertCurrency, isLoading, refetch]);
}
