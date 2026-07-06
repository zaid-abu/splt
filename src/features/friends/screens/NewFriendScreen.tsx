import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, View, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useAddFriend, useAllFriendships } from "@/features/friends/queries/useFriends";
import { useAuth } from "@/context/AppContext";
import { useSearchUsers } from "@/features/users/queries/useUsers";
import type { User } from "@/types";
import { useAppToast } from "@/hooks/useAppToast";
import { Text } from "@/components/ui/Text";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";


export default function NewFriendScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? "";
  const { mutateAsync: addFriend } = useAddFriend();
  const { toast } = useAppToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading: isSearching } = useSearchUsers(
    debouncedQuery,
    currentUser?.id ?? ""
  );
  const { data: allFriendships = [] } = useAllFriendships(currentUser?.id);

  const handleAddFriend = async (targetUser: User) => {
    if (addingUserId) return;
    setAddingUserId(targetUser.id);

    try {
      await addFriend({
        userId: userId,
        friendId: targetUser.id,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.show({
        label: "Friend Request Sent",
        description: `A friend request was sent to ${targetUser.name}.`,
        variant: "success",
        placement: "top",
      });
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add friend";
      toast.show({
        label: "Error",
        description: msg,
        variant: "danger",
        placement: "top",
      });
    } finally {
      setAddingUserId(null);
    }
  };

  const renderUserItem = ({ item, index }: { item: User; index: number }) => {
    const isAdding = addingUserId === item.id;

    const existingFriendship = allFriendships.find((f) => f.friendUser?.id === item.id);
    const status = existingFriendship?.status;

    const isRequested = status === "pending";
    const isAdded = status === "accepted";
    const isDisabled = !!addingUserId || isRequested || isAdded;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <View className="flex-row items-center px-6 py-4 border-b border-border">
          <View className="mr-4">
            <AppUserAvatar user={item} size="lg" />
          </View>

          <View className="flex-1 mr-3">
            <Text variant="body" weight="bold" numberOfLines={1}>
              {item.name}
            </Text>
            <Text variant="body-sm" color="muted" numberOfLines={1}>
              {item.email}
            </Text>
          </View>

          {isAdding ? (
            <Spinner size="sm" className="py-0 px-4" />
          ) : isAdded ? (
            <View className="h-10 px-4 rounded-xl bg-success/10 items-center justify-center">
              <Text variant="body-sm" weight="bold" color="success">
                Added
              </Text>
            </View>
          ) : isRequested ? (
            <View className="h-10 px-4 rounded-xl bg-transparent border border-border items-center justify-center">
              <Text variant="body-sm" weight="bold" color="foreground">
                Requested
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => handleAddFriend(item)}
              disabled={isDisabled}
              className="w-10 h-10 rounded-xl bg-primary items-center justify-center active:opacity-80"
            >
              <icons.UserPlus size={20} color="#FAFAFA" strokeWidth={1.5} />
            </Pressable>
          )}
        </View>
      </Animated.View>
    );
  };

  if (!currentUser) return <></>;
  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />

      <View
        className="flex-row justify-between px-6 pb-6"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Text variant="h2">Add Friend</Text>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
          className="p-2 active:opacity-50"
        >
          <icons.X size={24} className="text-muted-foreground" strokeWidth={1.5} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="px-6 pb-6 border-b border-border">
          <Input
            leftElement={<icons.Search size={20} className="text-muted-foreground" strokeWidth={1.5} />}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or email..."
            autoCapitalize="none"
            autoFocus
            rightElement={
              isSearching ? (
                <Spinner size="sm" className="py-0" />
              ) : searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                  <icons.XCircle size={20} className="text-muted-foreground" strokeWidth={1.5} />
                </Pressable>
              ) : undefined
            }
          />
        </View>

        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View className="px-6 py-12 items-center justify-center">
              {debouncedQuery.length >= 2 && !isSearching ? (
                <EmptyState
                  icon="Search"
                  title="No results"
                  description={`No users matching "${debouncedQuery}"`}
                />
              ) : debouncedQuery.length > 0 ? (
                <Text variant="body-sm" color="muted" className="text-center">
                  Keep typing to search...
                </Text>
              ) : (
                <EmptyState
                  icon="UserPlus"
                  title="Find Friends"
                  description="Search by their name or email address."
                />
              )}
            </View>
          }
        />
      </KeyboardAvoidingView>
    </View>
  );
}
