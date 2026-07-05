import React, { forwardRef, useState, useEffect, useMemo, useCallback } from "react";
import type { JSX } from "react";
import { View, FlatList, Pressable, TextInput, Keyboard } from "react-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Typography, Spinner } from "heroui-native";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AppContext";
import { useSearchUsers } from "@/features/users/queries/useUsers";
import { useFriends, useAllFriendships, useAddFriend } from "@/features/friends/queries/useFriends";
import type { User } from "@/types";
import { useAppToast } from "@/hooks/useAppToast";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";

interface UserSearchBottomSheetProps {
  onSelect: (user: User) => void;
  excludeUserIds?: string[];
  title?: string;
}

const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const SEPARATOR = "#E8E4DF";

export const UserSearchBottomSheet = forwardRef<BottomSheetModal, UserSearchBottomSheetProps>(
  ({ onSelect, excludeUserIds = [], title = "Add Member" }, ref) => {
    const insets = useSafeAreaInsets();
    const { currentUser } = useAuth();
    const { toast } = useAppToast();

    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    // Queries
    const { data: searchResults = [], isLoading: isSearching } = useSearchUsers(
      debouncedQuery,
      currentUser.id
    );
    const { data: friends = [] } = useFriends(currentUser.id);
    const { data: allFriendships = [] } = useAllFriendships(currentUser.id);
    const { mutateAsync: addFriend } = useAddFriend();

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

    const handleUserSelect = async (user: User) => {
      if (excludeUserIds.includes(user.id)) return;
      if (isProcessing) return;

      setIsProcessing(user.id);
      try {
        // Check if they are already friends
        const existingFriendship = allFriendships.find((f) => f.friendUser?.id === user.id);
        const isAdded = existingFriendship?.status === "accepted";
        const isRequested = existingFriendship?.status === "pending";

        // If not friends and not requested, send a request
        if (!isAdded && !isRequested) {
          await addFriend({
            userId: currentUser.id,
            friendId: user.id,
          });
          toast.show({
            label: "Friend Request Sent",
            description: `A friend request was sent to ${user.name}.`,
            variant: "success",
            placement: "top",
          });
        }

        // Trigger onSelect callback (which handles closing the sheet and adding to group)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Let the parent component handle closing to allow state updates
        onSelect(user);

        // Reset state
        setSearchQuery("");
        setDebouncedQuery("");
      } catch (err) {
        toast.show({
          label: "Error",
          description: "Failed to add user.",
          variant: "danger",
          placement: "top",
        });
      } finally {
        setIsProcessing(null);
      }
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

    const renderUserItem = ({ item, index }: { item: User; index: number }) => {
      const isExcluded = excludeUserIds.includes(item.id);
      const isProcessingThis = isProcessing === item.id;

      return (
        <Animated.View entering={FadeInDown.delay(index * 20).springify()}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: SEPARATOR,
              opacity: isExcluded ? 0.5 : 1,
            }}
          >
            <AppUserAvatar user={item} size="lg" />

            <View style={{ flex: 1, marginLeft: 16, marginRight: 12 }}>
              <Typography
                numberOfLines={1}
                style={{ fontSize: 16, color: TEXT_PRIMARY, fontFamily: "CrimsonText_700Bold" }}
              >
                {item.name}
              </Typography>
              <Typography
                numberOfLines={1}
                style={{
                  fontSize: 14,
                  color: TEXT_SECONDARY,
                  fontFamily: "CrimsonText_600SemiBold",
                  marginTop: 4,
                }}
              >
                {item.email}
              </Typography>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => handleUserSelect(item)}
              disabled={isExcluded || !!isProcessing}
              style={({ pressed }) => ({
                height: 40,
                paddingHorizontal: isExcluded ? 16 : 0,
                width: isExcluded ? undefined : 40,
                backgroundColor: isExcluded ? "#E8E4DF" : "#8C7A6B",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 0,
                opacity: pressed || (!!isProcessing && !isProcessingThis) ? 0.5 : 1,
              })}
            >
              {isProcessingThis ? (
                <Spinner size="sm" color="white" />
              ) : isExcluded ? (
                <Typography
                  style={{ fontSize: 14, color: TEXT_SECONDARY, fontFamily: "CrimsonText_700Bold" }}
                >
                  Added
                </Typography>
              ) : (
                <icons.Plus size={20} color="white" strokeWidth={1.5} />
              )}
            </Pressable>
          </View>
        </Animated.View>
      );
    };

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={["85%"]}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: BG, borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: "#D6D2CD", width: 40 }}
        keyboardBehavior="extend"
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: SEPARATOR,
            }}
          >
            <Typography
              style={{ fontSize: 24, color: TEXT_PRIMARY, fontFamily: "UnicaOne_400Regular" }}
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
              borderBottomColor: SEPARATOR,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: SEPARATOR,
                height: 48,
                paddingHorizontal: 16,
              }}
            >
              <icons.Search size={18} color={TEXT_SECONDARY} strokeWidth={1.5} />
              <BottomSheetTextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name or email..."
                placeholderTextColor={TEXT_SECONDARY}
                autoCapitalize="none"
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontFamily: "CrimsonText_600SemiBold",
                  color: TEXT_PRIMARY,
                  fontSize: 16,
                }}
              />
              {isSearching ? (
                <Spinner size="sm" color={TEXT_SECONDARY} />
              ) : searchQuery.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSearchQuery("")}
                  hitSlop={8}
                >
                  <icons.XCircle size={18} color={TEXT_SECONDARY} strokeWidth={1.5} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Results */}
          <FlatList
            data={displayData}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
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
                  <>
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 0,
                        backgroundColor: "transparent",
                        borderWidth: 1,
                        borderColor: SEPARATOR,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 16,
                      }}
                    >
                      <icons.UserX size={32} color={TEXT_PRIMARY} strokeWidth={1.5} />
                    </View>
                    <Typography
                      style={{
                        fontSize: 16,
                        color: TEXT_PRIMARY,
                        fontFamily: "CrimsonText_700Bold",
                        textAlign: "center",
                        marginBottom: 8,
                      }}
                    >
                      No users found
                    </Typography>
                    <Typography
                      style={{
                        fontSize: 15,
                        color: TEXT_SECONDARY,
                        fontFamily: "CrimsonText_600SemiBold",
                        textAlign: "center",
                      }}
                    >
                      No users matching &quot;{debouncedQuery}&quot;
                    </Typography>
                  </>
                ) : !isSearchingActive ? (
                  <>
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 0,
                        backgroundColor: "transparent",
                        borderWidth: 1,
                        borderColor: SEPARATOR,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 16,
                      }}
                    >
                      <icons.Users size={32} color={TEXT_PRIMARY} strokeWidth={1.5} />
                    </View>
                    <Typography
                      style={{
                        fontSize: 16,
                        color: TEXT_PRIMARY,
                        fontFamily: "CrimsonText_700Bold",
                        textAlign: "center",
                        marginBottom: 8,
                      }}
                    >
                      No friends yet
                    </Typography>
                    <Typography
                      style={{
                        fontSize: 15,
                        color: TEXT_SECONDARY,
                        fontFamily: "CrimsonText_600SemiBold",
                        textAlign: "center",
                      }}
                    >
                      Search for users to add them to your group.
                    </Typography>
                  </>
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
