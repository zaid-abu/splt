import React from "react";
import { View, Pressable, Text } from "react-native";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { EXPENSE_CATEGORIES } from "@/types";
import * as icons from "lucide-react-native";
import type { AnalyticsExpense } from "../hooks/useAnalytics";
import dayjs from "dayjs";
import { useUI } from "@/components/ui";
import { useCoralColors } from "@/components/coral";

interface Props {
  expenses: AnalyticsExpense[];
  currencyCode: string;
  onLogExpense: () => void;
}

export function TopExpenses({ expenses, currencyCode, onLogExpense }: Props) {
  const { color, radius, space, shadow } = useUI();
  const coral = useCoralColors();
  return (
    <View
      style={{
        borderRadius: 16,
        padding: 16,
        backgroundColor: coral.surface,
        borderWidth: 1,
        borderColor: coral.border,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontFamily: "InstrumentSans_600SemiBold",
          color: color.text,
          letterSpacing: 1.1,
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        Top Expenses
      </Text>

      {expenses.length === 0 ? (
        <View style={{ paddingVertical: 24, alignItems: "center", justifyContent: "center" }}>
          <icons.ReceiptText size={38} color={color.muted} strokeWidth={1.25} />
          <Text
            style={{
              marginTop: 12,
              color: color.muted,
              fontFamily: "InstrumentSans_500Medium",
              marginBottom: 16,
            }}
          >
            No expenses in this period.
          </Text>
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
              Log expense
            </Text>
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
                  borderBottomColor: color.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
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
                    <Icon size={20} color={color.text} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        color: color.text,
                        fontFamily: "InstrumentSans_600SemiBold",
                      }}
                      numberOfLines={1}
                    >
                      {expense.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: color.muted,
                        fontFamily: "InstrumentSans_500Medium",
                        marginTop: 2,
                      }}
                    >
                      {dayjs(expense.date).format("MMM D, YYYY")}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    color: color.text,
                    fontFamily: "InstrumentSans_600SemiBold",
                  }}
                >
                  {formatAmount(expense.myShareInPrefCurrency, currencyCode)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
