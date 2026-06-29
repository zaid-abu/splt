import { PressableFeedback, Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as icons from "lucide-react-native";

import { useApp } from "@/context/AppContext";
import { PageAnimator } from "@/components/PageAnimator";
import { AppUserAvatar } from "@/components/MemberAvatar";
import { formatAmount } from "@/components/AmountDisplay";

export default function ActivityScreen(): JSX.Element {
  const router = useRouter();
  const { activities, currentUser, getTotalOwedToMe, getTotalIOwe, preferredCurrency } = useApp();

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const owedToMe = getTotalOwedToMe();
  const iOwe = Math.abs(getTotalIOwe());

  const chartData = [
    { label: "Jan", value: 25, opacity: 0.2 },
    { label: "Feb", value: 40, opacity: 0.2 },
    { label: "Mar", value: 50, opacity: 0.2 },
    { label: "Apr", value: 35, opacity: 0.2 },
    { label: "May", value: 65, opacity: 1, highlight: "$ 7.200" },
    { label: "Jun", value: 30, opacity: 0.2 },
  ];

  const filteredActivities = activities.filter((a) =>
    a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageAnimator>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F6' }} edges={["top"]}>
        <StatusBar style="dark" />
        <ScrollView
          className="flex-1 bg-background"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ────────────────────────────────── */}
          <View className="flex-row items-center justify-between px-6 pt-6 mb-8">
            <Typography type="h1" className="font-black tracking-tight text-foreground text-[32px]">
              Activity
            </Typography>
            <PressableFeedback onPress={() => router.push("/profile")}>
              <View className="border-2 border-transparent rounded-full shadow-sm">
                <AppUserAvatar user={currentUser} size="md" />
              </View>
            </PressableFeedback>
          </View>

          {/* ── Stats Row ─────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(100).springify()} className="px-6 mb-6">
            <View className="flex-row gap-4">
              <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-border">
                <View className="w-10 h-10 rounded-full bg-success/10 items-center justify-center mb-3">
                  <icons.ArrowDownLeft size={20} className="text-success" />
                </View>
                <Typography type="body-xs" className="text-muted-foreground font-semibold tracking-wider mb-1">
                  OWED TO YOU
                </Typography>
                <Typography type="h2" className="font-black text-foreground text-[22px]">
                  {formatAmount(owedToMe, preferredCurrency.code)}
                </Typography>
              </View>

              <View className="flex-1 bg-white rounded-[24px] p-5 shadow-sm border border-border">
                <View className="w-10 h-10 rounded-full bg-danger/10 items-center justify-center mb-3">
                  <icons.ArrowUpRight size={20} className="text-danger" />
                </View>
                <Typography type="body-xs" className="text-muted-foreground font-semibold tracking-wider mb-1">
                  YOU OWE
                </Typography>
                <Typography type="h2" className="font-black text-foreground text-[22px]">
                  {formatAmount(iOwe, preferredCurrency.code)}
                </Typography>
              </View>
            </View>
          </Animated.View>

          {/* ── Chart ─────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(300).springify()} className="px-6 mb-10 mt-4">
            <View className="h-[220px] flex-row justify-between bg-white rounded-[24px] p-5 shadow-sm border border-border">
              {chartData.map((data, i) => (
                <View key={i} className="items-center flex-1 h-full">
                  <View className="flex-1 justify-end items-center w-full relative">
                    {data.highlight && (
                      <View 
                        className="bg-foreground py-1.5 rounded-[8px] absolute z-10 shadow-sm items-center justify-center"
                        style={{ width: 64, left: '50%', marginLeft: -32, bottom: `${data.value}%`, marginBottom: 8 }}
                      >
                        <Typography type="body-xs" className="text-white font-bold" numberOfLines={1}>{data.highlight}</Typography>
                      </View>
                    )}
                    <View 
                      className="bg-primary w-[32px] rounded-t-[12px] rounded-b-[4px]"
                      style={{
                        height: `${data.value}%`,
                        opacity: data.opacity,
                      }} 
                    />
                  </View>
                  <Typography type="body-xs" className="mt-3 text-muted-foreground font-bold">
                    {data.label}
                  </Typography>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── Transactions ──────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(400).springify()} className="px-6 mb-4 h-[44px] justify-center">
            {isSearching ? (
              <View className="flex-row items-center bg-white h-full rounded-[16px] px-4 border border-border">
                <icons.Search size={18} className="text-muted-foreground mr-2" />
                <TextInput
                  autoFocus
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 font-medium text-foreground text-[14px]"
                  placeholderTextColor="#8A8798"
                />
                <PressableFeedback onPress={() => { setIsSearching(false); setSearchQuery(""); }}>
                  <icons.X size={18} className="text-muted-foreground ml-2" />
                </PressableFeedback>
              </View>
            ) : (
              <View className="flex-row items-center justify-between">
                <Typography type="body-xs" className="text-muted-foreground font-bold tracking-widest ml-2 uppercase">
                  Recent Transactions
                </Typography>
                <PressableFeedback onPress={() => setIsSearching(true)}>
                  <icons.Search size={20} className="text-muted-foreground mr-2" />
                </PressableFeedback>
              </View>
            )}
          </Animated.View>

          {/* Transactions List */}
          <View className="px-6 mb-8">
            <View className="rounded-[24px] shadow-sm">
              <View className="bg-white rounded-[24px] overflow-hidden border border-border">
              {filteredActivities.length === 0 ? (
                <View className="p-8 items-center justify-center">
                  <Typography type="body" className="text-muted-foreground">
                    {searchQuery ? "No matching transactions found" : "No recent activity"}
                  </Typography>
                </View>
              ) : (
                filteredActivities.slice(0, 10).map((activity, idx) => {
                  const isPositive = activity.type === "settlement" || Math.random() > 0.5; // Mocking visual
                  return (
                    <Animated.View key={activity.id} entering={FadeInDown.delay(500 + idx * 50).springify()}>
                      <PressableFeedback>
                        <View className={`flex-row items-center p-4 ${idx < filteredActivities.length - 1 ? 'border-b border-border/50' : ''}`}>
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
                    </Animated.View>
                  );
                })
              )}
            </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </PageAnimator>
  );
}
