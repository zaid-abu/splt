import type { JSX, ComponentType } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { TransactionRow } from "@/features/expenses/components/TransactionRow";
import { UI } from "@/components/ui/native-ui";
import { FilterPill } from "@/components/ui/native-ui";
import type { Expense, User } from "@/types";

type LucideIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

function EmptyIconShell({ icon: Icon }: { icon: LucideIcon }): JSX.Element {
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: UI.radius.lg,
        backgroundColor: UI.color.control,
        borderWidth: 1,
        borderColor: UI.color.border,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
      }}
    >
      <Icon size={24} color={UI.color.muted} strokeWidth={1.5} />
    </View>
  );
}

function SectionLabel({
  children,
  rightAction,
}: {
  children: string;
  rightAction?: JSX.Element;
}): JSX.Element {
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
          color: UI.color.text,
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

export interface DashboardActivityProps {
  recentExpenses: Expense[];
  activityFilter: "all" | "paid" | "owe";
  onFilterChange: (filter: "all" | "paid" | "owe") => void;
  currentUserId: string;
  userById: Map<string, User>;
  preferredCurrency: { code: string };
  onExpensePress: (expenseId: string) => void;
  onViewAllActivity: () => void;
  onLogFirstExpense: () => void;
}

export function DashboardActivity({
  recentExpenses,
  activityFilter,
  onFilterChange,
  currentUserId,
  userById,
  preferredCurrency,
  onExpensePress,
  onViewAllActivity,
  onLogFirstExpense,
}: DashboardActivityProps): JSX.Element {
  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(175).springify()}
      style={{ paddingHorizontal: UI.space.page, marginBottom: 24 }}
    >
      <SectionLabel
        rightAction={
          <Pressable
            accessibilityRole="button"
            onPress={onViewAllActivity}
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
                color: UI.color.text,
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
          backgroundColor: UI.color.surface,
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
          padding: 14,
        }}
      >
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 2 }}>
          {(["all", "paid", "owe"] as const).map((filter) => {
            const label =
              filter === "paid" ? "You paid" : filter === "owe" ? "You owe" : "All";
            return (
              <FilterPill
                key={filter}
                label={label}
                isActive={activityFilter === filter}
                onPress={() => onFilterChange(filter)}
              />
            );
          })}
        </View>

        {recentExpenses.length > 0 ? (
          recentExpenses.map((expense, idx) => {
            const mySplit = expense.splits.find((s) => s.userId === currentUserId);
            const paidByUser = userById.get(expense.paidBy);
            return (
              <TransactionRow
                key={expense.id}
                expense={expense}
                currentUserId={currentUserId}
                paidByUser={paidByUser}
                myShare={mySplit?.amount ?? 0}
                isLast={idx === recentExpenses.length - 1}
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
                color: UI.color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
                marginBottom: 4,
              }}
            >
              No activity yet
            </Typography>
            <Typography
              style={{
                fontSize: 14,
                color: UI.color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Log your first expense to get started.
            </Typography>
            <Pressable
              accessibilityRole="button"
              onPress={onLogFirstExpense}
              style={({ pressed }) => ({
                paddingHorizontal: 20,
                minHeight: 44,
                backgroundColor: UI.color.text,
                borderRadius: UI.radius.pill,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Typography
                style={{
                  fontSize: 15,
                  color: UI.color.textInverse,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                Log your first expense
              </Typography>
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
}
