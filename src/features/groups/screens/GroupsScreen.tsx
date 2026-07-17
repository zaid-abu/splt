import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useCallback, useMemo } from "react";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { View, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import * as icons from "lucide-react-native";
import { FlashList } from "@shopify/flash-list";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { useQueryClient } from "@tanstack/react-query";

import { GroupCard } from "@/features/groups/components/GroupCard";
import { ListRowSkeleton } from "@/components/ui/Skeleton";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { ErrorState } from "@/components/ui/ErrorState";
import { useUI, ScreenHeader, MetricCell, SearchField, FilterPill } from "@/components/ui/native-ui";
import GlassBackground from "@/components/glassmorphism/GlassBackground";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import type { Group, GroupFilter } from "@/types";

const FILTERS: { key: GroupFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "owe", label: "You owe" },
  { key: "owed", label: "Owes you" },
  { key: "settled", label: "Settled" },
];

export default function GroupsScreen(): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const {
    data: groups = [],
    isLoading,
    isError: isGroupsError,
    refetch: refetchGroups,
  } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);

  const { search, setSearch, debouncedSearch } = useDebouncedSearch();
  const [filter, setFilter] = useState<GroupFilter>("all");
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

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
        .filter((expense) => expense.groupId === group.id)
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

  const ListHeaderComponent = useCallback(
    () => (
      <View>
        <View style={{ paddingHorizontal: space.page, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <MetricCell label="Groups" value={String(activeGroups.length)} />
            <MetricCell
              label="You owe"
              value={formatAmount(totals.youOwe, preferredCurrency.code)}
              tone={totals.youOwe > 0 ? "danger" : "neutral"}
            />
            <MetricCell
              label="Owed"
              value={formatAmount(totals.owedToYou, preferredCurrency.code)}
              tone={totals.owedToYou > 0 ? "success" : "neutral"}
            />
            <MetricCell
              label="Net"
              value={formatAmount(Math.abs(totals.netTotal), preferredCurrency.code)}
              tone={
                totals.netTotal < -0.005
                  ? "danger"
                  : totals.netTotal > 0.005
                    ? "success"
                    : "neutral"
              }
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: space.page, marginBottom: 14 }}>
          <SearchField
            value={search}
            onChangeText={setSearch}
            onClear={() => setSearch("")}
            placeholder="Search your groups..."
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            paddingHorizontal: space.page,
            marginBottom: 20,
          }}
        >
          {FILTERS.map((item) => (
            <FilterPill
              key={item.key}
              label={item.label}
              isActive={filter === item.key}
              onPress={() => setFilter(item.key)}
            />
          ))}
        </View>
      </View>
    ),
    [activeGroups.length, filter, preferredCurrency.code, search, setSearch, totals]
  );

  const ListEmptyComponent = useCallback(
    () => (
      <View style={{ paddingHorizontal: space.page }}>
        {isLoading ? (
          <View style={{ paddingTop: 20 }}>
            {[1, 2, 3].map((i) => (
              <ListRowSkeleton key={i} />
            ))}
          </View>
        ) : (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
              backgroundColor: color.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: color.border,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: radius.xl,
                backgroundColor: color.control,
                borderWidth: 1,
                borderColor: color.border,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <icons.Users size={32} color={color.text} strokeWidth={1.5} />
            </View>
            <Typography
              style={{
                fontSize: 18,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              No groups found
            </Typography>
            <Typography
              style={{
                fontSize: 15,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                textAlign: "center",
                lineHeight: 21,
                marginBottom: search || filter !== "all" ? 0 : 20,
              }}
            >
              {search
                ? "Try a different search term."
                : filter !== "all"
                  ? "No groups match this filter."
                  : "Create a group with friends to start splitting expenses easily."}
            </Typography>
            {!search && filter === "all" && (
              <Pressable
                onPress={() => router.push("/group/new")}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: color.text,
                  height: 52,
                  borderRadius: radius.pill,
                  paddingHorizontal: 28,
                  opacity: pressed ? 0.72 : 1,
                })}
              >
                <icons.Plus size={20} color={color.textInverse} strokeWidth={2} />
                <Typography
                  style={{
                    color: color.textInverse,
                    fontSize: 16,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    marginLeft: 8,
                  }}
                >
                  Create Group
                </Typography>
              </Pressable>
            )}
          </View>
        )}
      </View>
    ),
    [filter, isLoading, search, router]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ["groups"] });
    setRefreshing(false);
  }, [queryClient]);

  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: { group: Group; netBalance: number; latestExpenseAt: number };
      index: number;
    }) => {
      const isLast = index === filtered.length - 1;
      const isFirst = index === 0;

      return (
        <Animated.View
          entering={FadeInDown.duration(350)
            .delay(Math.min(index * 30, 200))
            .springify()}
          layout={LinearTransition.springify()}
        >
          <View style={{ paddingHorizontal: space.page }}>
            <GroupCard
              group={item.group}
              balance={item.netBalance}
              currency={preferredCurrency.code}
              latestExpenseAt={item.latestExpenseAt}
              index={index}
              isFirst={isFirst}
              isLast={isLast}
              onPress={() => router.push(`/group/${item.group.id}`)}
            />
          </View>
        </Animated.View>
      );
    },
    [filtered.length, preferredCurrency.code, router]
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <GlassBackground />
      <ThemedStatusBar />

      <View style={{ paddingTop: insets.top + 16 }}>
        <ScreenHeader
          title="Groups"
          rightAction={
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/group/new")}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: color.control,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: color.border,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <icons.Plus size={20} color={color.text} strokeWidth={1.5} />
            </Pressable>
          }
        />
      </View>

      {isGroupsError ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ErrorState onRetry={() => refetchGroups()} />
        </View>
      ) : (
        <FocusAwareView delay={0} style={{ flex: 1 }}>
          <FlashList
            data={filtered}
            renderItem={renderItem}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={{ paddingBottom: 130 }}
            showsVerticalScrollIndicator={false}
            extraData={{ filteredLength: filtered.length }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={color.text}
              />
            }
          />
        </FocusAwareView>
      )}
    </View>
  );
}
