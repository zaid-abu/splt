import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useMemo, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { FocusAwareView } from "@/components/animations/PageAnimator";
import { Text } from "@/components/primitives/Text";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";

import { GroupCard } from "@/features/groups/components/GroupCard";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import type { Group } from "@/types";

export default function GroupsScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? "";

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const { data: groups = [], isLoading } = useGroups(currentUser?.id);
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: settlements = [] } = useUserSettlements(currentUser?.id);

  const [search, setSearch] = useState("");

  const activeGroups = useMemo(() => {
    return groups.map((group) => {
      const balancesMap = balancesUtil.getUserBalances(
        userId,
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
      return { group, netBalance };
    });
  }, [groups, userId, expenses, settlements, preferredCurrency, convertCurrency]);

  const filtered = search.trim()
    ? activeGroups.filter((g) => g.group.name.toLowerCase().includes(search.toLowerCase()))
    : activeGroups;

  const HeaderComponent = useCallback(
    () => (
      <View style={{ marginTop: insets.top + 16, marginBottom: 24 }} className="px-6">
        <View className="flex-row justify-between mb-6">
          <Text variant="screenTitle" className="text-foreground">Groups</Text>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.push("/group/new")}
            className="w-11 h-11 rounded-xl items-center justify-center p-0"
          >
            
              <icons.Plus size={20} className="text-foreground" strokeWidth={1.5} />
            
          </Button>
        </View>

        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Search your groups..."
          leftElement={
              <icons.Search size={20} className="text-muted-foreground" strokeWidth={1.5} />
            }
          rightElement={search.length > 0 ? (
                <Pressable onPress={() => setSearch("")} hitSlop={8}>
                  <icons.XCircle size={20} className="text-muted-foreground" strokeWidth={1.5} />
                </Pressable>
              ) : undefined}
        />
      </View>
    ),
    [search, insets.top, router]
  );

  const EmptyComponent = useCallback(
    () => (
      <View className="px-6">
        {isLoading ? (
          <Spinner size="md" className="pt-10" />
        ) : search ? (
          <EmptyState
            icon="Search"
            title="No groups found"
            description="Try a different search term"
          />
        ) : (
          <EmptyState
            icon="Users"
            title="No groups found"
            description="Create a group with friends to start splitting expenses easily."
            action={{
              label: "Create Group",
              onPress: () => router.push("/group/new"),
            }}
          />
        )}
      </View>
    ),
    [isLoading, search, router]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: { group: Group; netBalance: number }; index: number }) => {
      const isLast = index === filtered.length - 1;

      return (
        <Animated.View layout={LinearTransition.springify()} className="px-6">
          <View
            className={`bg-surface ${index === 0 ? "rounded-t-2xl border-t" : ""} ${isLast ? "rounded-b-2xl border-b mb-4" : ""} border-x border-border`}
          >
            <GroupCard
              group={item.group}
              currentUserId={userId}
              balance={item.netBalance}
              currency={preferredCurrency.code}
              index={index}
              isLast={isLast}
              onPress={() => router.push(`/group/${item.group.id}`)}
            />
          </View>
        </Animated.View>
      );
    },
    [userId, filtered.length, preferredCurrency.code, router]
  );

  if (!currentUser) return <></>;
  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />

      <FocusAwareView delay={0} className="flex-1">
        <Animated.FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.group.id}
          itemLayoutAnimation={LinearTransition}
          ListHeaderComponent={HeaderComponent}
          ListEmptyComponent={EmptyComponent}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      </FocusAwareView>
    </View>
  );
}
