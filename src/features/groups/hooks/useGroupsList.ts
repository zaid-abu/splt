import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import type { Group, GroupFilter } from "@/types";

export interface GroupRow {
  group: Group;
  netBalance: number;
  latestExpenseAt: number;
}

export interface GroupTotals {
  youOwe: number;
  owedToYou: number;
  netTotal: number;
}

export interface UseGroupsListReturn {
  activeGroups: GroupRow[];
  totals: GroupTotals;
  filtered: GroupRow[];
  filter: GroupFilter;
  setFilter: (f: GroupFilter) => void;
  search: string;
  setSearch: (s: string) => void;
  debouncedSearch: string;
  isLoading: boolean;
  isError: boolean;
  refreshing: boolean;
  preferredCurrencyCode: string;
  onRefresh: () => Promise<void>;
  refetch: () => void;
  handleGroupPress: (groupId: string) => void;
  handleCreateGroup: () => void;
}

export function useGroupsList(): UseGroupsListReturn {
  const router = useRouter();
  const { currentUser } = useAuth();

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const {
    data: groups = [],
    isLoading: isLoadingGroups,
    isError: isGroupsError,
    refetch: refetchGroups,
  } = useGroups(currentUser?.id);
  const {
    data: expenses = [],
    isLoading: isLoadingExpenses,
    isError: isExpensesError,
    refetch: refetchExpenses,
  } = useUserExpenses(currentUser?.id);
  const {
    data: settlements = [],
    isLoading: isLoadingSettlements,
    isError: isSettlementsError,
    refetch: refetchSettlements,
  } = useUserSettlements(currentUser?.id);

  const isLoading = isLoadingGroups || isLoadingExpenses || isLoadingSettlements;
  const isError = isGroupsError || isExpensesError || isSettlementsError;

  const { search, setSearch, debouncedSearch } = useDebouncedSearch();
  const [filter, setFilter] = useState<GroupFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const activeGroups = useMemo(() => {
    const groupRows = groups.map((group) => {
      const balancesMap = balancesUtil.getUserBalances(
        currentUser.id,
        group.id,
        groups,
        expenses,
        settlements,
        preferredCurrency,
        convertCurrency
      );
      let netBalance = 0;
      for (const amount of balancesMap.values()) {
        netBalance += amount;
      }

      const latestExpenseAt = expenses
        .filter((e) => e.groupId === group.id)
        .reduce((latest, expense) => {
          const expenseTime = new Date(expense.createdAt).getTime();
          return Math.max(latest, expenseTime);
        }, new Date(group.createdAt).getTime());

      return { group, netBalance, latestExpenseAt };
    });

    groupRows.sort((a, b) => {
      const aHasBalance = Math.abs(a.netBalance) > 0.005;
      const bHasBalance = Math.abs(b.netBalance) > 0.005;
      if (aHasBalance !== bHasBalance) return aHasBalance ? -1 : 1;
      if (a.latestExpenseAt !== b.latestExpenseAt) return b.latestExpenseAt - a.latestExpenseAt;
      return Math.abs(b.netBalance) - Math.abs(a.netBalance);
    });

    return groupRows;
  }, [groups, currentUser.id, expenses, settlements, preferredCurrency, convertCurrency]);

  const totals = useMemo(() => {
    return activeGroups.reduce(
      (acc, item) => {
        if (item.netBalance < 0) acc.youOwe += Math.abs(item.netBalance);
        if (item.netBalance > 0) acc.owedToYou += item.netBalance;
        acc.netTotal += item.netBalance;
        return acc;
      },
      { youOwe: 0, owedToYou: 0, netTotal: 0 }
    );
  }, [activeGroups]);

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return activeGroups.filter((item) => {
      if (term && !item.group.name.toLowerCase().includes(term)) return false;
      if (filter === "owe") return item.netBalance < -0.005;
      if (filter === "owed") return item.netBalance > 0.005;
      if (filter === "settled") return Math.abs(item.netBalance) <= 0.005;
      return true;
    });
  }, [activeGroups, filter, debouncedSearch]);

  const refetch = useCallback(() => {
    void Promise.all([refetchGroups(), refetchExpenses(), refetchSettlements()]);
  }, [refetchExpenses, refetchGroups, refetchSettlements]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchGroups(), refetchExpenses(), refetchSettlements()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchExpenses, refetchGroups, refetchSettlements]);

  const handleGroupPress = useCallback(
    (groupId: string) => {
      router.push(`/group/${groupId}`);
    },
    [router]
  );

  const handleCreateGroup = useCallback(() => {
    router.push("/group/new");
  }, [router]);

  return {
    activeGroups,
    totals,
    filtered,
    filter,
    setFilter,
    search,
    setSearch,
    debouncedSearch,
    isLoading,
    isError,
    refreshing,
    preferredCurrencyCode: preferredCurrency.code,
    onRefresh,
    refetch,
    handleGroupPress,
    handleCreateGroup,
  };
}
