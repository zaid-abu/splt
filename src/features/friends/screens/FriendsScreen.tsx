import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  LayoutAnimation,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useQueryClient } from "@tanstack/react-query";

import { FocusAwareView } from "@/components/animations/PageAnimator";
import { SwipeableRow } from "@/components/layout/SwipeableRow";
import { ListRowSkeleton } from "@/components/ui/Skeleton";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatActivityDate } from "@/utils/date";
import { getBalanceCopy } from "@/utils/balance";
import {
  UI,
  ScreenHeader,
  MetricCell,
  SearchField,
  FilterPill,
  EmptyState,
} from "@/components/ui/native-ui";
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
import { useAppToast } from "@/hooks/useAppToast";
import { queryKeys } from "@/queries/keys";
import { useUIStore } from "@/store/useUIStore";
import type { Expense, Friendship, User, FriendFilter, FriendSectionKey } from "@/types";

const TEXT_PRIMARY = UI.color.text;
const TEXT_SECONDARY = UI.color.muted;
const TEXT_DANGER = UI.color.danger;
const TEXT_SUCCESS = UI.color.success;
const SEPARATOR = UI.color.border;
const CONTROL_SURFACE = UI.color.control;


type FriendListItem = {
  friend: User;
  balance: number;
  recentExpense: Expense | null;
  friendship?: Friendship;
};

type DisplayItem =
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

function IconButton({
  icon: Icon,
  label,
  onPress,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  onPress: () => void;
}): JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 999,
        backgroundColor: CONTROL_SURFACE,
        borderWidth: 1,
        borderColor: SEPARATOR,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Icon size={20} color={TEXT_PRIMARY} strokeWidth={2} />
    </Pressable>
  );
}

