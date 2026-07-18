import { useCallback, useMemo, useState } from "react";
import { Alert, Share } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { useAuth } from "@/context/AppContext";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import {
  useAcceptFriend,
  useAllFriendships,
  useFriends,
  useRejectFriend,
  useRemoveFriend,
} from "@/features/friends/queries/useFriends";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { useAppToast } from "@/hooks/useAppToast";
import { queryKeys } from "@/queries/keys";
import { useUIStore } from "@/store/useUIStore";
import type { Expense, Friendship, User, FriendFilter } from "@/types";
import { formatAmount } from "@/components/ui/AmountDisplay";

export type FriendListItem = {
  friend: User;
  balance: number;
  recentExpense: Expense | null;
  friendship?: Friendship;
};

export type DisplayItem =
  | {
      kind: "section";
      id: string;
      title: string;
      count: number;
    }
  | {
      kind: "friend";
      id: string;
      item: FriendListItem;
      sectionIndex: number;
      sectionCount: number;
    };

export function useFriendsList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const { toast } = useAppToast();

  const {
    data: groups = [],
    isLoading: isLoadingGroups,
    isError: isGroupsError,
    refetch: refetchGroups,
  } = useGroups(currentUser?.id);
  const {
    data: expenses = [],
    isError: isExpensesError,
    refetch: refetchExpenses,
  } = useUserExpenses(currentUser?.id);
  const {
    data: settlements = [],
    isError: isSettlementsError,
    refetch: refetchSettlements,
  } = useUserSettlements(currentUser?.id);
  const { data: friends = [], isLoading: isLoadingFriends } = useFriends(currentUser?.id);
  const { data: allFriendships = [] } = useAllFriendships(currentUser?.id);
  const { mutateAsync: acceptFriend } = useAcceptFriend();
  const { mutateAsync: rejectFriend } = useRejectFriend();
  const { mutateAsync: removeFriend } = useRemoveFriend();

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const { search, setSearch, debouncedSearch } = useDebouncedSearch();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FriendFilter>("all");

  const isLoading = isLoadingGroups || isLoadingFriends;

  const balances = useMemo(
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

  const totalOwedToMe = useMemo(() => {
    let total = 0;
    for (const balance of balances.values()) {
      if (balance > 0) total += balance;
    }
    return total;
  }, [balances]);

  const totalIOwe = useMemo(() => {
    let total = 0;
    for (const balance of balances.values()) {
      if (balance < 0) total += balance;
    }
    return Math.abs(total);
  }, [balances]);

  const acceptedFriendshipsByUserId = useMemo(() => {
    const friendshipMap = new Map<string, Friendship>();
    allFriendships.forEach((friendship) => {
      if (friendship.status === "accepted" && friendship.friendUser) {
        friendshipMap.set(friendship.friendUser.id, friendship);
      }
    });
    return friendshipMap;
  }, [allFriendships]);

  const pendingRequests = useMemo(
    () =>
      allFriendships.filter(
        (friendship) =>
          friendship.status === "pending" &&
          friendship.friendId === currentUser.id &&
          friendship.friendUser
      ),
    [allFriendships, currentUser.id]
  );

  const getRecentExpense = useCallback(
    (friendId: string) => {
      const shared = expenses.filter((expense) => {
        const involvesCurrentUser =
          expense.paidBy === currentUser.id ||
          expense.splits.some((split) => split.userId === currentUser.id);
        const involvesFriend =
          expense.paidBy === friendId || expense.splits.some((split) => split.userId === friendId);
        return involvesCurrentUser && involvesFriend;
      });

      if (shared.length === 0) return null;

      return shared.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    },
    [currentUser.id, expenses]
  );

  const friendRows = useMemo<FriendListItem[]>(() => {
    return friends
      .map((friend) => ({
        friend,
        balance: balances.get(friend.id) || 0,
        recentExpense: getRecentExpense(friend.id),
        friendship: acceptedFriendshipsByUserId.get(friend.id),
      }))
      .sort((a, b) => {
        const rank = (balance: number) => (balance > 0 ? 0 : balance < 0 ? 1 : 2);
        const rankDelta = rank(a.balance) - rank(b.balance);
        if (rankDelta !== 0) return rankDelta;

        const aDate = a.recentExpense ? new Date(a.recentExpense.date).getTime() : 0;
        const bDate = b.recentExpense ? new Date(b.recentExpense.date).getTime() : 0;
        if (aDate !== bDate) return bDate - aDate;

        return a.friend.name.localeCompare(b.friend.name);
      });
  }, [acceptedFriendshipsByUserId, balances, friends, getRecentExpense]);

  const filterCounts = useMemo(
    () => ({
      all: friendRows.length,
      owes_you: friendRows.filter((row) => row.balance > 0).length,
      you_owe: friendRows.filter((row) => row.balance < 0).length,
      settled: friendRows.filter((row) => row.balance === 0).length,
    }),
    [friendRows]
  );

  const searchMatchedRows = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return friendRows.filter((row) => {
      if (!query) return true;
      return (
        row.friend.name.toLowerCase().includes(query) ||
        row.friend.email.toLowerCase().includes(query)
      );
    });
  }, [friendRows, debouncedSearch]);

  const displayRows = useMemo<DisplayItem[]>(() => {
    const sectionConfigs: { key: string; title: string }[] = [
      { key: "owes_you", title: "Owes you" },
      { key: "you_owe", title: "You owe" },
      { key: "settled", title: "Settled" },
    ];

    const filteredSections =
      filter === "all"
        ? sectionConfigs
        : sectionConfigs.filter((section) => section.key === filter);

    return filteredSections.flatMap((section) => {
      const rows = searchMatchedRows.filter((row) => {
        if (section.key === "owes_you") return row.balance > 0;
        if (section.key === "you_owe") return row.balance < 0;
        return row.balance === 0;
      });

      if (rows.length === 0) return [];

      return [
        {
          kind: "section" as const,
          id: `section-${section.key}`,
          title: section.title,
          count: rows.length,
        },
        ...rows.map((item, index) => ({
          kind: "friend" as const,
          id: `friend-${item.friend.id}`,
          item,
          sectionIndex: index,
          sectionCount: rows.length,
        })),
      ];
    });
  }, [filter, searchMatchedRows]);

  const topBalanceAction = useMemo(() => {
    return (
      friendRows.find((row) => row.balance < 0) ?? friendRows.find((row) => row.balance > 0) ?? null
    );
  }, [friendRows]);

  const hasActiveFilters = search.trim().length > 0 || filter !== "all";

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: queryKeys.friends }),
        queryClient.refetchQueries({ queryKey: queryKeys.groups }),
        queryClient.refetchQueries({ queryKey: queryKeys.expenses }),
        queryClient.refetchQueries({ queryKey: queryKeys.settlements }),
        queryClient.refetchQueries({ queryKey: ["notifications"] }),
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const clearSearchAndFilter = useCallback(() => {
    setSearch("");
    setFilter("all");
  }, [setSearch]);

  const handleRequestAction = useCallback(
    async (friendshipId: string, action: "accept" | "reject") => {
      try {
        if (action === "accept") {
          await acceptFriend({ friendshipId });
        } else {
          await rejectFriend({ friendshipId });
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        toast.show({
          label: "Request failed",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "danger",
          placement: "top",
        });
      }
    },
    [acceptFriend, rejectFriend, toast]
  );

  const handleRemoveFriend = useCallback(
    (row: FriendListItem) => {
      if (!row.friendship) {
        Alert.alert(
          "Shared group contact",
          `${row.friend.name} appears here because you share a group. Remove them from the shared group to hide them from this list.`
        );
        return;
      }

      Alert.alert(
        "Remove friend?",
        "This removes the direct friendship. Shared group history and group membership stay unchanged.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                await removeFriend({ friendshipId: row.friendship!.id });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                toast.show({
                  label: "Friend removed",
                  description: `${row.friend.name} was removed from your direct friends.`,
                  variant: "success",
                  placement: "top",
                });
              } catch (error) {
                toast.show({
                  label: "Could not remove friend",
                  description: error instanceof Error ? error.message : "Please try again.",
                  variant: "danger",
                  placement: "top",
                });
              }
            },
          },
        ]
      );
    },
    [removeFriend, toast]
  );

  const handlePrimaryFriendAction = useCallback(
    async (row: FriendListItem) => {
      if (row.balance > 0) {
        try {
          await Share.share({
            message: `Hey ${row.friend.name.split(" ")[0]}! Just a quick reminder that you owe me ${formatAmount(Math.abs(row.balance), preferredCurrency.code)} on Splt. Let me know when you can settle up.`,
          });
        } catch (error) {
          console.log(error);
        }
        return;
      }

      if (row.balance < 0) {
        router.push({ pathname: "/settle/[id]", params: { id: row.friend.id } });
        return;
      }

      router.push({ pathname: "/expense/new", params: { friendId: row.friend.id } });
    },
    [preferredCurrency.code, router]
  );

  const isError = isGroupsError || isExpensesError || isSettlementsError;

  const refetchAll = useCallback(() => {
    if (isGroupsError) refetchGroups();
    if (isExpensesError) refetchExpenses();
    if (isSettlementsError) refetchSettlements();
  }, [
    isGroupsError,
    isExpensesError,
    isSettlementsError,
    refetchGroups,
    refetchExpenses,
    refetchSettlements,
  ]);

  return {
    currentUser,
    isLoading,
    isError,
    refetchAll,
    totalOwedToMe,
    totalIOwe,
    filterCounts,
    pendingRequests,
    topBalanceAction,
    displayRows,
    refreshing,
    search,
    setSearch,
    filter,
    setFilter,
    hasActiveFilters,
    onRefresh,
    clearSearchAndFilter,
    handleRequestAction,
    handleRemoveFriend,
    handlePrimaryFriendAction,
    preferredCurrency,
  };
}
