import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View, Text, TextInput } from "react-native";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useCoralColors } from "@/components/coral/useCoral";
import { CoralSegment } from "@/components/coral/CoralSegment";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import type { User, Group } from "@/types";

function Pill({ label, onRemove }: { label: string; onRemove: () => void }) {
  const coral = useCoralColors();
  return (
    <Pressable
      onPress={onRemove}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingLeft: 10,
        paddingRight: 8,
        height: 36,
        borderRadius: 999,
        backgroundColor: coral.accentSoft,
        borderWidth: 1,
        borderColor: coral.accent,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 13,
          color: coral.accentInk,
        }}
      >
        {label}
      </Text>
      <icons.X size={14} color={coral.accentInk} strokeWidth={2} />
    </Pressable>
  );
}

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
  singleFriendSelection = false,
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
  singleFriendSelection?: boolean;
}): JSX.Element {
  const coral = useCoralColors();
  const searchRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const rows = selectionTab === "friends" ? filteredFriends : filteredGroups;

  useEffect(() => {
    const timer = setTimeout(() => searchRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ gap: 14, paddingTop: 8 }}>
      <CoralSegment
        options={[
          { label: "Friends", value: "friends" },
          { label: "Groups", value: "groups" },
        ]}
        selected={selectionTab}
        onSelect={(v) => setSelectionTab(v as "friends" | "groups")}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          borderWidth: 1,
          borderColor: focused ? coral.accent : coral.border,
          borderRadius: 14,
          paddingHorizontal: 14,
          height: 48,
          backgroundColor: coral.surface,
        }}
      >
        <icons.Search size={18} color={coral.muted} strokeWidth={1.5} />
        <TextInput
          ref={searchRef}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={selectionTab === "friends" ? "Search friends..." : "Search groups..."}
          placeholderTextColor={coral.muted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 16,
            color: coral.foreground,
            padding: 0,
          }}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
            <icons.XCircle size={18} color={coral.muted} strokeWidth={1.5} />
          </Pressable>
        ) : null}
      </View>

      {selectedFriends.length > 0 && selectionTab === "friends" ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            {selectedFriends.map((friend) => (
              <Pill
                key={friend.id}
                label={friend.name.split(" ")[0]}
                onRemove={() =>
                  setSelectedFriendIds((prev) => prev.filter((id) => id !== friend.id))
                }
              />
            ))}
          </View>
        </ScrollView>
      ) : null}

      {selectedGroupId ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pill
            label={filteredGroups.find((g) => g.id === selectedGroupId)?.name ?? ""}
            onRemove={() => setSelectedGroupId("")}
          />
        </View>
      ) : null}

      <View
        style={{
          backgroundColor: coral.surface,
          borderWidth: 1,
          borderColor: coral.border,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {rows.length === 0 ? (
          <View style={{ paddingVertical: 48, alignItems: "center", gap: 4 }}>
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 15,
                color: coral.foreground,
              }}
            >
              No matches
            </Text>
            <Text
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 13,
                color: coral.muted,
              }}
            >
              Try a different search term.
            </Text>
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
                      singleFriendSelection
                        ? (prev[0] === friend.id ? [] : [friend.id])
                        : prev.includes(friend.id)
                          ? prev.filter((id) => id !== friend.id)
                          : [...prev, friend.id]
                    );
                    setSearchQuery("");
                    searchRef.current?.focus();
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 14,
                    minHeight: 58,
                    borderBottomWidth: index < filteredFriends.length - 1 ? 1 : 0,
                    borderBottomColor: coral.border,
                    opacity: pressed ? 0.65 : 1,
                  })}
                >
                  <AppUserAvatar user={friend} size="sm" />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: "InstrumentSans_600SemiBold",
                        fontSize: 15,
                        color: coral.foreground,
                      }}
                    >
                      {friend.name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "InstrumentSans_400Regular",
                        fontSize: 12,
                        color: coral.muted,
                        marginTop: 1,
                      }}
                    >
                      Friend
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: selected ? coral.accent : coral.border,
                      backgroundColor: selected ? coral.accent : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selected ? (
                      <icons.Check size={14} color={coral.inkOnAccent} strokeWidth={3} />
                    ) : null}
                  </View>
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
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 14,
                    minHeight: 58,
                    borderBottomWidth: index < filteredGroups.length - 1 ? 1 : 0,
                    borderBottomColor: coral.border,
                    opacity: pressed ? 0.65 : 1,
                  })}
                >
                  <GroupIconBadge group={group} size="sm" />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: "InstrumentSans_600SemiBold",
                        fontSize: 15,
                        color: coral.foreground,
                      }}
                    >
                      {group.name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "InstrumentSans_400Regular",
                        fontSize: 12,
                        color: coral.muted,
                        marginTop: 1,
                      }}
                    >
                      {group.members.length} members · {group.currency}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: selected ? coral.accent : coral.border,
                      backgroundColor: selected ? coral.accent : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selected ? (
                      <icons.Check size={14} color={coral.inkOnAccent} strokeWidth={3} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
      </View>
    </View>
  );
}
