/**
 * Dashboard (Home) Screen - Hero UI Redesign
 */
import { PressableFeedback, Typography } from "heroui-native";
import { useRouter } from "expo-router";
import { FocusAwareView } from "@/components/PageAnimator";
import type { JSX } from "react";
import { useState, useCallback, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { PieChart } from "react-native-gifted-charts";
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

import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { formatAmount } from "@/components/AmountDisplay";
import { AppUserAvatar } from "@/components/MemberAvatar";
import { ActivityItem } from "@/components/ActivityItem";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function DashboardScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { data: groups = [], isLoading: isLoadingGroups } = useGroups(currentUser?.id);
  const { data: activities = [], isLoading: isLoadingActivities } = useUserActivities(
    currentUser?.id
  );
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedSlice, setSelectedSlice] = useState<"owed" | "owe" | null>(null);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const owedToYou = balancesUtil.getTotalOwedToMe(
    currentUser.id,
    groups,
    expenses,
    settlements,
    preferredCurrency,
    convertCurrency
  );
  const youOwe = Math.abs(
    balancesUtil.getTotalIOwe(
      currentUser.id,
      groups,
      expenses,
      settlements,
      preferredCurrency,
      convertCurrency
    )
  );
  const netBalance = owedToYou - youOwe;

  const balances = balancesUtil.getUserBalances(
    currentUser.id,
    undefined,
    groups,
    expenses,
    settlements,
    preferredCurrency,
    convertCurrency
  );

  // Find top outstanding balances (up to 3)
  const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
  const uniqueUsers = Array.from(new Map(allMembers.map((user) => [user.id, user])).values());

  const outstandingFriends = uniqueUsers
    .filter((u) => u.id !== currentUser.id && (balances.get(u.id) || 0) !== 0)
    .map((u) => ({ user: u, balance: balances.get(u.id) || 0 }))
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
    .slice(0, 3);

  const recentActivities = [...activities]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 3);

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";
  const firstName = currentUser.name.split(" ")[0];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      setRefreshing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1000);
  }, []);

  const openQuickActions = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bottomSheetModalRef.current?.present();
  }, []);

  return (
    <FocusAwareView style={{ flex: 1 }} className="bg-background">
      <StatusBar style="dark" />

      {/* ── Sticky Blurred Header ───────────────────── */}
      <BlurView
        intensity={100}
        tint="light"
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 24,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "rgba(242, 242, 246, 0.90)",
        }}
      >
        <View>
          <Typography type="body-sm" className="text-muted-foreground font-medium mb-1">
            {greeting},
          </Typography>
          <Typography type="h2" className="font-black tracking-tight text-foreground text-[28px]">
            {firstName}
          </Typography>
        </View>
        <PressableFeedback
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/profile");
          }}
        >
          <View className="rounded-full p-[2px]">
            <AppUserAvatar user={currentUser} size="md" />
          </View>
        </PressableFeedback>
      </BlurView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 110, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3D2B82"
            progressViewOffset={insets.top + 100}
          />
        }
      >
        {/* ── Enhanced Hero Card (Financial Overview) ── */}
        <FocusAwareView delay={100} className="px-6 mb-6 mt-1">
          <View className="bg-primary rounded-[32px] p-6 relative overflow-hidden">
            {/* Decorative background circle */}
            <View className="absolute -top-10 -right-10 w-[150px] h-[150px] rounded-full bg-white opacity-10" />
            <View className="absolute -bottom-10 -left-10 w-[120px] h-[120px] rounded-full bg-white opacity-5" />

            <View className="flex-row justify-between items-center mb-6 z-10">
              <View>
                <Typography
                  type="body-sm"
                  className="text-primary-foreground opacity-80 font-medium mb-1"
                >
                  {selectedSlice === "owed"
                    ? "Total Owed to You"
                    : selectedSlice === "owe"
                      ? "Total You Owe"
                      : netBalance >= 0
                        ? "Net Balance (Owed to You)"
                        : "Net Balance (You Owe)"}
                </Typography>
                <Typography
                  type="h1"
                  className="text-primary-foreground font-black text-[40px] tracking-tight"
                >
                  {formatAmount(
                    Math.abs(
                      selectedSlice === "owed"
                        ? owedToYou
                        : selectedSlice === "owe"
                          ? youOwe
                          : netBalance || 0
                    ),
                    preferredCurrency.code
                  )}
                </Typography>
              </View>
              <View style={{ marginRight: -10 }}>
                <PieChart
                  donut
                  focusOnPress
                  toggleFocusOnPress
                  radius={35}
                  innerRadius={22}
                  data={[
                    {
                      value: owedToYou || 1,
                      color: "#10b981",
                      onPress: () => setSelectedSlice((prev) => (prev === "owed" ? null : "owed")),
                    },
                    {
                      value: youOwe || 1,
                      color: "#ef4444",
                      onPress: () => setSelectedSlice((prev) => (prev === "owe" ? null : "owe")),
                    },
                  ]}
                  backgroundColor="transparent"
                  centerLabelComponent={() => {
                    return <icons.Wallet size={16} color="white" />;
                  }}
                />
              </View>
            </View>

            {/* Breakdown Row */}
            <View className="flex-row items-center gap-6 mb-6 z-10">
              <View>
                <View className="flex-row items-center gap-1 mb-1">
                  <Typography
                    type="body-xs"
                    className="text-primary-foreground opacity-70 font-medium tracking-wider"
                  >
                    Owed To You
                  </Typography>
                </View>
                <Typography type="h3" className="text-primary-foreground font-bold">
                  {formatAmount(owedToYou, preferredCurrency.code)}
                </Typography>
              </View>
              <View className="h-8 w-[1px] bg-white/20" />
              <View>
                <View className="flex-row items-center gap-1 mb-1">
                  <Typography
                    type="body-xs"
                    className="text-primary-foreground opacity-70 font-medium tracking-wider"
                  >
                    You Owe
                  </Typography>
                </View>
                <Typography type="h3" className="text-primary-foreground font-bold">
                  {formatAmount(youOwe, preferredCurrency.code)}
                </Typography>
              </View>
            </View>

            {/* Quick Actions inside Card */}
            <View className="flex-row gap-3 z-10">
              <PressableFeedback
                className="flex-1 bg-white rounded-[16px] h-12 items-center justify-center"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/(tabs)/friends");
                }}
              >
                <View className="flex-row items-center justify-center gap-2">
                  <icons.Send size={16} className="text-primary" strokeWidth={2.5} />
                  <Typography type="body-sm" className="text-primary font-bold">
                    Settle Up
                  </Typography>
                </View>
              </PressableFeedback>
              <PressableFeedback
                className="flex-1 border border-white/30 rounded-[16px] h-12 items-center justify-center"
                onPress={openQuickActions}
              >
                <View className="flex-row items-center justify-center gap-2">
                  <icons.Zap size={16} color="white" strokeWidth={2.5} />
                  <Typography type="body-sm" className="text-white font-bold">
                    Actions
                  </Typography>
                </View>
              </PressableFeedback>
            </View>
          </View>
        </FocusAwareView>

        {/* ── Functional Quick Actions Grid ─────────── */}
        <FocusAwareView delay={200} className="px-6 mb-8">
          <View className="flex-row justify-between">
            {[
              {
                icon: icons.Users,
                label: "Groups",
                route: "/(tabs)/groups",
                color: "#6B4EFF",
                bg: "#E0DDF2",
              },
              {
                icon: icons.UserSquare2,
                label: "Friends",
                route: "/(tabs)/friends",
                color: "#10B981",
                bg: "#D1FAE5",
              },
              {
                icon: icons.Activity,
                label: "Activity",
                route: "/(tabs)/activity",
                color: "#F59E0B",
                bg: "#FEF3C7",
              },
              {
                icon: icons.UserCircle,
                label: "Profile",
                route: "/profile",
                color: "#EC4899",
                bg: "#FCE7F3",
              },
            ].map((action, index) => (
              <PressableFeedback
                key={index}
                className="items-center gap-2"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  action.route && router.push(action.route as any);
                }}
              >
                <View
                  className="w-16 h-16 rounded-[20px] items-center justify-center"
                  style={{ backgroundColor: action.bg }}
                >
                  <action.icon size={24} color={action.color} strokeWidth={2.5} />
                </View>
                <Typography type="body-sm" className="text-foreground font-medium text-[12px]">
                  {action.label}
                </Typography>
              </PressableFeedback>
            ))}
          </View>
        </FocusAwareView>

        {/* ── Outstanding Balances ──────────────────── */}
        <FocusAwareView delay={300} className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Typography type="h3" className="text-[20px] font-bold text-foreground tracking-tight">
              Needs Attention
            </Typography>
            <PressableFeedback
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/friends");
              }}
            >
              <Typography type="body-sm" className="text-primary font-bold">
                See all
              </Typography>
            </PressableFeedback>
          </View>

          <View className="gap-3">
            {outstandingFriends.length > 0 ? (
              outstandingFriends.map((f, idx) => {
                const isPositive = f.balance > 0;
                return (
                  <Animated.View
                    key={f.user.id}
                    entering={FadeInDown.delay(300 + idx * 100).springify()}
                  >
                    <PressableFeedback
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/friend/${f.user.id}`);
                      }}
                    >
                      <View className="flex-row items-center justify-between p-4 bg-surface rounded-[20px] border border-border">
                        <View className="flex-row items-center gap-4">
                          <AppUserAvatar user={f.user} size="lg" />
                          <View>
                            <Typography type="body" className="font-bold text-foreground">
                              {f.user.name}
                            </Typography>
                            <Typography
                              type="body-sm"
                              className={`font-bold mt-0.5 ${isPositive ? "text-success" : "text-danger"}`}
                            >
                              {isPositive ? "Owes you " : "You owe "}
                              {formatAmount(Math.abs(f.balance), preferredCurrency.code)}
                            </Typography>
                          </View>
                        </View>
                        <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center">
                          <icons.ChevronRight size={20} className="text-primary" />
                        </View>
                      </View>
                    </PressableFeedback>
                  </Animated.View>
                );
              })
            ) : (
              <View className="p-6 bg-surface rounded-[24px] items-center justify-center border border-border border-dashed">
                <View className="w-12 h-12 rounded-full bg-success/10 items-center justify-center mb-3">
                  <icons.CheckCircle2 size={24} className="text-success" />
                </View>
                <Typography type="body" className="font-bold text-foreground text-center">
                  You&apos;re all caught up!
                </Typography>
                <Typography type="body-sm" className="text-muted-foreground text-center mt-1">
                  No outstanding balances with friends.
                </Typography>
              </View>
            )}
          </View>
        </FocusAwareView>

        {/* ── Recent Activity ───────────────────────── */}
        {recentActivities.length > 0 && (
          <FocusAwareView delay={400} className="px-6 mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Typography
                type="h3"
                className="text-[20px] font-bold text-foreground tracking-tight"
              >
                Recent Activity
              </Typography>
              <PressableFeedback
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(tabs)/activity");
                }}
              >
                <Typography type="body-sm" className="text-primary font-bold">
                  See all
                </Typography>
              </PressableFeedback>
            </View>

            <View className="bg-white rounded-[24px] overflow-hidden border border-border">
              {recentActivities.map((activity, idx) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  index={idx}
                  isLast={idx === recentActivities.length - 1}
                />
              ))}
            </View>
          </FocusAwareView>
        )}
      </ScrollView>

      {/* ── Quick Actions Bottom Sheet ───────────────────────── */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={["35%"]}
        enablePanDownToClose={true}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
        )}
        backgroundStyle={{ borderRadius: 32, backgroundColor: "#FFFFFF" }}
      >
        <BottomSheetView style={{ padding: 24, paddingBottom: insets.bottom + 24 }}>
          <Typography type="h3" className="font-bold text-foreground mb-8 text-center text-[20px]">
            Quick Actions
          </Typography>
          <View className="flex-row justify-around">
            <PressableFeedback
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                bottomSheetModalRef.current?.dismiss();
                setTimeout(() => router.push("/expense/new"), 300);
              }}
            >
              <View className="items-center w-[80px]">
                <View className="w-16 h-16 rounded-[24px] bg-primary/10 items-center justify-center mb-3">
                  <icons.Plus size={28} className="text-primary" />
                </View>
                <Typography type="body-sm" className="font-bold text-center">
                  Add Bill
                </Typography>
              </View>
            </PressableFeedback>

            <PressableFeedback
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                bottomSheetModalRef.current?.dismiss();
                setTimeout(() => router.push("/(tabs)/friends"), 300);
              }}
            >
              <View className="items-center w-[80px]">
                <View className="w-16 h-16 rounded-[24px] bg-success/10 items-center justify-center mb-3">
                  <icons.Send size={28} className="text-success" />
                </View>
                <Typography type="body-sm" className="font-bold text-center">
                  Settle Up
                </Typography>
              </View>
            </PressableFeedback>

            <PressableFeedback
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                bottomSheetModalRef.current?.dismiss();
                setTimeout(() => router.push("/group/new"), 300);
              }}
            >
              <View className="items-center w-[80px]">
                <View className="w-16 h-16 rounded-[24px] bg-accent/10 items-center justify-center mb-3">
                  <icons.Users size={28} className="text-accent" />
                </View>
                <Typography type="body-sm" className="font-bold text-center">
                  New Group
                </Typography>
              </View>
            </PressableFeedback>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </FocusAwareView>
  );
}
