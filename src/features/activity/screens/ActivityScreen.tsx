import type { JSX } from "react";
import { useState, useMemo, useCallback } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { Typography } from "heroui-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";

import Animated from "react-native-reanimated";
import { useUserActivities } from "@/features/activity/queries/useActivities";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { ActivityItem } from "@/features/activity/components/ActivityItem";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { UI, ScreenHeader, SearchField, FilterPill, EmptyState } from "@/components/ui/native-ui";
import { ListRowSkeleton } from "@/components/ui/Skeleton";
import type { Activity, ActivityFilterType } from "@/types";

export default function ActivityScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  const { data: activities = [], isLoading: isLoadingActivities } = useUserActivities(currentUser?.id);
  const isAppLoading =
    useUIStore((s) => s.isAppLoading) || isLoadingActivities;

  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["activities"] });
    setRefreshing(false);
  }, [queryClient]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActivityFilterType>("All");

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
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const getSectionKey = (date: Date): string => {
      const d = new Date(date);
      if (d.toDateString() === today.toDateString()) return "Today";
      if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
      if (d > weekAgo) return "This Week";
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    };

    filteredActivities.forEach((activity) => {
      const key = getSectionKey(activity.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(activity);
    });

    const order = ["Today", "Yesterday", "This Week"];
    return Object.entries(groups)
      .sort(([a], [b]) => {
        const ai = order.indexOf(a);
        const bi = order.indexOf(b);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return 0;
      })
      .map(([title, data]) => ({ title, data }));
  }, [filteredActivities]);

  const FILTERS: ActivityFilterType[] = ["All", "Expenses", "Settlements", "Groups", "Friends"];

  const ListEmptyComponent = useCallback(() => {
    if (isAppLoading) return null;
    return (
      <View style={{ paddingHorizontal: UI.space.page, marginTop: 24 }}>
        <EmptyState
          icon={icons.Activity}
          title="No activity found"
          subtitle={
            searchQuery || activeFilter !== "All"
              ? "Try adjusting your filters or search term."
              : "Expenses and settlements will appear here as you use Splt."
          }
        />
      </View>
    );
  }, [isAppLoading, searchQuery, activeFilter]);

  return (
    <FocusAwareView style={{ flex: 1, backgroundColor: UI.color.bg, paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <ScreenHeader title="Activity" />

      {/* Search + filters — outside FlatList so the input never unmounts on data change */}
      <View style={{ backgroundColor: UI.color.bg }}>
        <View style={{ paddingHorizontal: UI.space.page, paddingBottom: 20 }}>
          <SearchField
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery("")}
            placeholder="Search activity..."
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: UI.space.page, gap: 8, paddingBottom: 20 }}
        >
          {FILTERS.map((filter) => (
            <FilterPill
              key={filter}
              label={filter}
              isActive={activeFilter === filter}
              onPress={() => setActiveFilter(filter)}
            />
          ))}
        </ScrollView>
      </View>

      {isAppLoading && groupedActivities.length === 0 ? (
        <View style={{ paddingHorizontal: UI.space.page, gap: 0 }}>
          {[1, 2, 3].map((i) => <ListRowSkeleton key={i} />)}
        </View>
      ) : (
      <Animated.FlatList
        data={groupedActivities}
        keyExtractor={(item) => item.title}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={UI.color.text} />
        }
        renderItem={({ item: section }: { item: { title: string; data: Activity[] } }) => (
          <View style={{ paddingHorizontal: UI.space.page, marginBottom: 24 }}>
            {/* Month header */}
            <Typography
              style={{
                fontSize: 11,
                fontFamily: "IBMPlexSans_600SemiBold",
                color: UI.color.muted,
                textTransform: "uppercase",
                letterSpacing: 1.4,
                marginBottom: 10,
                paddingLeft: 2,
              }}
            >
              {section.title}
            </Typography>

            {/* Card container */}
            <View
              style={{
                backgroundColor: UI.color.surface,
                borderRadius: UI.radius.lg,
                borderWidth: 1,
                borderColor: UI.color.border,
                overflow: "hidden",
              }}
            >
              {section.data.map((activity, idx) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  index={idx}
                  isLast={idx === section.data.length - 1}
                />
              ))}
            </View>
          </View>
        )}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      />
      )}
    </FocusAwareView>
  );
}
