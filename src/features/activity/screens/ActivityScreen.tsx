import type { JSX } from "react";
import { useCallback } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { Typography } from "heroui-native";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { ErrorState } from "@/components/ui/ErrorState";
import { useUI, ScreenHeader, SearchField, FilterPill, EmptyState } from "@/components/ui";
import GlassBackground from "@/components/glassmorphism/GlassBackground";
import { ListRowSkeleton } from "@/components/ui/Skeleton";
import { ActivitySection } from "@/features/activity/components/ActivitySection";
import { useActivity, ACTIVITY_FILTERS } from "@/features/activity/hooks/useActivity";
import type { Activity } from "@/types";

export default function ActivityScreen(): JSX.Element {
  const { color, space } = useUI();
  const insets = useSafeAreaInsets();

  const {
    isError,
    refetch,
    isAppLoading,
    refreshing,
    onRefresh,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    groupedActivities,
  } = useActivity();

  const ListEmptyComponent = useCallback(() => {
    if (isAppLoading) return null;
    return (
      <View style={{ paddingHorizontal: space.page, marginTop: 24 }}>
        <EmptyState
          icon={icons.Activity}
          title="No activity found"
          subtitle={
            searchQuery || activeFilter !== "All"
              ? "Try adjusting your filters or search term."
              : "Expenses and settlements will appear here as you use Splt."
          }
        />
      </View>
    );
  }, [isAppLoading, searchQuery, activeFilter]);

  return (
    <FocusAwareView style={{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top }}>
      <GlassBackground />
      <ThemedStatusBar />
      <Animated.View entering={FadeInDown.duration(350).springify()}>
        <ScreenHeader title="Activity" />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(350).delay(40).springify()}
        style={{ backgroundColor: color.bg }}
      >
        <View style={{ paddingHorizontal: space.page, paddingBottom: 20 }}>
          <SearchField
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery("")}
            placeholder="Search activity..."
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: space.page, gap: 8, paddingBottom: 20 }}
        >
          {ACTIVITY_FILTERS.map((filter) => (
            <FilterPill
              key={filter}
              label={filter}
              isActive={activeFilter === filter}
              onPress={() => setActiveFilter(filter)}
            />
          ))}
        </ScrollView>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(350).delay(80).springify()} style={{ flex: 1 }}>
        {isError ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <ErrorState onRetry={() => refetch()} />
          </View>
        ) : isAppLoading && groupedActivities.length === 0 ? (
          <View style={{ paddingHorizontal: space.page, gap: 0 }}>
            {[1, 2, 3].map((i) => (
              <ListRowSkeleton key={i} />
            ))}
          </View>
        ) : (
          <Animated.FlatList
            data={groupedActivities}
            keyExtractor={(item) => item.title}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={color.text}
              />
            }
            renderItem={({ item: section }: { item: { title: string; data: Activity[] } }) => (
              <ActivitySection title={section.title} data={section.data} />
            )}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
    </FocusAwareView>
  );
}
