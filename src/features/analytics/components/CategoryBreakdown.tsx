import React, { useState } from "react";
import { View, Pressable, LayoutAnimation } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/types";
import { formatAmount } from "@/components/ui/AmountDisplay";
import * as icons from "lucide-react-native";
import { Text } from "@/components/ui/Text";
import { EmptyState } from "@/components/ui/EmptyState";

interface Props {
  data: { category: ExpenseCategory; amount: number }[];
  totalSpent: number;
  currencyCode: string;
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: "#FB923C",
  transport: "#60A5FA",
  accommodation: "#F472B6",
  entertainment: "#A78BFA",
  shopping: "#F87171",
  utilities: "#34D399",
  health: "#22D3EE",
  travel: "#818CF8",
  other: "#8E8E93",
};

export function CategoryBreakdown({ data, totalSpent, currencyCode }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  if (data.length === 0) {
    return (
      <EmptyState
        icon="PieChart"
        title="No category data"
        description="Add some expenses to see your spending breakdown."
      />
    );
  }

  const chartData = data.map((item) => {
    const isSelected = selectedCategory === item.category;
    const isFaded = selectedCategory !== null && !isSelected;
    const baseColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;

    return {
      value: item.amount,
      color: isFaded ? `${baseColor}40` : baseColor,
      focused: isSelected,
      category: item.category,
    };
  });

  return (
    <View className="py-4">
      <Text variant="h4" color="foreground" className="mb-6">
        Categories
      </Text>

      <View className="items-center justify-center">
        <PieChart
          data={chartData}
          donut
          innerRadius={75}
          radius={120}
          innerCircleColor="#131316"
          focusOnPress
          onPress={(item: any) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setSelectedCategory((prev) =>
              prev === item.category ? null : (item.category as ExpenseCategory),
            );
          }}
          centerLabelComponent={() => {
            const selectedData = selectedCategory
              ? data.find((d) => d.category === selectedCategory)
              : null;
            const displayTotal = selectedData ? selectedData.amount : totalSpent;
            const labelText = selectedData
              ? EXPENSE_CATEGORIES.find((c) => c.key === selectedCategory)?.label || "Other"
              : "Total";

            return (
              <View className="items-center justify-center">
                <Text variant="label" color="muted" numberOfLines={1} adjustsFontSizeToFit className="text-center w-28">
                  {labelText}
                </Text>
                <Text variant="body" weight="bold" color="foreground" numberOfLines={1} adjustsFontSizeToFit className="text-center w-32 mt-0.5">
                  {formatAmount(displayTotal, currencyCode)}
                </Text>
              </View>
            );
          }}
        />
      </View>

      <View className="mt-8 gap-4">
        {data.map((item) => {
          const catInfo = EXPENSE_CATEGORIES.find((c) => c.key === item.category);
          const Icon = catInfo ? (icons as any)[catInfo.icon] : icons.Package;
          const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;

          const isSelected = selectedCategory === item.category;
          const isFaded = selectedCategory !== null && !isSelected;

          return (
            <Pressable
              key={item.category}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSelectedCategory((prev) => (prev === item.category ? null : item.category));
              }}
              className="flex-row items-center justify-between"
              style={{ opacity: isFaded ? 0.4 : 1 }}
            >
              <View className="flex-row items-center gap-3">
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: `${color}15`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={16} color={color} strokeWidth={2} />
                </View>
                <View>
                  <Text variant="body" weight="semibold" color="foreground">
                    {catInfo?.label || "Other"}
                  </Text>
                  <Text variant="body-xs" color="muted" className="mt-0.5">
                    {Math.round((item.amount / totalSpent) * 100)}%
                  </Text>
                </View>
              </View>
              <Text variant="body" weight="bold" color="foreground">
                {formatAmount(item.amount, currencyCode)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
