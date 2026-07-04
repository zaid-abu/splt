import { Typography, PressableFeedback, Button, Alert, Skeleton } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import type { JSX } from "react";
import { useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
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

import { formatAmount } from "@/components/AmountDisplay";
import { ActivityItem } from "@/components/ActivityItem";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { AppUserAvatar } from "@/components/MemberAvatar";

export default function FriendDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { data: activities = [], isLoading: isLoadingActivities } = useUserActivities(
    currentUser?.id
  );
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);

  const isAppLoading = useUIStore((s) => s.isAppLoading);

  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);

  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const balances = balancesUtil.getUserBalances(
    currentUser.id,
    undefined,
    groups,
    expenses,
    settlements,
    preferredCurrency,
    convertCurrency
  );

  const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
  const uniqueFriends = Array.from(new Map(allMembers.map((user) => [user.id, user])).values());
  const friend = uniqueFriends.find((f) => f.id === id);

  const sharedActivities = useMemo(() => {
    return activities
      .filter((a) => {
        if (a.type === "expense" && a.expense) {
          const e = a.expense;
          const friendInvolved = e.paidBy === id || e.splits.some((s) => s.userId === id);
          const currentUserInvolved =
            e.paidBy === currentUser.id || e.splits.some((s) => s.userId === currentUser.id);
          return friendInvolved && currentUserInvolved;
        }
        if (a.type === "settlement" && a.settlement) {
          const s = a.settlement;
          const friendInvolved = s.fromUserId === id || s.toUserId === id;
          const currentUserInvolved =
            s.fromUserId === currentUser.id || s.toUserId === currentUser.id;
          return friendInvolved && currentUserInvolved;
        }
        return false;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [activities, id, currentUser.id]);

  const netBalance = balances.get(id ?? "") || 0;
  const isPositive = netBalance > 0;
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

  if (!friend) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-background">
        <View className="flex-1 items-center justify-center p-6">
          <Alert status="danger" className="mb-4 rounded-[20px]">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Friend not found</Alert.Title>
              <Alert.Description>We couldn&apos;t find this friend.</Alert.Description>
            </Alert.Content>
          </Alert>
          <Button onPress={() => router.back()} className="rounded-full mt-4">
            Go back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeInDown.duration(300).springify()}>
      <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={["top", "bottom"]}>
        <StatusBar style="dark" />
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          {/* ── Header ─────────────────────────────────── */}
          <View className="px-4 pt-2 flex-row items-center justify-between z-10">
            <PressableFeedback
              className="w-12 h-12 rounded-full bg-white/50 items-center justify-center backdrop-blur-md"
              onPress={() => router.back()}
            >
              <icons.ArrowLeft size={24} color="#000" />
            </PressableFeedback>
          </View>

          {/* ── Friend Info ────────────────────────────── */}
          <Animated.View className="px-6 items-center mt-2 mb-6" style={heroStyle}>
            <View className="mb-4">
              <AppUserAvatar user={friend} size="lg" />
            </View>
            <Typography
              type="h1"
              className="font-black text-foreground text-[32px] text-center mb-2"
            >
              {friend.name}
            </Typography>

            <View
              className={`px-4 py-2 rounded-full mt-2 border ${
                netBalance === 0
                  ? "bg-secondary border-border"
                  : isPositive
                    ? "bg-success/10 border-success/20"
                    : "bg-danger/10 border-danger/20"
              }`}
            >
              <Typography
                type="body-sm"
                className={`font-bold ${
                  netBalance === 0
                    ? "text-muted-foreground"
                    : isPositive
                      ? "text-success"
                      : "text-danger"
                }`}
              >
                {netBalance === 0
                  ? "You are settled up"
                  : isPositive
                    ? `Owes you ${formatAmount(Math.abs(netBalance), preferredCurrency.code)}`
                    : `You owe ${formatAmount(Math.abs(netBalance), preferredCurrency.code)}`}
              </Typography>
            </View>
          </Animated.View>

          {/* ── Actions ────────────────────────────────── */}
          <View className="px-6 flex-row gap-3 mb-6">
            <View className="flex-1">
              <PressableFeedback onPress={() => router.push(`/settle/${id}`)}>
                <View className="w-full h-[56px] rounded-full items-center justify-center border-2 border-border flex-row gap-2">
                  <icons.Send size={20} className="text-foreground" />
                  <Typography type="body" className="font-bold text-foreground">
                    Settle up
                  </Typography>
                </View>
              </PressableFeedback>
            </View>
            <View className="flex-1">
              <PressableFeedback onPress={() => router.push(`/expense/new?friendId=${id}`)}>
                <View className="w-full h-[56px] rounded-full items-center justify-center bg-primary flex-row gap-2">
                  <icons.Plus size={20} color="white" />
                  <Typography type="body" className="font-bold text-white">
                    Expense
                  </Typography>
                </View>
              </PressableFeedback>
            </View>
          </View>

          {/* ── Activities ───────────────────────────────── */}
          <View className="px-6 mb-4 flex-row items-center justify-between">
            <Typography
              type="body-xs"
              className="text-muted-foreground font-bold tracking-widest ml-2 uppercase"
            >
              Shared Activity ({sharedActivities.length})
            </Typography>
          </View>

          {isAppLoading ? (
            <View className="px-6">
              <View className="bg-white rounded-[24px] overflow-hidden border border-border p-4 gap-4">
                <View className="flex-row items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-[16px]" />
                  <View className="flex-1 gap-2">
                    <Skeleton className="w-3/4 h-4 rounded-full" />
                    <Skeleton className="w-1/3 h-3 rounded-full" />
                  </View>
                </View>
                <View className="flex-row items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-[16px]" />
                  <View className="flex-1 gap-2">
                    <Skeleton className="w-1/2 h-4 rounded-full" />
                    <Skeleton className="w-1/4 h-3 rounded-full" />
                  </View>
                </View>
              </View>
            </View>
          ) : sharedActivities.length === 0 ? (
            <View className="px-6">
              <View className="bg-white rounded-[24px] items-center p-8 border border-border">
                <View className="w-16 h-16 rounded-full bg-secondary items-center justify-center mb-4">
                  <Text style={{ fontSize: 32 }}>💸</Text>
                </View>
                <Typography type="h3" className="font-black text-center mb-1">
                  No shared activity
                </Typography>
                <Typography type="body" className="text-muted-foreground text-center">
                  Add an expense to start tracking
                </Typography>
              </View>
            </View>
          ) : (
            <View className="px-6">
              <View className="bg-white rounded-[24px] overflow-hidden border border-border">
                {sharedActivities.map((activity, idx) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    index={idx}
                    isLast={idx === sharedActivities.length - 1}
                  />
                ))}
              </View>
            </View>
          )}

          <View className="h-12" />
        </Animated.ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}
