import type { ComponentType, JSX } from "react";
import { useCallback, useMemo, useState, useEffect } from "react";
import { ScrollView, View, RefreshControl, Pressable, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Typography } from "heroui-native";
import { useQueryClient } from "@tanstack/react-query";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

import { FocusAwareView } from "@/components/animations/PageAnimator";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { TransactionRow } from "@/features/expenses/components/TransactionRow";
import { GroupRow } from "@/features/groups/components/GroupRow";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { UI, TYPO, FilterPill, IconButton } from "@/components/ui/native-ui";
import { HapticButton } from "@/components/ui/HapticButton";
import { Card } from "@/components/ui/Card";
import { Skeleton, ListRowSkeleton } from "@/components/ui/Skeleton";
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

type LucideIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

function IconShell({ icon: Icon, tone }: { icon: LucideIcon; tone: string }): JSX.Element {
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: UI.radius.lg,
        backgroundColor:
          tone === "danger"
            ? UI.color.dangerTint
            : tone === "success"
              ? UI.color.successTint
              : UI.color.control,
        borderWidth: 1,
        borderColor: UI.color.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon
        size={20}
        color={
          tone === "danger"
            ? UI.color.danger
            : tone === "success"
              ? UI.color.success
              : UI.color.muted
        }
        strokeWidth={2}
      />
    </View>
  );
}

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

