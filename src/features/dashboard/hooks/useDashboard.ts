import { useCallback, useMemo, useState, useRef } from "react";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { SHELL_HREFS, settlementHref } from "@/features/navigation/shell";

import type { User, Group, Expense, Currency } from "@/types";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useFriends } from "@/features/friends/queries/useFriends";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import { useNotifications } from "@/features/notifications/queries/useNotifications";
import { useAnalytics } from "@/features/analytics/hooks/useAnalytics";

export interface DashboardGroupBalancePreview {
  group: Group;
  netBalance: number;
  latestExpenseAt: number;
  keyPerson?: User;
  keyPersonBalance?: number;
}

export interface DashboardData {
  currentUser: User | null;
  preferredCurrency: Currency;
  balanceTone: "danger" | "success" | "neutral";
  perUserBalances: Map<string, number>;
  owedToYou: number;
  youOwe: number;
  oweUsers: User[];
  owedUsers: User[];
  recentExpenses: Expense[];
  activeGroups: { group: Group; netBalance: number }[];
  groupBalancePreview: DashboardGroupBalancePreview[];
  openGroupCount: number;
  activeExpenseFilter: "all" | "paid" | "owe";
  isLoading: boolean;
  isError: boolean;
  refreshing: boolean;
  totalSpent: number;
  expenseCount: number;
  setActiveExpenseFilter: (f: "all" | "paid" | "owe") => void;
  onRefresh: () => void;
  handleAddExpense: () => void;
  handleSettleUp: () => void;
  handleViewAllGroups: () => void;
  handleCreateGroup: () => void;
  handleGroupPress: (groupId: string) => void;
  handleExpensePress: (expenseId: string) => void;
  handleViewAllActivity: () => void;
  handleViewProfile: () => void;
  handleViewNotifications: () => void;
  handleViewStats: () => void;
  handleSettleUser: (userId: string) => void;
  hasNotifications: boolean;
  settleSheetRef: React.RefObject<BottomSheetModal | null>;
  openSettleSheet: () => void;
  closeSettleSheet: () => void;
  groupsLoading: boolean;
}

