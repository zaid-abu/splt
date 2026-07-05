import React from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { EXPENSE_CATEGORIES } from "@/types";
import * as icons from "lucide-react-native";
import type { AnalyticsExpense } from "../hooks/useAnalytics";
import dayjs from "dayjs";

interface Props {
  expenses: AnalyticsExpense[];
  currencyCode: string;
}

export function TopExpenses({ expenses, currencyCode }: Props) {
  if (expenses.length === 0) return null;

  return (
    <View style={{ backgroundColor: "transparent", paddingVertical: 16 }}>
      <Typography
        style={{
          fontSize: 18,
          fontFamily: "CrimsonText_700Bold",
          color: "#1A1817",
          marginBottom: 16,
        }}
      >
        Top Expenses
      </Typography>

      <View style={{ gap: 16 }}>
        {expenses.map((expense) => {
          const catInfo = EXPENSE_CATEGORIES.find((c) => c.key === expense.category);
          const Icon = catInfo ? (icons as any)[catInfo.icon] : icons.Package;

          return (
            <View
              key={expense.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#F5F0EB",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={20} color="#8C7A6B" strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography
                    style={{ fontSize: 16, color: "#1A1817", fontFamily: "CrimsonText_700Bold" }}
                    numberOfLines={1}
                  >
                    {expense.title}
                  </Typography>
                  <Typography
                    style={{
                      fontSize: 13,
                      color: "#A39B93",
                      fontFamily: "CrimsonText_600SemiBold",
                      marginTop: 2,
                    }}
                  >
                    {dayjs(expense.date).format("MMM D, YYYY")}
                  </Typography>
                </View>
              </View>
              <Typography
                style={{ fontSize: 16, color: "#1A1817", fontFamily: "CrimsonText_700Bold" }}
              >
                {formatAmount(expense.myShareInPrefCurrency, currencyCode)}
              </Typography>
            </View>
          );
        })}
      </View>
    </View>
  );
}
