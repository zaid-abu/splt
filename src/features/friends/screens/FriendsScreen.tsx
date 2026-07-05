import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useMemo, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import {
  View,
  RefreshControl,
  TextInput,
  Pressable,
  ScrollView,
  Share,
  Alert,
  LayoutAnimation,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";

import * as Haptics from "expo-haptics";

import { SwipeableRow } from "@/components/layout/SwipeableRow";

import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useFriends } from "@/features/friends/queries/useFriends";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";

import { FocusAwareView } from "@/components/animations/PageAnimator";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { AppLoader } from "@/components/ui/AppLoader";
import type { User } from "@/types";

const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const TEXT_DANGER = "#000000";
const TEXT_SUCCESS = "#4CAF82";
const SEPARATOR = "#E8E4DF";

export default function FriendsScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { data: groups = [], isLoading: isLoadingGroups } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);
  const { data: friends = [], isLoading: isLoadingFriends } = useFriends(currentUser?.id);

  const isLoading = isLoadingGroups || isLoadingFriends;

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "owes_you" | "you_owe" | "settled">("all");

  const balances = useMemo(
    () =>
      balancesUtil.getUserBalances(
        currentUser.id,
        undefined,
        groups,
        expenses,
        settlements,
        preferredCurrency,
        convertCurrency
      ),
    [currentUser.id, groups, expenses, settlements, preferredCurrency, convertCurrency]
  );

  const totalOwedToMe = useMemo(
    () =>
      balancesUtil.getTotalOwedToMe(
        currentUser.id,
        groups,
        expenses,
        settlements,
        preferredCurrency,
        convertCurrency
      ),
    [currentUser.id, groups, expenses, settlements, preferredCurrency, convertCurrency]
  );

  const totalIOwe = useMemo(
    () =>
      balancesUtil.getTotalIOwe(
        currentUser.id,
        groups,
        expenses,
        settlements,
        preferredCurrency,
        convertCurrency
      ),
    [currentUser.id, groups, expenses, settlements, preferredCurrency, convertCurrency]
  );

  const uniqueFriends = friends;

  const filtered = useMemo(() => {
    let result = uniqueFriends;
    if (search.trim()) {
      result = result.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (filter !== "all") {
      result = result.filter((f) => {
        const bal = balances.get(f.id) || 0;
        if (filter === "owes_you") return bal > 0;
        if (filter === "you_owe") return bal < 0;
        if (filter === "settled") return bal === 0;
        return true;
      });
    }
    return result;
  }, [uniqueFriends, search, filter, balances]);

  const getRecentExpense = useCallback(
    (friendId: string) => {
      const shared = expenses.filter((e) => {
        const involvesCurrentUser =
          e.paidBy === currentUser.id || e.splits.some((s) => s.userId === currentUser.id);
        const involvesFriend = e.paidBy === friendId || e.splits.some((s) => s.userId === friendId);
        return involvesCurrentUser && involvesFriend;
      });
      if (shared.length === 0) return null;
      return shared.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    },
    [expenses, currentUser.id]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      setRefreshing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1000);
  }, []);

  const ListEmptyComponent = useCallback(
    () => (
      <View
        style={{
          paddingHorizontal: 24,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 80,
        }}
      >
        {isLoading ? (
          <View style={{ paddingTop: 40 }}>
            <AppLoader />
          </View>
        ) : (
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: 120,
                height: 120,
                marginBottom: 24,
                borderRadius: 60,
                backgroundColor: "#EAE5E0",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <icons.Wallet size={48} color={TEXT_PRIMARY} strokeWidth={1.5} />
            </View>
            <Typography
              style={{
                fontSize: 24,
                color: TEXT_PRIMARY,
                fontFamily: "CrimsonText_700Bold",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {search || filter !== "all" ? "No friends found" : "Your network is empty"}
            </Typography>
            <Typography
              style={{
                fontSize: 16,
                color: TEXT_SECONDARY,
                fontFamily: "CrimsonText_600SemiBold",
                textAlign: "center",
                marginBottom: 32,
                lineHeight: 24,
              }}
            >
              {search || filter !== "all"
                ? "Try a different search term or filter"
                : "Add friends to easily split bills, track balances, and settle up in seconds."}
            </Typography>
            {!search && (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/expense/new");
                }}
                style={({ pressed }) => ({
                  height: 56,
                  borderRadius: 0,
                  backgroundColor: "#8C7A6B",
                  paddingHorizontal: 32,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.8 : 1,
                  gap: 12,
                })}
              >
                <icons.Plus size={20} color="#FFFFFF" strokeWidth={2} />
                <Typography
                  style={{ color: "#FFFFFF", fontSize: 16, fontFamily: "CrimsonText_700Bold" }}
                >
                  Add a friend
                </Typography>
              </Pressable>
            )}
          </View>
        )}
      </View>
    ),
    [isLoading, search, filter, router]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: User; index: number }) => {
      const bal = balances.get(item.id) || 0;
      const isPositive = bal > 0;
      const isNegative = bal < 0;
      const recentExpense = getRecentExpense(item.id);

      return (
        <Animated.View layout={LinearTransition}>
          <SwipeableRow
            onDelete={() => {
              Alert.alert(
                "Remove Friend?",
                "Are you sure you want to remove this friend? This action cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      // TODO: Implement actual backend mutation
                    },
                  },
                ]
              );
            }}
            onSettle={
              bal !== 0
                ? () => {
                    router.push({ pathname: "/settle/[id]", params: { id: item.id } });
                  }
                : undefined
            }
            onRemind={
              bal > 0
                ? async () => {
                    try {
                      await Share.share({
                        message: `Hey ${item.name.split(" ")[0]}! Just a quick reminder that you owe me ${formatAmount(Math.abs(bal), preferredCurrency.code)} on Splt. Let me know when you can settle up! 💸`,
                      });
                    } catch (error) {
                      console.log(error);
                    }
                  }
                : undefined
            }
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/friend/${item.id}`);
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 20,
                paddingHorizontal: 24,
                backgroundColor: BG,
                borderBottomWidth: 1,
                borderBottomColor: SEPARATOR,
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <AppUserAvatar user={item} size="lg" />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Typography
                  style={{
                    fontSize: 20,
                    color: TEXT_PRIMARY,
                    fontFamily: "CrimsonText_700Bold",
                    marginBottom: 2,
                  }}
                >
                  {item.name}
                </Typography>

                {recentExpense ? (
                  <Typography
                    style={{
                      fontSize: 13,
                      color: TEXT_SECONDARY,
                      fontFamily: "CrimsonText_600SemiBold",
                      marginBottom: 4,
                    }}
                    numberOfLines={1}
                  >
                    Last: {recentExpense.title} •{" "}
                    {formatAmount(recentExpense.amount, recentExpense.currency)}
                  </Typography>
                ) : (
                  <View style={{ height: 4 }} />
                )}

                {bal === 0 ? (
                  <Typography
                    style={{
                      fontSize: 14,
                      color: TEXT_SECONDARY,
                      fontFamily: "CrimsonText_600SemiBold",
                    }}
                  >
                    Settled up
                  </Typography>
                ) : (
                  <Typography
                    style={{
                      fontSize: 14,
                      fontFamily: "CrimsonText_700Bold",
                      color: isPositive ? TEXT_SUCCESS : TEXT_DANGER,
                    }}
                  >
                    {isPositive ? "Owes you " : "You owe "}
                    {formatAmount(Math.abs(bal), preferredCurrency.code)}
                  </Typography>
                )}
              </View>
              <icons.ChevronRight size={24} color={TEXT_SECONDARY} strokeWidth={1} />
            </Pressable>
          </SwipeableRow>
        </Animated.View>
      );
    },
    [balances, preferredCurrency.code, router, getRecentExpense]
  );

  return (
    <FocusAwareView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          paddingBottom: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: BG,
        }}
      >
        <Typography
          style={{
            fontFamily: "CrimsonText_700Bold",
            fontSize: 16,
            color: TEXT_SECONDARY,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          Your Network
        </Typography>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/friend/new");
          }}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 0,
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: SEPARATOR,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <icons.Plus size={24} color={TEXT_PRIMARY} strokeWidth={1} />
        </Pressable>
      </View>

      <Animated.View entering={FadeInDown.duration(400)} style={{ flex: 1, backgroundColor: BG }}>
        <View style={{ marginBottom: 16 }}>
          {/* Balances Widget */}
          <View style={{ flexDirection: "row", paddingHorizontal: 24, paddingBottom: 24, gap: 16 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "transparent",
                padding: 16,
                borderWidth: 1,
                borderColor: SEPARATOR,
              }}
            >
              <Typography
                style={{
                  fontSize: 12,
                  color: TEXT_SECONDARY,
                  fontFamily: "CrimsonText_600SemiBold",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                Owed to you
              </Typography>
              <Typography
                style={{ fontSize: 24, color: TEXT_SUCCESS, fontFamily: "CrimsonText_700Bold" }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatAmount(totalOwedToMe, preferredCurrency.code)}
              </Typography>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "transparent",
                padding: 16,
                borderWidth: 1,
                borderColor: SEPARATOR,
              }}
            >
              <Typography
                style={{
                  fontSize: 12,
                  color: TEXT_SECONDARY,
                  fontFamily: "CrimsonText_600SemiBold",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                You owe
              </Typography>
              <Typography
                style={{ fontSize: 24, color: TEXT_DANGER, fontFamily: "CrimsonText_700Bold" }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatAmount(totalIOwe, preferredCurrency.code)}
              </Typography>
            </View>
          </View>

          {/* Search */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: SEPARATOR,
            }}
          >
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search friends..."
              placeholderTextColor={TEXT_SECONDARY}
              style={{
                fontSize: 32,
                fontFamily: "UnicaOne_400Regular",
                color: TEXT_PRIMARY,
                padding: 0,
              }}
            />
            {search.length > 0 && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setSearch("")}
                hitSlop={8}
                style={({ pressed }) => ({
                  position: "absolute",
                  right: 24,
                  top: 8,
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <icons.X size={24} color={TEXT_PRIMARY} strokeWidth={1} />
              </Pressable>
            )}
          </View>

          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 8 }}
          >
            {(["all", "owes_you", "you_owe", "settled"] as const).map((f) => {
              const isSelected = filter === f;
              const label =
                f === "all"
                  ? "All"
                  : f === "owes_you"
                    ? "Owes You"
                    : f === "you_owe"
                      ? "You Owe"
                      : "Settled Up";
              return (
                <Pressable
                  key={f}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setFilter(f);
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    backgroundColor: isSelected ? "#8C7A6B" : "transparent",
                    borderWidth: 1,
                    borderColor: isSelected ? "#8C7A6B" : SEPARATOR,
                  }}
                >
                  <Typography
                    style={{
                      fontSize: 13,
                      fontFamily: "CrimsonText_700Bold",
                      color: isSelected ? "#FFFFFF" : TEXT_PRIMARY,
                    }}
                  >
                    {label}
                  </Typography>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <Animated.FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          itemLayoutAnimation={LinearTransition}
          renderItem={renderItem}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={TEXT_PRIMARY}
              progressViewOffset={10}
            />
          }
        />
      </Animated.View>
    </FocusAwareView>
  );
}
