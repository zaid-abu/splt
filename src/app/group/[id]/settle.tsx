import { Alert, Button, Typography, PressableFeedback } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { JSX } from "react";
import { useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { AppUserAvatar } from "@/components/MemberAvatar";
import { getCurrencySymbol } from "@/components/AmountDisplay";
import * as icons from "lucide-react-native";

interface SettlementSuggestion {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export default function GroupSettleScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getGroup, getGroupBalances, currentUser, preferredCurrency } = useApp();

  const group = getGroup(id ?? "");
  const balances = getGroupBalances(id ?? "");
  const sym = getCurrencySymbol(preferredCurrency.code);

  const suggestions = useMemo(() => {
    if (!group) return [];

    // Separate into debtors (balance < 0) and creditors (balance > 0)
    const debtors: { userId: string; amount: number }[] = [];
    const creditors: { userId: string; amount: number }[] = [];

    for (const [userId, balance] of balances.entries()) {
      // Small epsilon to ignore floating point precision issues
      if (balance < -0.01) debtors.push({ userId, amount: Math.abs(balance) });
      else if (balance > 0.01) creditors.push({ userId, amount: balance });
    }

    // Sort by amount descending to minimize transactions (simple greedy approach)
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const payments: SettlementSuggestion[] = [];

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      const amount = Math.min(debtor.amount, creditor.amount);
      
      // We only care about positive amounts
      if (amount > 0.01) {
        payments.push({
          fromUserId: debtor.userId,
          toUserId: creditor.userId,
          amount,
        });
      }

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    // Filter to only payments involving the current user
    return payments.filter(
      p => p.fromUserId === currentUser.id || p.toUserId === currentUser.id
    );
  }, [balances, group, currentUser.id]);

  if (!group) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F6' }}>
        <View className="flex-1 items-center justify-center p-6">
          <Typography type="h3">Group not found</Typography>
          <Button onPress={() => router.back()} className="mt-4">Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  const handleSettle = (suggestion: SettlementSuggestion) => {
    // Navigate to settle/[id] modal with pre-filled parameters
    const friendId = suggestion.fromUserId === currentUser.id ? suggestion.toUserId : suggestion.fromUserId;
    const direction = suggestion.fromUserId === currentUser.id ? "you" : "them";
    const amountStr = suggestion.amount.toString();
    
    router.push(`/settle/${friendId}?groupId=${group.id}&amount=${amountStr}&direction=${direction}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F6' }} edges={["top", "bottom"]}>
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
            Suggested payments to settle your balance in <Typography type="body" className="font-bold text-foreground">{group.name}</Typography>.
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
                You don't have any outstanding balances in this group.
              </Typography>
            </View>
          ) : (
            <View className="bg-white rounded-[24px] overflow-hidden border border-border">
              {suggestions.map((s, idx) => {
                const isYouPaying = s.fromUserId === currentUser.id;
                const otherUserId = isYouPaying ? s.toUserId : s.fromUserId;
                const otherUser = group.members.find(m => m.userId === otherUserId)?.user;
                
                if (!otherUser) return null;

                return (
                  <View 
                    key={`${s.fromUserId}-${s.toUserId}`} 
                    className={`p-4 ${idx < suggestions.length - 1 ? 'border-b border-border/50' : ''}`}
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
                        className={`font-black ${isYouPaying ? 'text-danger' : 'text-success'}`}
                      >
                        {sym}{s.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
