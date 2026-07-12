import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useCallback, useMemo, useState } from "react";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { Alert, Pressable, Share, View } from "react-native";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQueryClient } from "@tanstack/react-query";

import { FocusAwareView } from "@/components/animations/PageAnimator";
import { SwipeableRow } from "@/components/layout/SwipeableRow";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { getBalanceCopy } from "@/utils/balance";
import { formatActivityDate } from "@/utils/date";
import { ErrorState } from "@/components/ui/ErrorState";
import { UI, ScreenHeader, IconButton } from "@/components/ui/native-ui";
import { useAuth } from "@/context/AppContext";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import {
  useAcceptFriend, useAllFriendships, useFriends, useRejectFriend, useRemoveFriend,
} from "@/features/friends/queries/useFriends";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import { useOverallBalances } from "@/features/settlements/hooks/useBalances";
import { useAppToast } from "@/hooks/useAppToast";
import { queryKeys } from "@/queries/keys";
import { useUIStore } from "@/store/useUIStore";
import type { Expense, Friendship, User, FriendFilter } from "@/types";

import { FriendsBalanceHeader } from "../components/FriendsBalanceHeader";
import { FriendsSearchBar } from "../components/FriendsSearchBar";
import { PendingRequestsBanner } from "../components/PendingRequestsBanner";
import { FriendsSectionList } from "../components/FriendsSectionList";

export type FriendListItem = {
  friend: User;
  balance: number;
  recentExpense: Expense | null;
  friendship?: Friendship;
};

export type DisplayItem =
  | { kind: "section"; id: string; title: string; count: number }
  | { kind: "friend"; id: string; item: FriendListItem; sectionIndex: number; sectionCount: number };

