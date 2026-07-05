import React, { useState } from "react";
import { View, Pressable, LayoutAnimation } from "react-native";
import { Typography } from "heroui-native";
import { PieChart } from "react-native-gifted-charts";
import { EXPENSE_CATEGORIES, ExpenseCategory } from "@/types";
import { formatAmount } from "@/components/ui/AmountDisplay";
import * as icons from "lucide-react-native";

interface Props {
  data: { category: ExpenseCategory; amount: number }[];
  totalSpent: number;
  currencyCode: string;
}

// Fixed earthy color palette for categories
const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: "#1A1817", // Black/Dark Gray
  transport: "#8C7A6B", // Primary Sepia
  accommodation: "#6D5C50", // Darker Sepia
  entertainment: "#A39B93", // Grayish Sepia
  shopping: "#B8ACA1", // Light Sepia
  utilities: "#D0C8C0", // Very Light Sepia
  health: "#3A312B", // Very Dark Sepia
  travel: "#4A423C", // Charcoal
  other: "#E5DFD9", // Border color (Off-white)
};

export function CategoryBreakdown({ data, totalSpent, currencyCode }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null);

  if (data.length === 0) {
    return (
      <View
        style={{
          paddingVertical: 24,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
        }}
      >
        <icons.PieChart size={32} color="#A39B93" strokeWidth={1.5} />
        <Typography
          style={{ marginTop: 12, color: "#A39B93", fontFamily: "CrimsonText_600SemiBold" }}
        >
          No category data
        </Typography>
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
    <View style={{ backgroundColor: "transparent", paddingVertical: 16 }}>
      <Typography
        style={{
          fontSize: 18,
          fontFamily: "CrimsonText_700Bold",
          color: "#1A1817",
          marginBottom: 24,
        }}
      >
        Categories
      </Typography>

      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <PieChart
          data={chartData}
          donut
          innerRadius={75}
          radius={120}
          innerCircleColor="#F5F0EB"
          focusOnPress
          onPress={(item: any) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
                <Typography
                  style={{
                    fontSize: 10,
                    color: "#A39B93",
                    fontFamily: "CrimsonText_600SemiBold",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    textAlign: "center",
                    width: 110,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {labelText}
                </Typography>
                <Typography
                  style={{
                    fontSize: 18,
                    color: "#1A1817",
                    fontFamily: "CrimsonText_700Bold",
                    marginTop: 2,
                    textAlign: "center",
                    width: 120,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatAmount(displayTotal, currencyCode)}
                </Typography>
              </View>
            );
          }}
        />
      </View>

      <View style={{ marginTop: 32, gap: 16 }}>
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
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: isFaded ? 0.4 : 1,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
                  <Typography
                    style={{
                      fontSize: 15,
                      color: "#1A1817",
                      fontFamily: "CrimsonText_600SemiBold",
                    }}
                  >
                    {catInfo?.label || "Other"}
                  </Typography>
                  <Typography
                    style={{
                      fontSize: 12,
                      color: "#A39B93",
                      fontFamily: "CrimsonText_600SemiBold",
                      marginTop: 2,
                    }}
                  >
                    {Math.round((item.amount / totalSpent) * 100)}%
                  </Typography>
                </View>
              </View>
              <Typography
                style={{ fontSize: 15, color: "#1A1817", fontFamily: "CrimsonText_700Bold" }}
              >
                {formatAmount(item.amount, currencyCode)}
              </Typography>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
