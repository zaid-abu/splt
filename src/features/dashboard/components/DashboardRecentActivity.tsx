import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { useUI, FilterPill, GlassSection, GlassRow } from "@/components/ui";
import { CategoryIconBadge } from "@/components/ui/CategoryIconBadge";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { formatActivityDate } from "@/utils/date";
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

      <GlassSection title="Recent activity" viewAllLabel="View all" onViewAll={onViewAll}>
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
              <GlassRow
                key={expense.id}
                icon={<CategoryIconBadge category={expense.category} size="md" />}
                title={expense.title}
                subtitle={`${paidByName} paid - ${formatActivityDate(expense.date ?? expense.createdAt)}`}
                onPress={() => onExpensePress(expense.id)}
                showChevron
                end={
                  <View style={{ alignItems: "flex-end" }}>
                    <Typography
                      style={{
                        fontSize: 15,
                        color: color.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      {formatAmount(expense.amount, expense.currency)}
                    </Typography>
                    {subAmountText ? (
                      <Typography
                        style={{
                          fontSize: 12,
                          color: subAmountColor,
                          fontFamily: "IBMPlexSans_600SemiBold",
                          marginTop: 4,
                        }}
                      >
                        {subAmountText}
                      </Typography>
                    ) : null}
                  </View>
                }
              />
            );
          })
        ) : (
          <View
            style={{ paddingVertical: 28, alignItems: "center", justifyContent: "center" }}
          >
            <EmptyIconShell icon={icons.PackageOpen} />
            <Typography
              style={{
                fontSize: 16,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
                marginBottom: 4,
              }}
            >
              No activity yet
            </Typography>
            <Typography
              style={{
                fontSize: 14,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Log your first expense to get started.
            </Typography>
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
              <Typography
                style={{
                  fontSize: 15,
                  color: color.textInverse,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                Log your first expense
              </Typography>
            </Pressable>
          </View>
        )}
      </GlassSection>
    </View>
  );
}
