import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AppContext";
import {
  useRecurringExpenses,
  useDeleteRecurringExpense,
  useSetRecurringStatus,
} from "@/features/recurring/queries/useRecurringExpenses";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { queryKeys } from "@/queries/keys";
import type { RecurringExpense } from "@/types";

export type RecurringFilter = "all" | "active" | "paused";

export interface UseRecurringListReturn {
  recurringExpenses: RecurringExpense[];
  filtered: RecurringExpense[];
  filter: RecurringFilter;
  setFilter: (f: RecurringFilter) => void;
  search: string;
  setSearch: (s: string) => void;
  isLoading: boolean;
  isError: boolean;
  refreshing: boolean;
  isDeleting: boolean;
  isTogglingStatus: boolean;
  onRefresh: () => Promise<void>;
  refetch: () => void;
  handleCreateRecurring: () => void;
  handleRecurringPress: (id: string) => void;
  handleToggleStatus: (id: string, currentStatus: string) => void;
  handleDelete: (id: string) => void;
}

export function useRecurringList(): UseRecurringListReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  const {
    data: recurringExpenses = [],
    isLoading,
    isError,
    refetch,
  } = useRecurringExpenses(currentUser?.id);

  const deleteMutation = useDeleteRecurringExpense();
  const statusMutation = useSetRecurringStatus();

  const { search, setSearch, debouncedSearch } = useDebouncedSearch();
  const [filter, setFilter] = useState<RecurringFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return recurringExpenses.filter((item) => {
      if (term && !item.title.toLowerCase().includes(term)) return false;
      if (filter === "active") return item.status === "active";
      if (filter === "paused") return item.status === "paused";
      return true;
    });
  }, [recurringExpenses, filter, debouncedSearch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({
      queryKey: queryKeys.recurring.list(currentUser!.id),
    });
    setRefreshing(false);
  }, [queryClient, currentUser]);

  const handleCreateRecurring = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/expense/new?mode=recurring");
  }, [router]);

  const handleRecurringPress = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/expense/recurring/${id}`);
    },
    [router]
  );

  const handleToggleStatus = useCallback(
    (id: string, currentStatus: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newStatus = currentStatus === "active" ? "paused" : "active";
      statusMutation.mutate({ id, status: newStatus });
    },
    [statusMutation]
  );

  const handleDelete = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  return {
    recurringExpenses,
    filtered,
    filter,
    setFilter,
    search,
    setSearch,
    isLoading,
    isError,
    refreshing,
    isDeleting: deleteMutation.isPending,
    isTogglingStatus: statusMutation.isPending,
    onRefresh,
    refetch,
    handleCreateRecurring,
    handleRecurringPress,
    handleToggleStatus,
    handleDelete,
  };
}
