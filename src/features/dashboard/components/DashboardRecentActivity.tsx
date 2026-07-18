import type { JSX } from "react";
import { View, Pressable, Text } from "react-native";
import * as icons from "lucide-react-native";
import { useUI, FilterPill } from "@/components/ui";
import { CategoryIconBadge } from "@/components/ui/CategoryIconBadge";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { formatActivityDate } from "@/utils/date";
import { MoneyRow, Eyebrow, useCoralColors } from "@/components/coral";
import type { Expense } from "@/types";

type LucideIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

function EmptyIconShell({ icon: Icon }: { icon: LucideIcon }): JSX.Element {
  const { color, radius } = useUI();
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: radius.lg,
        backgroundColor: color.control,
        borderWidth: 1,
        borderColor: color.border,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
      }}
    >
      <Icon size={24} color={color.muted} strokeWidth={1.5} />
    </View>
  );
}

type ActivityFilter = "all" | "paid" | "owe";

interface DashboardRecentActivityProps {
  expenses: Expense[];
  filter: ActivityFilter;
  onFilterChange: (filter: ActivityFilter) => void;
  currentUserId: string;
  onViewAll: () => void;
  onExpensePress: (expenseId: string) => void;
  onAddExpense: () => void;
}

export function DashboardRecentActivity({
  expenses,
  filter,
  onFilterChange,
  currentUserId,
  onViewAll,
  onExpensePress,
  onAddExpense,
}: DashboardRecentActivityProps): JSX.Element {
  const { color, radius } = useUI();
  const coral = useCoralColors();

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
        {(["all", "paid", "owe"] as const).map((f) => {
          const label = f === "paid" ? "You paid" : f === "owe" ? "You owe" : "All";
          return (
            <FilterPill
              key={f}
              label={label}
              isActive={filter === f}
              onPress={() => onFilterChange(f)}
            />
          );
        })}
      </View>

      <View style={{ marginBottom: 28 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Eyebrow style={{ marginTop: 0, marginBottom: 0 }}>Recent activity</Eyebrow>
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text
              style={{
                fontSize: 13,
                fontFamily: "InstrumentSans_600SemiBold",
                color: color.muted,
              }}
            >
              View all
            </Text>
          </Pressable>
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
          {expenses.length > 0 ? (
            expenses.map((expense) => {
              const mySplit = expense.splits.find((s) => s.userId === currentUserId);
              const myShare = mySplit?.amount ?? 0;
              const iPaid = expense.paidBy === currentUserId;
              const paidByName = iPaid
                ? "You"
                : (expense.paidByUser?.name.split(" ")[0] ?? "Someone");

              let subAmountText = "";
              let subAmountColor: string = color.text;

              if (iPaid) {
                const lentAmount = expense.amount - myShare;
                if (lentAmount > 0) {
                  subAmountText = `Lent ${formatAmount(lentAmount, expense.currency)}`;
                  subAmountColor = color.success;
                }
              } else if (myShare > 0) {
                subAmountText = `You owe ${formatAmount(myShare, expense.currency)}`;
                subAmountColor = color.danger;
              }

              return (
                <MoneyRow
                  key={expense.id}
                  avatar={<CategoryIconBadge category={expense.category} size="md" />}
                  title={expense.title}
                  subtitle={`${paidByName} paid - ${formatActivityDate(expense.date ?? expense.createdAt)}`}
                  onPress={() => onExpensePress(expense.id)}
                  amount={formatAmount(expense.amount, expense.currency)}
                  rightElement={
                    <View style={{ alignItems: "flex-end" }}>
                      {subAmountText ? (
                        <Text
                          style={{
                            fontSize: 12,
                            color: subAmountColor,
                            fontFamily: "InstrumentSans_600SemiBold",
                            marginTop: 4,
                          }}
                        >
                          {subAmountText}
                        </Text>
                      ) : null}
                      <icons.ChevronRight size={18} color={color.muted} />
                    </View>
                  }
                />
              );
            })
          ) : (
            <View style={{ paddingVertical: 28, alignItems: "center", justifyContent: "center" }}>
              <EmptyIconShell icon={icons.PackageOpen} />
              <Text
                style={{
                  fontSize: 16,
                  color: color.text,
                  fontFamily: "InstrumentSans_600SemiBold",
                  marginBottom: 4,
                }}
              >
                No activity yet
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: color.muted,
                  fontFamily: "InstrumentSans_500Medium",
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                Log your first expense to get started.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onAddExpense}
                style={({ pressed }) => ({
                  paddingHorizontal: 20,
                  minHeight: 44,
                  backgroundColor: color.text,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: color.textInverse,
                    fontFamily: "InstrumentSans_600SemiBold",
                  }}
                >
                  Log your first expense
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
