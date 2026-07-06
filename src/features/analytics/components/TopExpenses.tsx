import React from "react";
import { View } from "react-native";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { EXPENSE_CATEGORIES } from "@/types";
import * as icons from "lucide-react-native";
import type { AnalyticsExpense } from "../hooks/useAnalytics";
import dayjs from "dayjs";
import { Text } from "@/components/ui/Text";

interface Props {
  expenses: AnalyticsExpense[];
  currencyCode: string;
}

export function TopExpenses({ expenses, currencyCode }: Props) {
  if (expenses.length === 0) return null;

  return (
    <View className="py-4">
      <Text variant="h4" color="foreground" className="mb-4">
        Top Expenses
      </Text>

      <View className="gap-4">
        {expenses.map((expense) => {
          const catInfo = EXPENSE_CATEGORIES.find((c) => c.key === expense.category);
          const Icon = catInfo ? (icons as any)[catInfo.icon] : icons.Package;

          return (
            <View key={expense.id} className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 gap-3">
                <View className="w-10 h-10 rounded-full bg-surface-2 items-center justify-center">
                  <Icon size={20} color="#FB923C" strokeWidth={1.5} />
                </View>
                <View className="flex-1">
                  <Text variant="body" weight="bold" color="foreground" numberOfLines={1}>
                    {expense.title}
                  </Text>
                  <Text variant="body-xs" color="muted" className="mt-0.5">
                    {dayjs(expense.date).format("MMM D, YYYY")}
                  </Text>
                </View>
              </View>
              <Text variant="body" weight="bold" color="foreground">
                {formatAmount(expense.myShareInPrefCurrency, currencyCode)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
