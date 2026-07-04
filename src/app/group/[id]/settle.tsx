import { Button, Typography, PressableFeedback } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { GroupSettleRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { AppUserAvatar } from "@/components/MemberAvatar";
import { getCurrencySymbol } from "@/components/AmountDisplay";
import * as icons from "lucide-react-native";

interface SettlementSuggestion {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export default function GroupSettleScreen(): JSX.Element {
  const { id } = useLocalSearchParams<GroupSettleRouteParams>();
  const router = useRouter();
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
      <SafeAreaView style={{ flex: 1 }} className="bg-background">
        <View className="flex-1 items-center justify-center p-6">
          <Typography type="h3">Group not found</Typography>
          <Button onPress={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const handleSettle = (suggestion: SettlementSuggestion) => {
    // Navigate to settle/[id] modal with pre-filled parameters
    const friendId =
      suggestion.fromUserId === currentUser.id ? suggestion.toUserId : suggestion.fromUserId;
    const direction = suggestion.fromUserId === currentUser.id ? "you" : "them";
    const amountStr = suggestion.amount.toString();

    router.push(
      `/settle/${friendId}?groupId=${group.id}&amount=${amountStr}&direction=${direction}`
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 pt-4 mb-8">
          <PressableFeedback onPress={() => router.back()}>
            <View className="w-10 h-10 rounded-full bg-white items-center justify-center border border-border mr-4">
              <icons.ChevronLeft size={24} color="#1E1A34" />
            </View>
          </PressableFeedback>
          <Typography type="h3" className="font-black tracking-tight text-[28px]">
            Settle Up
          </Typography>
        </View>

        <View className="px-6 mb-8">
          <Typography type="body" className="text-muted-foreground mb-4">
            Suggested payments to settle your balance in{" "}
            <Typography type="body" className="font-bold text-foreground">
              {group.name}
            </Typography>
            .
          </Typography>

          {suggestions.length === 0 ? (
            <View className="bg-white rounded-[24px] items-center p-8 border border-border mt-4">
              <View className="w-16 h-16 rounded-full bg-success/10 items-center justify-center mb-4">
                <icons.Check size={32} className="text-success" strokeWidth={3} />
              </View>
              <Typography type="h3" className="font-black text-center mb-2">
                All Settled Up!
              </Typography>
              <Typography type="body" className="text-muted-foreground text-center">
                You don&apos;t have any outstanding balances in this group.
              </Typography>
            </View>
          ) : (
            <View className="bg-white rounded-[24px] overflow-hidden border border-border">
              {suggestions.map((s, idx) => {
                const isYouPaying = s.fromUserId === currentUser.id;
                const otherUserId = isYouPaying ? s.toUserId : s.fromUserId;
                const otherUser = group.members.find((m) => m.userId === otherUserId)?.user;

                if (!otherUser) return null;

                return (
                  <View
                    key={`${s.fromUserId}-${s.toUserId}`}
                    className={`p-4 ${idx < suggestions.length - 1 ? "border-b border-border/50" : ""}`}
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center gap-3">
                        <AppUserAvatar user={otherUser} size="md" />
                        <View>
                          <Typography type="body" className="font-bold text-foreground">
                            {isYouPaying ? "You owe" : "Owes you"}
                          </Typography>
                          <Typography type="body-sm" className="text-muted-foreground">
                            {otherUser.name}
                          </Typography>
                        </View>
                      </View>
                      <Typography
                        type="h3"
                        className={`font-black ${isYouPaying ? "text-danger" : "text-success"}`}
                      >
                        {sym}
                        {s.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Typography>
                    </View>
                    <Button
                      onPress={() => handleSettle(s)}
                      variant={isYouPaying ? undefined : "outline"}
                      className="w-full"
                    >
                      {isYouPaying ? "Pay Now" : "Record Payment"}
                    </Button>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
