import { Typography } from "heroui-native";
import type { JSX } from "react";
import { View, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import * as icons from "lucide-react-native";
import { FlashList } from "@shopify/flash-list";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";

import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { GroupCard } from "@/features/groups/components/GroupCard";
import { ListRowSkeleton } from "@/components/ui/Skeleton";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { ErrorState } from "@/components/ui/ErrorState";
import { useUI, ScreenHeader, SearchField, FilterPill } from "@/components/ui";
import { BalanceHero, StatPair } from "@/components/coral";
import type { GroupFilter } from "@/types";

import { useGroupsList } from "@/features/groups/hooks/useGroupsList";

const FILTERS: { key: GroupFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "owe", label: "You owe" },
  { key: "owed", label: "Owes you" },
  { key: "settled", label: "Settled" },
];

export default function GroupsScreen(): JSX.Element {
  const { color, radius, space } = useUI();
  const insets = useSafeAreaInsets();

  const {
    activeGroups,
    totals,
    filtered,
    filter,
    setFilter,
    search,
    setSearch,
    isLoading,
    isError,
    refreshing,
    preferredCurrencyCode,
    onRefresh,
    refetch,
    handleGroupPress,
    handleCreateGroup,
  } = useGroupsList();

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ThemedStatusBar />

      <View style={{ paddingTop: insets.top + 16 }}>
        <ScreenHeader
          title="Groups"
          rightAction={
            <Pressable
              accessibilityRole="button"
              onPress={handleCreateGroup}
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

      {isError ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ErrorState onRetry={() => refetch()} />
        </View>
      ) : (
        <FocusAwareView delay={0} style={{ flex: 1 }}>
          <FlashList
            data={filtered}
            renderItem={({ item, index }) => {
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
                      currency={preferredCurrencyCode}
                      latestExpenseAt={item.latestExpenseAt}
                      onPress={() => handleGroupPress(item.group.id)}
                    />
                  </View>
                </Animated.View>
              );
            }}
            ListHeaderComponent={
              <View>
                <View style={{ paddingHorizontal: space.page, marginBottom: 16 }}>
                  <BalanceHero
                    label="Net Balance"
                    value={formatAmount(Math.abs(totals.netTotal), preferredCurrencyCode)}
                  >
                    <StatPair
                      left={{ label: "Groups", value: String(activeGroups.length) }}
                      right={{
                        label: "You owe",
                        value: formatAmount(totals.youOwe, preferredCurrencyCode),
                        tone: totals.youOwe > 0 ? "negative" : "neutral",
                      }}
                    />
                  </BalanceHero>
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
            }
            ListEmptyComponent={
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
                      borderRadius: radius.lg,
                      padding: 32,
                      backgroundColor: color.surface,
                      borderWidth: 1,
                      borderColor: color.border,
                    }}
                  >
                    <View style={{ alignItems: "center" }}>
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
                          onPress={handleCreateGroup}
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
                  </View>
                )}
              </View>
            }
            contentContainerStyle={{ paddingBottom: 130 }}
            showsVerticalScrollIndicator={false}
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
