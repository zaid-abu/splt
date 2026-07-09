import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useCallback, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import * as icons from "lucide-react-native";
import { FlashList } from "@shopify/flash-list";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import Animated, { LinearTransition } from "react-native-reanimated";

import { GroupCard } from "@/features/groups/components/GroupCard";
import { AppLoader } from "@/components/ui/AppLoader";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { UI, ScreenHeader, MetricCell, SearchField, FilterPill, EmptyState } from "@/components/ui/native-ui";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import type { Group } from "@/types";

type GroupFilter = "all" | "owe" | "owed" | "settled";

const FILTERS: { key: GroupFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "owe", label: "You owe" },
  { key: "owed", label: "Owes you" },
  { key: "settled", label: "Settled" },
];

export default function GroupsScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const { data: groups = [], isLoading } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<GroupFilter>("all");

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
        return acc;
      },
      { youOwe: 0, owedToYou: 0 }
    );
  }, [activeGroups]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return activeGroups.filter((item) => {
      if (term && !item.group.name.toLowerCase().includes(term)) return false;
      if (filter === "owe") return item.netBalance < -0.005;
      if (filter === "owed") return item.netBalance > 0.005;
      if (filter === "settled") return Math.abs(item.netBalance) <= 0.005;
      return true;
    });
  }, [activeGroups, filter, search]);

  const ListHeaderComponent = useCallback(
    () => (
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
                backgroundColor: UI.color.control,
                borderRadius: UI.radius.pill,
                borderWidth: 1,
                borderColor: UI.color.border,
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <icons.Plus size={20} color={UI.color.text} strokeWidth={1.5} />
            </Pressable>
          }
        />

        <View style={{ paddingHorizontal: UI.space.page, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <MetricCell
              label="Groups"
              value={String(activeGroups.length)}
            />
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
          </View>
        </View>

        <View style={{ paddingHorizontal: UI.space.page, marginBottom: 14 }}>
          <SearchField
            value={search}
            onChangeText={setSearch}
            onClear={() => setSearch("")}
            placeholder="Search your groups..."
          />
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: UI.space.page, marginBottom: 20 }}>
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
    [activeGroups.length, filter, insets.top, preferredCurrency.code, router, search, totals]
  );

  const ListEmptyComponent = useCallback(
    () => (
      <View style={{ paddingHorizontal: UI.space.page }}>
        {isLoading ? (
          <View style={{ paddingTop: 40 }}>
            <AppLoader />
          </View>
        ) : (
          <EmptyState
            icon={icons.Users}
            title="No groups found"
            subtitle={
              search
                ? "Try a different search term."
                : filter !== "all"
                  ? "No groups match this filter."
                  : "Create a group with friends to start splitting expenses easily."
            }
          />
        )}
        {!search && filter === "all" && !isLoading && (
          <View style={{ marginTop: 16 }}>
            <Pressable
              onPress={() => router.push("/group/new")}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: UI.color.text,
                height: 56,
                borderRadius: UI.radius.pill,
                paddingHorizontal: 32,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <icons.Plus size={20} color="#FFFFFF" strokeWidth={2} />
              <Typography
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  marginLeft: 8,
                }}
              >
                Create Group
              </Typography>
            </Pressable>
          </View>
        )}
      </View>
    ),
    [filter, isLoading, search, router]
  );

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
        <Animated.View layout={LinearTransition.springify()}>
          <View style={{ paddingHorizontal: UI.space.page }}>
            <GroupCard
              group={item.group}
              balance={item.netBalance}
              currency={preferredCurrency.code}
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
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <StatusBar style="dark" />

      <FocusAwareView delay={0} style={{ flex: 1 }}>
        <FlashList
          data={filtered}
          renderItem={renderItem}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          extraData={{ filteredLength: filtered.length }}
        />
      </FocusAwareView>
    </View>
  );
}
