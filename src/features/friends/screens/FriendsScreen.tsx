import { Typography, Skeleton } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useMemo, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { View, RefreshControl, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";

import * as Haptics from "expo-haptics";

import { SwipeableRow } from "@/components/layout/SwipeableRow";
import { FlashList } from "@shopify/flash-list";
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

  const balances = balancesUtil.getUserBalances(
    currentUser.id,
    undefined,
    groups,
    expenses,
    settlements,
    preferredCurrency,
    convertCurrency
  );

  const uniqueFriends = friends;

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

  const ListHeaderComponent = useCallback(
    () => (
      <View style={{ paddingHorizontal: 24, paddingBottom: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: SEPARATOR }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search friends..."
          placeholderTextColor={TEXT_SECONDARY}
          style={{ fontSize: 32, fontFamily: "DMSerifDisplay_400Regular", color: TEXT_PRIMARY, padding: 0 }}
        />
        {search.length > 0 && (
          <Pressable 
            accessibilityRole="button" 
            onPress={() => setSearch("")} 
            hitSlop={8} 
            style={({ pressed }) => ({ position: "absolute", right: 24, top: 8, opacity: pressed ? 0.5 : 1 })}
          >
            <icons.X size={24} color={TEXT_PRIMARY} strokeWidth={1} />
          </Pressable>
        )}
      </View>
    ),
    [search]
  );

  const ListEmptyComponent = useCallback(
    () => (
      <View style={{ paddingHorizontal: 24, alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
        {isLoading ? (
          <View style={{ gap: 32, width: "100%" }}>
            <Skeleton className="w-full h-16 rounded-none bg-[#E8E4DF]" />
            <Skeleton className="w-full h-16 rounded-none bg-[#E8E4DF]" />
            <Skeleton className="w-full h-16 rounded-none bg-[#E8E4DF]" />
          </View>
        ) : (
          <View style={{ alignItems: "center" }}>
            <View style={{ width: 120, height: 120, marginBottom: 24, borderRadius: 0, backgroundColor: "transparent", borderWidth: 1, borderColor: SEPARATOR, alignItems: "center", justifyContent: "center" }}>
              <icons.Users size={48} color={TEXT_PRIMARY} strokeWidth={1} />
            </View>
            <Typography style={{ fontSize: 24, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold", textAlign: "center", marginBottom: 8 }}>
              No friends found
            </Typography>
            <Typography style={{ fontSize: 16, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium", textAlign: "center", marginBottom: 32, lineHeight: 24 }}>
              {search
                ? "Try a different search term"
                : "Add an expense with someone to see them here."}
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
                <Typography style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700", fontFamily: "PlusJakartaSans_700Bold" }}>
                  Add a friend
                </Typography>
              </Pressable>
            )}
          </View>
        )}
      </View>
    ),
    [isLoading, search, router]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: User; index: number }) => {
      const bal = balances.get(item.id) || 0;
      const isPositive = bal > 0;
      const isNegative = bal < 0;

      return (
        <Animated.View layout={LinearTransition}>
          <SwipeableRow
            onDelete={() => { /* TODO: implement delete */ }}
            onSettle={bal !== 0 ? () => { /* TODO: implement settle */ } : undefined}
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
                paddingVertical: 24,
                paddingHorizontal: 24,
                backgroundColor: BG,
                borderBottomWidth: 1,
                borderBottomColor: SEPARATOR,
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <AppUserAvatar user={item} size="lg" />
              <View style={{ flex: 1, marginLeft: 20 }}>
                <Typography style={{ fontSize: 24, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold", marginBottom: 4 }}>
                  {item.name}
                </Typography>
                {bal === 0 ? (
                  <Typography style={{ fontSize: 16, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium" }}>
                    Settled up
                  </Typography>
                ) : (
                  <Typography
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      fontFamily: "PlusJakartaSans_700Bold",
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
    [balances, preferredCurrency.code, router]
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
        <Typography style={{ fontFamily: "PlusJakartaSans_800ExtraBold", fontSize: 16, color: TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 2 }}>
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

      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{ flex: 1, backgroundColor: BG }}
      >
        <FlashList
          data={filtered}
          renderItem={renderItem}
          ListHeaderComponent={ListHeaderComponent}
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