export default function DashboardScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  const { data: groups = [], isLoading: isLoadingGroups } = useGroups(currentUser?.id);
  const { data: friends = [] } = useFriends(currentUser?.id);
  const { data: expenses = [], isLoading: isLoadingExpenses } = useUserExpenses(currentUser?.id);
  const { data: settlements = [], isLoading: isLoadingSettlements } = useUserSettlements(
    currentUser?.id
  );

  const isFirstLoad = isLoadingGroups || isLoadingExpenses || isLoadingSettlements;

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const { data: notifications = [] } = useNotifications(currentUser?.id);
  const hasNotifications = notifications.length > 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: UI.color.bg },
        row: { flexDirection: "row", alignItems: "center" },
        rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
        surfaceCard: {
          backgroundColor: UI.color.surface,
          borderWidth: 1,
          borderColor: UI.color.border,
          borderRadius: UI.radius.lg,
        },
        cardPadded: {
          backgroundColor: UI.color.surface,
          borderWidth: 1,
          borderColor: UI.color.border,
          borderRadius: UI.radius.lg,
          padding: 14,
        },
        textTitle: { fontSize: 16, color: UI.color.text, fontFamily: "IBMPlexSans_600SemiBold" },
        textSubtitle: { fontSize: 14, color: UI.color.muted, fontFamily: "IBMPlexSans_500Medium" },
        textSemi: { fontFamily: "IBMPlexSans_600SemiBold", color: UI.color.text },
        textMedium: { fontFamily: "IBMPlexSans_500Medium", color: UI.color.muted },
        sectionPad: { paddingHorizontal: UI.space.page },
        iconShell: {
          width: 44,
          height: 44,
          borderRadius: UI.radius.lg,
          backgroundColor: UI.color.control,
          borderWidth: 1,
          borderColor: UI.color.border,
          alignItems: "center",
          justifyContent: "center",
        },
        emptyIconShell: {
          width: 56,
          height: 56,
          borderRadius: UI.radius.lg,
          backgroundColor: UI.color.control,
          borderWidth: 1,
          borderColor: UI.color.border,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        },
        pillButton: {
          minHeight: 44,
          paddingHorizontal: 14,
          borderRadius: UI.radius.pill,
          alignItems: "center",
          justifyContent: "center",
        },
        iconButton: {
          width: 44,
          height: 44,
          borderRadius: UI.radius.pill,
          backgroundColor: UI.color.control,
          borderWidth: 1,
          borderColor: UI.color.border,
          alignItems: "center",
          justifyContent: "center",
        },
        pressed: { opacity: 0.7 },
      }),
    []
  );

  const [refreshing, setRefreshing] = useState(false);
  const [activityFilter, setActivityFilter] = useState<"all" | "paid" | "owe">("all");
  const queryClient = useQueryClient();

  const balanceScale = useSharedValue(1);
  const balanceAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: balanceScale.value }],
  }));

  useEffect(() => {
    if (!isFirstLoad) {
      const timer = setTimeout(() => {
        balanceScale.value = withSpring(1.02, { damping: 10, stiffness: 120 });
        setTimeout(() => {
          balanceScale.value = withSpring(1, { damping: 12, stiffness: 100 });
        }, 200);
      }, 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirstLoad]);

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

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

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

      {isFirstLoad ? (
        <View style={{ flex: 1, paddingTop: 40, paddingHorizontal: UI.space.page }}>
          <FocusAwareView delay={0} style={{ marginBottom: 18 }}>
            <Skeleton height={170} radius={UI.radius.lg} />
          </FocusAwareView>
          <FocusAwareView delay={35} style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Skeleton height={56} radius={999} />
              </View>
              <View style={{ flex: 1 }}>
                <Skeleton height={56} radius={999} />
              </View>
            </View>
          </FocusAwareView>
          <FocusAwareView delay={90} style={{ marginBottom: 28 }}>
            <View style={{ marginBottom: 14 }}>
              <Skeleton height={18} width={120} radius={6} />
            </View>
            <View
              style={{
                backgroundColor: UI.color.surface,
                borderRadius: UI.radius.lg,
                borderWidth: 1,
                borderColor: UI.color.border,
              }}
            >
              <ListRowSkeleton />
              <ListRowSkeleton />
            </View>
          </FocusAwareView>
          <FocusAwareView delay={100}>
            <View style={{ marginBottom: 14 }}>
              <Skeleton height={18} width={100} radius={6} />
            </View>
            <View
              style={{
                backgroundColor: UI.color.surface,
                borderRadius: UI.radius.lg,
                borderWidth: 1,
                borderColor: UI.color.border,
              }}
            >
              <ListRowSkeleton />
              <ListRowSkeleton />
            </View>
          </FocusAwareView>
        </View>
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
          <FocusAwareView delay={0} style={{ paddingHorizontal: UI.space.page, marginBottom: 18 }}>
            <Animated.View
              style={[
                {
                  backgroundColor:
                    balanceTone === "danger"
                      ? UI.color.dangerTint
                      : balanceTone === "success"
                        ? UI.color.successTint
                        : UI.color.surface,
                  borderRadius: UI.radius.lg,
                  borderWidth: 1,
                  borderColor: UI.color.border,
                  padding: 16,
                },
                balanceAnimatedStyle,
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                <IconShell
                  icon={
                    balanceTone === "danger"
                      ? icons.ArrowUpRight
                      : balanceTone === "success"
                        ? icons.ArrowDownLeft
                        : icons.Check
                  }
                  tone={balanceTone}
                />
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
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{
                      marginTop: 4,
                      fontSize: 24,
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

              {totalSpent > 0 && (
                <>
                  <View
                    style={{
                      height: 1,
                      backgroundColor: UI.color.border,
                      marginTop: 14,
                      marginBottom: 12,
                    }}
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push("/(tabs)/stats")}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: UI.color.control,
                          borderWidth: 1,
                          borderColor: UI.color.border,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <icons.BarChart3 size={16} color={UI.color.muted} strokeWidth={1.75} />
                      </View>
                      <View>
                        <Typography
                          style={{
                            fontSize: 13,
                            color: UI.color.muted,
                            fontFamily: "IBMPlexSans_500Medium",
                          }}
                        >
                          This month
                        </Typography>
                        <Typography
                          style={{
                            fontSize: 16,
                            color: UI.color.text,
                            fontFamily: "IBMPlexSans_600SemiBold",
                          }}
                        >
                          {formatAmount(totalSpent, preferredCurrency.code)}
                        </Typography>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Typography
                        style={{
                          fontSize: 13,
                          color: UI.color.muted,
                          fontFamily: "IBMPlexSans_500Medium",
                        }}
                      >
                        {expenseCount} expense{expenseCount !== 1 ? "s" : ""}
                      </Typography>
                      <icons.ChevronRight size={16} color={UI.color.muted} strokeWidth={1.75} />
                    </View>
                  </Pressable>
                </>
              )}
            </Animated.View>
          </FocusAwareView>

          <FocusAwareView delay={35} style={{ paddingHorizontal: UI.space.page, marginBottom: 24 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <HapticButton tone="ink" onPress={() => router.push("/expense/new")}>
                  + Add Expense
                </HapticButton>
              </View>
              <View style={{ flex: 1 }}>
                <HapticButton
                  tone="outlined"
                  onPress={() =>
                    owedToYou > 0
                      ? router.push(`/settle/${owedUsers[0].id}`)
                      : youOwe > 0
                        ? router.push(`/settle/${oweUsers[0].id}`)
                        : router.push("/(tabs)/friends")
                  }
                >
                  Settle up
                </HapticButton>
              </View>
            </View>
          </FocusAwareView>

          {friends.length <= 1 && (
            <FocusAwareView
              delay={75}
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
            </FocusAwareView>
          )}

          {(owedUsers.length > 0 || oweUsers.length > 0) && (
            <FocusAwareView
              delay={90}
              style={{ paddingHorizontal: UI.space.page, marginBottom: 24 }}
            >
              <View style={{ marginBottom: 14 }}>
                <Typography style={TYPO.semi(18)}>Need attention</Typography>
              </View>
              <Card padding={0}>
                {owedUsers.slice(0, 3).map((user) => (
                  <View
                    key={user.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: UI.color.border,
                    }}
                  >
                    <AppUserAvatar user={user} size="sm" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Typography style={TYPO.semi(15)}>{user.name}</Typography>
                      <Typography
                        style={[TYPO.medium(13), { color: UI.color.success, marginTop: 1 }]}
                      >
                        Owes you{" "}
                        {formatAmount(
                          Math.abs(perUserBalances.get(user.id) ?? 0),
                          preferredCurrency.code
                        )}
                      </Typography>
                    </View>
                    <HapticButton
                      tone="outlined"
                      height={36}
                      onPress={() => router.push(`/settle/${user.id}`)}
                    >
                      Remind
                    </HapticButton>
                  </View>
                ))}
                {oweUsers.slice(0, 3).map((user) => (
                  <View
                    key={user.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: UI.color.border,
                    }}
                  >
                    <AppUserAvatar user={user} size="sm" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Typography style={TYPO.semi(15)}>{user.name}</Typography>
                      <Typography
                        style={[TYPO.medium(13), { color: UI.color.danger, marginTop: 1 }]}
                      >
                        You owe{" "}
                        {formatAmount(
                          Math.abs(perUserBalances.get(user.id) ?? 0),
                          preferredCurrency.code
                        )}
                      </Typography>
                    </View>
                    <HapticButton
                      tone="ink"
                      height={36}
                      onPress={() => router.push(`/settle/${user.id}`)}
                    >
                      Settle
                    </HapticButton>
                  </View>
                ))}
              </Card>
            </FocusAwareView>
          )}

          <FocusAwareView
            delay={105}
            style={{ paddingHorizontal: UI.space.page, marginBottom: 28 }}
          >
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
                <View>
                  <ListRowSkeleton />
                  <ListRowSkeleton />
                </View>
              ) : activeGroups.length > 0 ? (
                activeGroups.map(({ group, netBalance }, idx) => (
                  <GroupRow
                    key={group.id}
                    group={group}
                    balance={netBalance}
                    currency={preferredCurrency.code}
                    isLast={idx === activeGroups.length - 1}
                    onPress={() => router.push(`/group/${group.id}`)}
                  />
                ))
              ) : (
                <View
                  style={{ paddingVertical: 28, alignItems: "center", justifyContent: "center" }}
                >
                  <EmptyIconShell icon={icons.UsersRound} />
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
                      style={{
                        fontSize: 14,
                        color: "#FFFFFF",
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      Create group
                    </Typography>
                  </Pressable>
                </View>
              )}
            </View>
          </FocusAwareView>

          <FocusAwareView
            delay={100}
            style={{ paddingHorizontal: UI.space.page, marginBottom: 24 }}
          >
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
                  const label =
                    filter === "paid" ? "You paid" : filter === "owe" ? "You owe" : "All";
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
                    <TransactionRow
                      key={expense.id}
                      expense={expense}
                      currentUserId={currentUser.id}
                      paidByUser={paidByUser}
                      myShare={mySplit?.amount ?? 0}
                      isLast={idx === recentExpenses.length - 1}
                      onPress={() => router.push(`/expense/${expense.id}`)}
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
                    onPress={() => router.push("/expense/new")}
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
                        color: "#FFFFFF",
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      Log your first expense
                    </Typography>
                  </Pressable>
                </View>
              )}
            </View>
          </FocusAwareView>
        </ScrollView>
      )}
    </View>
  );
}
