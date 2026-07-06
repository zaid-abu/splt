import { useLocalSearchParams, useRouter } from "expo-router";
import type { GroupRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { View, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Text } from "@/components/primitives/Text";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import * as icons from "lucide-react-native";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import { calculateTotalGroupExpenses } from "@/features/groups/utils/calculations";
import { BalanceCard } from "@/features/dashboard/components/BalanceCard";
import type { Expense, User } from "@/types";

const CATEGORY_ICONS: Record<string, keyof typeof icons> = {
  food: "Utensils",
  transport: "Car",
  accommodation: "Home",
  entertainment: "Film",
  shopping: "ShoppingBag",
  utilities: "Zap",
  health: "Pill",
  travel: "Plane",
  other: "Package",
};

const CATEGORY_COLORS: Record<string, { bg: string; icon: string }> = {
  food: { bg: "#FEF3C7", icon: "#F59E0B" },
  transport: { bg: "#DBEAFE", icon: "#3B82F6" },
  accommodation: { bg: "#FCE7F3", icon: "#EC4899" },
  entertainment: { bg: "#EDE9FE", icon: "#8B5CF6" },
  shopping: { bg: "#FEE2E2", icon: "#EF4444" },
  utilities: { bg: "#D1FAE5", icon: "#10B981" },
  health: { bg: "#CFFAFE", icon: "#06B6D4" },
  travel: { bg: "#E0E7FF", icon: "#6366F1" },
  other: { bg: "#F1F5F9", icon: "#64748B" },
};

interface TransactionRowProps {
  expense: Expense;
  currentUserId: string;
  paidByUser?: User;
  myShare: number;
  isLast: boolean;
  onPress: () => void;
}

function TransactionRow({
  expense,
  currentUserId,
  paidByUser,
  myShare,
  isLast,
  onPress,
}: TransactionRowProps): JSX.Element {
  const cat = expense.category ?? "other";
  const colors = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other;
  const iconName = CATEGORY_ICONS[cat] ?? "Package";
  const IconComp = (icons as any)[iconName] as React.ComponentType<{
    size: number;
    color: string;
    strokeWidth: number;
  }>;

  const iPaid = expense.paidBy === currentUserId;
  const paidByName = iPaid ? "You" : (paidByUser?.name.split(" ")[0] ?? "Someone");

  let subAmountText = "";
  let subAmountColor: "danger" | "success" = "danger";

  if (iPaid) {
    const lentAmount = expense.amount - myShare;
    if (lentAmount > 0) {
      subAmountText = formatAmount(lentAmount, expense.currency);
      subAmountColor = "success";
    }
  } else if (myShare > 0) {
    subAmountText = formatAmount(myShare, expense.currency);
    subAmountColor = "danger";
  }

  const dateStr = expense.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`flex-row items-center py-4 px-4 bg-surface active:opacity-50 ${isLast ? "" : "border-b border-border"}`}
    >
      <View
        style={{ backgroundColor: colors.bg }}
        className="w-12 h-12 rounded-xl items-center justify-center mr-4 shrink-0 relative"
      >
        <IconComp size={24} color={colors.icon} strokeWidth={1.5} />
        {paidByUser && (
          <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-background items-center justify-center">
            <Text variant="caption" color="primary" className="text-center">
              {paidByUser.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-1 mr-3">
        <Text variant="body" className="font-bold" color="foreground" numberOfLines={1}>
          {expense.title}
        </Text>
        <Text variant="bodySmall" color="muted" className="mt-1">
          {paidByName} paid
        </Text>
      </View>

      <View className="items-end shrink-0">
        <Text variant="body" className="font-bold" color="foreground">
          {formatAmount(expense.amount, expense.currency)}
        </Text>
        {!!subAmountText ? (
          <Text variant="bodySmall" color={subAmountColor} className="font-bold mt-1">
            {subAmountText}
          </Text>
        ) : (
          <Text variant="bodySmall" color="muted" className="mt-1">
            {dateStr}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function GroupDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<GroupRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? "";

  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: allExpenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);

  const convertCurrency = useUIStore((s) => s.convertCurrency);
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);

  const group = useMemo(() => groups.find((g) => g.id === id), [groups, id]);

  const expenses = useMemo(
    () =>
      allExpenses
        .filter((e) => e.groupId === id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [allExpenses, id]
  );

  const totalExpensesInGroupCurrency = useMemo(
    () => calculateTotalGroupExpenses(expenses, group?.currency ?? "USD", convertCurrency),
    [expenses, group, convertCurrency]
  );

  const groupDebts = useMemo(() => {
    if (!group) return [];
    return group.simplifyDebts
      ? balancesUtil.getSimplifiedDebts(
          group.id,
          expenses,
          settlements,
          group,
          preferredCurrency,
          convertCurrency
        )
      : balancesUtil.getExactPairwiseDebts(
          group.id,
          expenses,
          settlements,
          group,
          preferredCurrency,
          convertCurrency
        );
  }, [group, expenses, settlements, preferredCurrency, convertCurrency]);

  const oweUsers = useMemo(() => {
    if (!group) return [];
    return groupDebts
      .filter((d) => d.fromUserId === userId)
      .map((d) => group.members.find((m) => m.userId === d.toUserId)?.user)
      .filter(Boolean) as User[];
  }, [groupDebts, userId, group]);

  const owedUsers = useMemo(() => {
    if (!group) return [];
    return groupDebts
      .filter((d) => d.toUserId === userId)
      .map((d) => group.members.find((m) => m.userId === d.fromUserId)?.user)
      .filter(Boolean) as User[];
  }, [groupDebts, userId, group]);

  const youOwe = useMemo(
    () =>
      groupDebts
        .filter((d) => d.fromUserId === userId)
        .reduce((acc, curr) => acc + curr.amount, 0),
    [groupDebts, userId]
  );

  const owedToYou = useMemo(
    () =>
      groupDebts
        .filter((d) => d.toUserId === userId)
        .reduce((acc, curr) => acc + curr.amount, 0),
    [groupDebts, userId]
  );

  const userById = useMemo(() => {
    const map = new Map<string, User>();
    group?.members.forEach((m) => m.userId && map.set(m.userId, m.user));
    return map;
  }, [group]);

  if (!currentUser) return <></>;

  if (!group) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-6">
          <EmptyState
            icon="AlertCircle"
            title="Group not found"
            description="This group may have been deleted."
            action={{ label: "Go back", onPress: () => router.back() }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const GroupIcon = (icons as any)[group.icon] || icons.Users;

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />

      <View
        className="flex-row items-center justify-between px-6 pb-6"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
          className="w-11 h-11 items-center justify-center bg-transparent border border-border rounded-xl active:opacity-50"
        >
          <icons.ArrowLeft size={20} color="#FB923C" strokeWidth={1.5} />
        </Pressable>

        <View className="flex-row items-center justify-center gap-3 flex-1 mx-4">
          <GroupIcon size={24} color="#FB923C" strokeWidth={1.5} />
          <Text variant="screenTitle" color="primary" numberOfLines={1} className="shrink-1 text-center">
            {group.name}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/group/${group.id}/settings`)}
          className="w-11 h-11 items-center justify-center bg-transparent border border-border rounded-xl active:opacity-50"
        >
          <icons.Settings size={20} color="#FB923C" strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="px-6 mb-10"
        >
          <View className="bg-surface border border-border rounded-2xl overflow-hidden">
            <BalanceCard
              youOwe={youOwe}
              owedToYou={owedToYou}
              currencyCode={group.currency}
              oweUsers={oweUsers}
              owedUsers={owedUsers}
              onOwePress={() => router.push(`/group/${group.id}/settle`)}
              onOwedPress={() => router.push(`/group/${group.id}/settle`)}
            />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(50).springify()}
          className="px-6 mb-10"
        >
          <Text variant="sectionLabel" className="mb-4 px-1">
            Group Balances
          </Text>
          <View className="bg-surface border border-border rounded-2xl overflow-hidden">
            {groupDebts.length === 0 ? (
              <EmptyState
                icon="Check"
                title="All settled up!"
              />
            ) : (
              groupDebts.map((debt, idx) => {
                const fromUser = group.members.find((m) => m.userId === debt.fromUserId)?.user;
                const toUser = group.members.find((m) => m.userId === debt.toUserId)?.user;
                if (!fromUser || !toUser) return null;

                const isMeOwe = fromUser.id === userId;
                const isOweMe = toUser.id === userId;
                const amountColor = isMeOwe ? "danger" : isOweMe ? "success" : "primary";
                const isLast = idx === groupDebts.length - 1;

                return (
                  <Pressable
                    key={`${debt.fromUserId}-${debt.toUserId}`}
                    accessibilityRole="button"
                    className={`flex-row items-center justify-between py-4 px-4 bg-surface active:opacity-50 ${isLast ? "" : "border-b border-border"}`}
                  >
                    <View className="flex-row items-center gap-4">
                      <AppUserAvatar user={fromUser} size="md" />
                      <View>
                        <Text variant="body" className="font-bold" color="foreground">
                          {isMeOwe ? "You" : fromUser.name}
                        </Text>
                        <Text variant="bodySmall" color="muted" className="mt-1">
                          owes {isOweMe ? "you" : toUser.name.split(" ")[0]}
                        </Text>
                      </View>
                    </View>
                    <Text variant="sectionLabel" className="font-bold" color={amountColor}>
                      {formatAmount(debt.amount, group.currency)}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(100).springify()}
          className="px-6 mb-10"
        >
          <View className="flex-row items-center justify-between mb-4 px-1">
            <Text variant="sectionLabel">Transactions</Text>
            <Text variant="bodySmall" className="font-bold" color="primary">
              Total: {formatAmount(totalExpensesInGroupCurrency, group.currency)}
            </Text>
          </View>

          <View className="bg-surface border border-border rounded-2xl overflow-hidden">
            {expenses.length === 0 ? (
              <EmptyState
                icon="Receipt"
                title="No expenses yet"
                description="Add the first expense for this group"
              />
            ) : (
              expenses.map((expense, idx) => {
                const mySplit = expense.splits.find((s) => s.userId === userId);
                const paidByUser = userById.get(expense.paidBy);
                return (
                  <TransactionRow
                    key={expense.id}
                    expense={expense}
                    currentUserId={userId}
                    paidByUser={paidByUser}
                    myShare={mySplit?.amount ?? 0}
                    isLast={idx === expenses.length - 1}
                    onPress={() => router.push(`/expense/${expense.id}`)}
                  />
                );
              })
            )}
          </View>
        </Animated.View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 px-6 pt-4 flex-row gap-4 bg-background border-t border-border"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Button
          variant="secondary"
          size="md"
          fullWidth
          leftIcon={<icons.Handshake size={20} color="#FB923C" strokeWidth={1.5} />}
          onPress={() => router.push(`/group/${group.id}/settle`)}
          className="flex-1"
        >
          Settle Up
        </Button>

        <Button
          variant="primary"
          size="md"
          fullWidth
          leftIcon={<icons.Plus size={20} color="#FAFAFA" strokeWidth={2} />}
          onPress={() => router.push(`/expense/new?groupId=${group.id}`)}
          className="flex-1"
        >
          Add Expense
        </Button>
      </View>
    </View>
  );
}
