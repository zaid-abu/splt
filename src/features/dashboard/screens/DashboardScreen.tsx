import type { JSX } from "react";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, View, RefreshControl, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import Animated, { FadeInDown, LinearTransition, Easing } from "react-native-reanimated";

import { FocusAwareView } from "@/components/animations/PageAnimator";
import { BalanceCard } from "@/features/dashboard/components/BalanceCard";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { Text } from "@/components/primitives/Text";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useFriends } from "@/features/friends/queries/useFriends";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import { useNotifications } from "@/features/notifications/queries/useNotifications";
import type { Expense, Group, User } from "@/types";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function SectionHeading({
  children,
  rightAction,
}: {
  children: string;
  rightAction?: JSX.Element;
}): JSX.Element {
  return (
    <View className="flex-row items-center justify-between mb-4 px-1">
      <Text variant="sectionLabel" className="text-foreground">{children}</Text>
      {rightAction}
    </View>
  );
}

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
  food: { bg: "#1A1510", icon: "#FB923C" },
  transport: { bg: "#10141A", icon: "#60A5FA" },
  accommodation: { bg: "#1A1018", icon: "#F472B6" },
  entertainment: { bg: "#14121A", icon: "#A78BFA" },
  shopping: { bg: "#1A1010", icon: "#F87171" },
  utilities: { bg: "#101A14", icon: "#34D399" },
  health: { bg: "#10181A", icon: "#22D3EE" },
  travel: { bg: "#14141A", icon: "#818CF8" },
  other: { bg: "#1A1A1E", icon: "#8E8E93" },
};

const GROUP_BG_PALETTE = [
  "#2D1A0C", "#0C1A2D", "#2D0C1F", "#1C0C2D",
  "#0C2D1A", "#0C2D2D", "#2D0C0C", "#0C0C2D",
];

function getGroupColor(id: string): string {
  const idx = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GROUP_BG_PALETTE.length;
  return GROUP_BG_PALETTE[idx];
}

// ─── TransactionRow ───────────────────────────────────────────────────────────
interface TransactionRowProps {
  expense: Expense;
  currentUserId: string;
  paidByUser?: User;
  myShare: number;
  isLast: boolean;
  onPress: () => void;
}

