/**
 * Dashboard (Home) Screen — Phase 3 Revamp
 *
 * Flatter design (no shadows), smooth animations, strict reference alignment.
 */
import type { JSX } from "react";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, View, RefreshControl, Pressable, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Typography } from "heroui-native";
import Animated, { FadeInDown, LinearTransition, Easing } from "react-native-reanimated";

import { FocusAwareView } from "@/components/animations/PageAnimator";
import { BalanceCard } from "@/features/dashboard/components/BalanceCard";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import type { Expense, Group, User } from "@/types";

// ─── Design tokens (inline — no Tailwind needed for precise reference match) ──
const BG = "#F5F0EB";
const SURFACE = "#FFFFFF";
const BORDER = "#E8E4DF";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#8E8E93";
const TEXT_DANGER = "#E85D5D";
const TEXT_SUCCESS = "#4CAF82";
const SECTION_PAD = 20;
const CARD_RADIUS = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }): JSX.Element {
  return (
    <Typography
      style={{
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1.4,
        color: TEXT_SECONDARY,
        fontFamily: "PlusJakartaSans_700Bold",
        textTransform: "uppercase",
        marginBottom: 12,
      }}
    >
      {children}
    </Typography>
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

  // Determine sub-text logic based on the reference image
  // If you paid, it should show green sub-text for what others owe you (total - your share).
  // If they paid, it should show red sub-text for what you owe them (your share).
  let subAmountText = "";
  let subAmountColor = TEXT_DANGER;
  
  if (iPaid) {
     const lentAmount = expense.amount - myShare;
     if (lentAmount > 0) {
       subAmountText = formatAmount(lentAmount, expense.currency);
       subAmountColor = TEXT_SUCCESS;
     }
  } else if (myShare > 0) {
     subAmountText = formatAmount(myShare, expense.currency);
     subAmountColor = TEXT_DANGER;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${expense.title}, ${formatAmount(expense.amount, expense.currency)}`}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "rgba(0,0,0,0.03)",
        backgroundColor: pressed ? "#F9F6F2" : "transparent",
      })}
    >
      {/* Category icon */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
          flexShrink: 0,
        }}
      >
        <IconComp size={20} color={colors.icon} strokeWidth={2} />
        {paidByUser && (
          <View
            style={{
              position: "absolute",
              bottom: -4,
              right: -4,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "#E8E4DF",
              borderWidth: 2,
              borderColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              style={{
                fontSize: 10,
                fontWeight: "bold",
                color: TEXT_PRIMARY,
                textAlign: "center",
                includeFontPadding: false,
                lineHeight: 14,
              }}
            >
              {paidByUser.name.charAt(0).toUpperCase()}
            </Typography>
          </View>
        )}
      </View>

      {/* Title + paid by */}
      <View style={{ flex: 1, marginRight: 12 }}>
        <Typography
          numberOfLines={1}
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: TEXT_PRIMARY,
            fontFamily: "PlusJakartaSans_700Bold",
          }}
        >
          {expense.title}
        </Typography>
        <Typography
          style={{
            fontSize: 12,
            color: TEXT_SECONDARY,
            fontFamily: "PlusJakartaSans_400Regular",
            marginTop: 2,
          }}
        >
          Paid by {paidByName}
        </Typography>
      </View>

      {/* Total + share */}
      <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
        <Typography
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: TEXT_PRIMARY,
            fontFamily: "PlusJakartaSans_700Bold",
          }}
        >
          {formatAmount(expense.amount, expense.currency)}
        </Typography>
        {!!subAmountText && (
          <Typography
            style={{
              fontSize: 12,
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

const GROUP_BG_PALETTE = [
  "#FCE7D0", "#E8E4F9", "#D5EFE2", "#D9EEF8", 
  "#F9E3E3", "#E3EFF9", "#F5F0C0", "#E8D9F9",
];

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
      accessibilityLabel={`${group.name}, ${memberCount} participants`}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "rgba(0,0,0,0.03)",
        backgroundColor: pressed ? "#F9F6F2" : "transparent",
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: iconBg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
          flexShrink: 0,
        }}
      >
        <Typography
          style={{
            fontSize: 20,
            textAlign: "center",
            color: TEXT_PRIMARY,
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {(group.icon && group.icon.length <= 2) ? group.icon : group.name.substring(0, 1).toUpperCase()}
        </Typography>
      </View>

      <View style={{ flex: 1 }}>
        <Typography
          numberOfLines={1}
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: TEXT_PRIMARY,
            fontFamily: "PlusJakartaSans_700Bold",
          }}
        >
          {group.name}
        </Typography>
        <Typography
          style={{
            fontSize: 13,
            color: TEXT_SECONDARY,
            fontFamily: "PlusJakartaSans_400Regular",
            marginTop: 2,
          }}
        >
          {memberCount} participant{memberCount !== 1 ? "s" : ""}
        </Typography>
      </View>

      <icons.ChevronRight size={18} color={TEXT_SECONDARY} strokeWidth={1.5} />
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
          paddingBottom: 24,
          paddingHorizontal: SECTION_PAD,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          style={{
            fontFamily: "DMSerifDisplay_400Regular",
            fontSize: 32,
            color: TEXT_PRIMARY,
            lineHeight: 40,
            flex: 1,
          }}
          numberOfLines={1}
        >
          Welcome, {firstName}
        </Typography>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          style={{ width: 40, height: 40, alignItems: "flex-end", justifyContent: "center" }}
        >
          <View>
            <icons.Bell size={24} color={TEXT_PRIMARY} strokeWidth={1.5} />
            <View style={{ position: "absolute", top: 0, right: 2, backgroundColor: "#E85D5D", width: 8, height: 8, borderRadius: 4 }} />
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
        <FocusAwareView delay={0} style={{ paddingHorizontal: SECTION_PAD, marginBottom: 32 }}>
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
        <FocusAwareView delay={50} style={{ paddingHorizontal: SECTION_PAD, marginBottom: 32 }}>
          <SectionLabel>Active Groups</SectionLabel>

          <View style={{ backgroundColor: SURFACE, borderRadius: CARD_RADIUS, overflow: "hidden" }}>
            {isLoadingGroups ? (
              <View style={{ padding: 16 }}><Typography>Loading...</Typography></View>
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

                {/* + Add new group row */}
                <Pressable
                  onPress={() => router.push("/group/new")}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 16,
                    borderTopWidth: 1,
                    borderTopColor: "rgba(0,0,0,0.03)",
                    backgroundColor: pressed ? "#F9F6F2" : "transparent",
                    gap: 8,
                  })}
                >
                  <icons.Plus size={16} color={TEXT_SECONDARY} strokeWidth={2} />
                  <Typography style={{ fontSize: 13, fontWeight: "600", color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_600SemiBold" }}>
                    Add new group
                  </Typography>
                </Pressable>
              </>
            ) : (
              <>
                <View style={{ padding: 24, alignItems: "center" }}>
                  <Typography style={{ color: TEXT_SECONDARY }}>No groups yet</Typography>
                </View>
                <Pressable
                  onPress={() => router.push("/group/new")}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 16,
                    borderTopWidth: 1,
                    borderTopColor: "rgba(0,0,0,0.03)",
                    backgroundColor: pressed ? "#F9F6F2" : "transparent",
                    gap: 8,
                  })}
                >
                  <icons.Plus size={16} color={TEXT_SECONDARY} strokeWidth={2} />
                  <Typography style={{ fontSize: 13, fontWeight: "600", color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_600SemiBold" }}>
                    Add new group
                  </Typography>
                </Pressable>
              </>
            )}
          </View>
        </FocusAwareView>

        {/* ── D. Transactions ─────────────────────────────────────────────── */}
        {recentExpenses.length > 0 && (
          <FocusAwareView delay={100} style={{ paddingHorizontal: SECTION_PAD, marginBottom: 32 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <SectionLabel>Transactions</SectionLabel>
              <Pressable onPress={() => router.push("/(tabs)/friends")}>
                <Typography style={{ fontSize: 13, fontWeight: "600", color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_600SemiBold", marginBottom: 12 }}>
                  See all
                </Typography>
              </Pressable>
            </View>

            <View style={{ backgroundColor: SURFACE, borderRadius: CARD_RADIUS, overflow: "hidden" }}>
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
