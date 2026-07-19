import React, { forwardRef, useState, useEffect, useMemo, useCallback } from "react";
import { View, FlatList, Pressable } from "react-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Typography, Spinner } from "heroui-native";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AppContext";
import { useSearchUsers } from "@/features/users/queries/useUsers";
import { useFriends } from "@/features/friends/queries/useFriends";
import type { User } from "@/types";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useUI, EmptyState } from "@/components/ui";

interface UserSearchBottomSheetProps {
  onSelect: (user: User) => void;
  excludeUserIds?: string[];
  title?: string;
}

export const UserSearchBottomSheet = forwardRef<BottomSheetModal, UserSearchBottomSheetProps>(
  ({ onSelect, excludeUserIds = [], title = "Add Member" }, ref) => {
    const { color, radius } = useUI();
    const insets = useSafeAreaInsets();
    const { currentUser } = useAuth();

    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    // Queries
    const { data: searchResults = [], isLoading: isSearching } = useSearchUsers(
      debouncedQuery,
      currentUser.id
    );
    const { data: friends = [] } = useFriends(currentUser.id);

    // Debounce search query
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedQuery(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }, [searchQuery]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
          opacity={0.4}
        />
      ),
      []
    );

    const handleUserSelect = (user: User) => {
      if (excludeUserIds.includes(user.id)) return;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onSelect(user)
      setSearchQuery("")
      setDebouncedQuery("")
    };

    // Determine what list to show
    const isSearchingActive = debouncedQuery.length > 0;

    // Filter out currentUser and already excluded users from friends list
    const filteredFriends = useMemo(() => {
      return friends.filter((f) => !excludeUserIds.includes(f.id) && f.id !== currentUser.id);
    }, [friends, excludeUserIds, currentUser.id]);

    const filteredSearchResults = useMemo(() => {
      return searchResults.filter((u) => u.id !== currentUser.id);
    }, [searchResults, currentUser.id]);

    const displayData = isSearchingActive ? filteredSearchResults : filteredFriends;

    const renderUserItem = ({ item }: { item: User; index: number }) => {
      const isExcluded = excludeUserIds.includes(item.id);

      return (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: color.surface,
            borderWidth: 1,
            borderColor: color.border,
            borderRadius: radius.lg,
            opacity: isExcluded ? 0.5 : 1,
          }}
        >
          <AppUserAvatar user={item} size="lg" />

          <View style={{ flex: 1, marginLeft: 16, marginRight: 12 }}>
            <Typography
              numberOfLines={1}
              style={{
                fontSize: 16,
                color: color.textStrong,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              {item.name}
            </Typography>
            <Typography
              numberOfLines={1}
              style={{
                fontSize: 14,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                marginTop: 4,
              }}
            >
              {item.email}
            </Typography>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => handleUserSelect(item)}
            disabled={isExcluded}
            style={({ pressed }) => ({
              height: 40,
              paddingHorizontal: isExcluded ? 16 : 0,
              width: isExcluded ? undefined : 40,
              backgroundColor: isExcluded ? color.subtle : color.text,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.pill,
              opacity: pressed ? 0.5 : 1,
            })}
          >
            {isExcluded ? (
              <Typography
                style={{
                  fontSize: 14,
                  color: color.muted,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                Added
              </Typography>
            ) : (
              <icons.Plus size={20} color={color.textInverse} strokeWidth={1.5} />
            )}
          </Pressable>
        </View>
      );
    };

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={["90%"]}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: color.bg, borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: color.muted, width: 40 }}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: color.border,
            }}
          >
            <Typography
              style={{ fontSize: 24, color: color.textStrong, fontFamily: "Sora_600SemiBold" }}
            >
              {title}
            </Typography>
          </View>

          {/* Search Bar */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: color.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: color.control,
                borderWidth: 1,
                borderColor: color.border,
                borderRadius: radius.lg,
                height: 48,
                paddingHorizontal: 16,
              }}
            >
              <icons.Search size={18} color={color.muted} strokeWidth={1.5} />
              <BottomSheetTextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name or email..."
                placeholderTextColor={color.muted}
                autoCapitalize="none"
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontFamily: "IBMPlexSans_500Medium",
                  color: color.textStrong,
                  fontSize: 16,
                }}
              />
              {isSearching ? (
                <Spinner size="sm" color={color.muted} />
              ) : searchQuery.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSearchQuery("")}
                  hitSlop={8}
                >
                  <icons.XCircle size={18} color={color.muted} strokeWidth={1.5} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Results */}
          <FlatList
            data={displayData}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: Math.max(insets.bottom, 24),
            }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 48,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSearchingActive && !isSearching ? (
                  <EmptyState
                    icon={icons.UserX}
                    title="No users found"
                    subtitle={`No users matching "${debouncedQuery}"`}
                  />
                ) : !isSearchingActive ? (
                  <EmptyState
                    icon={icons.Users}
                    title="No friends yet"
                    subtitle="Search for users to add them to your group."
                  />
                ) : null}
              </View>
            }
          />
        </View>
      </BottomSheetModal>
    );
  }
);

UserSearchBottomSheet.displayName = "UserSearchBottomSheet";