export default function FriendsScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useAppToast();

  const { data: groups = [], isLoading: isLoadingGroups, isError: isGroupsError, refetch: refetchGroups } = useGroups(currentUser?.id);
  const { data: expenses = [], isError: isExpensesError, refetch: refetchExpenses } = useUserExpenses(currentUser?.id);
  const { data: settlements = [], isError: isSettlementsError, refetch: refetchSettlements } = useUserSettlements(currentUser?.id);
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

  const { data: balances = new Map() } = useOverallBalances(
    currentUser.id, groups, expenses, settlements, preferredCurrency, convertCurrency
  );

  const totalOwedToMe = useMemo(() => {
    let total = 0;
    for (const balance of balances.values()) { if (balance > 0) total += balance; }
    return total;
  }, [balances]);

  const totalIOwe = useMemo(() => {
    let total = 0;
    for (const balance of balances.values()) { if (balance < 0) total += balance; }
    return Math.abs(total);
  }, [balances]);

  const acceptedFriendshipsByUserId = useMemo(() => {
    const map = new Map<string, Friendship>();
    allFriendships.forEach((f) => { if (f.status === "accepted" && f.friendUser) map.set(f.friendUser.id, f); });
    return map;
  }, [allFriendships]);

  const pendingRequests = useMemo(() =>
    allFriendships.filter((f) => f.status === "pending" && f.friendId === currentUser.id && f.friendUser),
    [allFriendships, currentUser.id]
  );

  const getRecentExpense = useCallback((friendId: string) => {
    const shared = expenses.filter((e) =>
      (e.paidBy === currentUser.id || e.splits.some((s) => s.userId === currentUser.id)) &&
      (e.paidBy === friendId || e.splits.some((s) => s.userId === friendId))
    );
    if (shared.length === 0) return null;
    return shared.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [currentUser.id, expenses]);

  const friendRows = useMemo<FriendListItem[]>(() =>
    friends.map((friend) => ({
      friend, balance: balances.get(friend.id) || 0,
      recentExpense: getRecentExpense(friend.id),
      friendship: acceptedFriendshipsByUserId.get(friend.id),
    })).sort((a, b) => {
      const rank = (balance: number) => balance > 0 ? 0 : balance < 0 ? 1 : 2;
      const rankDelta = rank(a.balance) - rank(b.balance);
      if (rankDelta !== 0) return rankDelta;
      const aDate = a.recentExpense ? new Date(a.recentExpense.date).getTime() : 0;
      const bDate = b.recentExpense ? new Date(b.recentExpense.date).getTime() : 0;
      if (aDate !== bDate) return bDate - aDate;
      return a.friend.name.localeCompare(b.friend.name);
    }),
    [acceptedFriendshipsByUserId, balances, friends, getRecentExpense]
  );

  const filterCounts = useMemo(() => ({
    all: friendRows.length,
    owes_you: friendRows.filter((r) => r.balance > 0).length,
    you_owe: friendRows.filter((r) => r.balance < 0).length,
    settled: friendRows.filter((r) => r.balance === 0).length,
  }), [friendRows]);

  const searchMatchedRows = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return friendRows.filter((r) => !query || r.friend.name.toLowerCase().includes(query) || r.friend.email.toLowerCase().includes(query));
  }, [friendRows, debouncedSearch]);

  const displayRows = useMemo<DisplayItem[]>(() => {
    const sectionConfigs = [
      { key: "owes_you" as const, title: "Owes you" },
      { key: "you_owe" as const, title: "You owe" },
      { key: "settled" as const, title: "Settled" },
    ];
    const sections = filter === "all" ? sectionConfigs : sectionConfigs.filter((s) => s.key === filter);
    return sections.flatMap((section) => {
      const rows = searchMatchedRows.filter((r) => {
        if (section.key === "owes_you") return r.balance > 0;
        if (section.key === "you_owe") return r.balance < 0;
        return r.balance === 0;
      });
      if (rows.length === 0) return [];
      return [
        { kind: "section" as const, id: `section-${section.key}`, title: section.title, count: rows.length },
        ...rows.map((item, idx) => ({ kind: "friend" as const, id: `friend-${item.friend.id}`, item, sectionIndex: idx, sectionCount: rows.length })),
      ];
    });
  }, [filter, searchMatchedRows]);

  const topBalanceAction = useMemo(() =>
    friendRows.find((r) => r.balance < 0) ?? friendRows.find((r) => r.balance > 0) ?? null,
    [friendRows]
  );

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
    } finally { setRefreshing(false); }
  }, [queryClient]);

  const handleRequestAction = useCallback(async (friendshipId: string, action: "accept" | "reject") => {
    try {
      if (action === "accept") await acceptFriend({ friendshipId });
      else await rejectFriend({ friendshipId });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      toast.show({ label: "Request failed", description: error instanceof Error ? error.message : "Please try again.", variant: "danger", placement: "top" });
    }
  }, [acceptFriend, rejectFriend, toast]);

  const handleRemoveFriend = useCallback((row: FriendListItem) => {
    if (!row.friendship) {
      Alert.alert("Shared group contact", `${row.friend.name} appears here because you share a group. Remove them from the shared group to hide them from this list.`);
      return;
    }
    Alert.alert("Remove friend?", "This removes the direct friendship. Shared group history and group membership stay unchanged.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: async () => {
          try {
            await removeFriend({ friendshipId: row.friendship!.id });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.show({ label: "Friend removed", description: `${row.friend.name} was removed from your direct friends.`, variant: "success", placement: "top" });
          } catch (error) {
            toast.show({ label: "Could not remove friend", description: error instanceof Error ? error.message : "Please try again.", variant: "danger", placement: "top" });
          }
        },
      },
    ]);
  }, [removeFriend, toast]);

  const handlePrimaryFriendAction = useCallback(async (row: FriendListItem) => {
    if (row.balance > 0) {
      try {
        await Share.share({ message: `Hey ${row.friend.name.split(" ")[0]}! Just a quick reminder that you owe me ${formatAmount(Math.abs(row.balance), preferredCurrency.code)} on Splt. Let me know when you can settle up.` });
      } catch (error) {
        console.log(error);
      }
      return;
    }
    if (row.balance < 0) { router.push({ pathname: "/settle/[id]", params: { id: row.friend.id } }); return; }
    router.push({ pathname: "/expense/new", params: { friendId: row.friend.id } });
  }, [preferredCurrency.code, router]);

  const clearSearchAndFilter = useCallback(() => { setSearch(""); setFilter("all"); }, [setSearch]);

  const onAcceptRequest = useCallback(
    (id: string) => handleRequestAction(id, "accept"),
    [handleRequestAction]
  );
  const onRejectRequest = useCallback(
    (id: string) => handleRequestAction(id, "reject"),
    [handleRequestAction]
  );
  const onBannerPrimaryAction = useCallback(
    (row: { friend: User; balance: number }) =>
      handlePrimaryFriendAction({
        friend: row.friend,
        balance: row.balance,
        recentExpense: getRecentExpense(row.friend.id),
        friendship: acceptedFriendshipsByUserId.get(row.friend.id) ?? undefined,
      }),
    [handlePrimaryFriendAction, getRecentExpense, acceptedFriendshipsByUserId]
  );
  const onSearchClear = useCallback(() => setSearch(""), [setSearch]);

  const ListHeaderComponent = useCallback(() => (
    <>
      <FriendsBalanceHeader totalOwedToMe={totalOwedToMe} totalIOwe={totalIOwe} preferredCurrencyCode={preferredCurrency.code} filterCounts={filterCounts} />
      <PendingRequestsBanner pendingRequests={pendingRequests} topBalanceAction={topBalanceAction} preferredCurrencyCode={preferredCurrency.code} onAccept={onAcceptRequest} onReject={onRejectRequest} onPrimaryAction={onBannerPrimaryAction} />
      <FriendsSearchBar search={search} onSearchChange={setSearch} onSearchClear={onSearchClear} filter={filter} onFilterChange={setFilter} filterCounts={filterCounts} />
    </>
  ), [totalOwedToMe, totalIOwe, preferredCurrency.code, filterCounts, pendingRequests, topBalanceAction, onAcceptRequest, onRejectRequest, onBannerPrimaryAction, search, setSearch, onSearchClear, filter, setFilter]);

  const renderFriendRow = useCallback(
    (row: FriendListItem, sectionIndex: number, sectionCount: number) => {
      const { friend, balance, recentExpense } = row;
      const balanceCopy = getBalanceCopy(balance, preferredCurrency.code);
      const isFirst = sectionIndex === 0;
      const isLast = sectionIndex === sectionCount - 1;
      const actionLabel = balance > 0 ? "Remind" : balance < 0 ? "Settle" : "Add";
      const ActionIcon = balance > 0 ? icons.Bell : balance < 0 ? icons.CheckCircle2 : icons.Plus;

      return (
        <SwipeableRow
          onDelete={() => handleRemoveFriend(row)}
          onSettle={balance !== 0 ? () => router.push({ pathname: "/settle/[id]", params: { id: friend.id } }) : undefined}
          onRemind={balance > 0 ? () => handlePrimaryFriendAction(row) : undefined}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/friend/${friend.id}`); }}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", minHeight: 78, paddingVertical: 12,
              paddingHorizontal: 14, backgroundColor: UI.color.surface, borderWidth: 1,
              borderColor: UI.color.border, borderTopWidth: isFirst ? 1 : 0,
              borderTopLeftRadius: isFirst ? UI.radius.lg : 0,
              borderTopRightRadius: isFirst ? UI.radius.lg : 0,
              borderBottomLeftRadius: isLast ? UI.radius.lg : 0,
              borderBottomRightRadius: isLast ? UI.radius.lg : 0,
              opacity: pressed ? 0.62 : 1,
            })}
          >
            <AppUserAvatar user={friend} size="md" balance={balance} />
            <View style={{ flex: 1, minWidth: 0, marginLeft: 12, marginRight: 10 }}>
              <Typography numberOfLines={1} style={{ fontSize: 16, lineHeight: 21, color: UI.color.text, fontFamily: "IBMPlexSans_600SemiBold", letterSpacing: -0.2 }}>
                {friend.name}
              </Typography>
              <Typography numberOfLines={1} style={{ marginTop: 2, fontSize: 13, lineHeight: 17, color: UI.color.muted, fontFamily: "IBMPlexSans_500Medium" }}>
                {recentExpense ? `${recentExpense.title} - ${formatActivityDate(recentExpense.date)}` : row.friendship ? friend.email : "Shared group contact"}
              </Typography>
            </View>
            <View style={{ alignItems: "flex-end", maxWidth: 116 }}>
              <View style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: balanceCopy.bg, borderWidth: 1, borderColor: UI.color.border }}>
                <Typography numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 13, lineHeight: 16, color: balanceCopy.color, fontFamily: "IBMPlexSans_600SemiBold" }}>
                  {balance === 0 ? balanceCopy.label : balanceCopy.amount}
                </Typography>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={(event) => { event.stopPropagation(); handlePrimaryFriendAction(row); }}
                style={({ pressed }) => ({
                  marginTop: 7, minHeight: 36, paddingHorizontal: 9, borderRadius: 999,
                  backgroundColor: balance === 0 ? UI.color.control : UI.color.text,
                  borderWidth: 1, borderColor: balance === 0 ? UI.color.border : UI.color.text,
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
                  opacity: pressed ? 0.72 : 1,
                })}
              >
                <ActionIcon size={13} color={balance === 0 ? UI.color.text : UI.color.textInverse} strokeWidth={2} />
                <Typography style={{ fontSize: 12, lineHeight: 15, color: balance === 0 ? UI.color.text : UI.color.textInverse, fontFamily: "IBMPlexSans_600SemiBold" }}>
                  {actionLabel}
                </Typography>
              </Pressable>
            </View>
          </Pressable>
        </SwipeableRow>
      );
    },
    [handlePrimaryFriendAction, handleRemoveFriend, preferredCurrency.code, router]
  );

  return (
    <FocusAwareView style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <ThemedStatusBar />
      <Animated.View entering={FadeInDown.duration(350).springify()} style={{ paddingTop: insets.top + 16, backgroundColor: UI.color.bg }}>
        <ScreenHeader title="Friends" rightAction={<IconButton icon={icons.Plus} accessibilityLabel="Add friend" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/friend/new"); }} />} />
      </Animated.View>
      {isGroupsError || isExpensesError || isSettlementsError ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ErrorState onRetry={() => { if (isGroupsError) refetchGroups(); if (isExpensesError) refetchExpenses(); if (isSettlementsError) refetchSettlements(); }} />
        </View>
      ) : (
        <FriendsSectionList
          displayRows={displayRows}
          renderFriendRow={renderFriendRow}
          onRefresh={onRefresh}
          refreshing={refreshing}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearSearchAndFilter}
          isLoading={isLoading}
          ListHeaderComponent={ListHeaderComponent}
          insetsBottom={insets.bottom}
        />
      )}
    </FocusAwareView>
  );
}
