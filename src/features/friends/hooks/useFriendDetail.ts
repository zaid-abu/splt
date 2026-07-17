import { useMemo, useRef, useCallback, useState } from "react";
import { Alert as RNAlert, Share } from "react-native";
import { useRouter } from "expo-router";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/context/AppContext";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import {
  useAllFriendships,
  useFriends,
  useRemoveFriend,
} from "@/features/friends/queries/useFriends";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import { useAppToast } from "@/hooks/useAppToast";
import { useUIStore } from "@/store/useUIStore";
import { formatAmount } from "@/components/ui/AmountDisplay";
import type { User } from "@/types";

export function useFriendDetail(friendId: string) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useAppToast();
  const queryClient = useQueryClient();

  const optionsSheetRef = useRef<BottomSheetModal>(null);

  const handleOpenOptions = useCallback(() => {
    optionsSheetRef.current?.present();
  }, []);

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const isAppLoading = useUIStore((s) => s.isAppLoading);
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
  const { data: friendsList = [], isLoading: isLoadingFriends } = useFriends(currentUser?.id);
  const {
    data: allFriendships = [],
    isError: isFriendshipsError,
    refetch: refetchFriendships,
  } = useAllFriendships(currentUser?.id);
  const { mutateAsync: removeFriend } = useRemoveFriend();

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

  const friend = useMemo(
    () => friendsList.find((f) => f.id === friendId) ?? null,
    [friendsList, friendId]
  );

  const isLoading =
    isAppLoading ||
    isLoadingGroups ||
    isLoadingExpenses ||
    isLoadingSettlements ||
    isLoadingFriends;

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: ["expenses", "settlements", "friends", "groups"],
    });
    setRefreshing(false);
  }, [queryClient]);

  const directFriendship = useMemo(
    () =>
      allFriendships.find(
        (friendship) =>
          friendship.status === "accepted" && friendship.friendUser?.id === friendId
      ) ?? null,
    [allFriendships, friendId]
  );

  const sharedActivities = useMemo(() => {
    const sharedExp = expenses
      .filter((e) => {
        const friendInvolved = e.paidBy === friendId || e.splits.some((s) => s.userId === friendId);
        const currentUserInvolved =
          e.paidBy === currentUser.id || e.splits.some((s) => s.userId === currentUser.id);
        return friendInvolved && currentUserInvolved && !e.groupId;
      })
      .map((e) => ({
        id: `exp-${e.id}`,
        type: "expense" as const,
        userId: currentUser.id,
        user: currentUser as User,
        expense: e,
        description: e.title,
        date: e.date,
        currency: e.currency,
      }));

    const sharedSet = settlements
      .filter((s) => {
        const friendInvolved = s.fromUserId === friendId || s.toUserId === friendId;
        const currentUserInvolved =
          s.fromUserId === currentUser.id || s.toUserId === currentUser.id;
        return friendInvolved && currentUserInvolved && !s.groupId;
      })
      .map((s) => ({
        id: `set-${s.id}`,
        type: "settlement" as const,
        userId: currentUser.id,
        user: currentUser as User,
        settlement: s,
        description: "Settled up",
        date: s.date,
        currency: s.currency,
      }));

    return [...sharedExp, ...sharedSet].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [expenses, settlements, friendId, currentUser]);

  const netBalance = balances.get(friendId ?? "") || 0;
  const isPositive = netBalance > 0;
  const isSettled = netBalance === 0;

  const sharedGroups = useMemo(
    () => groups.filter((group) => group.members.some((member) => member.userId === friendId)),
    [groups, friendId]
  );

  const sharedGroupsWithRecentActivity = useMemo(
    () =>
      sharedGroups.map((group) => {
        const latestExpense = expenses
          .filter(
            (expense) =>
              expense.groupId === group.id &&
              (expense.paidBy === friendId ||
                expense.splits.some((split) => split.userId === friendId)) &&
              (expense.paidBy === currentUser.id ||
                expense.splits.some((split) => split.userId === currentUser.id))
          )
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        return {
          group,
          latestExpense: latestExpense ?? null,
        };
      }),
    [currentUser.id, expenses, friendId, sharedGroups]
  );

  const categorySpending = useMemo(() => {
    const totals: Record<string, number> = {};
    sharedActivities.forEach((activity) => {
      if (activity.type === "expense" && activity.expense) {
        const cat = activity.expense.category || "other";
        const amount = convertCurrency(
          activity.expense.amount,
          activity.currency || preferredCurrency.code,
          preferredCurrency.code
        );
        totals[cat] = (totals[cat] || 0) + amount;
      }
    });
    return Object.entries(totals)
      .filter(([, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({
        cat,
        amount,
      }));
  }, [sharedActivities, preferredCurrency.code, convertCurrency]);

  const handleShareBalance = useCallback(async () => {
    if (!friend) return;

    const balanceCopy = isSettled
      ? `You and ${friend.name} are settled up on Splt.`
      : isPositive
        ? `${friend.name} owes you ${formatAmount(Math.abs(netBalance), preferredCurrency.code)} on Splt.`
        : `You owe ${friend.name} ${formatAmount(Math.abs(netBalance), preferredCurrency.code)} on Splt.`;

    try {
      optionsSheetRef.current?.dismiss();
      await Share.share({ message: balanceCopy });
    } catch (error) {
      toast.show({
        label: "Could not share balance",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "danger",
        placement: "top",
      });
    }
  }, [friend, isPositive, isSettled, netBalance, preferredCurrency.code, toast]);

  const handleRemind = useCallback(async () => {
    if (!friend || netBalance <= 0) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Share.share({
        message: `Hey ${friend.name.split(" ")[0]}, quick reminder that you owe me ${formatAmount(Math.abs(netBalance), preferredCurrency.code)} on Splt.`,
      });
    } catch (error) {
      toast.show({
        label: "Could not send reminder",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "danger",
        placement: "top",
      });
    }
  }, [friend, netBalance, preferredCurrency.code, toast]);

  const handleShowContact = useCallback(() => {
    if (!friend) return;

    optionsSheetRef.current?.dismiss();
    RNAlert.alert(friend.name, friend.email);
  }, [friend]);

  const handleRemoveFriend = useCallback(() => {
    if (!friend) return;

    optionsSheetRef.current?.dismiss();

    if (!directFriendship) {
      RNAlert.alert(
        "Shared group contact",
        `${friend.name} appears here because you share a group. Remove them from the shared group to hide them from this list.`
      );
      return;
    }

    RNAlert.alert(
      "Remove friend?",
      "This removes the direct friendship. Shared group history and group membership stay unchanged.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFriend({ friendshipId: directFriendship.id });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              toast.show({
                label: "Friend removed",
                description: `${friend.name} was removed from your direct friends.`,
                variant: "success",
                placement: "top",
              });
              router.replace("/(tabs)/friends");
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
  }, [directFriendship, friend, removeFriend, router, toast]);

  const recentActivity = sharedActivities[0] ?? null;
  const lastActivityCopy = recentActivity
    ? `Last activity: ${recentActivity.description}`
    : "No shared one-on-one activity yet";

  const isError = isGroupsError || isExpensesError || isSettlementsError || isFriendshipsError;

  const refetchAll = useCallback(() => {
    if (isGroupsError) refetchGroups();
    if (isExpensesError) refetchExpenses();
    if (isSettlementsError) refetchSettlements();
    if (isFriendshipsError) refetchFriendships();
  }, [isGroupsError, isExpensesError, isSettlementsError, isFriendshipsError, refetchGroups, refetchExpenses, refetchSettlements, refetchFriendships]);

  return {
    currentUser,
    friend,
    isLoading,
    isError,
    refetchAll,
    refreshing,
    onRefresh,
    netBalance,
    isPositive,
    isSettled,
    directFriendship,
    sharedActivities,
    sharedGroups,
    sharedGroupsWithRecentActivity,
    categorySpending,
    lastActivityCopy,
    preferredCurrency,
    optionsSheetRef,
    handleOpenOptions,
    handleShareBalance,
    handleRemind,
    handleShowContact,
    handleRemoveFriend,
  };
}