export default function FriendsScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useAppToast();

  const { data: groups = [], isLoading: isLoadingGroups } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);
  const { data: friends = [], isLoading: isLoadingFriends } = useFriends(currentUser?.id);
  const { data: allFriendships = [] } = useAllFriendships(currentUser?.id);
  const { mutateAsync: acceptFriend } = useAcceptFriend();
  const { mutateAsync: rejectFriend } = useRejectFriend();
  const { mutateAsync: removeFriend } = useRemoveFriend();

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const [search, setSearch] = useState("");
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
    const query = search.trim().toLowerCase();
    return friendRows.filter((row) => {
      if (!query) return true;
      return (
        row.friend.name.toLowerCase().includes(query) ||
        row.friend.email.toLowerCase().includes(query)
      );
    });
  }, [friendRows, search]);

  const displayRows = useMemo<DisplayItem[]>(() => {
    const sectionConfigs: { key: FriendSectionKey; title: string }[] = [
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
    return friendRows.find((row) => row.balance < 0) ?? friendRows.find((row) => row.balance > 0);
  }, [friendRows]);

  const hasActiveFilters = search.trim().length > 0 || filter !== "all";

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.friends }),
      queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses }),
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements }),
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    ])
      .then(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [queryClient]);

  const clearSearchAndFilter = useCallback(() => {
    setSearch("");
    setFilter("all");
  }, []);

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

  const renderHeader = useCallback(
    () => (
      <View>
        <View style={{ paddingHorizontal: UI.space.page, marginBottom: 16 }}>
          <View
            style={{
              backgroundColor: UI.color.surface,
              borderRadius: UI.radius.lg,
              borderWidth: 1,
              borderColor: UI.color.border,
              padding: 14,
            }}
          >
            <View style={{ flexDirection: "row", gap: 10 }}>
              <MetricCell
                label="Owed to you"
                value={formatAmount(totalOwedToMe, preferredCurrency.code)}
                tone={totalOwedToMe > 0 ? "success" : "neutral"}
              />
              <MetricCell
                label="You owe"
                value={formatAmount(totalIOwe, preferredCurrency.code)}
                tone={totalIOwe > 0 ? "danger" : "neutral"}
              />
            </View>
            <Typography
              style={{
                marginTop: 12,
                fontSize: 13,
                lineHeight: 18,
                color: UI.color.muted,
                fontFamily: "IBMPlexSans_500Medium",
              }}
            >
              {filterCounts.all === 0
                ? "Add people you split with most often."
                : `${filterCounts.owes_you + filterCounts.you_owe} open balance${filterCounts.owes_you + filterCounts.you_owe === 1 ? "" : "s"} across ${filterCounts.all} friend${filterCounts.all === 1 ? "" : "s"}.`}
            </Typography>
          </View>
        </View>

        {(pendingRequests.length > 0 || topBalanceAction) && (
          <View style={{ paddingHorizontal: UI.space.page, marginBottom: 18 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <Typography
                style={{
                  fontSize: 18,
                  color: UI.color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  letterSpacing: -0.2,
                }}
              >
                Needs attention
              </Typography>
              <Typography
                style={{
                  fontSize: 13,
                  color: UI.color.muted,
                  fontFamily: "IBMPlexSans_500Medium",
                }}
              >
                {pendingRequests.length + (topBalanceAction ? 1 : 0)} item
                {pendingRequests.length + (topBalanceAction ? 1 : 0) === 1 ? "" : "s"}
              </Typography>
            </View>

            <View
              style={{
                backgroundColor: UI.color.surface,
                borderRadius: UI.radius.lg,
                borderWidth: 1,
                borderColor: UI.color.border,
                paddingHorizontal: 14,
              }}
            >
              {pendingRequests.slice(0, 2).map((request, index) => {
                const requester = request.friendUser!;
                const hasDivider =
                  index < pendingRequests.slice(0, 2).length - 1 || !!topBalanceAction;

                return (
                  <View
                    key={request.id}
                    style={{
                      minHeight: 68,
                      flexDirection: "row",
                      alignItems: "center",
                      borderBottomWidth: hasDivider ? 1 : 0,
                      borderBottomColor: SEPARATOR,
                      paddingVertical: 12,
                    }}
                  >
                    <AppUserAvatar user={requester} size="sm" />
                    <View style={{ flex: 1, marginLeft: 12, marginRight: 10 }}>
                      <Typography
                        numberOfLines={1}
                        style={{
                          fontSize: 15,
                          lineHeight: 20,
                          color: TEXT_PRIMARY,
                          fontFamily: "IBMPlexSans_600SemiBold",
                        }}
                      >
                        {requester.name}
                      </Typography>
                      <Typography
                        numberOfLines={1}
                        style={{
                          marginTop: 1,
                          fontSize: 13,
                          lineHeight: 17,
                          color: TEXT_SECONDARY,
                          fontFamily: "IBMPlexSans_500Medium",
                        }}
                      >
                        Wants to connect
                      </Typography>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Reject ${requester.name}'s request`}
                      onPress={() => handleRequestAction(request.id, "reject")}
                      hitSlop={8}
                      style={({ pressed }) => ({
                        width: 44,
                        height: 44,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: SEPARATOR,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 8,
                        opacity: pressed ? 0.62 : 1,
                      })}
                    >
                      <icons.X size={18} color={TEXT_SECONDARY} strokeWidth={2} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Accept ${requester.name}'s request`}
                      onPress={() => handleRequestAction(request.id, "accept")}
                      style={({ pressed }) => ({
                        width: 44,
                        height: 44,
                        borderRadius: 999,
                        backgroundColor: TEXT_PRIMARY,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: pressed ? 0.72 : 1,
                      })}
                    >
                      <icons.Check size={18} color="#FFFFFF" strokeWidth={2} />
                    </Pressable>
                  </View>
                );
              })}

              {topBalanceAction && (
                <View
                  style={{
                    minHeight: 68,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                  }}
                >
                  <AppUserAvatar
                    user={topBalanceAction.friend}
                    size="sm"
                    balance={topBalanceAction.balance}
                  />
                  <View style={{ flex: 1, marginLeft: 12, marginRight: 10 }}>
                    <Typography
                      numberOfLines={1}
                      style={{
                        fontSize: 15,
                        lineHeight: 20,
                        color: TEXT_PRIMARY,
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      {topBalanceAction.friend.name}
                    </Typography>
                    <Typography
                      numberOfLines={1}
                      style={{
                        marginTop: 1,
                        fontSize: 13,
                        lineHeight: 17,
                        color: topBalanceAction.balance > 0 ? TEXT_SUCCESS : TEXT_DANGER,
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      {topBalanceAction.balance > 0 ? "Remind about " : "Settle "}
                      {formatAmount(Math.abs(topBalanceAction.balance), preferredCurrency.code)}
                    </Typography>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => handlePrimaryFriendAction(topBalanceAction)}
                    style={({ pressed }) => ({
                      minHeight: 36,
                      paddingHorizontal: 14,
                      borderRadius: 999,
                      backgroundColor: TEXT_PRIMARY,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed ? 0.72 : 1,
                    })}
                  >
                    <Typography
                      style={{
                        fontSize: 13,
                        color: "#FFFFFF",
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      {topBalanceAction.balance > 0 ? "Remind" : "Settle"}
                    </Typography>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={{ paddingHorizontal: UI.space.page, marginBottom: 12 }}>
          <SearchField
            value={search}
            onChangeText={setSearch}
            onClear={() => setSearch("")}
            placeholder="Search friends or email"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: UI.space.page,
            paddingBottom: 4,
            gap: 8,
          }}
        >
          {(["all", "owes_you", "you_owe", "settled"] as const).map((value) => {
            const labels: Record<FriendFilter, string> = {
              all: "All",
              owes_you: "Owes you",
              you_owe: "You owe",
              settled: "Settled",
            };

            return (
              <FilterPill
                key={value}
                label={`${labels[value]} ${filterCounts[value]}`}
                isActive={filter === value}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setFilter(value);
                }}
              />
            );
          })}
        </ScrollView>
      </View>
    ),
    [
      filter,
      filterCounts,
      handlePrimaryFriendAction,
      handleRequestAction,
      pendingRequests,
      preferredCurrency.code,
      search,
      topBalanceAction,
      totalIOwe,
      totalOwedToMe,
    ]
  );

  const renderEmpty = useCallback(
    () => (
      <View style={{ paddingHorizontal: UI.space.page }}>
        {isLoading ? (
          <View style={{ paddingTop: 20 }}>
            {[1, 2, 3, 4].map((i) => <ListRowSkeleton key={i} />)}
          </View>
        ) : (
          <View style={{ marginTop: 20 }}>
            <EmptyState
              icon={icons.Users}
              title={
                hasActiveFilters ? "No friends match this view" : "Add the people you split with"
              }
              subtitle={
                hasActiveFilters
                  ? "Try a different name, email, or balance filter."
                  : "Friends and shared-group contacts will appear here with balances and recent activity."
              }
            />
            <View style={{ marginTop: 16, alignItems: "center" }}>
              <Pressable
                accessibilityRole="button"
                onPress={hasActiveFilters ? clearSearchAndFilter : () => router.push("/friend/new")}
                style={({ pressed }) => ({
                  minHeight: 44,
                  paddingHorizontal: 18,
                  borderRadius: UI.radius.pill,
                  backgroundColor: hasActiveFilters ? UI.color.control : UI.color.text,
                  borderWidth: 1,
                  borderColor: hasActiveFilters ? UI.color.border : UI.color.text,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Typography
                  style={{
                    fontSize: 14,
                    color: hasActiveFilters ? UI.color.text : "#FFFFFF",
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  {hasActiveFilters ? "Clear filters" : "Add friend"}
                </Typography>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    ),
    [clearSearchAndFilter, hasActiveFilters, isLoading, router]
  );

  const renderFriendRow = useCallback(
    (row: FriendListItem, sectionIndex: number, sectionCount: number) => {
      const { friend, balance, recentExpense } = row;
      const balanceCopy = getBalanceCopy(balance, preferredCurrency.code);
      const isFirst = sectionIndex === 0;
      const isLast = sectionIndex === sectionCount - 1;
      const actionLabel = balance > 0 ? "Remind" : balance < 0 ? "Settle" : "Add";
      const ActionIcon = balance > 0 ? icons.Bell : balance < 0 ? icons.CheckCircle2 : icons.Plus;

      return (
        <View style={{ paddingHorizontal: UI.space.page }}>
          <SwipeableRow
            onDelete={() => handleRemoveFriend(row)}
            onSettle={
              balance !== 0
                ? () => router.push({ pathname: "/settle/[id]", params: { id: friend.id } })
                : undefined
            }
            onRemind={balance > 0 ? () => handlePrimaryFriendAction(row) : undefined}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/friend/${friend.id}`);
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                minHeight: 78,
                paddingVertical: 12,
                paddingHorizontal: 14,
                backgroundColor: UI.color.surface,
                borderWidth: 1,
                borderColor: UI.color.border,
                borderTopWidth: isFirst ? 1 : 0,
                borderTopLeftRadius: isFirst ? UI.radius.lg : 0,
                borderTopRightRadius: isFirst ? UI.radius.lg : 0,
                borderBottomLeftRadius: isLast ? UI.radius.lg : 0,
                borderBottomRightRadius: isLast ? UI.radius.lg : 0,
                opacity: pressed ? 0.62 : 1,
              })}
            >
              <AppUserAvatar user={friend} size="md" balance={balance} />

              <View style={{ flex: 1, minWidth: 0, marginLeft: 12, marginRight: 10 }}>
                <Typography
                  numberOfLines={1}
                  style={{
                    fontSize: 16,
                    lineHeight: 21,
                    color: TEXT_PRIMARY,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    letterSpacing: -0.2,
                  }}
                >
                  {friend.name}
                </Typography>
                <Typography
                  numberOfLines={1}
                  style={{
                    marginTop: 2,
                    fontSize: 13,
                    lineHeight: 17,
                    color: TEXT_SECONDARY,
                    fontFamily: "IBMPlexSans_500Medium",
                  }}
                >
                  {recentExpense
                    ? `${recentExpense.title} - ${formatActivityDate(recentExpense.date)}`
                    : row.friendship
                      ? friend.email
                      : "Shared group contact"}
                </Typography>
              </View>

              <View style={{ alignItems: "flex-end", maxWidth: 116 }}>
                <View
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    borderRadius: 999,
                    backgroundColor: balanceCopy.bg,
                    borderWidth: 1,
                    borderColor: SEPARATOR,
                  }}
                >
                  <Typography
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={{
                      fontSize: 13,
                      lineHeight: 16,
                      color: balanceCopy.color,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    {balance === 0 ? balanceCopy.label : balanceCopy.amount}
                  </Typography>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={(event) => {
                    event.stopPropagation();
                    handlePrimaryFriendAction(row);
                  }}
                  style={({ pressed }) => ({
                    marginTop: 7,
                    minHeight: 36,
                    paddingHorizontal: 9,
                    borderRadius: 999,
                    backgroundColor: balance === 0 ? CONTROL_SURFACE : TEXT_PRIMARY,
                    borderWidth: 1,
                    borderColor: balance === 0 ? SEPARATOR : TEXT_PRIMARY,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    opacity: pressed ? 0.72 : 1,
                  })}
                >
                  <ActionIcon
                    size={13}
                    color={balance === 0 ? TEXT_PRIMARY : "#FFFFFF"}
                    strokeWidth={2}
                  />
                  <Typography
                    style={{
                      fontSize: 12,
                      lineHeight: 15,
                      color: balance === 0 ? TEXT_PRIMARY : "#FFFFFF",
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    {actionLabel}
                  </Typography>
                </Pressable>
              </View>
            </Pressable>
          </SwipeableRow>
        </View>
      );
    },
    [handlePrimaryFriendAction, handleRemoveFriend, preferredCurrency.code, router]
  );

  const renderItem = useCallback(
    ({ item }: { item: DisplayItem; index: number }) => {
      if (item.kind === "section") {
        return (
          <View
            style={{
              paddingHorizontal: UI.space.page,
              paddingTop: 18,
              paddingBottom: 9,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              style={{
                fontSize: 18,
                color: UI.color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
                letterSpacing: -0.2,
              }}
            >
              {item.title}
            </Typography>
            <Typography
              style={{
                fontSize: 13,
                color: UI.color.muted,
                fontFamily: "IBMPlexSans_500Medium",
              }}
            >
              {item.count}
            </Typography>
          </View>
        );
      }

      return (
        <Animated.View layout={LinearTransition.springify()}>
          {renderFriendRow(item.item, item.sectionIndex, item.sectionCount)}
        </Animated.View>
      );
    },
    [renderFriendRow]
  );

  return (
    <FocusAwareView style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <StatusBar style="dark" />

      <View style={{ paddingTop: insets.top + 16, backgroundColor: UI.color.bg }}>
        <ScreenHeader
          title="Friends"
          rightAction={
            <IconButton
              icon={icons.Plus}
              label="Add friend"
              onPress={() => router.push("/friend/new")}
            />
          }
        />
      </View>

      <Animated.FlatList
        data={displayRows}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={TEXT_PRIMARY}
            progressViewOffset={10}
          />
        }
      />
    </FocusAwareView>
  );
}
