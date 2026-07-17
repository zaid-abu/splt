import { useMemo, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUserActivities } from "@/features/activity/queries/useActivities";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import type { Activity, ActivityFilterType } from "@/types";

export const ACTIVITY_FILTERS: ActivityFilterType[] = [
  "All",
  "Expenses",
  "Settlements",
  "Groups",
  "Friends",
];

export function useActivity() {
  const { currentUser } = useAuth();
  const {
    data: activities = [],
    isLoading: isLoadingActivities,
    isError,
    refetch,
  } = useUserActivities(currentUser?.id);
  const isAppLoading = useUIStore((s) => s.isAppLoading) || isLoadingActivities;

  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ["activities"] });
    setRefreshing(false);
  }, [queryClient]);

  const {
    search: searchQuery,
    setSearch: setSearchQuery,
    debouncedSearch: debouncedSearchQuery,
  } = useDebouncedSearch();
  const [activeFilter, setActiveFilter] = useState<ActivityFilterType>("All");

  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [activities]);

  const filteredActivities = useMemo(() => {
    let result = sortedActivities;

    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
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
  }, [sortedActivities, debouncedSearchQuery, activeFilter]);

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

  return {
    activities,
    isLoadingActivities,
    isError,
    refetch,
    isAppLoading,
    refreshing,
    onRefresh,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    groupedActivities,
  };
}
