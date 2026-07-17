import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { CategoryIconBadge } from "@/components/ui/CategoryIconBadge";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { formatActivityDate } from "@/utils/date";
import { useUI, GlassSection, GlassRow } from "@/components/ui";
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

  return (
    <GlassSection
      title="Transactions"
      viewAllLabel={`Total: ${formatAmount(totalExpensesInGroupCurrency, currency)}`}
    >
      {expenses.length === 0 ? (
        <View
          style={{
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
        expenses.map((expense) => {
          const paidByUser = userById.get(expense.paidBy);
          const iPaid = expense.paidBy === currentUserId;
          const paidByName = iPaid ? "You" : (paidByUser?.name.split(" ")[0] ?? "Someone");

          return (
            <GlassRow
              key={expense.id}
              icon={<CategoryIconBadge category={expense.category} size="md" />}
              title={expense.title}
              subtitle={`${paidByName} paid · ${formatActivityDate(expense.date ?? expense.createdAt)}`}
              end={
                <Typography
                  style={{
                    fontSize: 15,
                    color: color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  {formatAmount(expense.amount, expense.currency)}
                </Typography>
              }
              showChevron
              onPress={() => onExpensePress(expense.id)}
            />
          );
        })
      )}
    </GlassSection>
  );
}
