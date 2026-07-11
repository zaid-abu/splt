import { Alert, Typography } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { FriendRouteParams } from "@/types/navigation";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { ComponentType, JSX } from "react";
import { useMemo, useRef, useCallback, useState } from "react";
import { StatusBar } from "expo-status-bar";
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
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { ActivityItem } from "@/features/activity/components/ActivityItem";
import { UI, SectionLabel } from "@/components/ui/native-ui";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import { FocusAwareView } from "@/components/animations/PageAnimator";

import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useAppToast } from "@/hooks/useAppToast";
import { useQueryClient } from "@tanstack/react-query";
import { EXPENSE_CATEGORIES } from "@/types";

// ─── Design Tokens ───
const BG = UI.color.bg;
const SURFACE = UI.color.surface;
const SURFACE_SOFT = UI.color.subtle;
const CONTROL = UI.color.control;
const TEXT_PRIMARY = UI.color.text;
const TEXT_SECONDARY = UI.color.muted;
const TEXT_SUBTLE = "#9B9A94";
const TEXT_DANGER = UI.color.danger;
const TEXT_SUCCESS = UI.color.success;
const SEPARATOR = UI.color.border;
const BRAND = UI.color.brand;
const CARD_RADIUS = UI.radius.lg;
const PILL_RADIUS = 999;

const CATEGORY_LABELS = Object.fromEntries(
  EXPENSE_CATEGORIES.map((category) => [category.key, category.label])
);

function SkeletonBlock({
  width,
  height,
  radius = 12,
}: {
  width: number | `${number}%`;
  height: number;
  radius?: number;
}): JSX.Element {
  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: SURFACE_SOFT,
      }}
    />
  );
}

