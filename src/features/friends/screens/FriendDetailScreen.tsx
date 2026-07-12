import { Alert, Typography } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { FriendRouteParams } from "@/types/navigation";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { ComponentType, JSX } from "react";
import { useMemo, useRef, useCallback, useState } from "react";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import {
  View,
  ScrollView,
  Pressable,
  Alert as RNAlert,
  Share,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import { useGroups } from "@/features/groups/queries/useGroups";
import {
  useAllFriendships,
  useFriends,
  useRemoveFriend,
} from "@/features/friends/queries/useFriends";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";

import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";

import { formatAmount } from "@/components/ui/AmountDisplay";
import { CategoryIconBadge } from "@/components/ui/CategoryIconBadge";
import { ErrorState } from "@/components/ui/ErrorState";
import { UI, SectionLabel, FilterPill } from "@/components/ui/native-ui";
import { Skeleton } from "@/components/ui/Skeleton";
import { FocusAwareView } from "@/components/animations/PageAnimator";

import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useAppToast } from "@/hooks/useAppToast";
import { useQueryClient } from "@tanstack/react-query";
import { EXPENSE_CATEGORIES } from "@/types";

import { TransactionRow } from "@/features/expenses/components/TransactionRow";
import { HapticButton } from "@/components/ui/HapticButton";
import { MutualGroups } from "../components/MutualGroups";

const CATEGORY_LABELS = Object.fromEntries(
  EXPENSE_CATEGORIES.map((category) => [category.key, category.label])
);

