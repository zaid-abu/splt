import type { JSX } from "react";
import { useState, useMemo, useCallback } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
} from "react-native";
import { Typography, Skeleton, PressableFeedback } from "heroui-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";

import Animated, { FadeIn } from "react-native-reanimated";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { ActivityItem } from "@/features/activity/components/ActivityItem";
import type { Activity } from "@/types";

// --- Design Tokens ---
const BG = "#F5F0EB";
const BRAND = "#8C7A6B";
const SURFACE = "#FFFFFF";
const BORDER = "#E8E4DF";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#8A8782";

type FilterType = "All" | "Expenses" | "Settlements" | "Groups" | "Friends";

type ListItem =
  | { type: "header"; title: string }
  | { type: "item"; activity: Activity };

export default function ActivityScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  const { data: groups = [] } = useGroups(currentUser?.id);
  const { data: expenses = [], isLoading: isLoadingExpenses } = useUserExpenses(currentUser?.id);
  const { data: settlements = [], isLoading: isLoadingSettlements } = useUserSettlements(currentUser?.id);
  const isAppLoading = useUIStore((s) => s.isAppLoading) || isLoadingExpenses || isLoadingSettlements;

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
      const monthYear = activity.date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
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
      if (item.type === "header") indices.push(index + 1);
    });
    return indices;
  }, [listData]);

  // --- Components ---

  const renderFilterPills = () => {
    const filters: FilterType[] = ["All", "Expenses", "Settlements", "Groups", "Friends"];
    return (
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {filters.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveFilter(filter);
                }}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillInactive,
                ]}
              >
                <Typography
                  style={[
                    styles.filterText,
                    isActive ? styles.filterTextActive : styles.filterTextInactive,
                  ]}
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

  const ListHeaderComponent = useCallback(() => (
    <View style={{ paddingTop: 24, backgroundColor: BG }}>
      <Typography style={styles.pageTitle}>Timeline</Typography>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <icons.Search size={20} color={TEXT_SECONDARY} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search activity..."
            placeholderTextColor={TEXT_SECONDARY}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <PressableFeedback
              accessibilityRole="button"
              onPress={() => setSearchQuery("")}
              hitSlop={8}
            >
              <icons.XCircle size={18} color={TEXT_SECONDARY} />
            </PressableFeedback>
          )}
        </View>
      </View>

      {renderFilterPills()}

      {isAppLoading && (
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <Skeleton style={{ width: 100, height: 16, backgroundColor: BORDER, marginBottom: 16 }} />
          <View style={{ backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER }}>
            <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 16 }}>
              <Skeleton style={{ width: 48, height: 48, backgroundColor: BORDER }} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton style={{ width: "80%", height: 16, backgroundColor: BORDER }} />
                <Skeleton style={{ width: "40%", height: 12, backgroundColor: BORDER }} />
              </View>
            </View>
            <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 16, borderTopWidth: 1, borderTopColor: BORDER }}>
              <Skeleton style={{ width: 48, height: 48, backgroundColor: BORDER }} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton style={{ width: "60%", height: 16, backgroundColor: BORDER }} />
                <Skeleton style={{ width: "30%", height: 12, backgroundColor: BORDER }} />
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  ), [insets.top, searchQuery, isAppLoading, activeFilter]);

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
    <Animated.View entering={FadeIn.duration(400)} style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <FlatList
        data={listData}
        keyExtractor={(item, index) => (item.type === "header" ? `header-${item.title}` : `item-${item.activity.id}`)}
        renderItem={({ item, index }) => {
          if (item.type === "header") {
            return (
              <View style={styles.headerContainer}>
                <Typography style={styles.headerText}>{item.title}</Typography>
              </View>
            );
          }
          const isNextHeader = index === listData.length - 1 || listData[index + 1].type === "header";
          return <ActivityItem activity={item.activity} index={index} isLast={isNextHeader} />;
        }}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        stickyHeaderIndices={stickyHeaderIndices}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      />
    </Animated.View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  pageTitle: {
    fontFamily: "DMSerifDisplay_400Regular",
    fontSize: 40,
    color: TEXT_PRIMARY,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    height: 48,
    borderRadius: 0,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: "PlusJakartaSans_500Medium",
    color: TEXT_PRIMARY,
  },
  filtersContainer: {
    marginBottom: 24,
  },
  filtersScroll: {
    paddingHorizontal: 24,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  filterPillInactive: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
  },
  filterPillActive: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_700Bold",
    letterSpacing: 0.5,
  },
  filterTextInactive: {
    color: TEXT_PRIMARY,
  },
  filterTextActive: {
    color: "#FFFFFF",
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
    fontFamily: "PlusJakartaSans_800ExtraBold",
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
    backgroundColor: SURFACE,
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
    fontFamily: "PlusJakartaSans_700Bold",
    color: TEXT_PRIMARY,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    color: TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 20,
  },
});
