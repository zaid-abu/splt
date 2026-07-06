import type { JSX } from "react";
import { useState, useMemo, useCallback } from "react";
import {
  View,
  RefreshControl,
  TextInput,
  ScrollView,
  Share,
  LayoutAnimation,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";

import { Text } from "@/components/primitives/Text";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pressable } from "@/components/primitives/Pressable";

import { FocusAwareView } from "@/components/animations/PageAnimator";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useFriends } from "@/features/friends/queries/useFriends";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@/types";

export default function FriendsScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? "";
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading: isLoadingGroups } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);
  const { data: friends = [], isLoading: isLoadingFriends } = useFriends(currentUser?.id);

  const isLoading = isLoadingGroups || isLoadingFriends;

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "owes_you" | "you_owe" | "settled">("all");

  const balances = useMemo(
    () => balancesUtil.getUserBalances(userId, undefined, groups, expenses, settlements, preferredCurrency, convertCurrency),
    [userId, groups, expenses, settlements, preferredCurrency, convertCurrency],
  );

  const totalOwedToMe = useMemo(
    () => balancesUtil.getTotalOwedToMe(userId, groups, expenses, settlements, preferredCurrency, convertCurrency),
    [userId, groups, expenses, settlements, preferredCurrency, convertCurrency],
  );

  const totalIOwe = useMemo(
    () => balancesUtil.getTotalIOwe(userId, groups, expenses, settlements, preferredCurrency, convertCurrency),
    [userId, groups, expenses, settlements, preferredCurrency, convertCurrency],
  );

  const filtered = useMemo(() => {
    let result = friends;
    if (search.trim()) {
      result = result.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (filter !== "all") {
      result = result.filter((f) => {
        const bal = balances.get(f.id) ?? 0;
        if (filter === "owes_you") return bal > 0;
        if (filter === "you_owe") return bal < 0;
        if (filter === "settled") return bal === 0;
        return true;
      });
    }
    return result;
  }, [friends, search, filter, balances]);

  const getRecentExpense = useCallback(
    (friendId: string) => {
      const shared = expenses.filter((e) => {
        const involvesCurrentUser = e.paidBy === userId || e.splits.some((s) => s.userId === userId);
        const involvesFriend = e.paidBy === friendId || e.splits.some((s) => s.userId === friendId);
        return involvesCurrentUser && involvesFriend;
      });
      if (shared.length === 0) return null;
      return shared.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    },
    [expenses, userId],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await queryClient.invalidateQueries();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [queryClient]);

  const renderItem = useCallback(
    ({ item }: { item: User }) => {
      const bal = balances.get(item.id) ?? 0;
      const recentExpense = getRecentExpense(item.id);

      return (
        <Animated.View layout={LinearTransition}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/friend/${item.id}`);
            }}
            className="flex-row items-center py-5 px-6 bg-surface border-b border-divider active:bg-surface-2"
          >
            <View className="mr-4">
              <AppUserAvatar user={item} size="lg" />
            </View>
            <View className="flex-1">
              <Text variant="body" className="font-bold mb-0.5">{item.name}</Text>
              <View>
                {recentExpense ? (
                  <Text variant="caption" color="muted" numberOfLines={1}>
                    Last: {recentExpense.title} • {formatAmount(recentExpense.amount, recentExpense.currency)}
                  </Text>
                ) : (
                  <View className="h-1" />
                )}
                {bal === 0 ? (
                  <Text variant="bodySmall" color="muted">Settled up</Text>
                ) : (
                  <Text variant="bodySmall" className={`font-bold ${bal > 0 ? "text-success" : "text-foreground"}`}>
                    {bal > 0 ? "Owes you " : "You owe "}
                    {formatAmount(Math.abs(bal), preferredCurrency.code)}
                  </Text>
                )}
              </View>
            </View>
            <View className="ml-2">
              <icons.ChevronRight size={24} color="#8E8E93" strokeWidth={1} />
            </View>
          </Pressable>
        </Animated.View>
      );
    },
    [balances, preferredCurrency.code, router, getRecentExpense],
  );

  const ListEmptyComponent = useCallback(
    () => (
      <View className="px-6 items-center justify-center pt-20">
        {isLoading ? (
          <Spinner />
        ) : (
          <EmptyState
            icon="Users"
            title={search || filter !== "all" ? "No friends found" : "Your network is empty"}
            description={
              search || filter !== "all"
                ? "Try a different search term or filter."
                : "Add friends to easily split bills, track balances, and settle up in seconds."
            }
            action={
              !search
                ? { label: "Add a Friend", onPress: () => router.push("/friend/new") }
                : undefined
            }
          />
        )}
      </View>
    ),
    [isLoading, search, filter, router],
  );

  if (!currentUser) return <></>;
  return (
    <View className="flex-1 bg-background">
      <FocusAwareView delay={0} className="flex-1">
        <View style={{ paddingTop: insets.top + 16, paddingBottom: 24 }} className="px-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text variant="screenTitle" className="text-foreground">
              Friends
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.push("/friend/new")}
              className="w-11 h-11 rounded-xl items-center justify-center p-0 border border-border"
            >
              <icons.Plus size={20} className="text-foreground" strokeWidth={1.5} />
            </Button>
          </View>

          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 border border-border rounded-xl p-4 bg-surface">
              <Text variant="bodySmall" color="muted" className="font-semibold mb-2">Owed to you</Text>
              <Text variant="amountSmall" className="text-success" numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(totalOwedToMe, preferredCurrency.code)}
              </Text>
            </View>
            <View className="flex-1 border border-border rounded-xl p-4 bg-surface">
              <Text variant="bodySmall" color="muted" className="font-semibold mb-2">You owe</Text>
              <Text variant="amountSmall" className="text-danger" numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(totalIOwe, preferredCurrency.code)}
              </Text>
            </View>
          </View>

          <View className="mb-4">
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Search friends..."
              leftElement={<icons.Search size={20} className="text-muted-foreground" strokeWidth={1.5} />}
              rightElement={search.length > 0 ? (
                <Pressable onPress={() => setSearch("")} hitSlop={8}>
                  <icons.XCircle size={20} className="text-muted-foreground" strokeWidth={1.5} />
                </Pressable>
              ) : undefined}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {(["all", "owes_you", "you_owe", "settled"] as const).map((f) => {
              const isSelected = filter === f;
              const label = f === "all" ? "All" : f === "owes_you" ? "Owes You" : f === "you_owe" ? "You Owe" : "Settled Up";
              return (
                <Pressable
                  key={f}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setFilter(f);
                  }}
                  className={`px-4 py-2 rounded-xl border active:bg-surface-2 ${
                    isSelected ? "bg-primary border-primary" : "bg-surface border-border"
                  }`}
                >
                  <Text variant="bodySmall" className={`font-bold ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <Animated.FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          itemLayoutAnimation={LinearTransition}
          renderItem={renderItem}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FB923C" progressViewOffset={10} />
          }
        />
      </FocusAwareView>
    </View>
  );
}