function LoadingState({ topInset }: { topInset: number }): JSX.Element {
  return (
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <ThemedStatusBar />
      <View
        style={{
          paddingTop: topInset + 16,
          paddingBottom: 24,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Skeleton width={44} height={44} radius={999} />
        <Skeleton width={132} height={22} />
        <Skeleton width={44} height={44} radius={999} />
      </View>

      <View style={{ paddingHorizontal: 24, gap: 32 }}>
        <View
          style={{
            padding: 24,
            backgroundColor: UI.color.surface,
            borderWidth: 1,
            borderColor: UI.color.border,
            borderRadius: UI.radius.lg,
            alignItems: "center",
            gap: 14,
          }}
        >
          <Skeleton width={120} height={14} />
          <Skeleton width={188} height={42} />
          <View style={{ width: "72%" }}>
            <Skeleton height={16} />
          </View>
        </View>
        <View style={{ gap: 12 }}>
          <Skeleton width={132} height={13} />
          <Skeleton height={72} />
          <Skeleton height={72} />
        </View>
      </View>
    </View>
  );
}

function OptionRow({
  icon: Icon,
  label,
  description,
  tone = "neutral",
  onPress,
}: {
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  description: string;
  tone?: "neutral" | "danger";
  onPress: () => void;
}): JSX.Element {
  const color = tone === "danger" ? UI.color.danger : UI.color.text;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 10,
        opacity: pressed ? 0.62 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: UI.color.control,
          borderWidth: 1,
          borderColor: UI.color.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={20} color={color} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography
          style={{
            fontSize: 16,
            lineHeight: 21,
            color,
            fontFamily: "IBMPlexSans_600SemiBold",
          }}
        >
          {label}
        </Typography>
        <Typography
          numberOfLines={2}
          style={{
            marginTop: 2,
            fontSize: 13,
            lineHeight: 18,
            color: UI.color.muted,
            fontFamily: "IBMPlexSans_500Medium",
          }}
        >
          {description}
        </Typography>
      </View>
    </Pressable>
  );
}

export default function FriendDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<FriendRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { toast } = useAppToast();

  const optionsSheetRef = useRef<BottomSheetModal>(null);

  const handleOpenOptions = useCallback(() => {
    optionsSheetRef.current?.present();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
        opacity={0.4}
      />
    ),
    []
  );

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const isAppLoading = useUIStore((s) => s.isAppLoading);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const {
    data: groups = [],
    isLoading: isLoadingGroups,
    isError: isGroupsError,
    refetch: refetchGroups,
  } = useGroups(currentUser?.id);
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
  const { data: friendsList = [], isLoading: isLoadingFriends } = useFriends(currentUser?.id);
  const {
    data: allFriendships = [],
    isError: isFriendshipsError,
    refetch: refetchFriendships,
  } = useAllFriendships(currentUser?.id);
  const { mutateAsync: removeFriend } = useRemoveFriend();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1, backgroundColor: UI.color.bg },
        row: { flexDirection: "row", alignItems: "center" },
        card: {
          backgroundColor: UI.color.surface,
          borderWidth: 1,
          borderColor: UI.color.border,
          borderRadius: UI.radius.lg,
          overflow: "hidden",
        },
        textTitle: { fontSize: 16, color: UI.color.text, fontFamily: "IBMPlexSans_600SemiBold" },
        textSubtitle: { fontSize: 14, color: UI.color.muted, fontFamily: "IBMPlexSans_500Medium" },
        textLabel: {
          fontSize: 12,
          color: UI.color.muted,
          fontFamily: "IBMPlexSans_600SemiBold",
          textTransform: "uppercase",
          letterSpacing: 1,
        },
        sectionPad: { paddingHorizontal: 24 },
      }),
    []
  );

  const balances = balancesUtil.getUserBalances(
    currentUser.id,
    undefined,
    groups,
    expenses,
    settlements,
    preferredCurrency,
    convertCurrency
  );

  const friend = friendsList.find((f) => f.id === id);
  const isLoading =
    isAppLoading ||
    isLoadingGroups ||
    isLoadingExpenses ||
    isLoadingSettlements ||
    isLoadingFriends;

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: ["expenses", "settlements", "friends", "groups"],
    });
    setRefreshing(false);
  }, [queryClient]);

  const directFriendship = useMemo(
    () =>
      allFriendships.find(
        (friendship) => friendship.status === "accepted" && friendship.friendUser?.id === id
      ),
    [allFriendships, id]
  );

  const sharedExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const friendInvolved = e.paidBy === id || e.splits.some((s) => s.userId === id);
        const currentUserInvolved =
          e.paidBy === currentUser.id || e.splits.some((s) => s.userId === currentUser.id);
        return friendInvolved && currentUserInvolved;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [expenses, id, currentUser]);

  const [expenseFilter, setExpenseFilter] = useState<"all" | "paid" | "owe">("all");

  const filteredExpenses = useMemo(() => {
    if (expenseFilter === "paid") return sharedExpenses.filter((e) => e.paidBy === currentUser.id);
    if (expenseFilter === "owe")
      return sharedExpenses.filter((e) => e.paidBy !== currentUser.id);
    return sharedExpenses;
  }, [sharedExpenses, expenseFilter, currentUser]);

  const netBalance = balances.get(id ?? "") || 0;
  const isPositive = netBalance > 0;
  const isSettled = netBalance === 0;

  const sharedGroups = useMemo(
    () => groups.filter((group) => group.members.some((member) => member.userId === id)),
    [groups, id]
  );

  const categorySpending = useMemo(() => {
    const totals: Record<string, number> = {};
    sharedExpenses.forEach((expense) => {
      const cat = expense.category || "other";
      const amount = convertCurrency(
        expense.amount,
        expense.currency || preferredCurrency.code,
        preferredCurrency.code
      );
      totals[cat] = (totals[cat] || 0) + amount;
    });
    return Object.entries(totals)
      .filter(([, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({
        cat,
        amount,
      }));
  }, [sharedExpenses, preferredCurrency.code, convertCurrency]);

  const handleShareBalance = useCallback(async () => {
    if (!friend) return;

    const balanceCopy = isSettled
      ? `You and ${friend.name} are settled up on Splt.`
      : isPositive
        ? `${friend.name} owes you ${formatAmount(Math.abs(netBalance), preferredCurrency.code)} on Splt.`
        : `You owe ${friend.name} ${formatAmount(Math.abs(netBalance), preferredCurrency.code)} on Splt.`;

    try {
      optionsSheetRef.current?.dismiss();
      await Share.share({ message: balanceCopy });
    } catch (error) {
      toast.show({
        label: "Could not share balance",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "danger",
        placement: "top",
      });
    }
  }, [friend, isPositive, isSettled, netBalance, preferredCurrency.code, toast]);

  const handleRemind = useCallback(async () => {
    if (!friend || netBalance <= 0) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Share.share({
        message: `Hey ${friend.name.split(" ")[0]}, quick reminder that you owe me ${formatAmount(Math.abs(netBalance), preferredCurrency.code)} on Splt.`,
      });
    } catch (error) {
      toast.show({
        label: "Could not send reminder",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "danger",
        placement: "top",
      });
    }
  }, [friend, netBalance, preferredCurrency.code, toast]);

  const handleShowContact = useCallback(() => {
    if (!friend) return;

    optionsSheetRef.current?.dismiss();
    RNAlert.alert(friend.name, friend.email);
  }, [friend]);

  const handleRemoveFriend = useCallback(() => {
    if (!friend) return;

    optionsSheetRef.current?.dismiss();

    if (!directFriendship) {
      RNAlert.alert(
        "Shared group contact",
        `${friend.name} appears here because you share a group. Remove them from the shared group to hide them from this list.`
      );
      return;
    }

    RNAlert.alert(
      "Remove friend?",
      "This removes the direct friendship. Shared group history and group membership stay unchanged.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFriend({ friendshipId: directFriendship.id });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              toast.show({
                label: "Friend removed",
                description: `${friend.name} was removed from your direct friends.`,
                variant: "success",
                placement: "top",
              });
              router.replace("/(tabs)/friends");
            } catch (error) {
              toast.show({
                label: "Could not remove friend",
                description: error instanceof Error ? error.message : "Please try again.",
                variant: "danger",
                placement: "top",
              });
            }
          },
        },
      ]
    );
  }, [directFriendship, friend, removeFriend, router, toast]);

  if (isLoading && !friend) {
    return <LoadingState topInset={insets.top} />;
  }

  if (isGroupsError || isExpensesError || isSettlementsError || isFriendshipsError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: UI.color.bg }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <ErrorState
            onRetry={() => {
              if (isGroupsError) refetchGroups();
              if (isExpensesError) refetchExpenses();
              if (isSettlementsError) refetchSettlements();
              if (isFriendshipsError) refetchFriendships();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!friend) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: UI.color.bg }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Alert status="danger" style={{ borderRadius: UI.radius.lg, marginBottom: 16 }}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Friend not found</Alert.Title>
              <Alert.Description>We couldn&apos;t find this friend.</Alert.Description>
            </Alert.Content>
          </Alert>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={{
              padding: 14,
              paddingHorizontal: 24,
              backgroundColor: UI.color.brand,
              borderRadius: UI.radius.pill,
            }}
          >
            <Typography
              style={{ color: UI.color.textInverse, fontFamily: "IBMPlexSans_600SemiBold" }}
            >
              Go back
            </Typography>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <ThemedStatusBar />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 999,
            backgroundColor: UI.color.control,
            borderWidth: 1,
            borderColor: UI.color.border,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <icons.ArrowLeft size={20} color={UI.color.text} strokeWidth={1.8} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Friend options"
          onPress={() => {
            Haptics.selectionAsync();
            handleOpenOptions();
          }}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 999,
            backgroundColor: UI.color.control,
            borderWidth: 1,
            borderColor: UI.color.border,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <icons.MoreHorizontal size={20} color={UI.color.text} strokeWidth={1.8} />
        </Pressable>
      </View>

      <FocusAwareView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={UI.color.text}
            />
          }
        >
          {/* ── Hero: Avatar + Name + Balance ──────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            style={{ alignItems: "center", paddingTop: 8, paddingBottom: 24, paddingHorizontal: 24 }}
          >
            <AppUserAvatar user={friend} size="lg" balance={netBalance} />
            <Typography
              numberOfLines={1}
              style={{
                fontFamily: "Sora_600SemiBold",
                fontSize: 24,
                color: UI.color.text,
                marginTop: 12,
              }}
            >
              {friend.name}
            </Typography>

            {isSettled ? (
              <View style={{ marginTop: 8, alignItems: "center" }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: UI.radius.pill,
                    backgroundColor: UI.color.control,
                    borderWidth: 1,
                    borderColor: UI.color.border,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <icons.Check size={20} color={UI.color.success} strokeWidth={1.8} />
                </View>
                <Typography
                  style={{
                    fontSize: 16,
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  All settled up
                </Typography>
              </View>
            ) : (
              <View style={{ marginTop: 8, alignItems: "center" }}>
                <Typography
                  style={{
                    fontSize: 13,
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                  }}
                >
                  {isPositive ? `${friend.name} owes you` : `You owe ${friend.name}`}
                </Typography>
                <Typography
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{
                    fontSize: 40,
                    color: isPositive ? UI.color.success : UI.color.danger,
                    fontFamily: "Sora_600SemiBold",
                    marginTop: 2,
                  }}
                >
                  {formatAmount(Math.abs(netBalance), preferredCurrency.code)}
                </Typography>
              </View>
            )}
          </Animated.View>

          {/* ── Quick Actions ──────────────────────────────────────────────── */}
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              paddingHorizontal: 24,
              marginBottom: 32,
            }}
          >
            <View style={{ flex: 1 }}>
              <HapticButton
                tone="ink"
                onPress={() =>
                  router.push({ pathname: "/settle/[id]", params: { id: friend.id } })
                }
              >
                Settle Up
              </HapticButton>
            </View>
            <View style={{ flex: 1 }}>
              <HapticButton
                tone="outlined"
                onPress={() => router.push(`/expense/new?friendId=${friend.id}`)}
              >
                Add Expense
              </HapticButton>
            </View>
          </View>

          {/* ── Mutual Groups ──────────────────────────────────────────────── */}
          {sharedGroups.length > 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(50).springify()}>
              <MutualGroups
                groups={sharedGroups}
                onGroupPress={(groupId) => router.push(`/group/${groupId}`)}
              />
            </Animated.View>
          )}

          {/* ── Shared Expenses Timeline ───────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(100).springify()}
            style={{ paddingHorizontal: 24, marginBottom: 40 }}
          >
            <View style={{ marginBottom: 14 }}>
              <SectionLabel>Shared Expenses</SectionLabel>
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {(["all", "paid", "owe"] as const).map((filter) => {
                const label =
                  filter === "paid" ? "You paid" : filter === "owe" ? "You owe" : "All";
                return (
                  <FilterPill
                    key={filter}
                    label={label}
                    isActive={expenseFilter === filter}
                    onPress={() => setExpenseFilter(filter)}
                  />
                );
              })}
            </View>

            <View
              style={{
                borderRadius: UI.radius.lg,
                borderWidth: filteredExpenses.length === 0 ? 1 : 0,
                borderColor: UI.color.border,
                backgroundColor:
                  filteredExpenses.length === 0 ? UI.color.surface : "transparent",
                overflow: "hidden",
              }}
            >
              {filteredExpenses.length > 0 ? (
                <View
                  style={{
                    borderRadius: UI.radius.lg,
                    borderWidth: 1,
                    borderColor: UI.color.border,
                    backgroundColor: UI.color.surface,
                  }}
                >
                  {filteredExpenses.map((expense, idx) => (
                    <TransactionRow
                      key={expense.id}
                      expense={expense}
                      currentUserId={currentUser.id}
                      paidByUser={expense.paidByUser}
                      myShare={
                        expense.splits.find((s) => s.userId === currentUser.id)?.amount ?? 0
                      }
                      isLast={idx === filteredExpenses.length - 1}
                      onPress={() => router.push(`/expense/${expense.id}`)}
                    />
                  ))}
                </View>
              ) : (
                <View style={{ paddingVertical: 36, alignItems: "center" }}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: UI.radius.pill,
                      backgroundColor: UI.color.control,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: UI.color.border,
                    }}
                  >
                    <icons.Receipt size={24} color={UI.color.text} strokeWidth={1.8} />
                  </View>
                  <Typography
                    style={{
                      fontSize: 16,
                      color: UI.color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                      marginBottom: 4,
                    }}
                  >
                    {sharedExpenses.length === 0
                      ? "No shared expenses yet"
                      : "No expenses match this filter"}
                  </Typography>
                  <Typography
                    style={{
                      fontSize: 14,
                      color: UI.color.muted,
                      fontFamily: "IBMPlexSans_500Medium",
                      textAlign: "center",
                    }}
                  >
                    {sharedExpenses.length === 0
                      ? "Add an expense with your friend to get started."
                      : `Try switching to a different filter.`}
                  </Typography>
                </View>
              )}
            </View>
          </Animated.View>

          {/* ── Category Spending ────────────────────────────────────────── */}
          {categorySpending.length > 0 && (
            <Animated.View
              entering={FadeInDown.duration(400).delay(150).springify()}
              style={{ paddingHorizontal: 24, marginBottom: 40 }}
            >
              <View style={{ marginBottom: 14 }}>
                <SectionLabel>Spending by Category</SectionLabel>
              </View>
              <View
                style={{
                  borderRadius: UI.radius.lg,
                  borderWidth: 1,
                  borderColor: UI.color.border,
                  backgroundColor: UI.color.surface,
                  paddingVertical: 12,
                }}
              >
                {categorySpending.map((item, idx) => (
                  <View
                    key={item.cat}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderBottomWidth: idx < categorySpending.length - 1 ? 1 : 0,
                      borderBottomColor: UI.color.border,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <CategoryIconBadge category={item.cat as any} size="sm" />
                      <Typography
                        style={{
                          fontSize: 15,
                          color: UI.color.text,
                          fontFamily: "IBMPlexSans_600SemiBold",
                          textTransform: "capitalize",
                        }}
                      >
                        {CATEGORY_LABELS[item.cat] ?? item.cat}
                      </Typography>
                    </View>
                    <Typography
                      style={{
                        fontSize: 16,
                        color: UI.color.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      {formatAmount(item.amount, preferredCurrency.code)}
                    </Typography>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </FocusAwareView>

      <BottomSheetModal
        ref={optionsSheetRef}
        index={0}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: UI.color.bg, borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: UI.color.muted, width: 40 }}
      >
        <BottomSheetView
          style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 24 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <AppUserAvatar user={friend} size="md" balance={netBalance} />
            <View style={{ flex: 1, minWidth: 0, marginLeft: 14 }}>
              <Typography
                numberOfLines={1}
                style={{
                  fontSize: 22,
                  lineHeight: 27,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  color: UI.color.text,
                }}
              >
                {friend.name}
              </Typography>
              <Typography
                numberOfLines={1}
                style={{
                  marginTop: 3,
                  fontSize: 14,
                  lineHeight: 19,
                  fontFamily: "IBMPlexSans_500Medium",
                  color: UI.color.muted,
                }}
              >
                {friend.email}
              </Typography>
            </View>
          </View>

          {isPositive && (
            <OptionRow
              icon={icons.Bell}
              label="Send reminder"
              description={`Ask ${friend.name.split(" ")[0]} to settle ${formatAmount(Math.abs(netBalance), preferredCurrency.code)}.`}
              onPress={() => {
                optionsSheetRef.current?.dismiss();
                handleRemind();
              }}
            />
          )}
          {!isSettled && !isPositive && (
            <OptionRow
              icon={icons.Handshake}
              label="Settle up"
              description={`Record a payment to clear what you owe ${friend.name.split(" ")[0]}.`}
              onPress={() => {
                optionsSheetRef.current?.dismiss();
                router.push({ pathname: "/settle/[id]", params: { id: friend.id } });
              }}
            />
          )}
          <OptionRow
            icon={icons.Share2}
            label="Share balance"
            description="Send a plain-language balance summary."
            onPress={handleShareBalance}
          />
          <OptionRow
            icon={icons.Mail}
            label="Contact info"
            description="View the email attached to this friend."
            onPress={handleShowContact}
          />
          <OptionRow
            icon={icons.UserMinus}
            label={directFriendship ? "Remove friend" : "Shared group contact"}
            description={
              directFriendship
                ? "Remove the direct friendship without deleting shared history."
                : "This person appears because you share a group."
            }
            tone={directFriendship ? "danger" : "neutral"}
            onPress={handleRemoveFriend}
          />
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}
