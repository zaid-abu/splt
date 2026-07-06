import React, { forwardRef, useState, useEffect, useMemo, useCallback } from "react";
import type { JSX } from "react";
import { View, FlatList, Pressable } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
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
import { Text } from "@/components/primitives/Text";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { BottomSheet } from "@/components/ui/BottomSheet";

interface UserSearchBottomSheetProps {
  onSelect: (user: User) => void;
  excludeUserIds?: string[];
  title?: string;
}

export const UserSearchBottomSheet = forwardRef<BottomSheetModal, UserSearchBottomSheetProps>(
  ({ onSelect, excludeUserIds = [], title = "Add Member" }, ref) => {
    const insets = useSafeAreaInsets();
    const { currentUser } = useAuth();
  const userId = currentUser?.id ?? "";
    const { toast } = useAppToast();

    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const { data: searchResults = [], isLoading: isSearching } = useSearchUsers(
      debouncedQuery,
      currentUser?.id ?? ""
    );
    const { data: friends = [] } = useFriends(currentUser?.id);
    const { data: allFriendships = [] } = useAllFriendships(currentUser?.id);
    const { mutateAsync: addFriend } = useAddFriend();

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedQuery(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleUserSelect = async (user: User) => {
      if (excludeUserIds.includes(user.id)) return;
      if (isProcessing) return;

      setIsProcessing(user.id);
      try {
        const existingFriendship = allFriendships.find((f) => f.friendUser?.id === user.id);
        const isAdded = existingFriendship?.status === "accepted";
        const isRequested = existingFriendship?.status === "pending";

        if (!isAdded && !isRequested) {
          await addFriend({
            userId: currentUser?.id ?? "",
            friendId: user.id,
          });
          toast.show({
            label: "Friend Request Sent",
            description: `A friend request was sent to ${user.name}.`,
            variant: "success",
            placement: "top",
          });
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        onSelect(user);

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

    const isSearchingActive = debouncedQuery.length > 0;

    const filteredFriends = useMemo(() => {
      return friends.filter((f) => !excludeUserIds.includes(f.id) && f.id !== currentUser?.id);
    }, [friends, excludeUserIds, currentUser?.id]);

    const filteredSearchResults = useMemo(() => {
      return searchResults.filter((u) => u.id !== currentUser?.id);
    }, [searchResults, currentUser?.id]);

    const displayData = isSearchingActive ? filteredSearchResults : filteredFriends;

    if (!currentUser) return null;

    const renderUserItem = ({ item, index }: { item: User; index: number }) => {
      const isExcluded = excludeUserIds.includes(item.id);
      const isProcessingThis = isProcessing === item.id;

      return (
        <Animated.View entering={FadeInDown.delay(index * 20).springify()}>
          <View
            className={`flex-row items-center px-6 py-4 ${index < displayData.length - 1 ? "border-b border-border" : ""}`}
          >
            <AppUserAvatar user={item} size="lg" />

            <View className="flex-1 ml-4 mr-3">
              <Text variant="body" className="font-bold" numberOfLines={1}>
                {item.name}
              </Text>
              <Text variant="bodySmall" color="muted" numberOfLines={1}>
                {item.email}
              </Text>
            </View>

            {isProcessingThis ? (
              <Spinner size="sm" className="py-0 px-2" />
            ) : isExcluded ? (
              <View className="h-10 px-4 rounded-xl bg-surface-2 items-center justify-center">
                <Text variant="bodySmall" className="font-bold" color="muted">
                  Added
                </Text>
              </View>
            ) : (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<icons.Plus size={20} color="#FAFAFA" strokeWidth={1.5} />}
                onPress={() => handleUserSelect(item)}
                disabled={isExcluded || !!isProcessing}
                className="w-10 h-10 rounded-xl"
              />
            )}
          </View>
        </Animated.View>
      );
    };

    return (
      <BottomSheet
        ref={ref}
        snapPoints={["85%"]}
        enableDynamicSizing={false}
        className="px-0 pt-0"
      >
        <View className="flex-1">
          <View className="px-6 py-4 border-b border-border">
            <Text variant="screenTitle">{title}</Text>
          </View>

          <View className="px-6 py-4 border-b border-border">
            <Input
              leftElement={<icons.Search size={18} color="#8E8E93" strokeWidth={1.5} />}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or email..."
              autoCapitalize="none"
              rightElement={
                isSearching ? (
                  <Spinner size="sm" className="py-0" />
                ) : searchQuery.length > 0 ? (
                  <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                    <icons.XCircle size={18} color="#8E8E93" strokeWidth={1.5} />
                  </Pressable>
                ) : undefined
              }
            />
          </View>

          <FlatList
            data={displayData}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View className="px-6 py-12 items-center justify-center">
                {isSearchingActive && !isSearching ? (
                  <EmptyState
                    icon="UserX"
                    title="No users found"
                    description={`No users matching "${debouncedQuery}"`}
                  />
                ) : !isSearchingActive ? (
                  <EmptyState
                    icon="Users"
                    title="No friends yet"
                    description="Search for users to add them to your group."
                  />
                ) : null}
              </View>
            }
          />
        </View>
      </BottomSheet>
    );
  }
);

UserSearchBottomSheet.displayName = "UserSearchBottomSheet";
