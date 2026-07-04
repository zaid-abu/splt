import { Alert, Typography } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { FriendRouteParams } from "@/types/navigation";
import Animated, {
  FadeInDown,
} from "react-native-reanimated";
import type { JSX } from "react";
import { useMemo, useRef, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { View, ScrollView, Pressable, Alert as RNAlert } from "react-native";
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

// ─── Design Tokens (Edge-to-Edge) ───
const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const TEXT_DANGER = "#000000";
const TEXT_SUCCESS = "#4CAF82";
const SEPARATOR = "#E8E4DF";

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

function SectionLabel({ children }: { children: string }): JSX.Element {
  return (
    <Typography
      style={{
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.4,
        color: TEXT_SECONDARY,
        fontFamily: "PlusJakartaSans_700Bold",
        textTransform: "uppercase",
        marginBottom: 16,
      }}
    >
      {children}
    </Typography>
  );
}

export default function FriendDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<FriendRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  
  const optionsSheetRef = useRef<BottomSheetModal>(null);
  
  const handleOpenOptions = useCallback(() => {
    optionsSheetRef.current?.present();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.4} />
    ),
    []
  );
  
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const isAppLoading = useUIStore((s) => s.isAppLoading);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);

  const balances = balancesUtil.getUserBalances(
    currentUser.id,
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
  }, [expenses, settlements, id, currentUser.id]);

  const netBalance = balances.get(id ?? "") || 0;
  const isPositive = netBalance > 0;
  const isSettled = netBalance === 0;

  const categorySpending = useMemo(() => {
    const totals: Record<string, number> = {};
    sharedActivities.forEach((activity) => {
      if (activity.type === "expense" && activity.expense) {
        const cat = activity.expense.category || "other";
        const amount = convertCurrency(activity.expense.amount, activity.currency || preferredCurrency.code, preferredCurrency.code);
        totals[cat] = (totals[cat] || 0) + amount;
      }
    });
    return Object.entries(totals)
      .filter(([, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1]) // highest first
      .map(([cat, amount]) => ({
        cat,
        amount,
        colors: CATEGORY_COLORS[cat] || CATEGORY_COLORS.other,
        iconName: CATEGORY_ICONS[cat] || CATEGORY_ICONS.other,
      }));
  }, [sharedActivities, preferredCurrency.code, convertCurrency]);

  if (!friend) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Alert status="danger" style={{ borderRadius: 0, marginBottom: 16 }}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Friend not found</Alert.Title>
              <Alert.Description>We couldn't find this friend.</Alert.Description>
            </Alert.Content>
          </Alert>
          <Pressable onPress={() => router.back()} style={{ padding: 12, backgroundColor: "#8C7A6B", borderRadius: 0 }}>
             <Typography style={{ color: "#FFF", fontWeight: "700" }}>Go back</Typography>
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
            borderRadius: 0,
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: SEPARATOR,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <icons.ArrowLeft size={20} color={TEXT_PRIMARY} strokeWidth={1.5} />
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, flex: 1, marginHorizontal: 16 }}>
          <AppUserAvatar user={friend} size="sm" />
          <Typography
            numberOfLines={1}
            style={{
              fontFamily: "DMSerifDisplay_400Regular",
              fontSize: 28,
              color: TEXT_PRIMARY,
              lineHeight: 36,
              flexShrink: 1,
              textAlign: "center",
            }}
          >
            {friend.name}
          </Typography>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handleOpenOptions}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 0,
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: SEPARATOR,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <icons.MoreVertical size={20} color={TEXT_PRIMARY} strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Balance Hero ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).springify()} style={{ paddingHorizontal: 24, marginBottom: 40, alignItems: "center" }}>
           <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 0,
                backgroundColor: isSettled ? "transparent" : (isPositive ? "#E6F4EA" : "#FCE8E8"),
                borderWidth: isSettled ? 1 : 0,
                borderColor: SEPARATOR,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              {isSettled ? (
                <icons.Check size={32} color={TEXT_PRIMARY} strokeWidth={1.5} />
              ) : isPositive ? (
                <icons.ArrowDownLeft size={32} color={TEXT_SUCCESS} strokeWidth={2} />
              ) : (
                <icons.ArrowUpRight size={32} color={TEXT_DANGER} strokeWidth={2} />
              )}
            </View>
            
            <Typography style={{ fontSize: 16, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold", marginBottom: 8 }}>
               {isSettled ? "All settled up!" : (isPositive ? "Owes you" : "You owe")}
            </Typography>
            
            {!isSettled && (
              <Typography style={{ fontSize: 36, fontWeight: "800", color: isPositive ? TEXT_SUCCESS : TEXT_DANGER, fontFamily: "PlusJakartaSans_800ExtraBold" }}>
                {formatAmount(Math.abs(netBalance), preferredCurrency.code)}
              </Typography>
            )}

            {isPositive && !isSettled && (
               <Pressable 
                  onPress={() => RNAlert.alert("Reminder Sent", `We've sent a friendly reminder to ${friend.name.split(" ")[0]}.`)}
                  style={({pressed}) => ({ marginTop: 16, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 0, borderWidth: 1, borderColor: TEXT_SUCCESS, opacity: pressed ? 0.5 : 1 })}
               >
                  <Typography style={{ fontSize: 13, fontWeight: "700", color: TEXT_SUCCESS, fontFamily: "PlusJakartaSans_700Bold" }}>Send Reminder</Typography>
               </Pressable>
            )}
        </Animated.View>

        {/* ── Category Breakdown ─────────────────────────────────────── */}
        {categorySpending.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(25).springify()} style={{ marginBottom: 40 }}>
            <View style={{ paddingHorizontal: 24 }}>
              <SectionLabel>Spending Together</SectionLabel>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
              {categorySpending.map(({ cat, amount, colors, iconName }) => {
                const IconComp = (icons as any)[iconName] || icons.Package;
                return (
                  <View key={cat} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "transparent", borderWidth: 1, borderColor: SEPARATOR, padding: 12, borderRadius: 0, minWidth: 140 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 0, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                      <IconComp size={18} color={colors.icon} strokeWidth={1.5} />
                    </View>
                    <View>
                      <Typography style={{ fontSize: 12, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium", textTransform: "capitalize", marginBottom: 2 }}>{cat}</Typography>
                      <Typography style={{ fontSize: 14, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>{formatAmount(amount, preferredCurrency.code)}</Typography>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* ── Activities ─────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(50).springify()} style={{ paddingHorizontal: 24, marginBottom: 40 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <SectionLabel>Shared Activity</SectionLabel>
            <Typography style={{ fontSize: 13, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold", marginBottom: 16 }}>
              Total: {sharedActivities.length}
            </Typography>
          </View>
          
          <View>
            {sharedActivities.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: "center", borderTopWidth: 1, borderBottomWidth: 1, borderColor: SEPARATOR }}>
                <View style={{ width: 56, height: 56, borderRadius: 0, backgroundColor: "transparent", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 1, borderColor: SEPARATOR }}>
                  <icons.Receipt size={24} color={TEXT_PRIMARY} strokeWidth={1.5} />
                </View>
                <Typography style={{ fontSize: 16, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold", marginBottom: 8 }}>
                  No shared activity
                </Typography>
                <Typography style={{ fontSize: 14, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium" }}>
                  Add an expense to start tracking
                </Typography>
              </View>
            ) : (
              <View style={{ borderTopWidth: 1, borderColor: SEPARATOR }}>
                {sharedActivities.map((activity, idx) => (
                  <View key={activity.id} style={{ borderBottomWidth: 1, borderBottomColor: SEPARATOR }}>
                    <ActivityItem
                      activity={activity}
                      index={idx}
                      isLast={true} // Force ActivityItem to not render its own bottom border or padding if possible, wait ActivityItem has padding. We just wrap it.
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── Custom Options Bottom Sheet ──────────────────────────────── */}
      <BottomSheetModal
        ref={optionsSheetRef}
        index={0}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: BG, borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: TEXT_SECONDARY, width: 40 }}
      >
        <BottomSheetView style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 24 }}>
          <Typography style={{ fontSize: 20, fontFamily: "DMSerifDisplay_400Regular", color: TEXT_PRIMARY, marginBottom: 24 }}>
            Manage Friendship
          </Typography>
          
          <Pressable
             onPress={() => {
                optionsSheetRef.current?.dismiss();
                RNAlert.alert("Exporting", "Your history is being exported.");
             }}
             style={({pressed}) => ({ flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: SEPARATOR, opacity: pressed ? 0.5 : 1 })}
          >
             <icons.Download size={20} color={TEXT_PRIMARY} strokeWidth={1.5} style={{ marginRight: 12 }} />
             <Typography style={{ fontSize: 16, fontFamily: "PlusJakartaSans_500Medium", color: TEXT_PRIMARY }}>Export History</Typography>
          </Pressable>

          <Pressable
             onPress={() => {
                optionsSheetRef.current?.dismiss();
                RNAlert.alert("Unfriend", "This feature is coming soon.");
             }}
             style={({pressed}) => ({ flexDirection: "row", alignItems: "center", paddingVertical: 16, opacity: pressed ? 0.5 : 1 })}
          >
             <icons.UserMinus size={20} color={"#E02424"} strokeWidth={1.5} style={{ marginRight: 12 }} />
             <Typography style={{ fontSize: 16, fontFamily: "PlusJakartaSans_500Medium", color: "#E02424" }}>Unfriend</Typography>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>

      {/* ── Bottom Action Bar ──────────────────────────────────────────── */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
          flexDirection: "row",
          gap: 16,
          backgroundColor: BG,
          borderTopWidth: 1,
          borderTopColor: SEPARATOR,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/settle/${id}`)}
          disabled={isSettled}
          style={({ pressed }) => ({
            flex: 1,
            height: 56,
            borderRadius: 0,
            backgroundColor: isSettled ? "#F5F0EB" : "transparent",
            borderWidth: 1,
            borderColor: SEPARATOR,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 12,
            opacity: isSettled ? 0.3 : pressed ? 0.5 : 1,
          })}
        >
          <icons.Send size={20} color={isSettled ? TEXT_SECONDARY : TEXT_PRIMARY} strokeWidth={1.5} />
          <Typography style={{ fontSize: 16, fontWeight: "700", color: isSettled ? TEXT_SECONDARY : TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
            Settle Up
          </Typography>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/expense/new?friendId=${id}`)}
          style={({ pressed }) => ({
            flex: 1,
            height: 56,
            borderRadius: 0,
            backgroundColor: "#8C7A6B",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 12,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <icons.Plus size={20} color="#FFFFFF" strokeWidth={2} />
          <Typography style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF", fontFamily: "PlusJakartaSans_700Bold" }}>
            Add Expense
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}
