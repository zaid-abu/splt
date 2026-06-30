import { PressableFeedback, Typography, Skeleton } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { FocusAwareView } from "@/components/PageAnimator";
import * as icons from "lucide-react-native";

import { useApp } from "@/context/AppContext";
import { AppUserAvatar } from "@/components/MemberAvatar";
import { formatAmount } from "@/components/AmountDisplay";
import { ActivityItem } from "@/components/ActivityItem";
import type { Activity } from "@/types";

export default function ActivityScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activities, currentUser, getTotalOwedToMe, getTotalIOwe, preferredCurrency, isAppLoading } = useApp();

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const owedToMe = getTotalOwedToMe();
  const iOwe = Math.abs(getTotalIOwe());

  // Sort activities by date descending
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [activities]);

  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) return sortedActivities;
    return sortedActivities.filter((a) =>
      a.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedActivities, searchQuery]);

  // Group activities by month-year
  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    filteredActivities.forEach((activity) => {
      const date = activity.date;
      const monthYear = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(activity);
    });
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [filteredActivities]);

  return (
    <FocusAwareView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F6' }} edges={["top"]}>
        <StatusBar style="dark" />
        
        {/* ── Sticky Blurred Header ───────────────────── */}
        <BlurView 
          intensity={100} 
          tint="light" 
          style={{ 
            paddingTop: insets.top + 16, 
            paddingBottom: 16, 
            paddingHorizontal: 24,
            position: 'absolute',
            top: 0, left: 0, right: 0,
            zIndex: 50,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(242, 242, 246, 0.90)',
          }}
        >
          <Typography type="h1" className="font-black tracking-tight text-foreground text-[32px]">
            Activity
          </Typography>
          <PressableFeedback onPress={() => router.push("/profile")}>
            <View className="border-2 border-transparent rounded-full">
              <AppUserAvatar user={currentUser} size="md" />
            </View>
          </PressableFeedback>
        </BlurView>

        <ScrollView
          className="flex-1 bg-background"
          contentContainerStyle={{ paddingTop: insets.top + 90, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Stats Row ─────────────────────────────── */}
          <FocusAwareView delay={100} className="px-6 mb-8">
            <View className="flex-row gap-4">
              <View className="flex-1 bg-white rounded-[24px] p-5 border border-border">
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

              <View className="flex-1 bg-white rounded-[24px] p-5 border border-border">
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
          </FocusAwareView>

          {/* ── Transactions Search ──────────────────────────── */}
          <FocusAwareView delay={200} className="px-6 mb-6 h-[44px] justify-center">
            {isSearching ? (
              <View className="flex-row items-center bg-white h-full rounded-[16px] px-4 border border-border">
                <icons.Search size={18} className="text-muted-foreground mr-2" />
                <TextInput
                  autoFocus
                  placeholder="Search activity..."
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
                  Timeline
                </Typography>
                <PressableFeedback onPress={() => setIsSearching(true)}>
                  <icons.Search size={20} className="text-muted-foreground mr-2" />
                </PressableFeedback>
              </View>
            )}
          </FocusAwareView>

          {/* ── Timeline List ─────────────────────────────── */}
          <View className="px-6 mb-8 gap-6">
            {isAppLoading ? (
              <View>
                <Skeleton className="w-24 h-4 rounded-full ml-2 mb-3" />
                <View className="bg-white rounded-[24px] overflow-hidden border border-border">
                  <View className="p-4 flex-row items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-[16px]" />
                    <View className="flex-1 gap-2">
                      <Skeleton className="w-3/4 h-4 rounded-full" />
                      <Skeleton className="w-1/3 h-3 rounded-full" />
                    </View>
                  </View>
                  <View className="p-4 flex-row items-center gap-4 border-t border-border/50">
                    <Skeleton className="w-12 h-12 rounded-[16px]" />
                    <View className="flex-1 gap-2">
                      <Skeleton className="w-1/2 h-4 rounded-full" />
                      <Skeleton className="w-1/4 h-3 rounded-full" />
                    </View>
                  </View>
                </View>
              </View>
            ) : groupedActivities.length === 0 ? (
              <View className="p-8 bg-white rounded-[24px] items-center justify-center border border-border border-dashed mt-4">
                <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center mb-3">
                  <icons.Activity size={24} className="text-muted-foreground" />
                </View>
                <Typography type="body" className="font-bold text-foreground">
                  No activity found
                </Typography>
                <Typography type="body-sm" className="text-muted-foreground text-center mt-1">
                  {searchQuery ? "Try a different search term." : "You have no recent activity."}
                </Typography>
              </View>
            ) : (
              groupedActivities.map((group, groupIdx) => (
                <View key={group.title}>
                  <Typography type="body-xs" className="text-muted-foreground font-bold tracking-widest ml-2 uppercase mb-3">
                    {group.title}
                  </Typography>
                  <View className="bg-white rounded-[24px] overflow-hidden border border-border">
                    {group.data.map((activity, idx) => (
                      <ActivityItem 
                        key={activity.id} 
                        activity={activity} 
                        index={groupIdx * 5 + idx} 
                        isLast={idx === group.data.length - 1} 
                      />
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </FocusAwareView>
  );
}
