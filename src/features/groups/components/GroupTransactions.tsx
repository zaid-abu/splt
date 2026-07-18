import type { JSX } from "react";
import { View, Text } from "react-native";
import * as icons from "lucide-react-native";
import { CategoryIconBadge } from "@/components/ui/CategoryIconBadge";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { formatActivityDate } from "@/utils/date";
import { useUI } from "@/components/ui";
import { MoneyRow, Eyebrow, useCoralColors } from "@/components/coral";
import type { Expense, User } from "@/types";

function EmptyIconShell({ icon: Icon }: { icon: any }): JSX.Element {
  const { color, radius } = useUI();
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: radius.lg,
        backgroundColor: color.control,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: color.border,
      }}
    >
      <Icon size={24} color={color.text} strokeWidth={1.8} />
    </View>
  );
}

export interface GroupTransactionsProps {
  expenses: Expense[];
  currentUserId?: string;
  userById: Map<string, User>;
  totalExpensesInGroupCurrency: number;
  currency: string;
  onExpensePress: (expenseId: string) => void;
}

export function GroupTransactions({
  expenses,
  currentUserId,
  userById,
  totalExpensesInGroupCurrency,
  currency,
  onExpensePress,
}: GroupTransactionsProps): JSX.Element {
  const { color } = useUI();
  const coral = useCoralColors();

  return (
    <View style={{ marginBottom: 28 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <Eyebrow style={{ marginTop: 0, marginBottom: 0 }}>Transactions</Eyebrow>
        <Text
          style={{
            fontSize: 13,
            fontFamily: "InstrumentSans_600SemiBold",
            color: color.muted,
          }}
        >
          Total: {formatAmount(totalExpensesInGroupCurrency, currency)}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: coral.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: coral.border,
          overflow: "hidden",
        }}
      >
        {expenses.length === 0 ? (
          <View
            style={{
              paddingVertical: 36,
              alignItems: "center",
            }}
          >
            <EmptyIconShell icon={icons.Receipt} />
            <Text
              style={{
                fontSize: 16,
                color: color.text,
                fontFamily: "InstrumentSans_600SemiBold",
                marginBottom: 8,
              }}
            >
              No expenses yet
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: color.muted,
                fontFamily: "InstrumentSans_500Medium",
                textAlign: "center",
              }}
            >
              Add the first expense for this group
            </Text>
          </View>
        ) : (
          expenses.map((expense) => {
            const paidByUser = userById.get(expense.paidBy);
            const iPaid = expense.paidBy === currentUserId;
            const paidByName = iPaid ? "You" : (paidByUser?.name.split(" ")[0] ?? "Someone");

            return (
              <MoneyRow
                key={expense.id}
                avatar={<CategoryIconBadge category={expense.category} size="md" />}
                title={expense.title}
                subtitle={`${paidByName} paid \u00b7 ${formatActivityDate(expense.date ?? expense.createdAt)}`}
                amount={formatAmount(expense.amount, expense.currency)}
                onPress={() => onExpensePress(expense.id)}
                rightElement={<icons.ChevronRight size={18} color={color.muted} />}
              />
            );
          })
        )}
      </View>
    </View>
  );
}
