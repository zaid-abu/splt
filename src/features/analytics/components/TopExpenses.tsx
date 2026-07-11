import React from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { EXPENSE_CATEGORIES } from "@/types";
import * as icons from "lucide-react-native";
import type { AnalyticsExpense } from "../hooks/useAnalytics";
import dayjs from "dayjs";
import { UI } from "@/components/ui/native-ui";

interface Props {
  expenses: AnalyticsExpense[];
  currencyCode: string;
  onLogExpense: () => void;
}

export function TopExpenses({ expenses, currencyCode, onLogExpense }: Props) {
  return (
    <View
      style={{
        backgroundColor: UI.color.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: UI.color.border,
        padding: 16,
      }}
    >
      <Typography
        style={{
          fontSize: 11,
          fontFamily: "IBMPlexSans_600SemiBold",
          color: UI.color.text,
          letterSpacing: 1.1,
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        Top Expenses
      </Typography>

      {expenses.length === 0 ? (
        <View style={{ paddingVertical: 24, alignItems: "center", justifyContent: "center" }}>
          <icons.ReceiptText size={38} color={UI.color.muted} strokeWidth={1.25} />
          <Typography
            style={{
              marginTop: 12,
              color: UI.color.muted,
              fontFamily: "IBMPlexSans_500Medium",
              marginBottom: 16,
            }}
          >
            No expenses in this period.
          </Typography>
          <Pressable
            accessibilityRole="button"
            onPress={onLogExpense}
            style={({ pressed }) => ({
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: UI.color.text,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Typography
              style={{
                fontSize: 14,
                color: UI.color.textInverse,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Log expense
            </Typography>
          </Pressable>
        </View>
      ) : (
        <View>
          {expenses.map((expense) => {
            const catInfo = EXPENSE_CATEGORIES.find((c) => c.key === expense.category);
            const Icon = catInfo ? (icons as any)[catInfo.icon] : icons.Package;
            const isLast = expense.id === expenses[expenses.length - 1]?.id;

            return (
              <View
                key={expense.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 16,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: UI.color.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 18,
                      backgroundColor: UI.color.control,
                      borderWidth: 1,
                      borderColor: UI.color.border,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                    }}
                  >
                    <Icon size={20} color={UI.color.text} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography
                      style={{
                        fontSize: 16,
                        color: UI.color.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                      numberOfLines={1}
                    >
                      {expense.title}
                    </Typography>
                    <Typography
                      style={{
                        fontSize: 13,
                        color: UI.color.muted,
                        fontFamily: "IBMPlexSans_500Medium",
                        marginTop: 2,
                      }}
                    >
                      {dayjs(expense.date).format("MMM D, YYYY")}
                    </Typography>
                  </View>
                </View>
                <Typography
                  style={{
                    fontSize: 16,
                    color: UI.color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  {formatAmount(expense.myShareInPrefCurrency, currencyCode)}
                </Typography>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
