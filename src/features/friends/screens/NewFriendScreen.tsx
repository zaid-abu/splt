import { Typography, Spinner } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useEffect } from "react";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { KeyboardAvoidingView, Platform, View, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";

import { useAddFriend, useAllFriendships } from "@/features/friends/queries/useFriends";
import { useAuth } from "@/context/AppContext";
import { useSearchUsers } from "@/features/users/queries/useUsers";
import type { User } from "@/types";
import { useAppToast } from "@/hooks/useAppToast";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useUI, EmptyState, IconButton, SearchField } from "@/components/ui/native-ui";

export default function NewFriendScreen(): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
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
    currentUser.id
  );
  const { data: allFriendships = [] } = useAllFriendships(currentUser.id);

  const handleAddFriend = async (targetUser: User) => {
    if (addingUserId) return;
    setAddingUserId(targetUser.id);

    try {
      await addFriend({
        userId: currentUser.id,
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

    // Check friendship status
    const existingFriendship = allFriendships.find((f) => f.friendUser?.id === item.id);
    const status = existingFriendship?.status;

    const isRequested = status === "pending";
    const isAdded = status === "accepted";
    const isDisabled = !!addingUserId || isRequested || isAdded;

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 24,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: color.border,
        }}
      >
        <View style={{ marginRight: 16 }}>
          <AppUserAvatar user={item} size="md" />
        </View>

        <View style={{ flex: 1, marginRight: 12 }}>
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
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleAddFriend(item);
          }}
          disabled={isDisabled}
          style={({ pressed }) => ({
            height: 44,
            paddingHorizontal: isRequested || isAdded ? 16 : 0,
            width: isRequested || isAdded ? undefined : 44,
            backgroundColor: isAdded
              ? color.success
              : isRequested
                ? color.control
                : color.text,
            borderWidth: isRequested ? 1 : 0,
            borderColor: color.border,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: radius.pill,
            opacity: pressed || (!!addingUserId && !isAdding) ? 0.5 : 1,
          })}
        >
          {isAdding ? (
            <Spinner size="sm" color={color.textInverse} />
          ) : isAdded ? (
            <Typography
              style={{
                fontSize: 14,
                color: color.textInverse,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Added
            </Typography>
          ) : isRequested ? (
            <Typography
              style={{
                fontSize: 14,
                color: color.textStrong,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Requested
            </Typography>
          ) : (
            <icons.UserPlus size={20} color={color.textInverse} strokeWidth={1.5} />
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ThemedStatusBar />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 24,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          style={{
            fontFamily: "Sora_600SemiBold",
            fontSize: 28,
            color: color.textStrong,
            lineHeight: 36,
          }}
        >
          Add Friend
        </Typography>
        <IconButton
          icon={icons.X}
          accessibilityLabel="Close add friend"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Search Bar */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingBottom: 24,
            borderBottomWidth: 1,
            borderBottomColor: color.border,
          }}
        >
          <SearchField
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery("")}
            placeholder="Search by name or email..."
            autoFocus
            rightElement={isSearching ? <Spinner size="sm" color={color.muted} /> : undefined}
          />
        </View>

        {/* Results */}
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={{ paddingBottom: 100 }}
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
              {debouncedQuery.length >= 2 && !isSearching ? (
                <>
                  <EmptyState
                    icon={icons.UserX}
                    title="No users found"
                    subtitle={`No users matching "${debouncedQuery}"`}
                  />
                </>
              ) : debouncedQuery.length > 0 ? (
                <Typography
                  style={{
                    fontSize: 15,
                    color: color.muted,
                    fontFamily: "IBMPlexSans_500Medium",
                    textAlign: "center",
                  }}
                >
                  Keep typing to search...
                </Typography>
              ) : (
                <EmptyState
                  icon={icons.Users}
                  title="Find friends"
                  subtitle="Search by name or email address to send a friend request."
                />
              )}
            </View>
          }
        />
      </KeyboardAvoidingView>
    </View>
  );
}
