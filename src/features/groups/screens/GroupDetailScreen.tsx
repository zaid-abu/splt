import { Alert, Typography } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { GroupRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { useCallback, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { View, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { CategoryIconBadge } from "@/components/ui/CategoryIconBadge";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
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

// ─── Design Tokens ───
const BG = "#F5F0EB";
const SURFACE = "#FFFCF8";
const CONTROL = "#FFFFFF";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const TEXT_DANGER = "#000000";
const TEXT_SUCCESS = "#4CAF82";
const SEPARATOR = "#E8E4DF";
const BRAND = "#8C7A6B";
const CARD_RADIUS = 18;
const PILL_RADIUS = 999;

function SectionLabel({ children }: { children: string }): JSX.Element {
  return (
    <Typography
      style={{
        fontSize: 11,
        letterSpacing: 1.4,
        color: TEXT_SECONDARY,
        fontFamily: "IBMPlexSans_600SemiBold",
        textTransform: "uppercase",
        marginBottom: 16,
      }}
    >
      {children}
    </Typography>
  );
}

// ─── TransactionRow ───
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
  const iPaid = expense.paidBy === currentUserId;
  const paidByName = iPaid ? "You" : (paidByUser?.name.split(" ")[0] ?? "Someone");

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

  const dateStr = expense.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: CARD_RADIUS,
        backgroundColor: pressed ? "#FBF7F2" : "transparent",
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: SEPARATOR,
      })}
    >
      <View style={{ marginRight: 16, flexShrink: 0 }}>
        <CategoryIconBadge category={expense.category} size="md" />
        {paidByUser && (
          <View
            style={{
              position: "absolute",
              bottom: -4,
              right: -4,
              width: 20,
              height: 20,
              borderRadius: PILL_RADIUS,
              backgroundColor: BG,
              borderWidth: 2,
              borderColor: BG,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              style={{ fontSize: 10, color: TEXT_PRIMARY, textAlign: "center", lineHeight: 14 }}
            >
              {paidByUser.name.charAt(0).toUpperCase()}
            </Typography>
          </View>
        )}
      </View>

      <View style={{ flex: 1, marginRight: 12 }}>
        <Typography
          numberOfLines={1}
          style={{ fontSize: 16, color: TEXT_PRIMARY, fontFamily: "IBMPlexSans_600SemiBold" }}
        >
          {expense.title}
        </Typography>
        <Typography
          style={{
            fontSize: 14,
            color: TEXT_SECONDARY,
            fontFamily: "IBMPlexSans_500Medium",
            marginTop: 4,
          }}
        >
          {paidByName} paid
        </Typography>
      </View>

      <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
        <Typography
          style={{ fontSize: 16, color: TEXT_PRIMARY, fontFamily: "IBMPlexSans_600SemiBold" }}
        >
          {formatAmount(expense.amount, expense.currency)}
        </Typography>
        {!!subAmountText ? (
          <Typography
            style={{
              fontSize: 14,
              color: subAmountColor,
              fontFamily: "IBMPlexSans_600SemiBold",
              marginTop: 4,
            }}
          >
            {subAmountText}
          </Typography>
        ) : (
          <Typography
            style={{
              fontSize: 14,
              color: TEXT_SECONDARY,
              fontFamily: "IBMPlexSans_500Medium",
              marginTop: 4,
            }}
          >
            {dateStr}
          </Typography>
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
      .filter((d) => d.fromUserId === currentUser.id)
      .map((d) => group.members.find((m) => m.userId === d.toUserId)?.user)
      .filter(Boolean) as User[];
  }, [groupDebts, currentUser.id, group]);

  const owedUsers = useMemo(() => {
    if (!group) return [];
    return groupDebts
      .filter((d) => d.toUserId === currentUser.id)
      .map((d) => group.members.find((m) => m.userId === d.fromUserId)?.user)
      .filter(Boolean) as User[];
  }, [groupDebts, currentUser.id, group]);

  const youOwe = useMemo(
    () =>
      groupDebts
        .filter((d) => d.fromUserId === currentUser.id)
        .reduce((acc, curr) => acc + curr.amount, 0),
    [groupDebts, currentUser.id]
  );

  const owedToYou = useMemo(
    () =>
      groupDebts
        .filter((d) => d.toUserId === currentUser.id)
        .reduce((acc, curr) => acc + curr.amount, 0),
    [groupDebts, currentUser.id]
  );

  const userById = useMemo(() => {
    const map = new Map<string, User>();
    group?.members.forEach((m) => map.set(m.userId, m.user));
    return map;
  }, [group]);

  if (!group) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Alert status="danger" style={{ borderRadius: CARD_RADIUS, marginBottom: 16 }}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Group not found</Alert.Title>
              <Alert.Description>This group may have been deleted.</Alert.Description>
            </Alert.Content>
          </Alert>
          <Pressable
            onPress={() => router.back()}
            style={{ padding: 14, paddingHorizontal: 24, backgroundColor: BRAND, borderRadius: PILL_RADIUS }}
          >
            <Typography style={{ color: "#FFF", fontFamily: "IBMPlexSans_600SemiBold" }}>Go back</Typography>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 24,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
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
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: PILL_RADIUS,
            backgroundColor: CONTROL,
            borderWidth: 1,
            borderColor: SEPARATOR,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <icons.ArrowLeft size={20} color={TEXT_PRIMARY} strokeWidth={1.8} />
        </Pressable>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            flex: 1,
            marginHorizontal: 16,
          }}
        >
          <GroupIconBadge group={group} size="sm" />
          <Typography
            numberOfLines={1}
            style={{
              fontFamily: "Sora_600SemiBold",
              fontSize: 24,
              color: TEXT_PRIMARY,
              flexShrink: 1,
              textAlign: "center",
            }}
          >
            {group.name}
          </Typography>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/group/${group.id}/settings`)}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: PILL_RADIUS,
            backgroundColor: CONTROL,
            borderWidth: 1,
            borderColor: SEPARATOR,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <icons.Settings size={20} color={TEXT_PRIMARY} strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Balance Cards ─────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          style={{ paddingHorizontal: 24, marginBottom: 32 }}
        >
          <BalanceCard
            youOwe={youOwe}
            owedToYou={owedToYou}
            currencyCode={group.currency}
            oweUsers={oweUsers}
            owedUsers={owedUsers}
            onOwePress={() => router.push(`/group/${group.id}/settle`)}
            onOwedPress={() => router.push(`/group/${group.id}/settle`)}
          />
        </Animated.View>

        {/* ── Group Balances ────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(50).springify()}
          style={{ paddingHorizontal: 24, marginBottom: 40 }}
        >
          <SectionLabel>Group Balances</SectionLabel>
          <View
            style={{
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: SEPARATOR,
              backgroundColor: SURFACE,
            }}
          >
            {groupDebts.length === 0 ? (
              <View
                style={{
                  paddingVertical: 32,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: PILL_RADIUS,
                    backgroundColor: CONTROL,
                    borderWidth: 1,
                    borderColor: SEPARATOR,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <icons.Check size={24} color={TEXT_SUCCESS} strokeWidth={1.8} />
                </View>
                <Typography
                  style={{ fontSize: 16, color: TEXT_PRIMARY, fontFamily: "IBMPlexSans_600SemiBold" }}
                >
                  All settled up!
                </Typography>
                <Typography
                  style={{ fontSize: 14, color: TEXT_SECONDARY, fontFamily: "IBMPlexSans_500Medium", marginTop: 4 }}
                >
                  No pending balances
                </Typography>
              </View>
            ) : (
              groupDebts.map((debt, idx) => {
                const fromUser = group.members.find((m) => m.userId === debt.fromUserId)?.user;
                const toUser = group.members.find((m) => m.userId === debt.toUserId)?.user;
                if (!fromUser || !toUser) return null;

                const isMeOwe = fromUser.id === currentUser.id;
                const isOweMe = toUser.id === currentUser.id;
                const amountColor = isMeOwe ? TEXT_DANGER : isOweMe ? TEXT_SUCCESS : TEXT_PRIMARY;

                return (
                  <Pressable
                    key={`${debt.fromUserId}-${debt.toUserId}`}
                    accessibilityRole="button"
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 16,
                      paddingHorizontal: 16,
                      borderBottomWidth: idx < groupDebts.length - 1 ? 1 : 0,
                      borderBottomColor: SEPARATOR,
                      backgroundColor: pressed ? "#FBF7F2" : "transparent",
                      borderTopLeftRadius: idx === 0 ? CARD_RADIUS : 0,
                      borderTopRightRadius: idx === 0 ? CARD_RADIUS : 0,
                      borderBottomLeftRadius: idx === groupDebts.length - 1 ? CARD_RADIUS : 0,
                      borderBottomRightRadius: idx === groupDebts.length - 1 ? CARD_RADIUS : 0,
                    })}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                      <AppUserAvatar user={fromUser} size="md" />
                      <View>
                        <Typography
                          style={{
                            fontSize: 16,
                            color: TEXT_PRIMARY,
                            fontFamily: "IBMPlexSans_600SemiBold",
                          }}
                        >
                          {isMeOwe ? "You" : fromUser.name}
                        </Typography>
                        <Typography
                          style={{
                            fontSize: 14,
                            color: TEXT_SECONDARY,
                            fontFamily: "IBMPlexSans_500Medium",
                            marginTop: 4,
                          }}
                        >
                          owes {isOweMe ? "you" : toUser.name.split(" ")[0]}
                        </Typography>
                      </View>
                    </View>
                    <Typography
                      style={{
                        fontSize: 18,
                        color: amountColor,
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      {formatAmount(debt.amount, group.currency)}
                    </Typography>
                  </Pressable>
                );
              })
            )}
          </View>
        </Animated.View>

        {/* ── Transactions ─────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100).springify()}
          style={{ paddingHorizontal: 24, marginBottom: 40 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <SectionLabel>Transactions</SectionLabel>
            <Typography
              style={{
                fontSize: 13,
                color: TEXT_PRIMARY,
                fontFamily: "IBMPlexSans_600SemiBold",
                marginBottom: 16,
              }}
            >
              Total: {formatAmount(totalExpensesInGroupCurrency, group.currency)}
            </Typography>
          </View>

          <View
            style={{
              borderRadius: CARD_RADIUS,
              borderWidth: expenses.length === 0 ? 1 : 0,
              borderColor: SEPARATOR,
              backgroundColor: expenses.length === 0 ? SURFACE : "transparent",
            }}
          >
            {expenses.length === 0 ? (
              <View
                style={{
                  paddingVertical: 36,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: PILL_RADIUS,
                    backgroundColor: CONTROL,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: SEPARATOR,
                  }}
                >
                  <icons.Receipt size={24} color={TEXT_PRIMARY} strokeWidth={1.8} />
                </View>
                <Typography
                  style={{
                    fontSize: 16,
                    color: TEXT_PRIMARY,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    marginBottom: 8,
                  }}
                >
                  No expenses yet
                </Typography>
                <Typography
                  style={{
                    fontSize: 14,
                    color: TEXT_SECONDARY,
                    fontFamily: "IBMPlexSans_500Medium",
                  }}
                >
                  Add the first expense for this group
                </Typography>
              </View>
            ) : (
              <View
                style={{
                  borderRadius: CARD_RADIUS,
                  borderWidth: 1,
                  borderColor: SEPARATOR,
                  backgroundColor: SURFACE,
                }}
              >
                {expenses.map((expense, idx) => {
                  const mySplit = expense.splits.find((s) => s.userId === currentUser.id);
                  const paidByUser = userById.get(expense.paidBy);
                  return (
                    <TransactionRow
                      key={expense.id}
                      expense={expense}
                      currentUserId={currentUser.id}
                      paidByUser={paidByUser}
                      myShare={mySplit?.amount ?? 0}
                      isLast={idx === expenses.length - 1}
                      onPress={() => router.push(`/expense/${expense.id}`)}
                    />
                  );
                })}
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── Bottom Action Bar ──────────────────────────────────────────── */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 16),
          flexDirection: "row",
          gap: 12,
          backgroundColor: BG,
          borderTopWidth: 1,
          borderTopColor: SEPARATOR,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/group/${group.id}/settle`)}
          style={({ pressed }) => ({
            flex: 1,
            height: 56,
            borderRadius: PILL_RADIUS,
            backgroundColor: CONTROL,
            borderWidth: 1,
            borderColor: SEPARATOR,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 10,
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <icons.Handshake size={20} color={TEXT_PRIMARY} strokeWidth={1.8} />
          <Typography
            style={{ fontSize: 16, color: TEXT_PRIMARY, fontFamily: "IBMPlexSans_600SemiBold" }}
          >
            Settle Up
          </Typography>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/expense/new?groupId=${group.id}`)}
          style={({ pressed }) => ({
            flex: 1.5,
            height: 56,
            borderRadius: PILL_RADIUS,
            backgroundColor: BRAND,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 10,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <icons.Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Typography style={{ fontSize: 16, color: "#FFFFFF", fontFamily: "IBMPlexSans_600SemiBold" }}>
            Add Expense
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}
