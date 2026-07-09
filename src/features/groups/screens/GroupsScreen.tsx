/**
 * Groups Screen
 *
 * Flatter design (no shadows), smooth animations, strict reference alignment based on design.json
 */
import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useCallback, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { View, TextInput, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import * as icons from "lucide-react-native";
import { FlashList } from "@shopify/flash-list";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import Animated, { LinearTransition } from "react-native-reanimated";

import { GroupCard } from "@/features/groups/components/GroupCard";
import { AppLoader } from "@/components/ui/AppLoader";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import type { Group } from "@/types";

// ─── Design Tokens ───
const BG = "#F5F0EB";
const SURFACE = "#FFFCF8";
const CONTROL_SURFACE = "#FFFFFF";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const TEXT_DANGER = "#E85D5D";
const TEXT_SUCCESS = "#4CAF82";
const SEPARATOR = "#E8E4DF";
const CARD_RADIUS = 16;
const SECTION_PAD = 24;

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
      <View style={{ paddingHorizontal: SECTION_PAD, marginTop: insets.top + 16 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <Typography
            style={{
              fontFamily: "Sora_600SemiBold",
              fontSize: 36,
              color: TEXT_PRIMARY,
              lineHeight: 44,
              letterSpacing: -0.5,
            }}
          >
            Groups
          </Typography>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/group/new")}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: CONTROL_SURFACE,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: SEPARATOR,
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <icons.Plus size={20} color={TEXT_PRIMARY} strokeWidth={1.5} />
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Groups", value: String(activeGroups.length), color: TEXT_PRIMARY },
            {
              label: "You owe",
              value: formatAmount(totals.youOwe, preferredCurrency.code),
              color: TEXT_DANGER,
            },
            {
              label: "Owed",
              value: formatAmount(totals.owedToYou, preferredCurrency.code),
              color: TEXT_SUCCESS,
            },
          ].map((item) => (
            <View
              key={item.label}
              style={{
                flex: 1,
                backgroundColor: SURFACE,
                borderRadius: CARD_RADIUS,
                borderWidth: 1,
                borderColor: SEPARATOR,
                paddingHorizontal: 12,
                paddingVertical: 12,
              }}
            >
              <Typography
                numberOfLines={1}
                style={{
                  fontSize: 11,
                  color: TEXT_SECONDARY,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 5,
                }}
              >
                {item.label}
              </Typography>
              <Typography
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  fontSize: 16,
                  color: item.color,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {item.value}
              </Typography>
            </View>
          ))}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: SURFACE,
            borderWidth: 1,
            borderColor: SEPARATOR,
            borderRadius: CARD_RADIUS,
            height: 56,
            paddingHorizontal: 16,
            marginBottom: 14,
          }}
        >
          <icons.Search size={20} color={TEXT_SECONDARY} strokeWidth={1.5} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search your groups..."
            placeholderTextColor={TEXT_SECONDARY}
            style={{
              flex: 1,
              marginLeft: 12,
              fontFamily: "IBMPlexSans_500Medium",
              color: TEXT_PRIMARY,
              fontSize: 16,
            }}
          />
          {search.length > 0 && (
            <Pressable accessibilityRole="button" onPress={() => setSearch("")} hitSlop={8}>
              <icons.XCircle size={20} color={TEXT_SECONDARY} strokeWidth={1.5} />
            </Pressable>
          )}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {FILTERS.map((item) => {
            const isActive = filter === item.key;
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                onPress={() => setFilter(item.key)}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: isActive ? TEXT_PRIMARY : CONTROL_SURFACE,
                  borderWidth: 1,
                  borderColor: isActive ? TEXT_PRIMARY : SEPARATOR,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Typography
                  style={{
                    fontSize: 13,
                    color: isActive ? "#FFFFFF" : TEXT_SECONDARY,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  {item.label}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      </View>
    ),
    [activeGroups.length, filter, insets.top, preferredCurrency.code, router, search, totals]
  );

  const ListEmptyComponent = useCallback(
    () => (
      <View style={{ paddingHorizontal: SECTION_PAD }}>
        {isLoading ? (
          <View style={{ paddingTop: 40 }}>
            <AppLoader />
          </View>
        ) : (
          <View
            style={{
              marginTop: 32,
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
              backgroundColor: SURFACE,
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: SEPARATOR,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 22,
                backgroundColor: CONTROL_SURFACE,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                borderWidth: 1,
                borderColor: SEPARATOR,
              }}
            >
              <icons.Users size={32} color={TEXT_PRIMARY} strokeWidth={1.5} />
            </View>
            <Typography
              style={{
                fontSize: 20,
                color: TEXT_PRIMARY,
                marginBottom: 8,
                fontFamily: "IBMPlexSans_600SemiBold",
                textAlign: "center",
                letterSpacing: -0.5,
              }}
            >
              No groups found
            </Typography>
            <Typography
              style={{
                fontSize: 15,
                color: TEXT_SECONDARY,
                textAlign: "center",
                fontFamily: "IBMPlexSans_500Medium",
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
                  marginTop: 32,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: TEXT_PRIMARY,
                  height: 56,
                  borderRadius: 999,
                  paddingHorizontal: 32,
                  opacity: pressed ? 0.8 : 1,
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
            )}
            {(search || filter !== "all") && (
              <Pressable
                onPress={() => {
                  setSearch("");
                  setFilter("all");
                }}
                style={({ pressed }) => ({
                  marginTop: 20,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: SEPARATOR,
                  backgroundColor: CONTROL_SURFACE,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Typography
                  style={{ color: TEXT_PRIMARY, fontSize: 14, fontFamily: "IBMPlexSans_600SemiBold" }}
                >
                  Clear filters
                </Typography>
              </Pressable>
            )}
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
          <View style={{ paddingHorizontal: SECTION_PAD }}>
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
    <View style={{ flex: 1, backgroundColor: BG }}>
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