function TransactionRow({ expense, currentUserId, paidByUser, myShare, isLast, onPress }: TransactionRowProps): JSX.Element {
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
  let subAmountColor: "muted" | "success" | "foreground" = "muted";

  if (iPaid) {
    const lentAmount = expense.amount - myShare;
    if (lentAmount > 0) {
      subAmountText = `Lent ${formatAmount(lentAmount, expense.currency)}`;
      subAmountColor = "success";
    }
  } else if (myShare > 0) {
    subAmountText = `Borrowed ${formatAmount(myShare, expense.currency)}`;
    subAmountColor = "muted";
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`flex-row items-center py-4 px-4 bg-surface active:opacity-50 ${isLast ? "" : "border-b border-divider"}`}
    >
      <View
        style={{ backgroundColor: colors.bg }}
        className="w-12 h-12 border border-border items-center justify-center mr-4 rounded-xl"
      >
        <IconComp size={20} color={colors.icon} strokeWidth={1.5} />
      </View>

      <View className="flex-1 mr-3">
        <Text variant="body" className="font-bold text-foreground" numberOfLines={1}>
          {expense.title}
        </Text>
        <Text variant="bodySmall" color="muted" className="mt-0.5">
          {paidByName} paid
        </Text>
      </View>

      <View className="items-end">
        <Text variant="body" className="font-bold text-foreground">
          {formatAmount(expense.amount, expense.currency)}
        </Text>
        {!!subAmountText && (
          <Text variant="bodySmall" className={`font-semibold mt-0.5 ${subAmountColor === "success" ? "text-success" : "text-muted"}`}>
            {subAmountText}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ─── GroupRow ─────────────────────────────────────────────────────────────────
interface GroupRowProps {
  group: Group;
  balance: number;
  currency: string;
  isLast: boolean;
  onPress: () => void;
}

function GroupRow({ group, balance, currency, isLast, onPress }: GroupRowProps): JSX.Element {
  const memberCount = group.members.length;
  const iconBg = getGroupColor(group.id);

  let subAmountText = "";
  let subAmountColor: "muted" | "danger" | "success" = "muted";

  if (balance < 0) {
    subAmountText = `You owe ${formatAmount(Math.abs(balance), currency)}`;
    subAmountColor = "danger";
  } else if (balance > 0) {
    subAmountText = `Owes you ${formatAmount(balance, currency)}`;
    subAmountColor = "success";
  } else {
    subAmountText = "Settled up";
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`flex-row items-center py-4 px-4 bg-surface active:opacity-50 ${isLast ? "" : "border-b border-divider"}`}
    >
      <View
        style={{ backgroundColor: iconBg }}
        className="w-12 h-12 border border-border items-center justify-center mr-4 rounded-xl"
      >
        <Text variant="sectionLabel" className="text-foreground">
          {group.icon && group.icon.length <= 2
            ? group.icon
            : group.name.substring(0, 1).toUpperCase()}
        </Text>
      </View>

      <View className="flex-1 mr-3">
        <Text variant="body" className="font-bold text-foreground" numberOfLines={1}>
          {group.name}
        </Text>
        <Text variant="bodySmall" color="muted" className="mt-1">
          {memberCount} participants
        </Text>
      </View>

      <View className="items-end">
        <Text variant="bodySmall" className={`font-bold ${subAmountColor === "success" ? "text-success" : subAmountColor === "danger" ? "text-danger" : "text-muted"}`}>
          {subAmountText}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── DashboardScreen ──────────────────────────────────────────────────────────
export default function DashboardScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  const { data: groups = [], isLoading: isLoadingGroups } = useGroups(currentUser?.id);
  const { data: friends = [] } = useFriends(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const { data: notifications = [] } = useNotifications(currentUser?.id);
  const hasNotifications = notifications.length > 0;

  const [refreshing, setRefreshing] = useState(false);
  const [activityFilter, setActivityFilter] = useState<"all" | "paid" | "owe">("all");
  const queryClient = useQueryClient();

  const owedToYou = useMemo(
    () => balancesUtil.getTotalOwedToMe(currentUser?.id ?? "", groups, expenses, settlements, preferredCurrency, convertCurrency),
    [currentUser?.id, groups, expenses, settlements, preferredCurrency, convertCurrency],
  );

  const youOwe = useMemo(
    () => Math.abs(balancesUtil.getTotalIOwe(currentUser?.id ?? "", groups, expenses, settlements, preferredCurrency, convertCurrency)),
    [currentUser?.id, groups, expenses, settlements, preferredCurrency, convertCurrency],
  );

  const perUserBalances = useMemo(
    () => balancesUtil.getUserBalances(currentUser?.id ?? "", undefined, groups, expenses, settlements, preferredCurrency, convertCurrency),
    [currentUser?.id, groups, expenses, settlements, preferredCurrency, convertCurrency],
  );

  const oweUsers = useMemo(
    () => friends.filter((u) => u.id !== (currentUser?.id ?? "") && (perUserBalances.get(u.id) ?? 0) < 0).slice(0, 4),
    [friends, currentUser?.id, perUserBalances],
  );

  const owedUsers = useMemo(
    () => friends.filter((u) => u.id !== (currentUser?.id ?? "") && (perUserBalances.get(u.id) ?? 0) > 0).slice(0, 4),
    [friends, currentUser?.id, perUserBalances],
  );

  const recentExpenses = useMemo(() => {
    let filtered = [...expenses];
    if (activityFilter === "paid") {
      filtered = filtered.filter((e) => e.paidBy === (currentUser?.id ?? ""));
    } else if (activityFilter === "owe") {
      filtered = filtered.filter((e) => e.paidBy !== (currentUser?.id ?? "") && e.splits.some((s) => s.userId === (currentUser?.id ?? "") && !s.paid));
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  }, [expenses, activityFilter, currentUser?.id]);

  const userById = useMemo(() => {
    const map = new Map<string, User>();
    friends.forEach((f) => map.set(f.id, f));
    return map;
  }, [friends]);

  const activeGroups = useMemo(() => {
    const groupBalances = groups.map((group) => {
      const balancesMap = balancesUtil.getUserBalances(currentUser?.id ?? "", group.id, groups, expenses, settlements, preferredCurrency, convertCurrency);
      let netBalance = 0;
      for (const amount of balancesMap.values()) {
        netBalance += amount;
      }
      return { group, netBalance };
    });
    groupBalances.sort((a, b) => a.netBalance - b.netBalance);
    return groupBalances.slice(0, 4);
  }, [groups, currentUser?.id, expenses, settlements, preferredCurrency, convertCurrency]);

  const firstName = useMemo(() => currentUser?.name?.split(" ")[0] ?? "", [currentUser?.name]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await queryClient.invalidateQueries();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [queryClient]);

  if (!currentUser) return <></>;

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />

      <View className="flex-row items-center justify-between px-6 pb-4" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-1">
          <Text variant="bodySmall" color="muted" className="font-semibold mb-1">
            {getGreeting()},
          </Text>
          <Text variant="screenTitle" className="text-foreground font-heading tracking-tight" numberOfLines={1}>
            {firstName}.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/notifications");
          }}
          className="w-11 h-11 items-center justify-center border border-border rounded-xl active:opacity-50"
        >
          <View>
            <icons.Bell size={20} color="#FAFAFA" strokeWidth={1.5} />
            {hasNotifications && (
              <View className="absolute -top-1 -right-1 bg-danger w-2.5 h-2.5 rounded-full border-2 border-background" />
            )}
          </View>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FB923C" />
        }
      >
        <FocusAwareView delay={0} className="px-6 mb-10">
          <View className="bg-surface border border-border rounded-2xl overflow-hidden">
            <BalanceCard
              youOwe={youOwe}
              owedToYou={owedToYou}
              currencyCode={preferredCurrency.code}
              oweUsers={oweUsers}
              owedUsers={owedUsers}
              onOwePress={() => router.push("/(tabs)/friends")}
              onOwedPress={() => router.push("/(tabs)/friends")}
              onSettlePress={() => oweUsers.length > 0 && router.push(`/settle/${oweUsers[0].id}`)}
            />
          </View>
        </FocusAwareView>

        <FocusAwareView delay={50} className="px-6 mb-10">
          <SectionHeading
            rightAction={
              <View className="flex-row items-center gap-4">
                <Pressable onPress={() => router.push("/(tabs)/friends")} hitSlop={8}>
                  <Text variant="bodySmall" color="muted" className="font-bold">View all</Text>
                </Pressable>
                <Pressable onPress={() => router.push("/group/new")} hitSlop={8}>
                  <icons.Plus size={22} color="#FB923C" strokeWidth={2.5} />
                </Pressable>
              </View>
            }
          >
            Groups
          </SectionHeading>

          <View className="bg-surface border border-border rounded-2xl overflow-hidden">
            {isLoadingGroups ? (
              <Spinner />
            ) : activeGroups.length > 0 ? (
              activeGroups.map(({ group, netBalance }, idx) => (
                <Animated.View
                  key={group.id}
                  entering={FadeInDown.duration(400).delay(idx * 50).easing(Easing.out(Easing.quad))}
                  layout={LinearTransition}
                >
                  <GroupRow
                    group={group}
                    balance={netBalance}
                    currency={preferredCurrency.code}
                    isLast={idx === activeGroups.length - 1}
                    onPress={() => router.push(`/group/${group.id}`)}
                  />
                </Animated.View>
              ))
            ) : (
              <EmptyState
                icon="Users"
                title="No groups yet"
                description="Tap + to create your first group."
                action={{ label: "Create Group", onPress: () => router.push("/group/new") }}
              />
            )}
          </View>
        </FocusAwareView>

        <FocusAwareView delay={100} className="px-6 mb-8">
          <SectionHeading
            rightAction={
              <Pressable onPress={() => router.push("/(tabs)/activity")} hitSlop={8}>
                <Text variant="bodySmall" color="muted" className="font-bold">View all</Text>
              </Pressable>
            }
          >
            Activity
          </SectionHeading>

          <View className="flex-row gap-2 mb-5">
            {(["all", "paid", "owe"] as const).map((filter) => (
              <Pressable
                key={filter}
                onPress={() => setActivityFilter(filter)}
                className={`px-4 py-2 rounded-xl border active:opacity-70 ${
                  activityFilter === filter
                    ? "bg-primary border-primary"
                    : "bg-surface-2 border-border"
                }`}
              >
                <Text
                  variant="bodySmall"
                  className={`font-bold capitalize ${activityFilter === filter ? "text-primary" : "text-muted"}`}
                >
                  {filter}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="bg-surface border border-border rounded-2xl overflow-hidden">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense, idx) => {
                const mySplit = expense.splits.find((s) => s.userId === currentUser.id);
                const paidByUser = userById.get(expense.paidBy);
                return (
                  <Animated.View
                    key={expense.id}
                    entering={FadeInDown.duration(400).delay(idx * 50).easing(Easing.out(Easing.quad))}
                    layout={LinearTransition}
                  >
                    <TransactionRow
                      expense={expense}
                      currentUserId={currentUser.id}
                      paidByUser={paidByUser}
                      myShare={mySplit?.amount ?? 0}
                      isLast={idx === recentExpenses.length - 1}
                      onPress={() => router.push(`/expense/${expense.id}`)}
                    />
                  </Animated.View>
                );
              })
            ) : (
              <EmptyState
                icon="PackageOpen"
                title="No recent activity"
                description="Log your first expense to get started."
                action={{ label: "Add Expense", onPress: () => router.push("/expense/new") }}
              />
            )}
          </View>
        </FocusAwareView>
      </ScrollView>
    </View>
  );
}
