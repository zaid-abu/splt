import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { TransactionRow } from "@/features/expenses/components/TransactionRow";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useUI } from "@/components/ui";
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
  const { color, radius } = useUI();

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <Typography
          style={{
            fontSize: 16,
            color: color.text,
            fontFamily: "IBMPlexSans_600SemiBold",
          }}
        >
          Transactions
        </Typography>
        <Typography
          style={{
            fontSize: 13,
            color: color.muted,
            fontFamily: "IBMPlexSans_600SemiBold",
          }}
        >
          Total: {formatAmount(totalExpensesInGroupCurrency, currency)}
        </Typography>
      </View>

      {expenses.length === 0 ? (
        <View
          style={{
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: color.border,
            backgroundColor: color.surface,
            paddingVertical: 36,
            alignItems: "center",
          }}
        >
          <EmptyIconShell icon={icons.Receipt} />
          <Typography
            style={{
              fontSize: 16,
              color: color.text,
              fontFamily: "IBMPlexSans_600SemiBold",
              marginBottom: 8,
            }}
          >
            No expenses yet
          </Typography>
          <Typography
            style={{
              fontSize: 14,
              color: color.muted,
              fontFamily: "IBMPlexSans_500Medium",
              textAlign: "center",
            }}
          >
            Add the first expense for this group
          </Typography>
        </View>
      ) : (
        <View
          style={{
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: color.border,
            backgroundColor: color.surface,
            overflow: "hidden",
          }}
        >
          {expenses.map((expense, idx) => {
            const mySplit = expense.splits.find((s) => s.userId === currentUserId);
            const paidByUser = userById.get(expense.paidBy);
            return (
              <TransactionRow
                key={expense.id}
                expense={expense}
                currentUserId={currentUserId || ""}
                paidByUser={paidByUser}
                myShare={mySplit?.amount ?? 0}
                isLast={idx === expenses.length - 1}
                onPress={() => onExpensePress(expense.id)}
                showAvatarBadge
              />
            );
          })}
        </View>
      )}
    </View>
  );
}
