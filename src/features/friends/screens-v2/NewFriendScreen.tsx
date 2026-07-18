import { useState, useEffect } from "react";
import { View, FlatList, Pressable, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { CoralSearchField } from "@/components/coral/CoralSearchField";
import { MoneyRow } from "@/components/coral/MoneyRow";
import { useCoralColors } from "@/components/coral/useCoral";

import { useAddFriend, useAllFriendships } from "@/features/friends/queries/useFriends";
import { useAuth } from "@/context/AppContext";
import { useSearchUsers } from "@/features/users/queries/useUsers";
import { useAppToast } from "@/hooks/useAppToast";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import type { User } from "@/types";

export default function NewFriendScreen() {
  const router = useRouter();
  const coral = useCoralColors();
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

  const { data: searchResults = [], isLoading: isSearching } = useSearchUsers(
    debouncedQuery,
    currentUser.id
  );
  const { data: allFriendships = [] } = useAllFriendships(currentUser.id);

  const handleAddFriend = async (targetUser: User) => {
    if (addingUserId) return;
    setAddingUserId(targetUser.id);

    try {
      await addFriend({ userId: currentUser.id, friendId: targetUser.id });

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
        router.replace("/people");
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

  const renderUserItem = ({ item }: { item: User }) => {
    const isAdding = addingUserId === item.id;
    const existingFriendship = allFriendships.find((f) => f.friendUser?.id === item.id);
    const status = existingFriendship?.status;
    const isRequested = status === "pending";
    const isAdded = status === "accepted";
    const isDisabled = !!addingUserId || isRequested || isAdded;

    return (
      <MoneyRow
        avatar={<AppUserAvatar user={item} size="sm" />}
        title={item.name}
        subtitle={item.email}
        amount=""
        rightElement={
          isAdding ? (
            <ActivityIndicator size="small" color={coral.accent} />
          ) : isAdded ? (
            <View
              style={{
                minWidth: 44,
                minHeight: 44,
                borderRadius: 14,
                backgroundColor: coral.positiveSoft,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 13,
                  color: coral.positive,
                }}
              >
                Added
              </Text>
            </View>
          ) : isRequested ? (
            <View
              style={{
                minWidth: 44,
                minHeight: 44,
                borderRadius: 14,
                backgroundColor: coral.surface,
                borderWidth: 1,
                borderColor: coral.border,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 13,
                  color: coral.muted,
                }}
              >
                Requested
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleAddFriend(item);
              }}
              disabled={isDisabled}
              style={{
                minWidth: 44,
                minHeight: 44,
                borderRadius: 14,
                backgroundColor: coral.accent,
                alignItems: "center",
                justifyContent: "center",
                opacity: isDisabled ? 0.45 : 1,
              }}
            >
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 13,
                  color: coral.inkOnAccent,
                }}
              >
                Add
              </Text>
            </Pressable>
          )
        }
      />
    );
  };

  return (
    <CoralScreen>
      <CoralTopBar title="Add Friend" onBack={() => router.back()} />

      <View style={{ marginTop: 12, marginBottom: 8 }}>
        <CoralSearchField
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery("")}
          placeholder="Search by name or email..."
          autoFocus
        />
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 48,
              gap: 8,
            }}
          >
            {debouncedQuery.length >= 2 && !isSearching ? (
              <Text
                style={{
                  fontFamily: "InstrumentSans_400Regular",
                  fontSize: 15,
                  color: coral.muted,
                }}
              >
                No users matching "{debouncedQuery}"
              </Text>
            ) : debouncedQuery.length > 0 ? (
              <Text
                style={{
                  fontFamily: "InstrumentSans_400Regular",
                  fontSize: 15,
                  color: coral.muted,
                }}
              >
                Keep typing to search...
              </Text>
            ) : (
              <Text
                style={{
                  fontFamily: "InstrumentSans_400Regular",
                  fontSize: 15,
                  color: coral.muted,
                }}
              >
                Search by name or email address
              </Text>
            )}
          </View>
        }
      />
    </CoralScreen>
  );
}
