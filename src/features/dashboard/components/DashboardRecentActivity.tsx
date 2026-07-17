import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { useUI, TYPO, FilterPill } from "@/components/ui";
import { TransactionRow } from "@/features/expenses/components/TransactionRow";
import type { Expense, User } from "@/types";

type LucideIcon = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

function SectionLabel({
  children,
  rightAction,
}: {
  children: string;
  rightAction?: JSX.Element;
}): JSX.Element {
  const { color } = useUI();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
      }}
    >
      <Typography
        style={{
          fontSize: 18,
          color: color.text,
          fontFamily: "IBMPlexSans_600SemiBold",
          letterSpacing: -0.2,
        }}
      >
        {children}
      </Typography>
      {rightAction}
    </View>
  );
}

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
      <SectionLabel
        rightAction={
          <Pressable
            accessibilityRole="button"
            onPress={onViewAll}
            hitSlop={8}
            style={({ pressed }) => ({
              minHeight: 44,
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Typography
              style={{
                fontSize: 14,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              View all
            </Typography>
          </Pressable>
        }
      >
        Recent activity
      </SectionLabel>

      <View
        style={{
          backgroundColor: color.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.border,
          padding: 14,
        }}
      >
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 2 }}>
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

        {expenses.length > 0 ? (
          expenses.map((expense, idx) => {
            const mySplit = expense.splits.find((s) => s.userId === currentUserId);
            return (
              <TransactionRow
                key={expense.id}
                expense={expense}
                currentUserId={currentUserId}
                paidByUser={expense.paidByUser}
                myShare={mySplit?.amount ?? 0}
                isLast={idx === expenses.length - 1}
                onPress={() => onExpensePress(expense.id)}
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
      </View>
    </View>
  );
}
