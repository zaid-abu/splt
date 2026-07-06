import { useLocalSearchParams, useRouter } from "expo-router";
import type { FriendRouteParams } from "@/types/navigation";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { JSX } from "react";
import { useMemo, useRef, useCallback, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import * as icons from "lucide-react-native";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useFriends } from "@/features/friends/queries/useFriends";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";

import { formatAmount } from "@/components/ui/AmountDisplay";
import { ActivityItem } from "@/features/activity/components/ActivityItem";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Dialog } from "@/components/ui/Dialog";

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

export default function FriendDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<FriendRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? "";

  const optionsSheetRef = useRef<BottomSheetModal>(null);
  const [reminderDialogVisible, setReminderDialogVisible] = useState(false);
  const [unfriendDialogVisible, setUnfriendDialogVisible] = useState(false);

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
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);

  const balances = balancesUtil.getUserBalances(
    userId,
    undefined,
    groups,
    expenses,
    settlements,
    preferredCurrency,
    convertCurrency
  );

  const { data: friendsList = [] } = useFriends(currentUser?.id);
  const friend = friendsList.find((f) => f.id === id);

  const sharedActivities = useMemo(() => {
    const sharedExp = expenses
      .filter((e) => {
        const friendInvolved = e.paidBy === id || e.splits.some((s) => s.userId === id);
        const currentUserInvolved =
          e.paidBy === userId || e.splits.some((s) => s.userId === userId);
        return friendInvolved && currentUserInvolved && !e.groupId;
      })
      .map((e) => ({
        id: `exp-${e.id}`,
        type: "expense" as const,
        userId: userId,
        user: currentUser!,
        expense: e,
        description: e.title,
        date: e.date,
        currency: e.currency,
      }));

    const sharedSet = settlements
      .filter((s) => {
        const friendInvolved = s.fromUserId === id || s.toUserId === id;
        const currentUserInvolved =
          s.fromUserId === userId || s.toUserId === userId;
        return friendInvolved && currentUserInvolved && !s.groupId;
      })
      .map((s) => ({
        id: `set-${s.id}`,
        type: "settlement" as const,
        userId: userId,
        user: currentUser!,
        settlement: s,
        description: "Settled up",
        date: s.date,
        currency: s.currency,
      }));

    return [...sharedExp, ...sharedSet].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [expenses, settlements, id, userId]);

  const netBalance = balances.get(id ?? "") || 0;
  const isPositive = netBalance > 0;
  const isSettled = netBalance === 0;

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
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({
        cat,
        amount,
        colors: CATEGORY_COLORS[cat] || CATEGORY_COLORS.other,
        iconName: CATEGORY_ICONS[cat] || CATEGORY_ICONS.other,
      }));
  }, [sharedActivities, preferredCurrency.code, convertCurrency]);

  if (!friend) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState
            icon="UserX"
            title="Friend not found"
            description="We couldn't find this friend."
            action={{ label: "Go back", onPress: () => router.back() }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUser) return <></>;
  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-6 pb-6"
        style={{ paddingTop: insets.top + 16 }}
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
          className="w-11 h-11 rounded-xl bg-transparent border border-border items-center justify-center active:opacity-50"
        >
          <icons.ArrowLeft size={20} className="text-foreground" strokeWidth={1.5} />
        </Pressable>

        <View className="flex-row items-center justify-center flex-1 mx-4 gap-3">
          <AppUserAvatar user={friend} size="sm" />
          <Text
            variant="h3"
            color="foreground"
            numberOfLines={1}
            className="flex-shrink text-center"
          >
            {friend.name}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleOpenOptions}
          className="w-11 h-11 rounded-xl bg-transparent border border-border items-center justify-center active:opacity-50"
        >
          <icons.MoreVertical size={20} className="text-foreground" strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Hero */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="px-6 mb-10 items-center"
        >
          <View
            className={`w-20 h-20 rounded-2xl items-center justify-center mb-4 ${
              isSettled
                ? "bg-transparent border border-border"
                : isPositive
                  ? "bg-success/10"
                  : "bg-danger/10"
            }`}
          >
            {isSettled ? (
              <icons.Check size={32} className="text-foreground" strokeWidth={1.5} />
            ) : isPositive ? (
              <icons.ArrowDownLeft size={32} className="text-success" strokeWidth={2} />
            ) : (
              <icons.ArrowUpRight size={32} className="text-danger" strokeWidth={2} />
            )}
          </View>

          <Text variant="body" weight="bold" color="foreground" className="mb-2">
            {isSettled ? "All settled up!" : isPositive ? "Owes you" : "You owe"}
          </Text>

          {!isSettled && (
            <Text
              variant="h1"
              color={isPositive ? "success" : "danger"}
              className="font-heading"
            >
              {formatAmount(Math.abs(netBalance), preferredCurrency.code)}
            </Text>
          )}

          {isPositive && !isSettled && (
            <Pressable
              onPress={() => setReminderDialogVisible(true)}
              className="mt-4 py-2 px-4 rounded-xl border border-success active:opacity-50"
            >
              <Text variant="body-sm" weight="bold" color="success">
                Send Reminder
              </Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Category Breakdown */}
        {categorySpending.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(25).springify()}
            className="mb-10"
          >
            <View className="px-6 mb-4">
              <Text variant="label">Spending Together</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
            >
              {categorySpending.map(({ cat, amount, colors, iconName }) => {
                const IconComp = (icons as any)[iconName] || icons.Package;
                return (
                  <View
                    key={cat}
                    className="flex-row items-center p-3 rounded-xl border border-border min-w-[140px]"
                  >
                    <View
                      className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: colors.bg }}
                    >
                      <IconComp size={18} color={colors.icon} strokeWidth={1.5} />
                    </View>
                    <View>
                      <Text variant="body-xs" color="muted" className="capitalize mb-0.5">
                        {cat}
                      </Text>
                      <Text variant="body-sm" weight="bold" color="foreground">
                        {formatAmount(amount, preferredCurrency.code)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* Activities */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(50).springify()}
          className="px-6 mb-10"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text variant="label">Shared Activity</Text>
            <Text variant="body-sm" weight="bold" color="foreground">
              Total: {sharedActivities.length}
            </Text>
          </View>

          {sharedActivities.length === 0 ? (
            <EmptyState
              icon="Receipt"
              title="No shared activity"
              description="Add an expense to start tracking"
            />
          ) : (
            <View className="border-t border-border">
              {sharedActivities.map((activity, idx) => (
                <View key={activity.id} className="border-b border-border">
                  <ActivityItem
                    activity={activity}
                    index={idx}
                    isLast={true}
                  />
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Options Bottom Sheet */}
      <BottomSheetModal
        ref={optionsSheetRef}
        index={0}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#131316", borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: "#3F3F46", width: 40 }}
      >
        <BottomSheetView
          style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 24 }}
        >
          <Text variant="h4" color="foreground" className="mb-6">
            Manage Friendship
          </Text>

          <Pressable
            onPress={() => {
              optionsSheetRef.current?.dismiss();
            }}
            className="flex-row items-center py-4 border-b border-border active:opacity-50"
          >
            <icons.Download
              size={20}
              className="text-foreground"
              strokeWidth={1.5}
              style={{ marginRight: 12 }}
            />
            <Text variant="body" weight="semibold" color="foreground">
              Export History
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              optionsSheetRef.current?.dismiss();
              setUnfriendDialogVisible(true);
            }}
            className="flex-row items-center py-4 active:opacity-50"
          >
            <icons.UserMinus
              size={20}
              className="text-danger"
              strokeWidth={1.5}
              style={{ marginRight: 12 }}
            />
            <Text variant="body" weight="semibold" color="danger">
              Unfriend
            </Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Reminder Dialog */}
      <Dialog
        visible={reminderDialogVisible}
        onClose={() => setReminderDialogVisible(false)}
        title="Reminder Sent"
        description={`We've sent a friendly reminder to ${friend.name.split(" ")[0]}.`}
        actions={[
          { label: "OK", variant: "primary", onPress: () => setReminderDialogVisible(false) },
        ]}
      />

      {/* Unfriend Dialog */}
      <Dialog
        visible={unfriendDialogVisible}
        onClose={() => setUnfriendDialogVisible(false)}
        title="Unfriend"
        description="This feature is coming soon."
        actions={[
          { label: "Cancel", variant: "ghost", onPress: () => setUnfriendDialogVisible(false) },
          { label: "Unfriend", variant: "danger", onPress: () => setUnfriendDialogVisible(false) },
        ]}
      />

      {/* Bottom Action Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row gap-4 px-6 pt-4 bg-background border-t border-border"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Button
          variant="ghost"
          size="md"
          disabled={isSettled}
          leftIcon={
            <icons.Send
              size={20}
              className={isSettled ? "text-muted-foreground" : "text-foreground"}
              strokeWidth={1.5}
            />
          }
          onPress={() => router.push(`/settle/${id}`)}
          className="flex-1"
        >
          Settle Up
        </Button>

        <Button
          variant="primary"
          size="md"
          leftIcon={<icons.Plus size={20} color="#FAFAFA" strokeWidth={2} />}
          onPress={() => router.push(`/expense/new?friendId=${id}`)}
          className="flex-1"
        >
          Add Expense
        </Button>
      </View>
    </View>
  );
}
