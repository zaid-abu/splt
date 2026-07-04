/**
 * Group Detail Screen
 *
 * HeroUI components used:
 * - Button
 * - Card, Card.Body, Card.Title, Card.Description, Card.Header, Card.Footer
 * - Chip
 * - ListGroup + all sub-components
 * - Avatar, Avatar.Fallback
 * - Separator
 * - Typography
 * - Alert, Alert.Indicator, Alert.Content, Alert.Title, Alert.Description
 * - Skeleton
 */
import { Alert, Typography, PressableFeedback, Button, Skeleton } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  FadeInDown,
} from "react-native-reanimated";

import { ExpenseItem } from "@/components/ExpenseItem";
import { AvatarStack, AppUserAvatar } from "@/components/MemberAvatar";
import { getCurrencySymbol } from "@/components/AmountDisplay";
import * as icons from "lucide-react-native";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import {
  useGroups,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useAddGroupMembers,
} from "@/queries/useGroups";
import {
  useUserExpenses,
  useAddExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "@/queries/useExpenses";
import { useUserActivities, useLogActivity, useDeleteActivity } from "@/queries/useActivities";
import { useUserSettlements, useAddSettlement } from "@/queries/useSettlements";
import * as balancesUtil from "@/utils/balances";

export default function GroupDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: allExpenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);

  const convertCurrency = useUIStore((s) => s.convertCurrency);
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const isAppLoading = useUIStore((s) => s.isAppLoading);

  const group = groups.find((g) => g.id === id);
  const expenses = allExpenses.filter((e) => e.groupId === id);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const heroStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(scrollY.value, [-100, 0, 100], [50, 0, 0], Extrapolation.CLAMP),
        },
        {
          scale: interpolate(scrollY.value, [-100, 0], [1.1, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });

  if (!group) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-5 gap-4">
          <Alert status="danger" className="rounded-[20px]">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Group not found</Alert.Title>
              <Alert.Description>This group may have been deleted.</Alert.Description>
            </Alert.Content>
          </Alert>
          <Button onPress={() => router.back()} className="rounded-full">
            Go back
          </Button>{" "}
        </View>
      </SafeAreaView>
    );
  }

  const sym = getCurrencySymbol(group.currency);
  const balances = balancesUtil.getGroupBalances(
    group.id,
    expenses,
    settlements,
    group,
    preferredCurrency,
    convertCurrency
  );
  const myBalance = balances.get(currentUser.id) ?? 0;

  const groupDebts = group.simplifyDebts
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

  // Calculate total expenses in group currency
  const totalExpensesInGroupCurrency = expenses.reduce(
    (sum, exp) => sum + convertCurrency(exp.amount, exp.currency, group.currency),
    0
  );

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={["top"]}>
      <StatusBar style="dark" />
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Back ───────────────────────────────────── */}
        <View className="pt-4 mb-4 px-4">
          <PressableFeedback onPress={() => router.back()}>
            <View className="w-10 h-10 rounded-full bg-white items-center justify-center border border-border">
              <icons.ChevronLeft size={24} color="#1E1A34" />
            </View>
          </PressableFeedback>
        </View>

        {/* ── Group hero ─────────────────────────────── */}
        <Animated.View className="px-6 mb-6" style={heroStyle}>
          <View className="bg-white rounded-[32px] p-6 border border-border">
            <View className="flex-row items-center gap-4 mb-5">
              <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
                {(() => {
                  const GroupIcon = (icons as any)[group.icon] || icons.Users;
                  return <GroupIcon size={32} className="text-primary" strokeWidth={2} />;
                })()}
              </View>
              <View className="flex-1">
                <Typography type="h2" className="font-black text-[24px] tracking-tight">
                  {group.name}
                </Typography>
                {group.description && (
                  <Typography type="body-sm" className="text-muted-foreground mt-0.5">
                    {group.description}
                  </Typography>
                )}
              </View>
            </View>

            <PressableFeedback onPress={() => router.push(`/group/${group.id}/settings`)}>
              <View className="flex-row items-center justify-between bg-background rounded-[20px] p-3 mb-5 border border-border/50">
                <View className="flex-row items-center gap-2">
                  <AvatarStack users={group.members.map((m) => m.user)} max={5} />
                  <Typography type="body-sm" className="font-bold text-foreground ml-1">
                    {group.members.length} members
                  </Typography>
                </View>
                <icons.Settings size={20} color="#8A8798" />
              </View>
            </PressableFeedback>

            {/* My balance highlight */}
            <View
              className={`flex-row items-center justify-between rounded-[20px] p-4 ${
                myBalance > 0
                  ? "bg-success/10 border border-success/20"
                  : myBalance < 0
                    ? "bg-danger/10 border border-danger/20"
                    : "bg-surface-secondary border border-border"
              }`}
            >
              <View>
                <Typography
                  type="body-xs"
                  className="font-bold tracking-wider mb-0.5 text-muted-foreground uppercase"
                >
                  Your balance
                </Typography>
                <Typography
                  type="h2"
                  className={`font-black tracking-tight text-[28px] ${
                    myBalance > 0
                      ? "text-success"
                      : myBalance < 0
                        ? "text-danger"
                        : "text-foreground"
                  }`}
                >
                  {myBalance > 0 ? "+" : myBalance < 0 ? "-" : ""}
                  {sym}
                  {Math.abs(myBalance).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </View>
              <View
                className={`px-3 py-1.5 rounded-full ${
                  myBalance > 0
                    ? "bg-success/20"
                    : myBalance < 0
                      ? "bg-danger/20"
                      : "bg-white border border-border"
                }`}
              >
                <Typography
                  type="body-sm"
                  className={`font-bold ${
                    myBalance > 0
                      ? "text-success"
                      : myBalance < 0
                        ? "text-danger"
                        : "text-muted-foreground"
                  }`}
                >
                  {myBalance > 0 ? "Owed to you" : myBalance < 0 ? "You owe" : "Settled up"}
                </Typography>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Balances ───────────────────────────────── */}
        <View className="px-6 mb-6">
          <Typography
            type="body-xs"
            className="text-muted-foreground font-bold tracking-widest mb-3 ml-2 uppercase"
          >
            Balances
          </Typography>
          <View className="bg-white rounded-[24px] border border-border overflow-hidden">
            {isAppLoading ? (
              <>
                <View className="p-4 border-b border-border/50 flex-row items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <View className="flex-1 gap-2">
                    <Skeleton className="w-24 h-4 rounded-full" />
                    <Skeleton className="w-16 h-3 rounded-full" />
                  </View>
                </View>
                <View className="p-4 flex-row items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <View className="flex-1 gap-2">
                    <Skeleton className="w-32 h-4 rounded-full" />
                    <Skeleton className="w-20 h-3 rounded-full" />
                  </View>
                </View>
              </>
            ) : groupDebts.length === 0 ? (
              <View className="p-6 items-center justify-center">
                <View className="w-12 h-12 rounded-full bg-success/10 items-center justify-center mb-3">
                  <icons.Check size={24} className="text-success" strokeWidth={3} />
                </View>
                <Typography type="body" className="font-bold text-foreground">
                  All settled up!
                </Typography>
              </View>
            ) : (
              groupDebts.map((debt, idx) => {
                const fromUser = group.members.find((m) => m.userId === debt.fromUserId)?.user;
                const toUser = group.members.find((m) => m.userId === debt.toUserId)?.user;
                if (!fromUser || !toUser) return null;

                return (
                  <PressableFeedback key={`${debt.fromUserId}-${debt.toUserId}`} onPress={() => {}}>
                    <View
                      className={`flex-row items-center justify-between p-4 ${idx < groupDebts.length - 1 ? "border-b border-border/50" : ""}`}
                    >
                      <View className="flex-row items-center gap-3">
                        <AppUserAvatar user={fromUser} size="md" />
                        <View>
                          <Typography type="body" className="font-bold text-foreground">
                            {fromUser.id === currentUser.id ? "You" : fromUser.name}
                          </Typography>
                          <Typography type="body-sm" className="text-muted-foreground">
                            owes {toUser.id === currentUser.id ? "you" : toUser.name}
                          </Typography>
                        </View>
                      </View>
                      <Typography
                        type="body"
                        className={`font-black ${
                          fromUser.id === currentUser.id
                            ? "text-danger"
                            : toUser.id === currentUser.id
                              ? "text-success"
                              : "text-foreground"
                        }`}
                      >
                        {sym}
                        {debt.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Typography>
                    </View>
                  </PressableFeedback>
                );
              })
            )}
          </View>
        </View>

        {/* ── Expenses ───────────────────────────────── */}
        <View className="px-6 mb-4 flex-row items-center justify-between">
          <Typography
            type="body-xs"
            className="text-muted-foreground font-bold tracking-widest ml-2 uppercase"
          >
            Expenses ({expenses.length})
          </Typography>
          <Typography type="body-sm" className="font-bold text-foreground mr-2">
            Total: {sym}
            {totalExpensesInGroupCurrency.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </View>

        {isAppLoading ? (
          <View className="px-4 gap-3">
            <Skeleton className="w-full h-[72px] rounded-[24px]" />
            <Skeleton className="w-full h-[72px] rounded-[24px]" />
            <Skeleton className="w-full h-[72px] rounded-[24px]" />
          </View>
        ) : expenses.length === 0 ? (
          <View className="px-6">
            <View className="bg-white rounded-[24px] items-center p-8 border border-border">
              <View className="w-16 h-16 rounded-full bg-secondary items-center justify-center mb-4">
                <Text style={{ fontSize: 32 }}>💸</Text>
              </View>
              <Typography type="h3" className="font-black text-center mb-1">
                No expenses yet
              </Typography>
              <Typography type="body" className="text-muted-foreground text-center">
                Add the first expense for this group
              </Typography>
            </View>
          </View>
        ) : (
          <View className="px-4 gap-2">
            {expenses.map((expense, idx) => (
              <Animated.View
                key={expense.id}
                entering={FadeInDown.delay(100 + idx * 50).springify()}
              >
                <ExpenseItem
                  expense={expense}
                  currentUserId={currentUser.id}
                  onPress={() => router.push(`/expense/${expense.id}`)}
                />
              </Animated.View>
            ))}
          </View>
        )}
      </Animated.ScrollView>

      {/* ── Bottom Action Bar ──────────────────────── */}
      <View className="bg-white border-t border-border/30 px-6 pt-4 pb-8 flex-row gap-4">
        <View className="flex-1">
          <PressableFeedback onPress={() => router.push(`/group/${group.id}/settle`)}>
            <View className="w-full h-[56px] rounded-full items-center justify-center bg-secondary flex-row gap-2">
              <icons.Handshake size={20} className="text-primary" />
              <Typography type="body" className="font-bold text-primary">
                Settle Up
              </Typography>
            </View>
          </PressableFeedback>
        </View>

        <View className="flex-1">
          <PressableFeedback onPress={() => router.push(`/expense/new?groupId=${group.id}`)}>
            <View className="w-full h-[56px] rounded-full items-center justify-center bg-primary flex-row gap-2">
              <icons.Plus size={20} color="white" />
              <Typography type="body" className="font-bold text-white">
                Add Expense
              </Typography>
            </View>
          </PressableFeedback>
        </View>
      </View>
    </SafeAreaView>
  );
}
