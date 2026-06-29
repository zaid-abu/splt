/**
 * Dashboard (Home) Screen - Hero UI Redesign
 */
import { PressableFeedback, Typography, Surface, Card, Button } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";

import { PageAnimator } from "@/components/PageAnimator";
import { useApp } from "@/context/AppContext";
import { formatAmount } from "@/components/AmountDisplay";
import { AppUserAvatar } from "@/components/MemberAvatar";

export default function DashboardScreen(): JSX.Element {
  const router = useRouter();
  const { currentUser, groups, activities, getTotalOwedToMe, getTotalIOwe, getUserBalances, preferredCurrency } = useApp();

  const owedToYou = getTotalOwedToMe();
  const youOwe = Math.abs(getTotalIOwe());
  const netBalance = owedToYou - youOwe;
  const sym = preferredCurrency.symbol;

  const balances = getUserBalances();

  // Find top outstanding balances (up to 3)
  const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
  const uniqueUsers = Array.from(new Map(allMembers.map((user) => [user.id, user])).values());

  const outstandingFriends = uniqueUsers
    .filter(u => u.id !== currentUser.id && (balances.get(u.id) || 0) !== 0)
    .map(u => ({ user: u, balance: balances.get(u.id) || 0 }))
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
    .slice(0, 3);

  const recentActivities = activities.slice(0, 3);

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  const firstName = currentUser.name.split(" ")[0];

  return (
    <PageAnimator>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F6' }} edges={["top"]}>
        <StatusBar style="dark" />
        <ScrollView
          style={{ flex: 1, backgroundColor: '#F2F2F6' }}
          contentContainerStyle={{ paddingBottom: 120 }} // padding for floating tab bar
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ────────────────────────────────── */}
          <View className="flex-row items-center justify-between px-6 pt-4 mb-8">
            <View>
              <Typography type="body-sm" className="text-muted-foreground font-medium mb-1">
                {greeting},
              </Typography>
              <Typography type="h2" className="font-black tracking-tight text-foreground text-[28px]">
                {firstName}
              </Typography>
            </View>
            <PressableFeedback onPress={() => router.push("/profile")}>
              <View className="rounded-full p-[2px]">
                <AppUserAvatar user={currentUser} size="md" />
              </View>
            </PressableFeedback>
          </View>

          {/* ── Enhanced Hero Card (Financial Overview) ── */}
          <View className="px-6 mb-8">
            <View
              className="rounded-[32px] shadow-lg"
              style={{
                shadowColor: "#3D2B82",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
              }}
            >
              <View className="bg-primary rounded-[32px] p-6 relative overflow-hidden">
                {/* Decorative background circle */}
                <View className="absolute -top-10 -right-10 w-[150px] h-[150px] rounded-full bg-white opacity-10" />
                <View className="absolute -bottom-10 -left-10 w-[120px] h-[120px] rounded-full bg-white opacity-5" />

                <View className="flex-row justify-between items-start mb-6 z-10">
                  <View>
                    <Typography type="body-sm" className="text-primary-foreground opacity-80 font-medium mb-1">
                      {netBalance >= 0 ? "Net Balance (Owed to You)" : "Net Balance (You Owe)"}
                    </Typography>
                    <Typography type="h1" className="text-primary-foreground font-black text-[40px] tracking-tight">
                      {formatAmount(Math.abs(netBalance || 0), preferredCurrency.code)}
                    </Typography>
                  </View>
                  <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                    <icons.Wallet size={20} color="white" strokeWidth={2.5} />
                  </View>
                </View>

                {/* Breakdown Row */}
                <View className="flex-row items-center gap-6 mb-6 z-10">
                  <View>
                    <View className="flex-row items-center gap-1 mb-1">
                      <Typography type="body-xs" className="text-primary-foreground opacity-70 font-semibold tracking-wider">
                        OWED TO YOU
                      </Typography>
                    </View>
                    <Typography type="h3" className="text-primary-foreground font-bold">
                      {formatAmount(owedToYou, preferredCurrency.code)}
                    </Typography>
                  </View>
                  <View className="h-8 w-[1px] bg-white/20" />
                  <View>
                    <View className="flex-row items-center gap-1 mb-1">
                      <Typography type="body-xs" className="text-primary-foreground opacity-70 font-semibold tracking-wider">
                        YOU OWE
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
                    onPress={() => router.push("/(tabs)/friends")}
                  >
                    <View className="flex-row items-center justify-center gap-2">
                      <icons.Send size={16} className="text-primary" strokeWidth={2.5} />
                      <Typography type="body-sm" className="text-primary font-bold">Settle Up</Typography>
                    </View>
                  </PressableFeedback>
                  <PressableFeedback
                    className="flex-1 border border-white/30 rounded-[16px] h-12 items-center justify-center"
                    onPress={() => router.push("/expense/new")}
                  >
                    <View className="flex-row items-center justify-center gap-2">
                      <icons.Plus size={16} color="white" strokeWidth={2.5} />
                      <Typography type="body-sm" className="text-white font-bold">Add Bill</Typography>
                    </View>
                  </PressableFeedback>
                </View>
              </View>
            </View>
          </View>

          {/* ── Functional Quick Actions Grid ─────────── */}
          <View className="px-6 mb-10">
            <View className="flex-row justify-between">
              {[
                { icon: icons.Users, label: "Groups", route: "/(tabs)/groups", color: "#6B4EFF", bg: "#E0DDF2" },
                { icon: icons.UserSquare2, label: "Friends", route: "/(tabs)/friends", color: "#10B981", bg: "#D1FAE5" },
                { icon: icons.Activity, label: "Activity", route: "/(tabs)/activity", color: "#F59E0B", bg: "#FEF3C7" },
                { icon: icons.UserCircle, label: "Profile", route: "/profile", color: "#EC4899", bg: "#FCE7F3" },
              ].map((action, index) => (
                <PressableFeedback
                  key={index}
                  className="items-center gap-2"
                  onPress={() => action.route && router.push(action.route as any)}
                >
                  <View
                    className="w-16 h-16 rounded-[20px] items-center justify-center"
                    style={{ backgroundColor: action.bg }}
                  >
                    <action.icon size={24} color={action.color} strokeWidth={2.5} />
                  </View>
                  <Typography type="body-sm" className="text-foreground font-semibold text-[12px]">
                    {action.label}
                  </Typography>
                </PressableFeedback>
              ))}
            </View>
          </View>

          {/* ── Outstanding Balances ──────────────────── */}
          <View className="px-6 mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Typography type="h3" className="text-[20px] font-bold text-foreground tracking-tight">
                Needs Attention
              </Typography>
              <PressableFeedback onPress={() => router.push("/(tabs)/friends")}>
                <Typography type="body-sm" className="text-primary font-bold">See all</Typography>
              </PressableFeedback>
            </View>

            <View className="gap-3">
              {outstandingFriends.length > 0 ? (
                outstandingFriends.map((f, idx) => {
                  const isPositive = f.balance > 0;
                  return (
                    <PressableFeedback key={f.user.id} onPress={() => router.push(`/friend/${f.user.id}`)}>
                      <View className="flex-row items-center justify-between p-4 bg-surface rounded-[20px] shadow-sm border border-border">
                        <View className="flex-row items-center gap-4">
                          <AppUserAvatar user={f.user} size="lg" />
                          <View>
                            <Typography type="body" className="font-bold text-foreground">
                              {f.user.name}
                            </Typography>
                            <Typography type="body-sm" className={`font-bold mt-0.5 ${isPositive ? 'text-success' : 'text-danger'}`}>
                              {isPositive ? 'Owes you ' : 'You owe '}
                              {formatAmount(Math.abs(f.balance), preferredCurrency.code)}
                            </Typography>
                          </View>
                        </View>
                        <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center">
                          <icons.ChevronRight size={20} className="text-primary" />
                        </View>
                      </View>
                    </PressableFeedback>
                  );
                })
              ) : (
                <View className="p-6 bg-surface rounded-[24px] items-center justify-center border border-border border-dashed">
                  <View className="w-12 h-12 rounded-full bg-success/10 items-center justify-center mb-3">
                    <icons.CheckCircle2 size={24} className="text-success" />
                  </View>
                  <Typography type="body" className="font-bold text-foreground text-center">
                    You're all caught up!
                  </Typography>
                  <Typography type="body-sm" className="text-muted-foreground text-center mt-1">
                    No outstanding balances with friends.
                  </Typography>
                </View>
              )}
            </View>
          </View>

          {/* ── Recent Activity ───────────────────────── */}
          {recentActivities.length > 0 && (
            <View className="px-6 mb-8">
              <View className="flex-row items-center justify-between mb-4">
                <Typography type="h3" className="text-[20px] font-bold text-foreground tracking-tight">
                  Recent Activity
                </Typography>
                <PressableFeedback onPress={() => router.push("/(tabs)/activity")}>
                  <Typography type="body-sm" className="text-primary font-bold">See all</Typography>
                </PressableFeedback>
              </View>

              <View className="rounded-[24px] shadow-sm">
                <View className="bg-white rounded-[24px] overflow-hidden border border-border">
                  {recentActivities.map((activity, idx) => {
                    const isPositive = activity.type === "settlement" || Math.random() > 0.5; // Visual mock logic from activity.tsx
                    return (
                      <PressableFeedback key={activity.id} onPress={() => router.push("/(tabs)/activity")}>
                        <View className={`flex-row items-center p-4 ${idx < recentActivities.length - 1 ? 'border-b border-border/50' : ''}`}>
                          <View className={`w-12 h-12 rounded-[16px] items-center justify-center mr-4 ${isPositive ? 'bg-success/10' : 'bg-primary/10'}`}>
                            {isPositive ? (
                              <icons.ArrowDownLeft size={24} className="text-success" strokeWidth={2.5} />
                            ) : (
                              <icons.ArrowUpRight size={24} className="text-primary" strokeWidth={2.5} />
                            )}
                          </View>
                          <View className="flex-1 mr-2">
                            <Typography type="body" className="font-bold text-foreground" numberOfLines={1}>
                              {activity.description}
                            </Typography>
                            <Typography type="body-sm" className="text-muted-foreground font-medium" numberOfLines={1}>
                              {activity.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </Typography>
                          </View>

                          <Typography type="body" className={`font-black ${isPositive ? 'text-success' : 'text-foreground'}`}>
                            {isPositive ? "+" : "-"}${Math.abs(activity.amount || 15).toFixed(2)}
                          </Typography>
                        </View>
                      </PressableFeedback>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </PageAnimator>
  );
}
