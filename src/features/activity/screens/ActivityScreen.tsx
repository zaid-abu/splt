import { Typography, Skeleton, Button, ListGroup, PressableFeedback } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useMemo, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { View, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import * as icons from "lucide-react-native";
import { FlashList } from "@shopify/flash-list";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserActivities } from "@/features/activity/queries/useActivities";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";

import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { ActivityItem } from "@/features/activity/components/ActivityItem";
import type { Activity } from "@/types";

type ListItem =
  | { type: "header"; title: string }
  | { type: "item"; activity: Activity; isFirst: boolean; isLast: boolean };

export default function ActivityScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { data: activities = [], isLoading: isLoadingActivities } = useUserActivities(
    currentUser?.id
  );
  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);
  const isAppLoading = useUIStore((s) => s.isAppLoading);

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const owedToYou = balancesUtil.getTotalOwedToMe(
    currentUser.id,
    groups,
    expenses,
    settlements,
    preferredCurrency,
    convertCurrency
  );
  const youOwe = Math.abs(
    balancesUtil.getTotalIOwe(
      currentUser.id,
      groups,
      expenses,
      settlements,
      preferredCurrency,
      convertCurrency
    )
  );
  const netBalance = owedToYou - youOwe;

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

  const listData = useMemo(() => {
    const result: ListItem[] = [];
    groupedActivities.forEach((group) => {
      result.push({ type: "header", title: group.title });
      group.data.forEach((item, index) => {
        result.push({
          type: "item",
          activity: item,
          isFirst: index === 0,
          isLast: index === group.data.length - 1,
        });
      });
    });
    return result;
  }, [groupedActivities]);

  const stickyHeaderIndices = useMemo(() => {
    const indices: number[] = [];
    listData.forEach((item, index) => {
      if (item.type === "header") indices.push(index);
    });
    return indices;
  }, [listData]);

  const ListHeaderComponent = useCallback(
    () => (
      <View style={{ paddingTop: insets.top + 100 }}>
        {/* ── Stats Row ─────────────────────────────── */}
        <FocusAwareView delay={100} className="px-6 mb-8">
          <View className="flex-row gap-4">
            <View className="flex-1 bg-white rounded-[24px] p-5 border border-border">
              <View className="w-10 h-10 rounded-full bg-success/10 items-center justify-center mb-3">
                <icons.ArrowDownLeft size={20} className="text-success" />
              </View>
              <Typography
                type="body-xs"
                className="text-muted-foreground font-medium tracking-wider mb-1"
              >
                Owed To You
              </Typography>
              <Typography type="h2" className="font-black text-foreground text-[22px]">
                {formatAmount(owedToYou, preferredCurrency.code)}
              </Typography>
            </View>

            <View className="flex-1 bg-white rounded-[24px] p-5 border border-border">
              <View className="w-10 h-10 rounded-full bg-danger/10 items-center justify-center mb-3">
                <icons.ArrowUpRight size={20} className="text-danger" />
              </View>
              <Typography
                type="body-xs"
                className="text-muted-foreground font-medium tracking-wider mb-1"
              >
                You Owe
              </Typography>
              <Typography type="h2" className="font-black text-foreground text-[22px]">
                {formatAmount(youOwe, preferredCurrency.code)}
              </Typography>
            </View>
          </View>
        </FocusAwareView>

        {/* ── Transactions Search ──────────────────────────── */}
        <FocusAwareView delay={200} className="px-6 mb-2 h-[44px] justify-center z-10">
          {isSearching ? (
            <View className="flex-row items-center gap-2">
              <View className="flex-1 flex-row items-center bg-white rounded-[16px] border border-border/50 h-[44px] px-3">
                <icons.Search size={20} color="#8A8798" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  placeholder="Search activity..."
                  placeholderTextColor="#8A8798"
                  className="flex-1 ml-2 font-medium text-foreground text-[15px]"
                />
                {searchQuery.length > 0 && (
                  <PressableFeedback onPress={() => setSearchQuery("")} hitSlop={8}>
                    <icons.XCircle size={18} color="#8A8798" />
                  </PressableFeedback>
                )}
              </View>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => {
                  setIsSearching(false);
                  setSearchQuery("");
                }}
              >
                Cancel
              </Button>
            </View>
          ) : (
            <View className="flex-row items-center justify-between">
              <Typography
                type="body-xs"
                className="text-muted-foreground font-bold tracking-widest ml-2 uppercase"
              >
                Timeline
              </Typography>
              <Button
                variant="ghost"
                isIconOnly
                onPress={() => setIsSearching(true)}
                className="p-0 min-w-0 min-h-0 w-8 h-8 rounded-full"
              >
                <icons.Search size={20} className="text-muted-foreground" />
              </Button>
            </View>
          )}
        </FocusAwareView>

        {isAppLoading && (
          <View className="px-6 mt-4">
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
        )}
      </View>
    ),
    [insets.top, owedToYou, youOwe, preferredCurrency.code, isSearching, searchQuery, isAppLoading]
  );

  const ListEmptyComponent = useCallback(
    () =>
      !isAppLoading ? (
        <View className="px-6">
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
        </View>
      ) : null,
    [isAppLoading, searchQuery]
  );

  const renderItem = useCallback(({ item, index }: { item: ListItem; index: number }) => {
    if (item.type === "header") {
      return (
        <View className="bg-background pt-4 pb-2 px-6 pl-8">
          <Typography
            type="body-xs"
            className="text-muted-foreground font-bold tracking-widest uppercase"
          >
            {item.title}
          </Typography>
        </View>
      );
    }

    return (
      <View className="px-6">
        <View
          className={`bg-white border-x border-border ${
            item.isFirst ? "rounded-t-[24px] border-t" : ""
          } ${item.isLast ? "rounded-b-[24px] border-b mb-6" : ""}`}
        >
          <ActivityItem activity={item.activity} index={index} isLast={item.isLast} />
        </View>
      </View>
    );
  }, []);

  return (
    <FocusAwareView style={{ flex: 1 }} className="bg-background">
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" />

        {/* ── Sticky Blurred Header ───────────────────── */}
        <BlurView
          intensity={100}
          tint="light"
          style={{
            paddingTop: insets.top + 16,
            paddingBottom: 16,
            paddingHorizontal: 24,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(242, 242, 246, 0.90)",
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

        <View className="flex-1 bg-background">
          <FlashList
            data={listData}
            renderItem={renderItem}
            stickyHeaderIndices={stickyHeaderIndices}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            getItemType={(item) => item.type}
          />
        </View>
      </View>
    </FocusAwareView>
  );
}
