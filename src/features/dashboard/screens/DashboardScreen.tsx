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
import { Typography } from "heroui-native";
import Animated, { FadeInDown, LinearTransition, Easing } from "react-native-reanimated";

import { FocusAwareView } from "@/components/animations/PageAnimator";
import { BalanceCard } from "@/features/dashboard/components/BalanceCard";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import type { Expense, Group, User } from "@/types";

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
  isLast: boolean;
  onPress: () => void;
}

const GROUP_BG_PALETTE = ["#FAFAFA", "#F8F8F8"];

function getGroupColor(id: string): string {
  const idx = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GROUP_BG_PALETTE.length;
  return GROUP_BG_PALETTE[idx];
}

function GroupRow({ group, isLast, onPress }: GroupRowProps): JSX.Element {
  const memberCount = group.members.length;
  const iconBg = getGroupColor(group.id);

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
          width: 56,
          height: 56,
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
            fontSize: 24,
            textAlign: "center",
            color: TEXT_PRIMARY,
          }}
        >
          {(group.icon && group.icon.length <= 2) ? group.icon : group.name.substring(0, 1).toUpperCase()}
        </Typography>
      </View>

      <View style={{ flex: 1 }}>
        <Typography
          numberOfLines={1}
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: TEXT_PRIMARY,
            fontFamily: "PlusJakartaSans_700Bold",
            letterSpacing: -0.4,
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

      <icons.ChevronRight size={20} color={TEXT_SECONDARY} strokeWidth={1.5} />
    </Pressable>
  );
}

// ─── DashboardScreen ──────────────────────────────────────────────────────────
export default function DashboardScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  const { data: groups = [], isLoading: isLoadingGroups } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const [refreshing, setRefreshing] = useState(false);

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
    const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
    const unique = Array.from(new Map(allMembers.map((u) => [u.id, u])).values());
    return unique.filter((u) => u.id !== currentUser.id && (perUserBalances.get(u.id) ?? 0) < 0).slice(0, 4);
  }, [groups, currentUser.id, perUserBalances]);

  const owedUsers = useMemo(() => {
    const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
    const unique = Array.from(new Map(allMembers.map((u) => [u.id, u])).values());
    return unique.filter((u) => u.id !== currentUser.id && (perUserBalances.get(u.id) ?? 0) > 0).slice(0, 4);
  }, [groups, currentUser.id, perUserBalances]);

  const recentExpenses = useMemo(
    () => [...expenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [expenses]
  );

  const userById = useMemo(() => {
    const map = new Map<string, User>();
    groups.forEach((g) => g.members.forEach((m) => map.set(m.userId, m.user)));
    return map;
  }, [groups]);

  const activeGroups = useMemo(() => groups.slice(0, 4), [groups]);
  const firstName = useMemo(() => currentUser.name.split(" ")[0], [currentUser.name]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      setRefreshing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1000);
  }, []);

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
        <Typography
          style={{
            fontFamily: "DMSerifDisplay_400Regular",
            fontSize: 36,
            color: TEXT_PRIMARY,
            lineHeight: 44,
            flex: 1,
            letterSpacing: -0.5,
          }}
          numberOfLines={1}
        >
          {firstName}.
        </Typography>

        <Pressable
          accessibilityRole="button"
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          style={({ pressed }) => ({
            width: 44, height: 44, alignItems: "center", justifyContent: "center", 
            backgroundColor: "transparent", borderRadius: 0, borderWidth: 1, borderColor: SEPARATOR,
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <View>
            <icons.Bell size={20} color={TEXT_PRIMARY} strokeWidth={1.5} />
            <View style={{ position: "absolute", top: 0, right: 0, backgroundColor: "#000", width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: BG }} />
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
          />
        </FocusAwareView>

        {/* ── C. Active Groups ────────────────────────────────────────────── */}
        <FocusAwareView delay={50} style={{ paddingHorizontal: SECTION_PAD, marginBottom: 40 }}>
          <SectionLabel
            rightAction={
              <Pressable onPress={() => router.push("/group/new")}>
                <icons.Plus size={24} color={TEXT_PRIMARY} strokeWidth={2} />
              </Pressable>
            }
          >
            Groups
          </SectionLabel>

          <View>
            {isLoadingGroups ? (
              <View style={{ paddingVertical: 16 }}><Typography style={{ color: TEXT_SECONDARY }}>Loading...</Typography></View>
            ) : activeGroups.length > 0 ? (
              <>
                {activeGroups.map((group, idx) => (
                  <Animated.View
                    key={group.id}
                    entering={FadeInDown.duration(400).delay(idx * 50).easing(Easing.out(Easing.quad))}
                    layout={LinearTransition}
                  >
                    <GroupRow group={group} isLast={idx === activeGroups.length - 1} onPress={() => router.push(`/group/${group.id}`)} />
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

        {/* ── D. Transactions ─────────────────────────────────────────────── */}
        {recentExpenses.length > 0 && (
          <FocusAwareView delay={100} style={{ paddingHorizontal: SECTION_PAD, marginBottom: 32 }}>
            <SectionLabel
              rightAction={
                <Pressable onPress={() => router.push("/(tabs)/friends")}>
                  <Typography style={{ fontSize: 14, fontWeight: "700", color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                    View all
                  </Typography>
                </Pressable>
              }
            >
              Activity
            </SectionLabel>

            <View style={{ backgroundColor: "transparent" }}>
              {recentExpenses.map((expense, idx) => {
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
              })}
            </View>
          </FocusAwareView>
        )}
      </ScrollView>
    </View>
  );
}
