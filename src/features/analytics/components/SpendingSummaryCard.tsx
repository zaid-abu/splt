import type { JSX } from "react";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { GlassHeroBalance } from "@/components/ui";
import type { CategoryData } from "@/types";

interface SpendingSummaryCardProps {
  totalSpent: number;
  expenseCount: number;
  categoryData: CategoryData[];
  currencyCode: string;
}

export function SpendingSummaryCard({
  totalSpent,
  expenseCount,
  categoryData,
  currencyCode,
}: SpendingSummaryCardProps): JSX.Element {
  const averageExpense = expenseCount > 0 ? totalSpent / expenseCount : 0;
  const biggestCategory = categoryData[0];
  const biggestCategoryLabel = biggestCategory
    ? biggestCategory.category.charAt(0).toUpperCase() + biggestCategory.category.slice(1)
    : "None";

  return (
    <GlassHeroBalance
      label="Spending Summary"
      amount={formatAmount(totalSpent, currencyCode)}
      metrics={[
        { label: "Expenses", value: String(expenseCount) },
        { label: "Average", value: formatAmount(averageExpense, currencyCode) },
        { label: "Top Category", value: biggestCategoryLabel },
      ]}
    />
  );
}
