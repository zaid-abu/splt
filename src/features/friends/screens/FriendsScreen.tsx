import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useCallback } from "react";
import { LayoutAnimation, RefreshControl, View } from "react-native";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";

import { FocusAwareView } from "@/components/animations/PageAnimator";
import { ErrorState } from "@/components/ui/ErrorState";
import { useUI, ScreenHeader, IconButton } from "@/components/ui";
import { useFriendsList, type DisplayItem } from "@/features/friends/hooks/useFriendsList";
import { FriendsSummary } from "@/features/friends/components/FriendsSummary";
import { FriendsRequests } from "@/features/friends/components/FriendsRequests";
import { FriendsSearchFilter } from "@/features/friends/components/FriendsSearchFilter";
import { FriendRow } from "@/features/friends/components/FriendRow";
import { FriendsEmpty } from "@/features/friends/components/FriendsEmpty";

function SectionHeader({ title, count }: { title: string; count: number }): JSX.Element {
  const { color, space } = useUI();

  return (
    <View
      style={{
        paddingHorizontal: space.page,
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
          color: color.text,
          fontFamily: "IBMPlexSans_600SemiBold",
          letterSpacing: -0.2,
        }}
      >
        {title}
      </Typography>
      <Typography
        style={{
          fontSize: 13,
          color: color.muted,
          fontFamily: "IBMPlexSans_500Medium",
        }}
      >
        {count}
      </Typography>
    </View>
  );
}

export default function FriendsScreen(): JSX.Element {
  const { color } = useUI();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    isLoading,
    isError,
    refetchAll,
    totalOwedToMe,
    totalIOwe,
    filterCounts,
    pendingRequests,
    topBalanceAction,
    displayRows,
    refreshing,
    search,
    setSearch,
    filter,
    setFilter,
    hasActiveFilters,
    onRefresh,
    clearSearchAndFilter,
    handleRequestAction,
    handleRemoveFriend,
    handlePrimaryFriendAction,
    preferredCurrency,
  } = useFriendsList();

  const renderHeader = useCallback(
    () => (
      <View>
        <FriendsSummary
          totalOwedToMe={totalOwedToMe}
          totalIOwe={totalIOwe}
          filterCounts={filterCounts}
          currencyCode={preferredCurrency.code}
        />

        {(pendingRequests.length > 0 || topBalanceAction) && (
          <FriendsRequests
            pendingRequests={pendingRequests}
            topBalanceAction={topBalanceAction}
            currencyCode={preferredCurrency.code}
            onRequestAction={handleRequestAction}
            onPrimaryAction={handlePrimaryFriendAction}
          />
        )}

        <FriendsSearchFilter
          search={search}
          onSearchChange={setSearch}
          onSearchClear={() => setSearch("")}
          filter={filter}
          onFilterChange={(value) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setFilter(value);
          }}
          filterCounts={filterCounts}
        />
      </View>
    ),
    [
      totalOwedToMe,
      totalIOwe,
      filterCounts,
      pendingRequests,
      topBalanceAction,
      preferredCurrency.code,
      handleRequestAction,
      handlePrimaryFriendAction,
      search,
      setSearch,
      filter,
      setFilter,
    ]
  );

  const renderItem = useCallback(
    ({ item }: { item: DisplayItem; index: number }) => {
      if (item.kind === "section") {
        return <SectionHeader title={item.title} count={item.count} />;
      }

      return (
        <Animated.View layout={LinearTransition.springify()}>
          <FriendRow
            row={item.item}
            sectionIndex={item.sectionIndex}
            sectionCount={item.sectionCount}
            currencyCode={preferredCurrency.code}
            onRemove={handleRemoveFriend}
            onPrimaryAction={handlePrimaryFriendAction}
          />
        </Animated.View>
      );
    },
    [preferredCurrency.code, handleRemoveFriend, handlePrimaryFriendAction]
  );

  return (
    <FocusAwareView style={{ flex: 1, backgroundColor: color.bg }}>
      <ThemedStatusBar />

      <Animated.View
        entering={FadeInDown.duration(350).springify()}
        style={{ paddingTop: insets.top + 16, backgroundColor: color.bg }}
      >
        <ScreenHeader
          title="Friends"
          rightAction={
            <IconButton
              icon={icons.Plus}
              accessibilityLabel="Add friend"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/friend/new");
              }}
            />
          }
        />
      </Animated.View>

      {isError ? (
        <Animated.View
          entering={FadeInDown.duration(350).delay(50).springify()}
          style={{ flex: 1, justifyContent: "center" }}
        >
          <ErrorState onRetry={refetchAll} />
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeInDown.duration(350).delay(50).springify()}
          style={{ flex: 1 }}
        >
          <Animated.FlatList
            data={displayRows}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
              <FriendsEmpty
                isLoading={isLoading}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearSearchAndFilter}
              />
            }
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={color.text}
                progressViewOffset={10}
              />
            }
          />
        </Animated.View>
      )}
    </FocusAwareView>
  );
}
