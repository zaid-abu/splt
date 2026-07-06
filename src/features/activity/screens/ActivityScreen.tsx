import type { JSX } from "react";
import { useState, useMemo, useCallback } from "react";
import { View, Pressable, ScrollView, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";

import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { ActivityItem } from "@/features/activity/components/ActivityItem";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { Text } from "@/components/primitives/Text";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Activity } from "@/types";

type FilterType = "All" | "Expenses" | "Settlements" | "Groups" | "Friends";

type ListItem = { type: "header"; title: string } | { type: "item"; activity: Activity };

export default function ActivityScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: expenses = [], isLoading: isLoadingExpenses } = useUserExpenses(currentUser?.id);
  const { data: settlements = [], isLoading: isLoadingSettlements } = useUserSettlements(
    currentUser?.id
  );
  const isAppLoading =
    useUIStore((s) => s.isAppLoading) || isLoadingExpenses || isLoadingSettlements;

  const activities = useMemo(() => {
    const arr: Activity[] = [];
    expenses.forEach((e) => {
      arr.push({
        id: `exp-${e.id}`,
        type: "expense",
        expense: e,
        groupId: e.groupId,
        userId: e.paidBy,
        user: currentUser!,
        description: e.title,
        currency: e.currency,
        date: e.date,
      });
    });
    settlements.forEach((s) => {
      arr.push({
        id: `set-${s.id}`,
        type: "settlement",
        settlement: s,
        groupId: s.groupId,
        userId: s.fromUserId,
        user: currentUser!,
        description: "Settled up",
        currency: s.currency,
        date: s.date,
      });
    });
    return arr;
  }, [expenses, settlements, currentUser]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");

  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [activities]);

  const filteredActivities = useMemo(() => {
    let result = sortedActivities;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => a.description.toLowerCase().includes(q));
    }

    if (activeFilter !== "All") {
      result = result.filter((a) => {
        switch (activeFilter) {
          case "Expenses":
            return a.type === "expense";
          case "Settlements":
            return a.type === "settlement";
          case "Groups":
            return !!a.groupId || a.type === "group_created" || a.type === "member_joined";
          case "Friends":
            return !a.groupId && (a.type === "expense" || a.type === "settlement");
          default:
            return true;
        }
      });
    }

    return result;
  }, [sortedActivities, searchQuery, activeFilter]);

  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    filteredActivities.forEach((activity) => {
      const monthYear = activity.date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
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
      group.data.forEach((item) => {
        result.push({ type: "item", activity: item });
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

  const renderFilterPills = () => {
    const filters: FilterType[] = ["All", "Expenses", "Settlements", "Groups", "Friends"];
    return (
      <View className="mb-6">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        >
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveFilter(filter);
                }}
                className={`px-4 py-2 rounded-full border ${
                  isActive ? "bg-primary border-primary" : "bg-transparent border-border"
                }`}
              >
                <Text
                  variant="bodySmall"
                  className={`font-bold ${isActive ? "text-foreground" : "text-primary"}`}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderHeader = () => (
    <Animated.View entering={FadeInDown.duration(400)} className="bg-background z-10">
      {/* ── Header ── */}
      <View className="pt-4 px-6 pb-6 flex-row items-center justify-between">
        <Text variant="bodySmall" color="muted" className="font-semibold">
          Timeline
        </Text>
      </View>

      <View className="px-6 pb-4 border-b border-border relative">
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search activity..."
          leftElement={<icons.Search size={20} className="text-muted-foreground" strokeWidth={1.5} />}
          rightElement={
            searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                <icons.XCircle size={20} className="text-muted-foreground" strokeWidth={1.5} />
              </Pressable>
            ) : undefined
          }
        />
      </View>

      <View className="pt-6">
        {renderFilterPills()}
      </View>

      {isAppLoading && <Spinner size="md" />}
    </Animated.View>
  );

  const ListEmptyComponent = useCallback(() => {
    if (isAppLoading) return null;
    return (
      <View className="px-6 mt-6">
        <EmptyState
          icon="Activity"
          title="No activity found"
          description={
            searchQuery || activeFilter !== "All"
              ? "Try adjusting your filters or search term."
              : "You have no recent activity."
          }
        />
      </View>
    );
  }, [isAppLoading, searchQuery, activeFilter]);

  return (
    <FocusAwareView className="flex-1 bg-background">
      <View style={{ paddingTop: insets.top }}>
      <StatusBar style="light" />
      {renderHeader()}
      <Animated.FlatList
        data={listData}
        keyExtractor={(item, index) =>
          item.type === "header" ? `header-${item.title}` : `item-${item.activity.id}`
        }
        itemLayoutAnimation={LinearTransition}
        renderItem={({ item, index }) => {
          if (item.type === "header") {
            return (
              <View className="bg-background px-6 py-3 z-10 border-b border-border">
                <Text variant="bodySmall" color="muted" className="font-semibold">
                  {item.title}
                </Text>
              </View>
            );
          }
          const isFirstInGroup = index === 0 || listData[index - 1].type === "header";
          const isNextHeader =
            index === listData.length - 1 || listData[index + 1].type === "header";
          return <ActivityItem activity={item.activity} index={index} isFirst={isFirstInGroup} isLast={isNextHeader} />;
        }}
        ListEmptyComponent={ListEmptyComponent}
        stickyHeaderIndices={stickyHeaderIndices}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      />
      </View>
    </FocusAwareView>
  );
}
