import type { JSX } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Card } from "@/components/ui/Card";
import { SearchField, UI } from "@/components/ui/native-ui";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { SelectionMark } from "@/features/expenses/components/SelectionMark";
import { SegmentedTabs } from "@/features/expenses/components/SegmentedTabs";
import { styles } from "@/features/expenses/utils/styles";
import type { User, Group } from "@/types";

export function ContextPicker({
  selectionTab,
  setSelectionTab,
  searchQuery,
  setSearchQuery,
  filteredFriends,
  filteredGroups,
  selectedFriendIds,
  setSelectedFriendIds,
  selectedGroupId,
  setSelectedGroupId,
  selectedFriends,
}: {
  selectionTab: "friends" | "groups";
  setSelectionTab: (value: "friends" | "groups") => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filteredFriends: User[];
  filteredGroups: Group[];
  selectedFriendIds: string[];
  setSelectedFriendIds: (value: string[] | ((prev: string[]) => string[])) => void;
  selectedGroupId: string;
  setSelectedGroupId: (value: string | ((prev: string) => string)) => void;
  selectedFriends: User[];
}): JSX.Element {
  const rows = selectionTab === "friends" ? filteredFriends : filteredGroups;

  return (
    <View style={styles.contextBlock}>
      <Card style={styles.contextIntro}>
        <View style={styles.contextIntroIcon}>
          <icons.ReceiptText size={22} color={UI.color.text} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Typography style={styles.contextIntroTitle}>Who is this expense with?</Typography>
          <Typography style={styles.contextIntroText}>
            Choose one group or any number of friends before entering the amount.
          </Typography>
        </View>
      </Card>

      <SearchField
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery("")}
      />
      <SegmentedTabs value={selectionTab} onChange={setSelectionTab} />

      {selectedFriends.length > 0 && !selectedGroupId ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.selectedChipRow}>
            {selectedFriends.map((friend) => (
              <Pressable
                key={friend.id}
                accessibilityRole="button"
                onPress={() =>
                  setSelectedFriendIds((prev) => prev.filter((friendId) => friendId !== friend.id))
                }
                style={({ pressed }) => [styles.selectedChip, pressed && styles.pressed]}
              >
                <AppUserAvatar user={friend} size="sm" />
                <Typography style={styles.selectedChipText}>{friend.name.split(" ")[0]}</Typography>
                <icons.X size={15} color={UI.color.muted} strokeWidth={1.9} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : null}

      <View style={styles.listCard}>
        {rows.length === 0 ? (
          <View style={styles.emptyList}>
            <Typography style={styles.emptyTitle}>No matches</Typography>
            <Typography style={styles.emptyText}>Try a different search term.</Typography>
          </View>
        ) : null}

        {selectionTab === "friends"
          ? filteredFriends.map((friend, index) => {
              const selected = selectedFriendIds.includes(friend.id);
              return (
                <Pressable
                  key={friend.id}
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedGroupId("");
                    setSelectedFriendIds((prev) =>
                      prev.includes(friend.id)
                        ? prev.filter((friendId) => friendId !== friend.id)
                        : [...prev, friend.id]
                    );
                  }}
                  style={({ pressed }) => [
                    styles.contextRow,
                    index < filteredFriends.length - 1 && styles.rowDivider,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <AppUserAvatar user={friend} size="md" />
                  <View style={styles.rowText}>
                    <Typography numberOfLines={1} style={styles.rowTitle}>
                      {friend.name}
                    </Typography>
                    <Typography style={styles.rowMeta}>Friend</Typography>
                  </View>
                  <SelectionMark selected={selected} />
                </Pressable>
              );
            })
          : filteredGroups.map((group, index) => {
              const selected = selectedGroupId === group.id;
              return (
                <Pressable
                  key={group.id}
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedFriendIds([]);
                    setSelectedGroupId((prev) => (prev === group.id ? "" : group.id));
                  }}
                  style={({ pressed }) => [
                    styles.contextRow,
                    index < filteredGroups.length - 1 && styles.rowDivider,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <GroupIconBadge group={group} size="md" />
                  <View style={styles.rowText}>
                    <Typography numberOfLines={1} style={styles.rowTitle}>
                      {group.name}
                    </Typography>
                    <Typography style={styles.rowMeta}>
                      {group.members.length} members · {group.currency}
                    </Typography>
                  </View>
                  <SelectionMark selected={selected} />
                </Pressable>
              );
            })}
      </View>
    </View>
  );
}
