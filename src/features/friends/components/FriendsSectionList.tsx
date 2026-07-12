import { memo, useCallback } from "react";
import type { JSX } from "react";
import { View, RefreshControl, Pressable } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Typography } from "heroui-native";
import { UI, EmptyState } from "@/components/ui/native-ui";
import { ListRowSkeleton } from "@/components/ui/Skeleton";
import * as icons from "lucide-react-native";
import { useRouter } from "expo-router";
import type { DisplayItem, FriendListItem } from "../screens/FriendsScreen";

interface FriendsSectionListProps {
  displayRows: DisplayItem[];
  renderFriendRow: (row: FriendListItem, sectionIndex: number, sectionCount: number) => JSX.Element;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  isLoading: boolean;
  ListHeaderComponent: () => JSX.Element;
  insetsBottom: number;
}

export const FriendsSectionList = memo(function FriendsSectionList({
  displayRows, renderFriendRow, onRefresh, refreshing, hasActiveFilters,
  onClearFilters, isLoading, ListHeaderComponent, insetsBottom,
}: FriendsSectionListProps): JSX.Element {
  const router = useRouter();

  const renderItem = useCallback(
    ({ item }: { item: DisplayItem }) => {
      if (item.kind === "section") {
        return (
          <View
            style={{
              paddingHorizontal: UI.space.page, paddingTop: 18, paddingBottom: 9,
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <Typography
              style={{
                fontSize: 18, color: UI.color.text, fontFamily: "IBMPlexSans_600SemiBold", letterSpacing: -0.2,
              }}
            >
              {item.title}
            </Typography>
            <Typography style={{ fontSize: 13, color: UI.color.muted, fontFamily: "IBMPlexSans_500Medium" }}>
              {item.count}
            </Typography>
          </View>
        );
      }
      return renderFriendRow(item.item, item.sectionIndex, item.sectionCount);
    },
    [renderFriendRow]
  );

  return (
    <FlashList
      data={displayRows}
      keyExtractor={(item: DisplayItem) => item.id}
      renderItem={renderItem}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <View style={{ paddingHorizontal: UI.space.page }}>
          {isLoading ? (
            <View style={{ paddingTop: 20 }}>
              {[1, 2, 3, 4].map((i) => <ListRowSkeleton key={i} />)}
            </View>
          ) : (
            <View style={{ marginTop: 20 }}>
              <EmptyState
                icon={icons.Users}
                title={hasActiveFilters ? "No friends match this view" : "Add the people you split with"}
                subtitle={hasActiveFilters ? "Try a different name, email, or balance filter." : "Friends and shared-group contacts will appear here with balances and recent activity."}
              />
              <View style={{ marginTop: 16, alignItems: "center" }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={hasActiveFilters ? onClearFilters : () => router.push("/friend/new")}
                  style={({ pressed }) => ({
                    minHeight: 44, paddingHorizontal: 18, borderRadius: UI.radius.pill,
                    backgroundColor: hasActiveFilters ? UI.color.control : UI.color.text,
                    borderWidth: 1, borderColor: hasActiveFilters ? UI.color.border : UI.color.text,
                    alignItems: "center", justifyContent: "center", opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Typography style={{ fontSize: 14, color: hasActiveFilters ? UI.color.text : UI.color.textInverse, fontFamily: "IBMPlexSans_600SemiBold" }}>
                    {hasActiveFilters ? "Clear filters" : "Add friend"}
                  </Typography>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      }
      contentContainerStyle={{ paddingBottom: insetsBottom + 140 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={UI.color.text} progressViewOffset={10} />
      }
    />
  );
});
