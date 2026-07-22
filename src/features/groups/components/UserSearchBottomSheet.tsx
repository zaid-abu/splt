import { useState, useEffect, useMemo, useCallback } from "react";
import type { JSX } from "react";
import { View, FlatList, Pressable, Text, ActivityIndicator, TextInput } from "react-native";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AppContext";
import { useSearchUsers } from "@/features/users/queries/useUsers";
import { useFriends } from "@/features/friends/queries/useFriends";
import type { User } from "@/types";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { CoralSheet, useCoralColors } from "@/components/coral";

interface UserSearchBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (user: User) => void;
  excludeUserIds?: string[];
  title?: string;
}

export function UserSearchBottomSheet({
  visible,
  onClose,
  onSelect,
  excludeUserIds = [],
  title = "Add Member",
}: UserSearchBottomSheetProps): JSX.Element {
  const coral = useCoralColors();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: searchResults = [], isLoading: isSearching } = useSearchUsers(
    debouncedQuery,
    currentUser.id
  );
  const { data: friends = [] } = useFriends(currentUser.id);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleUserSelect = (user: User) => {
    if (excludeUserIds.includes(user.id)) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelect(user);
    setSearchQuery("");
    setDebouncedQuery("");
  };

  const isSearchingActive = debouncedQuery.length > 0;

    const filteredFriends = useMemo(() => {
      return friends.filter((f) => f.id !== currentUser.id);
    }, [friends, currentUser.id]);

  const filteredSearchResults = useMemo(() => {
    return searchResults.filter((u) => u.id !== currentUser.id);
  }, [searchResults, currentUser.id]);

  const displayData = isSearchingActive ? filteredSearchResults : filteredFriends;

  const renderUserItem = ({ item }: { item: User }) => {
    const isExcluded = excludeUserIds.includes(item.id);

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: coral.surface,
          borderWidth: 1,
          borderColor: coral.border,
          borderRadius: 16,
          opacity: isExcluded ? 0.5 : 1,
        }}
      >
        <AppUserAvatar user={item} size="md" />

        <View style={{ flex: 1, marginLeft: 16, marginRight: 12 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 16,
              color: coral.foreground,
              fontFamily: "InstrumentSans_600SemiBold",
            }}
          >
            {item.name}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              color: coral.muted,
              fontFamily: "InstrumentSans_400Regular",
              marginTop: 4,
            }}
          >
            {item.email}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => handleUserSelect(item)}
          disabled={isExcluded}
          style={({ pressed }) => ({
            height: 40,
            width: isExcluded ? undefined : 40,
            paddingHorizontal: isExcluded ? 16 : 0,
            backgroundColor: isExcluded ? coral.border : coral.accent,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            opacity: pressed ? 0.5 : 1,
          })}
        >
          {isExcluded ? (
            <Text
              style={{
                fontSize: 14,
                color: coral.muted,
                fontFamily: "InstrumentSans_600SemiBold",
              }}
            >
              Added
            </Text>
          ) : (
            <icons.Plus size={20} color={coral.inkOnAccent} strokeWidth={1.5} />
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <CoralSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 24,
            letterSpacing: -0.025 * 24,
            color: coral.foreground,
            marginBottom: 12,
          }}
        >
          {title}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: coral.surface,
            borderWidth: 1,
            borderColor: coral.border,
            borderRadius: 14,
            height: 48,
            paddingHorizontal: 16,
            marginBottom: 12,
          }}
        >
          <icons.Search size={18} color={coral.muted} strokeWidth={1.5} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or email..."
            placeholderTextColor={coral.muted}
            autoCapitalize="none"
            style={{
              flex: 1,
              marginLeft: 12,
              fontFamily: "InstrumentSans_400Regular",
              color: coral.foreground,
              fontSize: 16,
            }}
          />
          {isSearching ? (
            <ActivityIndicator size="small" color={coral.muted} />
          ) : searchQuery.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSearchQuery("")}
              hitSlop={8}
            >
              <icons.XCircle size={18} color={coral.muted} strokeWidth={1.5} />
            </Pressable>
          ) : null}
        </View>

        <View style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
          {displayData.map((item) => (
            <View key={item.id} style={{ marginBottom: 8 }}>
              {renderUserItem({ item })}
            </View>
          ))}
          {displayData.length === 0 && (
            <View style={{ paddingVertical: 48, alignItems: "center", justifyContent: "center" }}>
              {isSearchingActive && !isSearching ? (
                <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted }}>
                  No users matching "{debouncedQuery}"
                </Text>
              ) : !isSearchingActive ? (
                <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted }}>
                  No friends yet — search for users to add them to your group.
                </Text>
              ) : null}
            </View>
          )}
        </View>
      </View>
    </CoralSheet>
  );
}
