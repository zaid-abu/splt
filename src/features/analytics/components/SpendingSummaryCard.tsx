import type { JSX } from "react";
import { View, Text } from "react-native";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { BalanceHero, StatPair, useCoralColors } from "@/components/coral";
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
  const coral = useCoralColors();
  const averageExpense = expenseCount > 0 ? totalSpent / expenseCount : 0;
  const biggestCategory = categoryData[0];
  const biggestCategoryLabel = biggestCategory
    ? biggestCategory.category.charAt(0).toUpperCase() + biggestCategory.category.slice(1)
    : "None";

  return (
    <BalanceHero label="Spending Summary" value={formatAmount(totalSpent, currencyCode)}>
      <StatPair
        left={{ label: "Expenses", value: String(expenseCount) }}
        right={{ label: "Average", value: formatAmount(averageExpense, currencyCode) }}
      />
      <View
        style={{
          backgroundColor: coral.surface,
          borderWidth: 1,
          borderColor: coral.border,
          borderRadius: 14,
          padding: 14,
          marginTop: 10,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "IBMPlexMono_600SemiBold",
            fontVariant: ["tabular-nums"],
            fontSize: 22,
            fontWeight: "600",
            color: coral.foreground,
          }}
        >
          {biggestCategoryLabel}
        </Text>
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 12,
            color: coral.muted,
            marginTop: 5,
          }}
        >
          Top Category
        </Text>
      </View>
    </BalanceHero>
  );
}
