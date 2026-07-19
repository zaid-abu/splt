import { useMemo, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUserActivities } from "@/features/activity/queries/useActivities";
import { useRecurringExpenses } from "@/features/recurring/queries/useRecurringExpenses";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import type { Activity, ActivityFilterType, RecurringExpense } from "@/types";

export type ActivityTab = "timeline" | "upcoming";

export const ACTIVITY_FILTERS: ActivityFilterType[] = [
  "All",
  "Expenses",
  "Settlements",
  "Groups",
  "Friends",
];

export interface UpcomingRow {
  id: string;
  icon: "calendar" | "home" | "bell" | "receipt" | "bolt";
  title: string;
  detail: string;
  value: string;
  tone: "neutral" | "positive" | "negative" | "warning";
  recurringExpenseId: string;
}

export interface ActivitySection<T> {
  title: string;
  meta?: string;
  data: T[];
}

export function useActivity() {
  const { currentUser } = useAuth();
  const {
    data: activities = [],
    isLoading: isLoadingActivities,
    isError,
    refetch,
  } = useUserActivities(currentUser?.id);
  const { data: recurringExpenses = [] } = useRecurringExpenses(currentUser?.id);
  const isAppLoading = useUIStore((s) => s.isAppLoading) || isLoadingActivities;

  const [selectedTab, setSelectedTab] = useState<ActivityTab>("timeline");
  const [activeFilter, setActiveFilter] = useState<ActivityFilterType>("All");

  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ["activities"] });
    await queryClient.refetchQueries({ queryKey: ["recurring"] });
    setRefreshing(false);
  }, [queryClient]);

  const {
    search: searchQuery,
    setSearch: setSearchQuery,
    debouncedSearch: debouncedSearchQuery,
  } = useDebouncedSearch();

  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [activities]);

  const filteredActivities = useMemo(() => {
    let result = sortedActivities;

    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      result = result.filter((a) => a.description.toLowerCase().includes(q));
    }

    return result;
  }, [sortedActivities, debouncedSearchQuery]);

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
      .map(([title, data]) => ({ title, meta: `${data.length} ${data.length === 1 ? "event" : "events"}`, data }));
  }, [filteredActivities]);

  const upcomingSections = useMemo(() => {
    const needsReview: UpcomingRow[] = [];
    const byMonth: Record<string, UpcomingRow[]> = {};

    const activeRecurring = recurringExpenses.filter((r) => r.status === "active");

    activeRecurring.forEach((r) => {
      if (!r.autoPost && r.status === "active") {
        needsReview.push(mapRecurringToRow(r, "needs-review"));
      }

      const monthKey = formatMonthLabel(r.nextRunDate);
      if (!byMonth[monthKey]) byMonth[monthKey] = [];
      byMonth[monthKey].push(mapRecurringToRow(r, "scheduled"));
    });

    const sections: ActivitySection<UpcomingRow>[] = [];
    if (needsReview.length > 0) {
      sections.push({ title: "Needs review", meta: String(needsReview.length), data: needsReview });
    }

    const monthOrder = Object.keys(byMonth).sort((a, b) => {
      const da = new Date(a);
      const db = new Date(b);
      return da.getTime() - db.getTime();
    });

    for (const month of monthOrder) {
      const rows = byMonth[month];
      sections.push({ title: month, meta: `${rows.length} expected`, data: rows });
    }

    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      return sections
        .map((s) => ({ ...s, data: s.data.filter((r) => r.title.toLowerCase().includes(q)) }))
        .filter((s) => s.data.length > 0);
    }

    return sections;
  }, [recurringExpenses, debouncedSearchQuery]);

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
    selectedTab,
    setSelectedTab,
    groupedActivities,
    upcomingSections,
  };
}

function formatMonthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function mapRecurringToRow(r: RecurringExpense, kind: "needs-review" | "scheduled"): UpcomingRow {
  const date = new Date(r.nextRunDate);
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const formattedDate = `${month} ${day}`;

  if (kind === "needs-review") {
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    return {
      id: r.id,
      icon: "calendar",
      title: r.title,
      detail: `Due ${dayName} - needs review`,
      value: r.amount ? `Review $${r.amount}` : "Review",
      tone: "warning",
      recurringExpenseId: r.id,
    };
  }

  const isRecurringReview = !r.autoPost;

  return {
    id: r.id,
    icon: inferIcon(r),
    title: r.title,
    detail: `${formattedDate}${isRecurringReview ? " - review first" : " - posts automatically"}`,
    value: r.amount ? `$${r.amount}` : "",
    tone: "neutral",
    recurringExpenseId: r.id,
  };
}

function inferIcon(r: RecurringExpense): UpcomingRow["icon"] {
  const title = r.title.toLowerCase();
  if (title.includes("rent") || title.includes("mortgage") || title.includes("lease")) return "home";
  if (title.includes("remind") || title.includes("reminder")) return "bell";
  if (title.includes("electric") || title.includes("power") || title.includes("bill") || title.includes("utility")) return "bolt";
  return "calendar";
}
