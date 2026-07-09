import type { JSX } from "react";
import { useState, useMemo, useCallback } from "react";
import { View, ScrollView } from "react-native";
import { Typography } from "heroui-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";

import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { ActivityItem } from "@/features/activity/components/ActivityItem";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { AppLoader } from "@/components/ui/AppLoader";
import { UI, ScreenHeader, SearchField, FilterPill, EmptyState } from "@/components/ui/native-ui";
import type { Activity, ActivityFilterType } from "@/types";



export default function ActivityScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

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
  }, [currentUser, expenses, settlements]);

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

  const FILTERS: ActivityFilterType[] = ["All", "Expenses", "Settlements", "Groups", "Friends"];

  const renderFilterPills = () => (
    <View style={{ marginBottom: 24 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: UI.space.page, gap: 8 }}
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
  );

  const renderSearchAndFilters = () => (
    <Animated.View entering={FadeInDown.duration(400)} style={{ backgroundColor: UI.color.bg }}>
      <View style={{ paddingHorizontal: UI.space.page, paddingBottom: 24 }}>
        <SearchField
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery("")}
          placeholder="Search activity..."
        />
      </View>

      {renderFilterPills()}

      {isAppLoading && <AppLoader />}
    </Animated.View>
  );

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

      <Animated.FlatList
        data={groupedActivities}
        keyExtractor={(item) => item.title}
        itemLayoutAnimation={LinearTransition}
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
        ListHeaderComponent={renderSearchAndFilters}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      />
    </FocusAwareView>
  );
}
