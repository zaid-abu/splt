import type { ComponentType, JSX } from "react";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, View, RefreshControl, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Typography } from "heroui-native";
import { useQueryClient } from "@tanstack/react-query";
import Animated, { FadeInDown, LinearTransition, Easing } from "react-native-reanimated";

import { FocusAwareView } from "@/components/animations/PageAnimator";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { AppLoader } from "@/components/ui/AppLoader";
import { TransactionRow } from "@/features/expenses/components/TransactionRow";
import { GroupRow } from "@/features/groups/components/GroupRow";
import { UI, FilterPill } from "@/components/ui/native-ui";
import { MoneySignal } from "@/components/ui/MoneySignal";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useFriends } from "@/features/friends/queries/useFriends";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import { useNotifications } from "@/features/notifications/queries/useNotifications";
import { useAnalytics } from "@/features/analytics/hooks/useAnalytics";
import { getGreeting } from "@/utils/date";
import type { User } from "@/types";



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

function IconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
}: {
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  accessibilityLabel: string;
  onPress: () => void;
}): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: UI.color.control,
        borderRadius: UI.radius.pill,
        borderWidth: 1,
        borderColor: UI.color.border,
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Icon size={18} color={UI.color.text} strokeWidth={1.75} />
    </Pressable>
  );
}

