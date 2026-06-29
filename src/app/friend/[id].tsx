import { Typography, PressableFeedback, Button, Alert } from "heroui-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { JSX } from "react";
import { useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";

import { PageAnimator } from "@/components/PageAnimator";
import { formatAmount } from "@/components/AmountDisplay";
import { ExpenseItem } from "@/components/ExpenseItem";
import { useApp } from "@/context/AppContext";
import { AppUserAvatar } from "@/components/MemberAvatar";

export default function FriendDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { expenses, groups, currentUser, preferredCurrency, getUserBalances } = useApp();

  const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
  const uniqueFriends = Array.from(new Map(allMembers.map((user) => [user.id, user])).values());
  const friend = uniqueFriends.find(f => f.id === id);

  const sharedExpenses = useMemo(() => {
    return expenses.filter(e => {
      const friendInvolved = e.paidBy === id || e.splits.some(s => s.userId === id);
      const currentUserInvolved = e.paidBy === currentUser.id || e.splits.some(s => s.userId === currentUser.id);
      return friendInvolved && currentUserInvolved;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, id, currentUser.id]);

  const balances = getUserBalances();
  const netBalance = balances.get(id ?? "") || 0;
  const isPositive = netBalance > 0;
  const isNegative = netBalance < 0;
  const sym = preferredCurrency.symbol;

  if (!friend) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F6' }}>
        <View className="flex-1 items-center justify-center p-6">
          <Alert status="danger" className="mb-4 rounded-[20px]">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Friend not found</Alert.Title>
              <Alert.Description>We couldn't find this friend.</Alert.Description>
            </Alert.Content>
          </Alert>
          <Button onPress={() => router.back()} className="rounded-full mt-4">Go back</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <PageAnimator>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F6' }} edges={["top", "bottom"]}>
        <StatusBar style="dark" />
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          
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
          <View className="px-6 items-center mt-2 mb-8">
            <View className="mb-4">
              <AppUserAvatar user={friend} size="lg" />
            </View>
            <Typography type="h1" className="font-black text-foreground text-[32px] text-center mb-2">
              {friend.name}
            </Typography>

            <View className={`px-4 py-2 rounded-full mt-2 border ${
              netBalance === 0 ? 'bg-secondary border-border' : 
              isPositive ? 'bg-success/10 border-success/20' : 'bg-danger/10 border-danger/20'
            }`}>
              <Typography type="body-sm" className={`font-bold ${
                netBalance === 0 ? 'text-muted-foreground' : 
                isPositive ? 'text-success' : 'text-danger'
              }`}>
                {netBalance === 0 ? "You are settled up" : 
                 isPositive ? `Owes you ${formatAmount(Math.abs(netBalance), preferredCurrency.code)}` : 
                 `You owe ${formatAmount(Math.abs(netBalance), preferredCurrency.code)}`}
              </Typography>
            </View>
          </View>

          {/* ── Actions ────────────────────────────────── */}
          <View className="px-6 flex-row gap-3 mb-8">
            <View className="flex-1">
              <Button onPress={() => {}} className="rounded-full shadow-sm" variant="outline">
                Settle up
              </Button>
            </View>
            <View className="flex-1">
              <PressableFeedback onPress={() => router.push(`/expense/new`)}>
                <View className="w-full h-[56px] rounded-full items-center justify-center bg-primary flex-row gap-2 shadow-sm">
                  <icons.Plus size={20} color="white" />
                  <Typography type="body" className="font-bold text-white">
                    Expense
                  </Typography>
                </View>
              </PressableFeedback>
            </View>
          </View>

          {/* ── Expenses ───────────────────────────────── */}
          <View className="px-6 mb-4 flex-row items-center justify-between">
            <Typography type="body-xs" className="text-muted-foreground font-bold tracking-widest ml-2 uppercase">
              Shared Expenses ({sharedExpenses.length})
            </Typography>
          </View>

          {sharedExpenses.length === 0 ? (
            <View className="px-6">
              <View className="bg-white rounded-[24px] items-center p-8 shadow-sm border border-border">
                <View className="w-16 h-16 rounded-full bg-secondary items-center justify-center mb-4">
                  <Text style={{ fontSize: 32 }}>💸</Text>
                </View>
                <Typography type="h3" className="font-black text-center mb-1">No shared expenses</Typography>
                <Typography type="body" className="text-muted-foreground text-center">
                  Add an expense to start tracking
                </Typography>
              </View>
            </View>
          ) : (
            <View className="px-4">
              {sharedExpenses.map((expense) => (
                <ExpenseItem
                  key={expense.id}
                  expense={expense}
                  currentUserId={currentUser.id}
                  onPress={() => router.push(`/expense/${expense.id}`)}
                />
              ))}
            </View>
          )}

          <View className="h-12" />
        </ScrollView>
      </SafeAreaView>
    </PageAnimator>
  );
}