export function useDashboard(): DashboardData {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  const {
    data: groups = [],
    isLoading: groupsLoading,
    isError: isGroupsError,
  } = useGroups(currentUser.id);

  const { data: friends = [] } = useFriends(currentUser.id);

  const {
    data: expenses = [],
    isLoading: expensesLoading,
    isError: isExpensesError,
  } = useUserExpenses(currentUser.id);

  const {
    data: settlements = [],
    isLoading: settlementsLoading,
    isError: isSettlementsError,
  } = useUserSettlements(currentUser.id);

  const isLoading = groupsLoading || expensesLoading || settlementsLoading;
  const isError = isGroupsError || isExpensesError || isSettlementsError;

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const { data: notifications = [] } = useNotifications(currentUser.id);
  const hasNotifications = notifications.length > 0;

  const [refreshing, setRefreshing] = useState(false);
  const [activeExpenseFilter, setActiveExpenseFilter] = useState<"all" | "paid" | "owe">("all");

  const settleSheetRef = useRef<BottomSheetModal>(null);

  const perUserBalances = useMemo(
    () =>
      balancesUtil.getUserBalances(
        currentUser.id,
        undefined,
        groups,
        expenses,
        settlements,
        preferredCurrency,
        convertCurrency
      ),
    [currentUser.id, groups, expenses, settlements, preferredCurrency, convertCurrency]
  );

  const owedToYou = useMemo(() => {
    let total = 0;
    for (const balance of perUserBalances.values()) {
      if (balance > 0) total += balance;
    }
    return total;
  }, [perUserBalances]);

  const youOwe = useMemo(() => {
    let total = 0;
    for (const balance of perUserBalances.values()) {
      if (balance < 0) total += balance;
    }
    return Math.abs(total);
  }, [perUserBalances]);

  const oweUsers = useMemo(() => {
    return friends
      .filter((u) => u.id !== currentUser.id && (perUserBalances.get(u.id) ?? 0) < 0)
      .slice(0, 4);
  }, [friends, currentUser.id, perUserBalances]);

  const owedUsers = useMemo(() => {
    return friends
      .filter((u) => u.id !== currentUser.id && (perUserBalances.get(u.id) ?? 0) > 0)
      .slice(0, 4);
  }, [friends, currentUser.id, perUserBalances]);

  const recentExpenses = useMemo(() => {
    let filtered = [...expenses];
    if (activeExpenseFilter === "paid") {
      filtered = filtered.filter((e) => e.paidBy === currentUser.id);
    } else if (activeExpenseFilter === "owe") {
      filtered = filtered.filter(
        (e) =>
          e.paidBy !== currentUser.id &&
          e.splits.some((s) => s.userId === currentUser.id && !s.paid)
      );
    }
    return filtered
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [expenses, activeExpenseFilter, currentUser.id]);

  const groupNetBalances = useMemo(() => {
    return groups.map((group): DashboardGroupBalancePreview => {
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

      let keyPerson: User | undefined;
      let keyPersonBalance: number | undefined;
      for (const member of group.members) {
        if (member.userId === currentUser.id) continue;

        const balance = balancesMap.get(member.userId) ?? 0;
        if (Math.abs(balance) <= 0.005) continue;
        if (keyPersonBalance === undefined || Math.abs(balance) > Math.abs(keyPersonBalance)) {
          keyPerson = member.user;
          keyPersonBalance = balance;
        }
      }

      const latestExpenseAt = expenses
        .filter((expense) => expense.groupId === group.id)
        .reduce((latest, expense) => {
          const expenseTime = new Date(expense.createdAt).getTime();
          return Math.max(latest, expenseTime);
        }, new Date(group.createdAt).getTime());

      return { group, netBalance, latestExpenseAt, keyPerson, keyPersonBalance };
    });
  }, [groups, currentUser.id, expenses, settlements, preferredCurrency, convertCurrency]);

  const activeGroups = useMemo(() => {
    const sorted = [...groupNetBalances].sort((a, b) => {
      const aHasBalance = Math.abs(a.netBalance) > 0.005;
      const bHasBalance = Math.abs(b.netBalance) > 0.005;
      if (aHasBalance !== bHasBalance) return aHasBalance ? -1 : 1;
      if (a.latestExpenseAt !== b.latestExpenseAt) return b.latestExpenseAt - a.latestExpenseAt;
      return Math.abs(b.netBalance) - Math.abs(a.netBalance);
    });
    return sorted.slice(0, 4);
  }, [groupNetBalances]);

  const groupBalancePreview = useMemo(() => {
    const openGroups = groupNetBalances.filter(({ netBalance }) => Math.abs(netBalance) > 0.005);
    const candidates = openGroups.length > 0 ? openGroups : groupNetBalances;

    return [...candidates]
      .sort((a, b) => {
        if (openGroups.length > 0) {
          const balanceDifference = Math.abs(b.netBalance) - Math.abs(a.netBalance);
          if (balanceDifference !== 0) return balanceDifference;
        }
        return b.latestExpenseAt - a.latestExpenseAt;
      })
      .slice(0, 4);
  }, [groupNetBalances]);

  const openGroupCount = useMemo(
    () => groupNetBalances.filter(({ netBalance }) => Math.abs(netBalance) > 0.005).length,
    [groupNetBalances]
  );

  const { totalSpent, expenseCount } = useAnalytics(
    currentUser.id,
    "month",
    preferredCurrency.code,
    convertCurrency
  );

  const netBalance = owedToYou - youOwe;
  const balanceTone: "danger" | "success" | "neutral" =
    netBalance < 0 ? "danger" : netBalance > 0 ? "success" : "neutral";

  const handleAddExpense = useCallback(() => {
    router.push("/expense/new");
  }, [router]);

  const handleSettleUp = useCallback(() => {
    if (owedUsers.length > 0 && oweUsers.length > 0) {
      settleSheetRef.current?.present();
    } else if (owedToYou > 0) {
      router.push(settlementHref(owedUsers[0]?.id));
    } else if (youOwe > 0) {
      router.push(settlementHref(oweUsers[0]?.id));
    } else {
      router.push(SHELL_HREFS.circlesPeople);
    }
  }, [owedUsers, oweUsers, owedToYou, youOwe, router]);

  const handleViewAllGroups = useCallback(() => {
    router.push(SHELL_HREFS.circlesGroups);
  }, [router]);

  const handleCreateGroup = useCallback(() => {
    router.push("/group/new");
  }, [router]);

  const handleGroupPress = useCallback(
    (groupId: string) => {
      router.push(`/group/${groupId}`);
    },
    [router]
  );

  const handleExpensePress = useCallback(
    (expenseId: string) => {
      router.push(`/expense/${expenseId}`);
    },
    [router]
  );

  const handleViewAllActivity = useCallback(() => {
    router.push(SHELL_HREFS.activity);
  }, [router]);

  const handleViewProfile = useCallback(() => {
    router.push(SHELL_HREFS.more);
  }, [router]);

  const handleViewNotifications = useCallback(() => {
    router.push(SHELL_HREFS.notifications);
  }, [router]);

  const handleViewStats = useCallback(() => {
    router.push(SHELL_HREFS.analytics);
  }, [router]);

  const handleSettleUser = useCallback(
    (userId: string) => {
      router.push(settlementHref(userId));
    },
    [router]
  );

  const openSettleSheet = useCallback(() => {
    settleSheetRef.current?.present();
  }, []);

  const closeSettleSheet = useCallback(() => {
    settleSheetRef.current?.dismiss();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await queryClient.invalidateQueries({
      queryKey: ["groups", "expenses", "settlements", "friends", "notifications", "activities"],
    });
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [queryClient]);

  return {
    currentUser,
    preferredCurrency,
    balanceTone,
    perUserBalances,
    owedToYou,
    youOwe,
    oweUsers,
    owedUsers,
    recentExpenses,
    activeGroups,
    groupBalancePreview,
    openGroupCount,
    activeExpenseFilter,
    totalSpent,
    expenseCount,
    isLoading,
    isError,
    refreshing,
    setActiveExpenseFilter,
    onRefresh,
    handleAddExpense,
    handleSettleUp,
    handleViewAllGroups,
    handleCreateGroup,
    handleGroupPress,
    handleExpensePress,
    handleViewAllActivity,
    handleViewProfile,
    handleViewNotifications,
    handleViewStats,
    handleSettleUser,
    hasNotifications,
    settleSheetRef,
    openSettleSheet,
    closeSettleSheet,
    groupsLoading,
  };
}
