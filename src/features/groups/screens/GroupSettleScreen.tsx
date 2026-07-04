import { Typography } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { GroupSettleRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";

import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { getCurrencySymbol } from "@/components/ui/AmountDisplay";
import * as icons from "lucide-react-native";

const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const TEXT_SUCCESS = "#4CAF82";
const SEPARATOR = "#E8E4DF";

interface SettlementSuggestion {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export default function GroupSettleScreen(): JSX.Element {
  const { id } = useLocalSearchParams<GroupSettleRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: allExpenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);

  const group = groups.find((g) => g.id === id);
  const expenses = allExpenses.filter((e) => e.groupId === id);

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const sym = group ? getCurrencySymbol(group.currency) : "$";

  const suggestions = (() => {
    if (!group) return [];

    const pairwiseDebts = group?.simplifyDebts
      ? balancesUtil.getSimplifiedDebts(
          group.id,
          expenses,
          settlements,
          group,
          preferredCurrency,
          convertCurrency
        )
      : balancesUtil.getExactPairwiseDebts(
          group?.id ?? "",
          expenses,
          settlements,
          group,
          preferredCurrency,
          convertCurrency
        );

    return pairwiseDebts.filter(
      (p) => p.fromUserId === currentUser.id || p.toUserId === currentUser.id
    );
  })();

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center" }}>
        <Typography style={{ fontSize: 18, color: TEXT_PRIMARY }}>Group not found</Typography>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16, padding: 12, backgroundColor: "#8C7A6B", borderRadius: 12 }}>
          <Typography style={{ color: "#FFF", fontWeight: "700" }}>Go Back</Typography>
        </Pressable>
      </View>
    );
  }

  const handleSettle = (suggestion: SettlementSuggestion) => {
    const friendId =
      suggestion.fromUserId === currentUser.id ? suggestion.toUserId : suggestion.fromUserId;
    const direction = suggestion.fromUserId === currentUser.id ? "you" : "them";
    const amountStr = suggestion.amount.toString();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to settle/[id] modal with pre-filled parameters
    router.push(
      `/settle/${friendId}?groupId=${group.id}&amount=${amountStr}&direction=${direction}`
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
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
        <Typography style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 28, color: TEXT_PRIMARY, lineHeight: 36 }}>
          Settle Up
        </Typography>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <Typography style={{ fontSize: 16, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium", lineHeight: 24, marginBottom: 32 }}>
            Suggested payments to settle your balance in{" "}
            <Typography style={{ fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
              {group.name}
            </Typography>.
          </Typography>

          {suggestions.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 32, borderTopWidth: 1, borderBottomWidth: 1, borderColor: SEPARATOR }}>
              <View style={{ width: 64, height: 64, borderRadius: 0, backgroundColor: "transparent", borderWidth: 1, borderColor: SEPARATOR, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <icons.Check size={32} color={TEXT_PRIMARY} strokeWidth={1.5} />
              </View>
              <Typography style={{ fontSize: 24, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold", marginBottom: 8 }}>
                All Settled Up!
              </Typography>
              <Typography style={{ fontSize: 16, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium", textAlign: "center", lineHeight: 24 }}>
                You don't have any outstanding balances in this group.
              </Typography>
            </View>
          ) : (
            <View>
              {suggestions.map((s, idx) => {
                const isYouPaying = s.fromUserId === currentUser.id;
                const otherUserId = isYouPaying ? s.toUserId : s.fromUserId;
                const otherUser = group.members.find((m) => m.userId === otherUserId)?.user;

                if (!otherUser) return null;

                return (
                  <View
                    key={`${s.fromUserId}-${s.toUserId}`}
                    style={{ 
                      paddingVertical: 24, 
                      borderBottomWidth: idx === suggestions.length - 1 ? 0 : 1, 
                      borderBottomColor: SEPARATOR 
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                        <AppUserAvatar user={otherUser} size="md" />
                        <View>
                          <Typography style={{ fontSize: 13, fontWeight: "700", color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_700Bold", textTransform: "uppercase", letterSpacing: 1.2 }}>
                            {isYouPaying ? "You owe" : "Owes you"}
                          </Typography>
                          <Typography style={{ fontSize: 18, color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold", marginTop: 4 }}>
                            {otherUser.name.split(" ")[0]}
                          </Typography>
                        </View>
                      </View>
                      <Typography style={{ fontSize: 24, fontWeight: "800", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_800ExtraBold" }}>
                        {sym}{s.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </View>
                    
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleSettle(s)}
                      style={({ pressed }) => ({
                        height: 56,
                        borderRadius: 0,
                        backgroundColor: isYouPaying ? TEXT_PRIMARY : "transparent",
                        borderWidth: 1,
                        borderColor: isYouPaying ? TEXT_PRIMARY : SEPARATOR,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Typography style={{ fontSize: 16, fontWeight: "700", color: isYouPaying ? "#FFFFFF" : TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                        {isYouPaying ? "Pay Now" : "Record Payment"}
                      </Typography>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
