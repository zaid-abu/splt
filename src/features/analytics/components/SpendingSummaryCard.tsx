import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/ui";
import { useUI } from "@/components/ui";
import type { AnalyticsPeriod, CategoryData } from "@/types";

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
  const { color } = useUI();
  const averageExpense = expenseCount > 0 ? totalSpent / expenseCount : 0;
  const biggestCategory = categoryData[0];
  const biggestCategoryLabel = biggestCategory
    ? biggestCategory.category.charAt(0).toUpperCase() + biggestCategory.category.slice(1)
    : "None";

  return (
    <Card padding={16}>
      <SectionLabel style={{ marginBottom: 12 }}>Spending summary</SectionLabel>
      <Typography
        style={{
          fontSize: 38,
          color: color.text,
          fontFamily: "IBMPlexSans_600SemiBold",
          lineHeight: 46,
          marginBottom: 16,
        }}
      >
        {formatAmount(totalSpent, currencyCode)}
      </Typography>

      <View style={{ flexDirection: "row", gap: 10 }}>
        {[
          { label: "Expenses", value: String(expenseCount) },
          { label: "Average", value: formatAmount(averageExpense, currencyCode) },
          { label: "Top category", value: biggestCategoryLabel },
        ].map((item) => (
          <View
            key={item.label}
            style={{
              flex: 1,
              backgroundColor: color.control,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: color.border,
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
          >
            <Typography
              numberOfLines={1}
              style={{
                fontSize: 11,
                color: color.muted,
                fontFamily: "IBMPlexSans_600SemiBold",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 5,
              }}
            >
              {item.label}
            </Typography>
            <Typography
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                fontSize: 16,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              {item.value}
            </Typography>
          </View>
        ))}
      </View>
    </Card>
  );
}
