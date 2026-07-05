/**
 * Dashboard (Home) Screen — Edge-to-Edge Editorial
 *
 * PURE WHITE background, borderless layout, large typography, minimalist lines.
 */
import type { JSX } from "react";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, View, RefreshControl, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Typography, Skeleton } from "heroui-native";
import { useQueryClient } from "@tanstack/react-query";
import Animated, { FadeInDown, LinearTransition, Easing } from "react-native-reanimated";

import { FocusAwareView } from "@/components/animations/PageAnimator";
import { BalanceCard } from "@/features/dashboard/components/BalanceCard";
import { formatAmount } from "@/components/ui/AmountDisplay";
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

// ─── Design tokens (Edge-to-Edge) ──
const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782"; // Slightly warmer gray to match beige
const TEXT_DANGER = "#000000"; // Elegant black instead of red
const TEXT_SUCCESS = "#4CAF82";
const SEPARATOR = "#E8E4DF"; // Slightly darker beige for subtle lines
const SECTION_PAD = 24;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionLabel({ children, rightAction }: { children: string, rightAction?: JSX.Element }): JSX.Element {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <Typography
        style={{
          fontSize: 20,
          fontWeight: "800",
          color: TEXT_PRIMARY,
          fontFamily: "PlusJakartaSans_800ExtraBold",
          letterSpacing: -0.5,
        }}
      >
        {children}
      </Typography>
      {rightAction}
    </View>
  );
}

// Category icon mapping
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

// Extremely subtle pastel colors to fit the stark white theme
const CATEGORY_COLORS: Record<string, { bg: string; icon: string }> = {
  food: { bg: "#FFFDF5", icon: "#000000" },
  transport: { bg: "#F8FBFF", icon: "#000000" },
  accommodation: { bg: "#FFF9FC", icon: "#000000" },
  entertainment: { bg: "#FBFAFF", icon: "#000000" },
  shopping: { bg: "#FFF9F9", icon: "#000000" },
  utilities: { bg: "#F6FFFC", icon: "#000000" },
  health: { bg: "#F5FEFF", icon: "#000000" },
  travel: { bg: "#F9F9FF", icon: "#000000" },
  other: { bg: "#F9F9F9", icon: "#000000" },
};

// ─── TransactionRow ───────────────────────────────────────────────────────────
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
  let subAmountColor = TEXT_SECONDARY;
  
  if (iPaid) {
     const lentAmount = expense.amount - myShare;
     if (lentAmount > 0) {
       subAmountText = `Lent ${formatAmount(lentAmount, expense.currency)}`;
       subAmountColor = TEXT_SUCCESS;
     }
  } else if (myShare > 0) {
     subAmountText = `Borrowed ${formatAmount(myShare, expense.currency)}`;
     subAmountColor = TEXT_SECONDARY;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: SEPARATOR,
        opacity: pressed ? 0.5 : 1,
      })}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 0,
          backgroundColor: colors.bg,
          borderWidth: 1,
          borderColor: SEPARATOR,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 16,
        }}
      >
        <IconComp size={20} color={colors.icon} strokeWidth={1.5} />
      </View>

      <View style={{ flex: 1, marginRight: 12 }}>
        <Typography
          numberOfLines={1}
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: TEXT_PRIMARY,
            fontFamily: "PlusJakartaSans_700Bold",
            letterSpacing: -0.3,
          }}
        >
          {expense.title}
        </Typography>
        <Typography
          style={{
            fontSize: 13,
            color: TEXT_SECONDARY,
            fontFamily: "PlusJakartaSans_500Medium",
            marginTop: 2,
          }}
        >
          {paidByName} paid
        </Typography>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Typography
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: TEXT_PRIMARY,
            fontFamily: "PlusJakartaSans_700Bold",
            letterSpacing: -0.3,
          }}
        >
          {formatAmount(expense.amount, expense.currency)}
        </Typography>
        {!!subAmountText && (
          <Typography
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: subAmountColor,
              fontFamily: "PlusJakartaSans_600SemiBold",
              marginTop: 2,
            }}
          >
            {subAmountText}
          </Typography>
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

const GROUP_BG_PALETTE = [
  "#FEF3C7", // Amber
  "#DBEAFE", // Blue
  "#FCE7F3", // Pink
  "#EDE9FE", // Purple
  "#D1FAE5", // Emerald
  "#CFFAFE", // Cyan
  "#FEE2E2", // Red
  "#E0E7FF", // Indigo
];

function getGroupColor(id: string): string {
  const idx = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GROUP_BG_PALETTE.length;
  return GROUP_BG_PALETTE[idx];
}

