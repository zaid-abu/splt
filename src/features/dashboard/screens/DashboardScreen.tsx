import type { JSX } from "react";
import { useCallback, useMemo, useState, useRef } from "react";
import { ScrollView, View, RefreshControl, StyleSheet } from "react-native";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Typography } from "heroui-native";
import { useQueryClient } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { UI, IconButton } from "@/components/ui/native-ui";
import { HapticButton } from "@/components/ui/HapticButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useFriends } from "@/features/friends/queries/useFriends";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import { useOverallBalances } from "@/features/settlements/hooks/useBalances";
import { useNotifications } from "@/features/notifications/queries/useNotifications";
import { useAnalytics } from "@/features/analytics/hooks/useAnalytics";
import { getGreeting } from "@/utils/date";
import type { User } from "@/types";

import { BalanceWidget } from "../components/BalanceWidget";
import { QuickActions } from "../components/QuickActions";
import { AttentionList } from "../components/AttentionList";
import { DashboardGroups } from "../components/DashboardGroups";
import { DashboardActivity } from "../components/DashboardActivity";
import { DashboardSkeleton } from "../components/DashboardSkeleton";
import { SettleUpSheet } from "../components/SettleUpSheet";

export default function DashboardScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  const {
    data: groups = [],
    isLoading: isLoadingGroups,
    isError: isGroupsError,
    refetch: refetchGroups,
  } = useGroups(currentUser?.id);
  const { data: friends = [] } = useFriends(currentUser?.id);
  const {
    data: expenses = [],
    isLoading: isLoadingExpenses,
    isError: isExpensesError,
    refetch: refetchExpenses,
  } = useUserExpenses(currentUser?.id);
  const {
    data: settlements = [],
    isLoading: isLoadingSettlements,
    isError: isSettlementsError,
    refetch: refetchSettlements,
  } = useUserSettlements(currentUser?.id);

  const isFirstLoad = isLoadingGroups || isLoadingExpenses || isLoadingSettlements;

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const { data: notifications = [] } = useNotifications(currentUser?.id);
  const hasNotifications = notifications.length > 0;

  const [refreshing, setRefreshing] = useState(false);
  const [activityFilter, setActivityFilter] = useState<"all" | "paid" | "owe">("all");
  const queryClient = useQueryClient();

  const settleSheetRef = useRef<BottomSheetModal>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: UI.color.bg },
      }),
    []
  );

  const { data: perUserBalances = new Map() } = useOverallBalances(
    currentUser.id,
    groups,
    expenses,
    settlements,
    preferredCurrency,
    convertCurrency
  );

  const owedToYou = useMemo(() => {
    let total = 0;
    for (const balance of perUserBalances.values()) {
      if (balance > 0) total += balance;
    }
    return total;
  }, [perUserBalances]);

  const youOwe = useMemo(() => {
    let total = 0;
    for (const balance of perUserBalances.values()) {
      if (balance < 0) total += balance;
    }
    return Math.abs(total);
  }, [perUserBalances]);

  const oweUsers = useMemo(() => {
    return friends
      .filter((u) => u.id !== currentUser.id && (perUserBalances.get(u.id) ?? 0) < 0)
      .slice(0, 4);
  }, [friends, currentUser.id, perUserBalances]);

  const owedUsers = useMemo(() => {
    return friends
      .filter((u) => u.id !== currentUser.id && (perUserBalances.get(u.id) ?? 0) > 0)
      .slice(0, 4);
  }, [friends, currentUser.id, perUserBalances]);

  const recentExpenses = useMemo(() => {
    let filtered = [...expenses];
    if (activityFilter === "paid") {
      filtered = filtered.filter((e) => e.paidBy === currentUser.id);
    } else if (activityFilter === "owe") {
      filtered = filtered.filter(
        (e) =>
          e.paidBy !== currentUser.id &&
          e.splits.some((s) => s.userId === currentUser.id && !s.paid)
      );
    }
    return filtered
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [expenses, activityFilter, currentUser.id]);

  const userById = useMemo(() => {
    const map = new Map<string, User>();
    friends.forEach((f) => map.set(f.id, f));
    return map;
  }, [friends]);

  const activeGroups = useMemo(() => {
    const groupBalances = groups.map((group) => {
      const balancesMap = balancesUtil.getUserBalances(
        currentUser.id,
        group.id,
        groups,
        expenses,
        settlements,
        preferredCurrency,
        convertCurrency
      );
      let netBalance = 0;
      for (const amount of balancesMap.values()) {
        netBalance += amount;
      }
      const latestExpenseAt = expenses
        .filter((expense) => expense.groupId === group.id)
        .reduce((latest, expense) => {
          const expenseTime = new Date(expense.createdAt).getTime();
          return Math.max(latest, expenseTime);
        }, new Date(group.createdAt).getTime());

      return { group, netBalance, latestExpenseAt };
    });

    groupBalances.sort((a, b) => {
      const aHasBalance = Math.abs(a.netBalance) > 0.005;
      const bHasBalance = Math.abs(b.netBalance) > 0.005;
      if (aHasBalance !== bHasBalance) return aHasBalance ? -1 : 1;
      if (a.latestExpenseAt !== b.latestExpenseAt) return b.latestExpenseAt - a.latestExpenseAt;
      return Math.abs(b.netBalance) - Math.abs(a.netBalance);
    });

    return groupBalances.slice(0, 4);
  }, [groups, currentUser.id, expenses, settlements, preferredCurrency, convertCurrency]);

  const firstName = useMemo(() => currentUser.name.split(" ")[0], [currentUser.name]);
  const netBalance = owedToYou - youOwe;
  const balanceTone = netBalance < 0 ? "danger" : netBalance > 0 ? "success" : "neutral";
  const balanceTitle =
    netBalance > 0
      ? `${formatAmount(netBalance, preferredCurrency.code)} owed to you`
      : netBalance < 0
        ? `${formatAmount(Math.abs(netBalance), preferredCurrency.code)} left to settle`
        : "You are settled up";
  const owedBackLabel =
    owedUsers.length > 1
      ? `${owedUsers.length} people`
      : owedUsers[0]?.name.split(" ")[0] || "Someone";
  const waitingPersonLabel =
    oweUsers.length > 1
      ? `${oweUsers.length} people`
      : oweUsers[0]?.name.split(" ")[0] || "Someone";
  const balanceSubtitle =
    netBalance > 0
      ? `${owedBackLabel} can settle back when ready.`
      : netBalance < 0
        ? `${waitingPersonLabel} ${oweUsers.length > 1 ? "are" : "is"} waiting on you.`
        : "Nothing urgent. Add expenses as they happen.";
  const openGroupCount = activeGroups.filter(
    ({ netBalance: amount }) => Math.abs(amount) > 0.005
  ).length;

  const { totalSpent, expenseCount } = useAnalytics(
    currentUser?.id,
    "month",
    preferredCurrency.code,
    convertCurrency
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await queryClient.invalidateQueries({
      queryKey: ["groups", "expenses", "settlements", "friends", "notifications", "activities"],
    });
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [queryClient]);

  const handleSettleUp = useCallback(() => {
    if (owedUsers.length > 0 && oweUsers.length > 0) {
      settleSheetRef.current?.present();
    } else if (owedToYou > 0) {
      router.push(`/settle/${owedUsers[0].id}`);
    } else if (youOwe > 0) {
      router.push(`/settle/${oweUsers[0].id}`);
    } else {
      router.push("/(tabs)/friends");
    }
  }, [owedUsers, oweUsers, owedToYou, youOwe, router]);

  return (
    <View style={styles.screen}>
      <ThemedStatusBar />

      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 12,
          paddingHorizontal: UI.space.page,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1 }}>
          <Typography
            style={{
              fontSize: 14,
              color: UI.color.muted,
              fontFamily: "IBMPlexSans_500Medium",
              marginBottom: 6,
            }}
          >
            {getGreeting()},
          </Typography>
          <Typography
            style={{
              fontFamily: "Sora_600SemiBold",
              fontSize: 30,
              color: UI.color.textStrong,
              lineHeight: 34,
              letterSpacing: -0.3,
            }}
            numberOfLines={1}
          >
            {firstName}
          </Typography>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginLeft: 12 }}>
          <View>
            <IconButton
              icon={icons.Bell}
              accessibilityLabel="View notifications"
              onPress={() => router.push("/notifications")}
            />
            {hasNotifications && (
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: UI.color.danger,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  borderWidth: 2,
                  borderColor: UI.color.control,
                }}
              />
            )}
          </View>
          <IconButton
            icon={icons.CircleUserRound}
            accessibilityLabel="Open profile"
            onPress={() => router.push("/profile")}
          />
        </View>
      </View>

      {isGroupsError || isExpensesError || isSettlementsError ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ErrorState
            onRetry={() => {
              if (isGroupsError) refetchGroups();
              if (isExpensesError) refetchExpenses();
              if (isSettlementsError) refetchSettlements();
            }}
          />
        </View>
      ) : isFirstLoad ? (
        <DashboardSkeleton />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={UI.color.text}
            />
          }
        >
          <BalanceWidget
            youOwe={youOwe}
            owedToYou={owedToYou}
            netBalance={netBalance}
            balanceTone={balanceTone}
            balanceTitle={balanceTitle}
            balanceSubtitle={balanceSubtitle}
            totalSpent={totalSpent}
            expenseCount={expenseCount}
            preferredCurrency={preferredCurrency}
          />

          <QuickActions
            onAddExpense={() => router.push("/expense/new")}
            onSettleUp={handleSettleUp}
          />

          {friends.length <= 1 && (
            <Animated.View
              entering={FadeInDown.duration(350).delay(70).springify()}
              style={{ paddingHorizontal: UI.space.page, marginBottom: 24 }}
            >
              <View
                style={{
                  backgroundColor: UI.color.surface,
                  borderRadius: UI.radius.lg,
                  borderWidth: 1,
                  borderColor: UI.color.border,
                  padding: 20,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: UI.radius.lg,
                    backgroundColor: UI.color.control,
                    borderWidth: 1,
                    borderColor: UI.color.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <icons.UserPlus size={22} color={UI.color.muted} strokeWidth={1.5} />
                </View>
                <Typography
                  style={{
                    fontSize: 17,
                    color: UI.color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    marginBottom: 4,
                    textAlign: "center",
                  }}
                >
                  {friends.length === 0 ? "Find your people" : "Expand your circle"}
                </Typography>
                <Typography
                  style={{
                    fontSize: 14,
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_500Medium",
                    textAlign: "center",
                    marginBottom: 14,
                    lineHeight: 20,
                  }}
                >
                  {friends.length === 0
                    ? "Add friends to start splitting expenses together."
                    : "You have a few friends. Add more to split group expenses."}
                </Typography>
                <HapticButton
                  tone="outlined"
                  height={44}
                  onPress={() => router.push("/friend/new")}
                >
                  {friends.length === 0 ? "Add friend" : "Find friends"}
                </HapticButton>
              </View>
            </Animated.View>
          )}

          <AttentionList
            oweUsers={oweUsers}
            owedUsers={owedUsers}
            perUserBalances={perUserBalances}
            currentUserId={currentUser.id}
            preferredCurrency={preferredCurrency}
          />

          <DashboardGroups
            activeGroups={activeGroups}
            openGroupCount={openGroupCount}
            isLoadingGroups={isLoadingGroups}
            preferredCurrency={preferredCurrency.code}
            onGroupPress={(id) => router.push(`/group/${id}`)}
            onViewAllGroups={() => router.push("/(tabs)/groups")}
            onCreateGroup={() => router.push("/group/new")}
          />

          <DashboardActivity
            recentExpenses={recentExpenses}
            activityFilter={activityFilter}
            onFilterChange={setActivityFilter}
            currentUserId={currentUser.id}
            userById={userById}
            preferredCurrency={preferredCurrency}
            onExpensePress={(id) => router.push(`/expense/${id}`)}
            onViewAllActivity={() => router.push("/(tabs)/activity")}
            onLogFirstExpense={() => router.push("/expense/new")}
          />
        </ScrollView>
      )}

      <SettleUpSheet
        sheetRef={settleSheetRef}
        currentUserId={currentUser.id}
        friends={friends}
        perUserBalances={perUserBalances}
        preferredCurrency={preferredCurrency}
      />
    </View>
  );
}
