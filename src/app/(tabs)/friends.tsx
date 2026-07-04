import { Typography, PressableFeedback, Skeleton, Button, SearchField } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useMemo, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View, RefreshControl, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import LottieView from "lottie-react-native";
import { SwipeableRow } from "@/components/layout/SwipeableRow";
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

import { FocusAwareView } from "@/components/animations/PageAnimator";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";

export default function FriendsScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { data: groups = [], isLoading } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const balances = balancesUtil.getUserBalances(
    currentUser.id,
    undefined,
    groups,
    expenses,
    settlements,
    preferredCurrency,
    convertCurrency
  );

  const uniqueFriends = useMemo(() => {
    const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
    return Array.from(new Map(allMembers.map((user) => [user.id, user])).values()).filter(
      (user) => user.id !== currentUser.id
    );
  }, [groups, currentUser.id]);

  const filtered = search.trim()
    ? uniqueFriends.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : uniqueFriends;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      setRefreshing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1000);
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
        <Typography type="h1" className="font-black tracking-tight text-foreground text-[32px]">
          Friends
        </Typography>
        <Button
          variant="primary"
          isIconOnly
          className="w-12 h-12 rounded-full"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/friend/new");
          }}
        >
          <icons.Plus size={24} color="white" strokeWidth={3} />
        </Button>
      </BlurView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 90, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3D2B82"
            progressViewOffset={insets.top + 80}
          />
        }
      >
        <View className="px-6 mt-2">
          {/* Search */}
          <View className="mb-6">
            <View className="flex-row items-center bg-white rounded-[16px] border border-border/50 h-[48px] px-4">
              <icons.Search size={20} color="#8A8798" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search friends..."
                placeholderTextColor="#8A8798"
                className="flex-1 ml-2 font-medium text-foreground text-[16px]"
              />
              {search.length > 0 && (
                <PressableFeedback onPress={() => setSearch("")} hitSlop={8}>
                  <icons.XCircle size={18} color="#8A8798" />
                </PressableFeedback>
              )}
            </View>
          </View>

          {/* List */}
          {filtered.length === 0 ? (
            <View className="mt-8 items-center justify-center p-8 bg-white rounded-[32px] border border-border border-dashed">
              <View className="w-24 h-24 mb-4">
                <LottieView
                  source={require("@/assets/empty-state.json")}
                  autoPlay
                  loop
                  style={{ width: "100%", height: "100%" }}
                />
              </View>
              <Typography type="h3" className="font-bold text-foreground text-center mb-2">
                No friends found
              </Typography>
              <Typography type="body-sm" className="text-muted-foreground text-center mb-6">
                {search
                  ? "Try a different search term"
                  : "Add an expense with someone to see them here."}
              </Typography>
              {!search && (
                <Button
                  variant="primary"
                  className="px-6 h-12 rounded-[16px]"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push("/expense/new");
                  }}
                >
                  <icons.Plus size={20} color="white" />
                  <Button.Label className="font-bold">Add a friend</Button.Label>
                </Button>
              )}
            </View>
          ) : (
            <View className="gap-2">
              {isLoading ? (
                <>
                  <Skeleton className="w-full h-[88px] rounded-[24px]" />
                  <Skeleton className="w-full h-[88px] rounded-[24px]" />
                  <Skeleton className="w-full h-[88px] rounded-[24px]" />
                </>
              ) : (
                filtered.map((friend, index) => {
                  const bal = balances.get(friend.id) || 0;
                  const isPositive = bal > 0;
                  const isNegative = bal < 0;

                  return (
                    <FocusAwareView key={friend.id} delay={100 + index * 50}>
                      <SwipeableRow
                        onDelete={() => console.log("Delete friend", friend.id)}
                        onSettle={
                          bal !== 0 ? () => console.log("Settle up with", friend.id) : undefined
                        }
                      >
                        <PressableFeedback
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push(`/friend/${friend.id}`);
                          }}
                        >
                          <View className="flex-row items-center bg-white rounded-[24px] p-4 border border-border">
                            <AppUserAvatar user={friend} size="lg" />
                            <View className="flex-1 ml-4">
                              <Typography
                                type="h3"
                                className="font-bold text-[18px] text-foreground mb-1"
                              >
                                {friend.name}
                              </Typography>
                              {bal === 0 ? (
                                <Typography
                                  type="body-sm"
                                  className="text-muted-foreground font-medium"
                                >
                                  Settled up
                                </Typography>
                              ) : (
                                <Typography
                                  type="body-sm"
                                  className={`font-bold ${isPositive ? "text-success" : "text-danger"}`}
                                >
                                  {isPositive ? "Owes you " : "You owe "}
                                  {formatAmount(Math.abs(bal), preferredCurrency.code)}
                                </Typography>
                              )}
                            </View>
                            <icons.ChevronRight size={20} color="#8A8798" />
                          </View>
                        </PressableFeedback>
                      </SwipeableRow>
                    </FocusAwareView>
                  );
                })
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </FocusAwareView>
  );
}