function LoadingState({ topInset }: { topInset: number }): JSX.Element {
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />
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
        <SkeletonBlock width={44} height={44} radius={PILL_RADIUS} />
        <View style={{ alignItems: "center", gap: 8 }}>
          <SkeletonBlock width={132} height={22} />
          <SkeletonBlock width={84} height={14} />
        </View>
        <SkeletonBlock width={44} height={44} radius={PILL_RADIUS} />
      </View>

      <View style={{ paddingHorizontal: 24, gap: 32 }}>
        <View
          style={{
            padding: 24,
            backgroundColor: SURFACE,
            borderWidth: 1,
            borderColor: SEPARATOR,
            borderRadius: CARD_RADIUS,
            alignItems: "center",
            gap: 14,
          }}
        >
          <SkeletonBlock width={120} height={14} />
          <SkeletonBlock width={188} height={42} />
          <SkeletonBlock width="72%" height={16} />
        </View>
        <View style={{ gap: 12 }}>
          <SkeletonBlock width={132} height={13} />
          <SkeletonBlock width="100%" height={72} />
          <SkeletonBlock width="100%" height={72} />
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
  const color = tone === "danger" ? TEXT_DANGER : TEXT_PRIMARY;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
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
          backgroundColor: CONTROL,
          borderWidth: 1,
          borderColor: SEPARATOR,
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
            color: TEXT_SECONDARY,
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

  const { data: groups = [], isLoading: isLoadingGroups } = useGroups(currentUser?.id);
  const { data: expenses = [], isLoading: isLoadingExpenses } = useUserExpenses(currentUser?.id);
  const { data: settlements = [], isLoading: isLoadingSettlements } = useUserSettlements(
    currentUser?.id
  );
  const { data: friendsList = [], isLoading: isLoadingFriends } = useFriends(currentUser?.id);
  const { data: allFriendships = [] } = useAllFriendships(currentUser?.id);
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
        pillButton: {
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: UI.radius.pill,
          borderWidth: 1,
        },
        pillButtonActive: { backgroundColor: UI.color.text, borderColor: UI.color.text },
        pillButtonInactive: { backgroundColor: UI.color.control, borderColor: UI.color.border },
        sectionPad: { paddingHorizontal: 24 },
        bottomAction: {
          flex: 1,
          height: 56,
          borderRadius: UI.radius.pill,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
        },
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

  const sharedActivities = useMemo(() => {
    const sharedExp = expenses
      .filter((e) => {
        const friendInvolved = e.paidBy === id || e.splits.some((s) => s.userId === id);
        const currentUserInvolved =
          e.paidBy === currentUser.id || e.splits.some((s) => s.userId === currentUser.id);
        // Specifically look for non-group expenses (1-on-1) or group ones involving both
        return friendInvolved && currentUserInvolved && !e.groupId;
      })
      .map((e) => ({
        id: `exp-${e.id}`,
        type: "expense" as const,
        userId: currentUser.id,
        user: currentUser,
        expense: e,
        description: e.title,
        date: e.date,
        currency: e.currency,
      }));

    const sharedSet = settlements
      .filter((s) => {
        const friendInvolved = s.fromUserId === id || s.toUserId === id;
        const currentUserInvolved =
          s.fromUserId === currentUser.id || s.toUserId === currentUser.id;
        return friendInvolved && currentUserInvolved && !s.groupId;
      })
      .map((s) => ({
        id: `set-${s.id}`,
        type: "settlement" as const,
        userId: currentUser.id,
        user: currentUser,
        settlement: s,
        description: "Settled up",
        date: s.date,
        currency: s.currency,
      }));

    return [...sharedExp, ...sharedSet].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [expenses, settlements, id, currentUser]);

  const netBalance = balances.get(id ?? "") || 0;
  const isPositive = netBalance > 0;
  const isSettled = netBalance === 0;
  const recentActivity = sharedActivities[0] ?? null;
  const lastActivityCopy = recentActivity
    ? `Last activity: ${recentActivity.description}`
    : "No shared one-on-one activity yet";

  const sharedGroups = useMemo(
    () => groups.filter((group) => group.members.some((member) => member.userId === id)),
    [groups, id]
  );

  const sharedGroupsWithRecentActivity = useMemo(
    () =>
      sharedGroups.map((group) => {
        const latestExpense = expenses
          .filter(
            (expense) =>
              expense.groupId === group.id &&
              (expense.paidBy === id || expense.splits.some((split) => split.userId === id)) &&
              (expense.paidBy === currentUser.id ||
                expense.splits.some((split) => split.userId === currentUser.id))
          )
          .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

        return {
          group,
          latestExpense,
        };
      }),
    [currentUser.id, expenses, id, sharedGroups]
  );

  const categorySpending = useMemo(() => {
    const totals: Record<string, number> = {};
    sharedActivities.forEach((activity) => {
      if (activity.type === "expense" && activity.expense) {
        const cat = activity.expense.category || "other";
        const amount = convertCurrency(
          activity.expense.amount,
          activity.currency || preferredCurrency.code,
          preferredCurrency.code
        );
        totals[cat] = (totals[cat] || 0) + amount;
      }
    });
    return Object.entries(totals)
      .filter(([, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1]) // highest first
      .map(([cat, amount]) => ({
        cat,
        amount,
      }));
  }, [sharedActivities, preferredCurrency.code, convertCurrency]);

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

  if (!friend) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Alert status="danger" style={{ borderRadius: CARD_RADIUS, marginBottom: 16 }}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Friend not found</Alert.Title>
              <Alert.Description>We couldn&apos;t find this friend.</Alert.Description>
            </Alert.Content>
          </Alert>
          <Pressable
            onPress={() => router.back()}
            style={{
              padding: 14,
              paddingHorizontal: 24,
              backgroundColor: BRAND,
              borderRadius: PILL_RADIUS,
            }}
          >
            <Typography style={{ color: "#FFF", fontFamily: "IBMPlexSans_600SemiBold" }}>
              Go back
            </Typography>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
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
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            marginHorizontal: 16,
          }}
        >
          <AppUserAvatar user={friend} size="sm" />
          <Typography
            numberOfLines={1}
            style={{
              fontFamily: "Sora_600SemiBold",
              fontSize: 24,
              color: TEXT_PRIMARY,
              flexShrink: 1,
              textAlign: "center",
              marginTop: 4,
            }}
          >
            {friend.name}
          </Typography>
          <Typography
            numberOfLines={1}
            style={{
              fontSize: 13,
              color: TEXT_SECONDARY,
              fontFamily: "IBMPlexSans_500Medium",
              textAlign: "center",
              marginTop: 1,
            }}
          >
            {friend.email}
          </Typography>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Friend options"
          onPress={handleOpenOptions}
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
          <icons.MoreHorizontal size={20} color={TEXT_PRIMARY} strokeWidth={1.8} />
        </Pressable>
      </View>

      <FocusAwareView style={{ flex: 1 }}>
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
          {/* ── Balance Card ─────────────────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            style={{ paddingHorizontal: 24, marginBottom: 40 }}
          >
            <View
              style={{
                padding: 24,
                backgroundColor: SURFACE,
                borderWidth: 1,
                borderColor: SEPARATOR,
                borderRadius: CARD_RADIUS,
                alignItems: "center",
              }}
            >
              {isSettled ? (
                <>
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
                    style={{
                      fontSize: 16,
                      color: TEXT_PRIMARY,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    All settled up
                  </Typography>
                  <Typography
                    style={{
                      marginTop: 4,
                      fontSize: 14,
                      color: TEXT_SECONDARY,
                      fontFamily: "IBMPlexSans_500Medium",
                    }}
                  >
                    No pending balances
                  </Typography>
                  <Typography
                    numberOfLines={2}
                    style={{
                      marginTop: 12,
                      fontSize: 14,
                      lineHeight: 20,
                      color: TEXT_SECONDARY,
                      fontFamily: "IBMPlexSans_500Medium",
                      textAlign: "center",
                    }}
                  >
                    {lastActivityCopy}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography
                    style={{
                      fontSize: 13,
                      color: TEXT_SECONDARY,
                      fontFamily: "IBMPlexSans_600SemiBold",
                      textTransform: "uppercase",
                      letterSpacing: 1.2,
                      marginBottom: 8,
                    }}
                  >
                    {isPositive ? `${friend.name} owes you` : `You owe ${friend.name}`}
                  </Typography>
                  <Typography
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{
                      fontSize: 40,
                      color: isPositive ? TEXT_SUCCESS : TEXT_DANGER,
                      fontFamily: "Sora_600SemiBold",
                    }}
                  >
                    {formatAmount(Math.abs(netBalance), preferredCurrency.code)}
                  </Typography>
                  <Typography
                    numberOfLines={2}
                    style={{
                      marginTop: 12,
                      fontSize: 14,
                      lineHeight: 20,
                      color: TEXT_SECONDARY,
                      fontFamily: "IBMPlexSans_500Medium",
                      textAlign: "center",
                    }}
                  >
                    {isPositive
                      ? "Send a reminder or add another shared expense."
                      : "Settle this balance when you are ready."}{" "}
                    {lastActivityCopy}
                  </Typography>
                </>
              )}
            </View>
          </Animated.View>

          {/* ── Shared Groups ─────────────────────────────────────────────── */}
          {sharedGroupsWithRecentActivity.length > 0 && (
            <Animated.View
              entering={FadeInDown.duration(400).delay(50).springify()}
              style={{ paddingHorizontal: 24, marginBottom: 40 }}
            >
              <SectionLabel>Shared Groups</SectionLabel>
              <View
                style={{
                  borderRadius: CARD_RADIUS,
                  borderWidth: 1,
                  borderColor: SEPARATOR,
                  backgroundColor: SURFACE,
                }}
              >
                {sharedGroupsWithRecentActivity.map(({ group, latestExpense }, idx) => (
                  <Pressable
                    key={group.id}
                    accessibilityRole="button"
                    onPress={() => router.push(`/group/${group.id}`)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderBottomWidth: idx < sharedGroupsWithRecentActivity.length - 1 ? 1 : 0,
                      borderBottomColor: SEPARATOR,
                      backgroundColor: pressed ? "#FBF7F2" : "transparent",
                      borderTopLeftRadius: idx === 0 ? CARD_RADIUS : 0,
                      borderTopRightRadius: idx === 0 ? CARD_RADIUS : 0,
                      borderBottomLeftRadius:
                        idx === sharedGroupsWithRecentActivity.length - 1 ? CARD_RADIUS : 0,
                      borderBottomRightRadius:
                        idx === sharedGroupsWithRecentActivity.length - 1 ? CARD_RADIUS : 0,
                    })}
                  >
                    <GroupIconBadge group={group} size="sm" />
                    <View style={{ flex: 1, minWidth: 0, marginLeft: 12, marginRight: 12 }}>
                      <Typography
                        numberOfLines={1}
                        style={{
                          fontSize: 16,
                          color: TEXT_PRIMARY,
                          fontFamily: "IBMPlexSans_600SemiBold",
                        }}
                      >
                        {group.name}
                      </Typography>
                      <Typography
                        numberOfLines={1}
                        style={{
                          marginTop: 3,
                          fontSize: 13,
                          color: TEXT_SECONDARY,
                          fontFamily: "IBMPlexSans_500Medium",
                        }}
                      >
                        {latestExpense
                          ? `Latest: ${latestExpense.title}`
                          : "No shared group expenses yet"}
                      </Typography>
                    </View>
                    <icons.ChevronRight size={18} color={TEXT_SUBTLE} strokeWidth={1.8} />
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          )}

          {/* ── Category Spending ────────────────────────────────────────── */}
          {categorySpending.length > 0 && (
            <Animated.View
              entering={FadeInDown.duration(400).delay(100).springify()}
              style={{ paddingHorizontal: 24, marginBottom: 40 }}
            >
              <SectionLabel>Spending by Category</SectionLabel>
              <View
                style={{
                  borderRadius: CARD_RADIUS,
                  borderWidth: 1,
                  borderColor: SEPARATOR,
                  backgroundColor: SURFACE,
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
                      borderBottomColor: SEPARATOR,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <CategoryIconBadge category={item.cat as any} size="sm" />
                      <Typography
                        style={{
                          fontSize: 15,
                          color: TEXT_PRIMARY,
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
                        color: TEXT_PRIMARY,
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

          {/* ── Transactions ─────────────────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(150).springify()}
            style={{ paddingHorizontal: 24, marginBottom: 40 }}
          >
            <SectionLabel>Recent Activity</SectionLabel>

            <View
              style={{
                borderRadius: CARD_RADIUS,
                borderWidth: sharedActivities.length === 0 ? 1 : 0,
                borderColor: SEPARATOR,
                backgroundColor: sharedActivities.length === 0 ? SURFACE : "transparent",
              }}
            >
              {sharedActivities.length === 0 ? (
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
                    No shared activity
                  </Typography>
                  <Typography
                    style={{
                      fontSize: 14,
                      color: TEXT_SECONDARY,
                      fontFamily: "IBMPlexSans_500Medium",
                    }}
                  >
                    Add an expense to get started
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
                  {sharedActivities.map((activity, idx) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      index={idx}
                      isLast={idx === sharedActivities.length - 1}
                    />
                  ))}
                </View>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </FocusAwareView>

      {/* ── Bottom Action Bar ──────────────────────────────────────────── */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <BottomActionBar>
          {!isSettled && (
            <Pressable
              accessibilityRole="button"
              onPress={
                isPositive
                  ? handleRemind
                  : () => router.push({ pathname: "/settle/[id]", params: { id: friend.id } })
              }
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
              {isPositive ? (
                <icons.Bell size={20} color={TEXT_PRIMARY} strokeWidth={1.8} />
              ) : (
                <icons.Handshake size={20} color={TEXT_PRIMARY} strokeWidth={1.8} />
              )}
              <Typography
                style={{ fontSize: 16, color: TEXT_PRIMARY, fontFamily: "IBMPlexSans_600SemiBold" }}
              >
                {isPositive ? "Remind" : "Settle Up"}
              </Typography>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/expense/new?friendId=${friend.id}`)}
            style={({ pressed }) => ({
              flex: isSettled ? 1 : 1.5,
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
            <Typography
              style={{ fontSize: 16, color: "#FFFFFF", fontFamily: "IBMPlexSans_600SemiBold" }}
            >
              Add Expense
            </Typography>
          </Pressable>
        </BottomActionBar>
      </View>

      <BottomSheetModal
        ref={optionsSheetRef}
        index={0}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: UI.color.bg, borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: TEXT_SECONDARY, width: 40 }}
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
                  color: TEXT_PRIMARY,
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
                  color: TEXT_SECONDARY,
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