function QuickAction({
  icon: Icon,
  label,
  detail,
  onPress,
  primary = false,
}: {
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  detail: string;
  onPress: () => void;
  primary?: boolean;
}): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 66,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: primary ? UI.color.text : UI.color.border,
        backgroundColor: primary ? UI.color.text : UI.color.control,
        opacity: pressed ? 0.78 : 1,
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: primary ? "rgba(255,255,255,0.12)" : UI.color.subtle,
          marginBottom: 7,
        }}
      >
        <Icon size={17} color={primary ? "#FFFFFF" : UI.color.text} strokeWidth={2} />
      </View>
      <Typography
        numberOfLines={1}
        style={{
          fontSize: 13,
          color: primary ? "#FFFFFF" : UI.color.text,
          fontFamily: "IBMPlexSans_600SemiBold",
          textAlign: "center",
        }}
      >
        {label}
      </Typography>
      <Typography
        numberOfLines={1}
        style={{
          marginTop: 1,
          fontSize: 11,
          color: primary ? "rgba(255,255,255,0.72)" : UI.color.muted,
          fontFamily: "IBMPlexSans_500Medium",
          textAlign: "center",
        }}
      >
        {detail}
      </Typography>
    </Pressable>
  );
}



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
    () =>
      balancesUtil.getTotalOwedToMe(
        currentUser.id,
        groups,
        expenses,
        settlements,
        preferredCurrency,
        convertCurrency
      ),
    [currentUser.id, groups, expenses, settlements, preferredCurrency, convertCurrency]
  );

  const youOwe = useMemo(
    () =>
      Math.abs(
        balancesUtil.getTotalIOwe(
          currentUser.id,
          groups,
          expenses,
          settlements,
          preferredCurrency,
          convertCurrency
        )
      ),
    [currentUser.id, groups, expenses, settlements, preferredCurrency, convertCurrency]
  );

  const perUserBalances = useMemo(
    () =>
      balancesUtil.getUserBalances(
        currentUser.id,
        undefined,
        groups,
        expenses,
        settlements,
        preferredCurrency,
        convertCurrency
      ),
    [currentUser.id, groups, expenses, settlements, preferredCurrency, convertCurrency]
  );

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
    await queryClient.invalidateQueries();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [queryClient]);

  return (
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <StatusBar style="dark" />

      {/* Greeting + Actions */}
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
              includeFontPadding: false,
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
              includeFontPadding: false,
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={UI.color.text} />
        }
      >
        {/* Net Balance Card */}
        <FocusAwareView delay={0} style={{ paddingHorizontal: UI.space.page, marginBottom: 18 }}>
          <View
            style={{
              backgroundColor: UI.color.surface,
              borderRadius: UI.radius.lg,
              borderWidth: 1,
              borderColor: UI.color.border,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor:
                    balanceTone === "danger"
                      ? "#FFF7F5"
                      : balanceTone === "success"
                        ? "#F5FCF8"
                        : UI.color.subtle,
                  borderWidth: 1,
                  borderColor: UI.color.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {balanceTone === "danger" ? (
                  <icons.ArrowUpRight size={20} color={UI.color.danger} strokeWidth={2.25} />
                ) : balanceTone === "success" ? (
                  <icons.ArrowDownLeft size={20} color={UI.color.success} strokeWidth={2.25} />
                ) : (
                  <icons.Check size={20} color={UI.color.muted} strokeWidth={2.25} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Typography
                  style={{
                    fontSize: 12,
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  Today&apos;s money state
                </Typography>
                <Typography
                  style={{
                    marginTop: 4,
                    fontSize: 22,
                    color: UI.color.textStrong,
                    fontFamily: "Sora_600SemiBold",
                    letterSpacing: -0.2,
                  }}
                >
                  {balanceTitle}
                </Typography>
                <Typography
                  style={{
                    marginTop: 5,
                    fontSize: 14,
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_500Medium",
                  }}
                >
                  {balanceSubtitle}
                </Typography>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <MoneySignal
                label="You owe"
                value={formatAmount(youOwe, preferredCurrency.code)}
                tone={youOwe > 0 ? "danger" : "neutral"}
              />
              <MoneySignal
                label="Owed to you"
                value={formatAmount(owedToYou, preferredCurrency.code)}
                tone={owedToYou > 0 ? "success" : "neutral"}
              />
            </View>
          </View>
        </FocusAwareView>

        {/* Quick Actions */}
        <FocusAwareView delay={35} style={{ paddingHorizontal: UI.space.page, marginBottom: 24 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <QuickAction
              icon={icons.ReceiptText}
              label="Expense"
              detail="Add new"
              onPress={() => router.push("/expense/new")}
              primary
            />
            <QuickAction
              icon={icons.HandCoins}
              label="Settle"
              detail={
                youOwe > 0
                  ? `${oweUsers.length || 1} balance${oweUsers.length === 1 ? "" : "s"}`
                  : "Review balances"
              }
              onPress={() =>
                oweUsers.length > 0
                  ? router.push(`/settle/${oweUsers[0].id}`)
                  : router.push("/(tabs)/friends")
              }
            />
            <QuickAction
              icon={icons.ListChecks}
              label="Activity"
              detail="Timeline"
              onPress={() => router.push("/(tabs)/activity")}
            />
          </View>
        </FocusAwareView>

        {/* Stats/Analytics Preview Card */}
        <FocusAwareView delay={70} style={{ paddingHorizontal: UI.space.page, marginBottom: 24 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(tabs)/stats")}
            style={({ pressed }) => ({
              backgroundColor: UI.color.textStrong,
              borderRadius: UI.radius.lg,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flex: 1 }}>
              <Typography
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "IBMPlexSans_600SemiBold",
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  marginBottom: 6,
                }}
              >
                This Month
              </Typography>
              <Typography
                style={{
                  fontSize: 26,
                  color: "#FFFFFF",
                  fontFamily: "Sora_600SemiBold",
                  letterSpacing: -0.3,
                  marginBottom: 4,
                }}
              >
                {formatAmount(totalSpent, preferredCurrency.code)}
              </Typography>
              <Typography
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: "IBMPlexSans_500Medium",
                }}
              >
                {expenseCount} expense{expenseCount !== 1 ? "s" : ""} this period
              </Typography>
            </View>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: UI.radius.xl,
                backgroundColor: "rgba(255,255,255,0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <icons.BarChart3 size={22} color="#FFFFFF" strokeWidth={1.75} />
            </View>
          </Pressable>
        </FocusAwareView>

        {/* Groups Section */}
        <FocusAwareView delay={105} style={{ paddingHorizontal: UI.space.page, marginBottom: 28 }}>
          <SectionLabel
            rightAction={
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                <Typography
                  style={{
                    fontSize: 13,
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_500Medium",
                  }}
                >
                  {openGroupCount} open
                </Typography>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/(tabs)/groups")}
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
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Create group"
                  onPress={() => router.push("/group/new")}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: UI.radius.pill,
                    borderWidth: 1,
                    borderColor: UI.color.border,
                    backgroundColor: UI.color.control,
                    opacity: pressed ? 0.72 : 1,
                  })}
                >
                  <icons.Plus size={22} color={UI.color.text} strokeWidth={2.5} />
                </Pressable>
              </View>
            }
          >
            Groups
          </SectionLabel>

          <View
            style={{
              backgroundColor: UI.color.surface,
              borderRadius: UI.radius.lg,
              borderWidth: 1,
              borderColor: UI.color.border,
              paddingHorizontal: 14,
            }}
          >
            {isLoadingGroups ? (
              <View style={{ paddingTop: 20 }}>
                <AppLoader />
              </View>
            ) : activeGroups.length > 0 ? (
              <>
                {activeGroups.map(({ group, netBalance }, idx) => (
                  <Animated.View
                    key={group.id}
                    entering={FadeInDown.duration(400)
                      .delay(idx * 50)
                      .easing(Easing.out(Easing.quad))}
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
                ))}
              </>
            ) : (
              <View style={{ paddingVertical: 28, alignItems: "center", justifyContent: "center" }}>
                <icons.UsersRound
                  size={38}
                  color={UI.color.muted}
                  strokeWidth={1.2}
                  style={{ marginBottom: 12 }}
                />
                <Typography
                  style={{
                    color: UI.color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    fontSize: 17,
                    marginBottom: 4,
                  }}
                >
                  No groups yet
                </Typography>
                <Typography
                  style={{
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_500Medium",
                    fontSize: 14,
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  Start a shared space for expenses.
                </Typography>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/group/new")}
                  style={({ pressed }) => ({
                    paddingHorizontal: 16,
                    minHeight: 44,
                    backgroundColor: UI.color.text,
                    borderRadius: UI.radius.pill,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Typography
                    style={{ fontSize: 14, color: "#FFFFFF", fontFamily: "IBMPlexSans_600SemiBold" }}
                  >
                    Create group
                  </Typography>
                </Pressable>
              </View>
            )}
          </View>
        </FocusAwareView>

        {/* Recent Activity */}
        <FocusAwareView delay={100} style={{ paddingHorizontal: UI.space.page, marginBottom: 24 }}>
          <SectionLabel
            rightAction={
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/(tabs)/activity")}
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
                const label = filter === "paid" ? "You paid" : filter === "owe" ? "You owe" : "All";
                return (
                  <FilterPill
                    key={filter}
                    label={label}
                    isActive={activityFilter === filter}
                    onPress={() => setActivityFilter(filter)}
                  />
                );
              })}
            </View>

            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense, idx) => {
                const mySplit = expense.splits.find((s) => s.userId === currentUser.id);
                const paidByUser = userById.get(expense.paidBy);
                return (
                  <Animated.View
                    key={expense.id}
                    entering={FadeInDown.duration(400)
                      .delay(idx * 50)
                      .easing(Easing.out(Easing.quad))}
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
              <Animated.View
                entering={FadeInDown.duration(400).easing(Easing.out(Easing.quad))}
                layout={LinearTransition}
                style={{ paddingVertical: 28, alignItems: "center", justifyContent: "center" }}
              >
                <icons.PackageOpen
                  size={42}
                  color={UI.color.muted}
                  strokeWidth={1}
                  style={{ marginBottom: 12 }}
                />
                <Typography
                  style={{
                    fontSize: 16,
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_500Medium",
                    textAlign: "center",
                  }}
                >
                  No activity yet.
                </Typography>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/expense/new")}
                  style={({ pressed }) => ({
                    marginTop: 14,
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
                    style={{ fontSize: 15, color: "#FFFFFF", fontFamily: "IBMPlexSans_600SemiBold" }}
                  >
                    Log your first expense
                  </Typography>
                </Pressable>
              </Animated.View>
            )}
          </View>
        </FocusAwareView>
      </ScrollView>
    </View>
  );
}
