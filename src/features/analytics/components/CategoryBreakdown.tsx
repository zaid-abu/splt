import React, { useState } from "react";
import { View, Pressable, Text } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { EXPENSE_CATEGORIES, ExpenseCategory } from "@/types";
import { formatAmount } from "@/components/ui/AmountDisplay";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useUI } from "@/components/ui";

interface Props {
  data: { category: ExpenseCategory; amount: number }[];
  totalSpent: number;
  currencyCode: string;
  onLogExpense?: () => void;
}

// Fixed earthy color palette for categories
const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: "#D97706",
  transport: "#2563EB",
  accommodation: "#DB2777",
  entertainment: "#7C3AED",
  shopping: "#DC2626",
  utilities: "#059669",
  health: "#0891B2",
  travel: "#4F46E5",
  other: "#6B7280",
};

export function CategoryBreakdown({ data, totalSpent, currencyCode, onLogExpense }: Props) {
  const { color, radius, space, shadow } = useUI();
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  if (data.length === 0) {
    return (
      <View
        style={{
          paddingVertical: 32,
          paddingHorizontal: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: color.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: color.border,
        }}
      >
        <icons.PieChart size={38} color={color.muted} strokeWidth={1.25} />
        <Text
          style={{
            marginTop: 12,
            color: color.muted,
            fontFamily: "InstrumentSans_500Medium",
            marginBottom: 16,
          }}
        >
          No category data
        </Text>
        {onLogExpense && (
          <Pressable
            accessibilityRole="button"
            onPress={onLogExpense}
            style={({ pressed }) => ({
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: color.text,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 14,
                color: color.textInverse,
                fontFamily: "InstrumentSans_600SemiBold",
              }}
            >
              Log an expense
            </Text>
          </Pressable>
        )}
      </View>
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
    <View
      style={{
        backgroundColor: color.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: color.border,
        padding: 16,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontFamily: "InstrumentSans_600SemiBold",
          color: color.text,
          letterSpacing: 1.1,
          textTransform: "uppercase",
          marginBottom: 20,
        }}
      >
        Categories
      </Text>

      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <PieChart
          data={chartData}
          donut
          innerRadius={75}
          radius={120}
          innerCircleColor={color.surface}
          focusOnPress
          onPress={(item: any) => {
            Haptics.selectionAsync();
            setSelectedCategory((prev) =>
              prev === item.category ? null : (item.category as ExpenseCategory)
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
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <Text
                  style={{
                    fontSize: 10,
                    color: color.muted,
                    fontFamily: "InstrumentSans_500Medium",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    textAlign: "center",
                    width: 110,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {labelText}
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    color: color.text,
                    fontFamily: "InstrumentSans_600SemiBold",
                    marginTop: 2,
                    textAlign: "center",
                    width: 120,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatAmount(displayTotal, currencyCode)}
                </Text>
              </View>
            );
          }}
        />
      </View>

      <View style={{ marginTop: 32, gap: 18 }}>
        {data.map((item) => {
          const catInfo = EXPENSE_CATEGORIES.find((c) => c.key === item.category);
          const Icon = catInfo ? (icons as any)[catInfo.icon] : icons.Package;
          const categoryColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;
          const percent = totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0;

          const isSelected = selectedCategory === item.category;
          const isFaded = selectedCategory !== null && !isSelected;

          return (
            <Pressable
              key={item.category}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedCategory((prev) => (prev === item.category ? null : item.category));
              }}
              style={{
                opacity: isFaded ? 0.4 : 1,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 18,
                    backgroundColor: color.control,
                    borderWidth: 1,
                    borderColor: color.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Icon size={16} color={categoryColor} strokeWidth={2} />
                </View>

                <View style={{ flex: 1, marginRight: 12 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontSize: 15,
                          color: color.text,
                          fontFamily: "InstrumentSans_600SemiBold",
                        }}
                      >
                        {catInfo?.label || "Other"}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: color.muted,
                          fontFamily: "InstrumentSans_500Medium",
                          marginTop: 2,
                        }}
                      >
                        {percent}% of spending
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 15,
                        color: color.text,
                        fontFamily: "InstrumentSans_600SemiBold",
                      }}
                    >
                      {formatAmount(item.amount, currencyCode)}
                    </Text>
                  </View>

                  <View
                    style={{
                      height: 6,
                      borderRadius: 999,
                      backgroundColor: color.bg,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.min(100, percent)}%`,
                        height: "100%",
                        borderRadius: 999,
                        backgroundColor: categoryColor,
                      }}
                    />
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