function GroupRow({ group, balance, currency, isLast, onPress }: GroupRowProps): JSX.Element {
  const memberCount = group.members.length;
  const iconBg = getGroupColor(group.id);

  let subAmountText = "";
  let subAmountColor = TEXT_SECONDARY;
  
  if (balance < 0) {
    subAmountText = `You owe ${formatAmount(Math.abs(balance), currency)}`;
    subAmountColor = TEXT_DANGER;
  } else if (balance > 0) {
    subAmountText = `Owes you ${formatAmount(balance, currency)}`;
    subAmountColor = TEXT_SUCCESS;
  } else {
    subAmountText = "Settled up";
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: SEPARATOR,
        opacity: pressed ? 0.5 : 1,
      })}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 0,
          backgroundColor: iconBg,
          borderWidth: 1,
          borderColor: SEPARATOR,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 16,
        }}
      >
        <Typography
          style={{
            fontSize: 20,
            textAlign: "center",
            color: TEXT_PRIMARY,
          }}
        >
          {(group.icon && group.icon.length <= 2) ? group.icon : group.name.substring(0, 1).toUpperCase()}
        </Typography>
      </View>

      <View style={{ flex: 1, marginRight: 12 }}>
        <Typography
          numberOfLines={1}
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: TEXT_PRIMARY,
            fontFamily: "PlusJakartaSans_700Bold",
            letterSpacing: -0.3,
          }}
        >
          {group.name}
        </Typography>
        <Typography
          style={{
            fontSize: 14,
            color: TEXT_SECONDARY,
            fontFamily: "PlusJakartaSans_500Medium",
            marginTop: 4,
          }}
        >
          {memberCount} participants
        </Typography>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Typography
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: subAmountColor,
            fontFamily: "PlusJakartaSans_700Bold",
          }}
        >
          {subAmountText}
        </Typography>
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
  const [activityFilter, setActivityFilter] = useState<"all"|"paid"|"owe">("all");
  const queryClient = useQueryClient();

  // Balance computations
  const owedToYou = useMemo(
    () => balancesUtil.getTotalOwedToMe(currentUser.id, groups, expenses, settlements, preferredCurrency, convertCurrency),
    [currentUser.id, groups, expenses, settlements, preferredCurrency, convertCurrency]
  );

  const youOwe = useMemo(
    () => Math.abs(balancesUtil.getTotalIOwe(currentUser.id, groups, expenses, settlements, preferredCurrency, convertCurrency)),
    [currentUser.id, groups, expenses, settlements, preferredCurrency, convertCurrency]
  );

  const perUserBalances = useMemo(
    () => balancesUtil.getUserBalances(currentUser.id, undefined, groups, expenses, settlements, preferredCurrency, convertCurrency),
    [currentUser.id, groups, expenses, settlements, preferredCurrency, convertCurrency]
  );

  const oweUsers = useMemo(() => {
    return friends.filter((u) => u.id !== currentUser.id && (perUserBalances.get(u.id) ?? 0) < 0).slice(0, 4);
  }, [friends, currentUser.id, perUserBalances]);

  const owedUsers = useMemo(() => {
    return friends.filter((u) => u.id !== currentUser.id && (perUserBalances.get(u.id) ?? 0) > 0).slice(0, 4);
  }, [friends, currentUser.id, perUserBalances]);

  const recentExpenses = useMemo(() => {
    let filtered = [...expenses];
    if (activityFilter === "paid") {
      filtered = filtered.filter(e => e.paidBy === currentUser.id);
    } else if (activityFilter === "owe") {
      filtered = filtered.filter(e => e.paidBy !== currentUser.id && e.splits.some(s => s.userId === currentUser.id && !s.paid));
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  }, [expenses, activityFilter, currentUser.id]);

  const userById = useMemo(() => {
    const map = new Map<string, User>();
    friends.forEach((f) => map.set(f.id, f));
    return map;
  }, [friends]);

  const activeGroups = useMemo(() => {
    const groupBalances = groups.map(group => {
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
      return { group, netBalance };
    });

    // Sort by netBalance ascending (most owed first)
    groupBalances.sort((a, b) => a.netBalance - b.netBalance);
    
    return groupBalances.slice(0, 4);
  }, [groups, currentUser.id, expenses, settlements, preferredCurrency, convertCurrency]);

  const firstName = useMemo(() => currentUser.name.split(" ")[0], [currentUser.name]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await queryClient.invalidateQueries();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [queryClient]);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      {/* ── A. Header ──────────────────────────────────────────────────────── */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 8,
          paddingHorizontal: SECTION_PAD,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1 }}>
          <Typography
            style={{
              fontSize: 14,
              color: TEXT_SECONDARY,
              fontFamily: "PlusJakartaSans_500Medium",
              marginBottom: 4,
            }}
          >
            {getGreeting()},
          </Typography>
          <Typography
            style={{
              fontFamily: "DMSerifDisplay_400Regular",
              fontSize: 36,
              color: TEXT_PRIMARY,
              lineHeight: 44,
              letterSpacing: -0.5,
            }}
            numberOfLines={1}
          >
            {firstName}.
          </Typography>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/notifications");
          }}
          style={({ pressed }) => ({
            width: 44, height: 44, alignItems: "center", justifyContent: "center", 
            backgroundColor: "transparent", borderRadius: 0, borderWidth: 1, borderColor: SEPARATOR,
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <View>
            <icons.Bell size={20} color={TEXT_PRIMARY} strokeWidth={1.5} />
            {hasNotifications && (
              <View style={{ position: "absolute", top: -2, right: -2, backgroundColor: "#E85D5D", width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: BG }} />
            )}
          </View>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TEXT_PRIMARY} />}
      >
        {/* ── B. Balance Overview ─────────────────────────────────────────── */}
        <FocusAwareView delay={0} style={{ paddingHorizontal: SECTION_PAD, marginBottom: 40, borderBottomWidth: 1, borderBottomColor: SEPARATOR, paddingBottom: 24 }}>
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
        </FocusAwareView>

        {/* ── C. Active Groups ────────────────────────────────────────────── */}
        <FocusAwareView delay={50} style={{ paddingHorizontal: SECTION_PAD, marginBottom: 40 }}>
          <SectionLabel
            rightAction={
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                <Pressable onPress={() => router.push("/(tabs)/groups")} hitSlop={8}>
                  <Typography style={{ fontSize: 14, fontWeight: "700", color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                    View all
                  </Typography>
                </Pressable>
                <Pressable onPress={() => router.push("/group/new")} hitSlop={8}>
                  <icons.Plus size={22} color={TEXT_PRIMARY} strokeWidth={2.5} />
                </Pressable>
              </View>
            }
          >
            Groups
          </SectionLabel>

          <View>
            {isLoadingGroups ? (
              <View style={{ gap: 16 }}>
                <Skeleton className="w-full h-[80px] rounded-none bg-[#E8E4DF]" />
                <Skeleton className="w-full h-[80px] rounded-none bg-[#E8E4DF]" />
              </View>
            ) : activeGroups.length > 0 ? (
              <>
                {activeGroups.map(({ group, netBalance }, idx) => (
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
                ))}
              </>
            ) : (
              <View style={{ paddingVertical: 24 }}>
                <Typography style={{ color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium" }}>No groups yet. Tap + to create one.</Typography>
              </View>
            )}
          </View>
        </FocusAwareView>

        <FocusAwareView delay={100} style={{ paddingHorizontal: SECTION_PAD, marginBottom: 32 }}>
          <SectionLabel
            rightAction={
              <Pressable onPress={() => router.push("/(tabs)/activity")}>
                <Typography style={{ fontSize: 14, fontWeight: "700", color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                  View all
                </Typography>
              </Pressable>
            }
          >
            Activity
          </SectionLabel>

          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            {(["all", "paid", "owe"] as const).map((filter) => (
              <Pressable
                key={filter}
                onPress={() => setActivityFilter(filter)}
                style={({ pressed }) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 0,
                  backgroundColor: activityFilter === filter ? "#8C7A6B" : "transparent",
                  borderWidth: 1,
                  borderColor: activityFilter === filter ? "#8C7A6B" : SEPARATOR,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Typography
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    fontFamily: "PlusJakartaSans_700Bold",
                    color: activityFilter === filter ? "#FFFFFF" : TEXT_SECONDARY,
                    textTransform: "capitalize",
                  }}
                >
                  {filter}
                </Typography>
              </Pressable>
            ))}
          </View>

          <View style={{ backgroundColor: "transparent" }}>
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
              <Animated.View 
                entering={FadeInDown.duration(400).easing(Easing.out(Easing.quad))} 
                layout={LinearTransition}
                style={{ paddingVertical: 32, alignItems: "center", justifyContent: "center" }}
              >
                <icons.PackageOpen size={48} color={TEXT_SECONDARY} strokeWidth={1} style={{ marginBottom: 16 }} />
                <Typography style={{ fontSize: 16, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium" }}>
                  No recent activity found.
                </Typography>
                <Pressable
                  onPress={() => router.push("/expense/new")}
                  style={({ pressed }) => ({
                    marginTop: 16,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    backgroundColor: "#8C7A6B",
                    borderRadius: 0,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Typography style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF", fontFamily: "PlusJakartaSans_700Bold" }}>
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
