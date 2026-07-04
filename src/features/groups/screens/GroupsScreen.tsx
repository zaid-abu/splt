/**
 * Groups Screen
 *
 * Flatter design (no shadows), smooth animations, strict reference alignment based on design.json
 */
import { Typography, Skeleton } from "heroui-native";
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
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import type { Group } from "@/types";

// ─── Design Tokens ───
const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const SEPARATOR = "#E8E4DF";
const SECTION_PAD = 24;

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

  const activeGroups = useMemo(() => {
    return groups.map((group) => {
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
      return { group, netBalance };
    });
  }, [groups, currentUser.id, expenses, settlements, preferredCurrency, convertCurrency]);

  const filtered = search.trim()
    ? activeGroups.filter((g) => g.group.name.toLowerCase().includes(search.toLowerCase()))
    : activeGroups;

  const ListHeaderComponent = useCallback(
    () => (
      <View style={{ paddingHorizontal: SECTION_PAD, marginBottom: 24, marginTop: insets.top + 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <Typography
            style={{
              fontFamily: "DMSerifDisplay_400Regular",
              fontSize: 36,
              color: TEXT_PRIMARY,
              lineHeight: 44,
              letterSpacing: -0.5,
            }}
          >
            Groups.
          </Typography>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/group/new")}
            style={({ pressed }) => ({
              width: 44, height: 44, alignItems: "center", justifyContent: "center", 
              backgroundColor: "transparent", borderRadius: 0, borderWidth: 1, borderColor: SEPARATOR,
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <icons.Plus size={20} color={TEXT_PRIMARY} strokeWidth={1.5} />
          </Pressable>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: BG,
            borderWidth: 1,
            borderColor: SEPARATOR,
            borderRadius: 0,
            height: 56,
            paddingHorizontal: 16,
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
              fontFamily: "PlusJakartaSans_500Medium",
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
      </View>
    ),
    [search, insets.top, router]
  );

  const ListEmptyComponent = useCallback(
    () => (
      <View style={{ paddingHorizontal: SECTION_PAD }}>
        {isLoading ? (
          <View style={{ borderTopWidth: 1, borderTopColor: SEPARATOR }}>
            <View style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: SEPARATOR, flexDirection: "row", alignItems: "center" }}>
              <Skeleton className="w-12 h-12 rounded-none mr-4 bg-[#E8E4DF]" />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton className="w-3/4 h-5 rounded-none bg-[#E8E4DF]" />
                <Skeleton className="w-1/3 h-4 rounded-none bg-[#E8E4DF]" />
              </View>
            </View>
            <View style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: SEPARATOR, flexDirection: "row", alignItems: "center" }}>
              <Skeleton className="w-12 h-12 rounded-none mr-4 bg-[#E8E4DF]" />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton className="w-1/2 h-5 rounded-none bg-[#E8E4DF]" />
                <Skeleton className="w-1/4 h-4 rounded-none bg-[#E8E4DF]" />
              </View>
            </View>
          </View>
        ) : (
          <View
            style={{
              marginTop: 32,
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 0,
                backgroundColor: "#F0EBE1", // slightly darker secondary background for contrast
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                borderWidth: 1,
                borderColor: SEPARATOR,
              }}
            >
              <icons.Users size={32} color={TEXT_PRIMARY} strokeWidth={1.5} />
            </View>
            <Typography style={{ fontSize: 20, fontWeight: "700", color: TEXT_PRIMARY, marginBottom: 8, fontFamily: "PlusJakartaSans_700Bold", textAlign: "center", letterSpacing: -0.5 }}>
              No groups found
            </Typography>
            <Typography style={{ fontSize: 15, color: TEXT_SECONDARY, textAlign: "center", fontFamily: "PlusJakartaSans_500Medium" }}>
              {search
                ? "Try a different search term"
                : "Create a group with friends to start splitting expenses easily."}
            </Typography>
            {!search && (
              <Pressable
                onPress={() => router.push("/group/new")}
                style={({ pressed }) => ({
                  marginTop: 32,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "transparent",
                  height: 56,
                  borderRadius: 0,
                  borderWidth: 1,
                  borderColor: TEXT_PRIMARY,
                  paddingHorizontal: 32,
                  opacity: pressed ? 0.5 : 1,
                })}
              >
                <icons.Plus size={20} color={TEXT_PRIMARY} strokeWidth={2} />
                <Typography style={{ color: TEXT_PRIMARY, fontWeight: "700", fontSize: 16, fontFamily: "PlusJakartaSans_700Bold", marginLeft: 8 }}>
                  Create Group
                </Typography>
              </Pressable>
            )}
          </View>
        )}
      </View>
    ),
    [isLoading, search, router]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: { group: Group, netBalance: number }; index: number }) => {
      const isLast = index === filtered.length - 1;

      return (
        <Animated.View layout={LinearTransition.springify()}>
          <View
            style={{
              backgroundColor: BG,
              borderTopWidth: index === 0 ? 1 : 0,
              borderTopColor: SEPARATOR,
            }}
          >
            <GroupCard
              group={item.group}
              currentUserId={currentUser.id}
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
    [currentUser.id, filtered.length, preferredCurrency.code, router]
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
