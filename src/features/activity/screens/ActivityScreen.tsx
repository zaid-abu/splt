import type { JSX } from "react";
import { useState, useMemo, useCallback } from "react";
import { View, TextInput, StyleSheet, Pressable, ScrollView, FlatList } from "react-native";
import { Typography, PressableFeedback } from "heroui-native";
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
import { AppLoader } from "@/components/ui/AppLoader";
import type { Activity } from "@/types";

// --- Design Tokens ---
const BG = "#F5F0EB";
const BRAND = "#8C7A6B";
const BORDER = "#E8E4DF";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#8A8782";

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
  }, [expenses, settlements]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");

  // Sort activities by date descending
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [activities]);

  // Apply Search & Pill Filters
  const filteredActivities = useMemo(() => {
    let result = sortedActivities;

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => a.description.toLowerCase().includes(q));
    }

    // Filter by Pill Type
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

  // Group activities by month-year
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

  // --- Components ---

  const renderFilterPills = () => {
    const filters: FilterType[] = ["All", "Expenses", "Settlements", "Groups", "Friends"];
    return (
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
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
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: isActive ? "#8C7A6B" : "transparent",
                  borderWidth: 1,
                  borderColor: isActive ? "#8C7A6B" : BORDER,
                }}
              >
                <Typography
                  style={{
                    fontSize: 13,
                    fontFamily: "CrimsonText_700Bold",
                    color: isActive ? "#FFFFFF" : TEXT_PRIMARY,
                  }}
                >
                  {filter}
                </Typography>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderHeader = () => (
    <Animated.View entering={FadeInDown.duration(400)} style={{ backgroundColor: BG }}>
      {/* ── Header ── */}
      <View
        style={{
          paddingTop: 16,
          paddingHorizontal: 24,
          paddingBottom: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: BG,
        }}
      >
        <Typography
          style={{
            fontFamily: "CrimsonText_700Bold",
            fontSize: 16,
            color: TEXT_SECONDARY,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          Timeline
        </Typography>
      </View>

      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: BORDER,
        }}
      >
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search activity..."
          placeholderTextColor={TEXT_SECONDARY}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            fontSize: 32,
            fontFamily: "UnicaOne_400Regular",
            color: TEXT_PRIMARY,
            padding: 0,
          }}
        />
        {searchQuery.length > 0 && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setSearchQuery("")}
            hitSlop={8}
            style={({ pressed }) => ({
              position: "absolute",
              right: 24,
              top: 8,
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <icons.X size={24} color={TEXT_PRIMARY} strokeWidth={1} />
          </Pressable>
        )}
      </View>

      {renderFilterPills()}

      {isAppLoading && <AppLoader />}
    </Animated.View>
  );

  const ListEmptyComponent = useCallback(() => {
    if (isAppLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconBox}>
            <icons.Activity size={32} color={TEXT_SECONDARY} />
          </View>
          <Typography style={styles.emptyTitle}>No activity found</Typography>
          <Typography style={styles.emptySubtitle}>
            {searchQuery || activeFilter !== "All"
              ? "Try adjusting your filters or search term."
              : "You have no recent activity."}
          </Typography>
        </View>
      </View>
    );
  }, [isAppLoading, searchQuery, activeFilter]);

  return (
    <FocusAwareView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
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
              <View style={styles.headerContainer}>
                <Typography style={styles.headerText}>{item.title}</Typography>
              </View>
            );
          }
          const isNextHeader =
            index === listData.length - 1 || listData[index + 1].type === "header";
          return <ActivityItem activity={item.activity} index={index} isLast={isNextHeader} />;
        }}
        ListEmptyComponent={ListEmptyComponent}
        stickyHeaderIndices={stickyHeaderIndices}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      />
    </FocusAwareView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  filtersContainer: {
    marginBottom: 24,
  },
  filtersScroll: {
    paddingHorizontal: 24,
    gap: 8,
  },
  headerContainer: {
    backgroundColor: BG,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    zIndex: 10,
  },
  headerText: {
    fontSize: 13,
    fontFamily: "CrimsonText_700Bold",
    color: TEXT_SECONDARY,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  emptyContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  emptyBox: {
    padding: 32,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "CrimsonText_700Bold",
    color: TEXT_PRIMARY,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "CrimsonText_600SemiBold",
    color: TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 20,
  },
});
