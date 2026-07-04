import { Typography, Spinner } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, Platform, View, FlatList, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useAddFriend, useAllFriendships } from "@/features/friends/queries/useFriends";
import { useAuth } from "@/context/AppContext";
import { useSearchUsers } from "@/features/users/queries/useUsers";
import type { User, Friendship } from "@/types";
import { useAppToast } from "@/hooks/useAppToast";

// ─── Design Tokens ───
const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const SEPARATOR = "#E8E4DF";

export default function NewFriendScreen(): JSX.Element {
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

  const { data: searchResults, isLoading: isSearching } = useSearchUsers(debouncedQuery, currentUser.id);
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
    const existingFriendship = allFriendships.find(f => f.friendUser?.id === item.id);
    const status = existingFriendship?.status;
    
    const isRequested = status === "pending";
    const isAdded = status === "accepted";
    const isDisabled = !!addingUserId || isRequested || isAdded;

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: SEPARATOR }}>
          
          <View style={{ width: 48, height: 48, borderRadius: 0, backgroundColor: "transparent", borderWidth: 1, borderColor: SEPARATOR, alignItems: "center", justifyContent: "center", marginRight: 16 }}>
            <Typography style={{ fontSize: 18, fontWeight: "700", color: TEXT_PRIMARY }}>
              {item.initials}
            </Typography>
          </View>
          
          <View style={{ flex: 1, marginRight: 12 }}>
            <Typography numberOfLines={1} style={{ fontSize: 16, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
              {item.name}
            </Typography>
            <Typography numberOfLines={1} style={{ fontSize: 14, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium", marginTop: 4 }}>
              {item.email}
            </Typography>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => handleAddFriend(item)}
            disabled={isDisabled}
            style={({ pressed }) => ({
              height: 44,
              paddingHorizontal: isRequested || isAdded ? 16 : 0,
              width: isRequested || isAdded ? undefined : 44,
              backgroundColor: isAdded ? "#4CAF82" : isRequested ? "transparent" : "#8C7A6B",
              borderWidth: isRequested ? 1 : 0,
              borderColor: SEPARATOR,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 0,
              opacity: pressed || (!!addingUserId && !isAdding) ? 0.5 : 1,
            })}
          >
            {isAdding ? (
              <Spinner size="sm" color="white" />
            ) : isAdded ? (
              <Typography style={{ fontSize: 14, fontWeight: "700", color: "white", fontFamily: "PlusJakartaSans_700Bold" }}>
                Added
              </Typography>
            ) : isRequested ? (
              <Typography style={{ fontSize: 14, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
                Requested
              </Typography>
            ) : (
              <icons.UserPlus size={20} color="white" strokeWidth={1.5} />
            )}
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Typography style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 28, color: TEXT_PRIMARY, lineHeight: 36 }}>
          Add Friend
        </Typography>
        <Pressable 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }} 
          accessibilityRole="button" 
          style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.5 : 1 })}
        >
          <icons.X size={24} color={TEXT_SECONDARY} strokeWidth={1.5} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Search Bar */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: SEPARATOR }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "transparent", borderWidth: 1, borderColor: SEPARATOR, height: 56, paddingHorizontal: 16 }}>
            <icons.Search size={20} color={TEXT_SECONDARY} strokeWidth={1.5} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or email..."
              placeholderTextColor={TEXT_SECONDARY}
              autoCapitalize="none"
              autoFocus
              style={{
                flex: 1,
                marginLeft: 12,
                fontFamily: "PlusJakartaSans_500Medium",
                color: TEXT_PRIMARY,
                fontSize: 16,
              }}
            />
            {isSearching ? (
              <Spinner size="sm" color={TEXT_SECONDARY} />
            ) : searchQuery.length > 0 ? (
              <Pressable accessibilityRole="button" onPress={() => setSearchQuery("")} hitSlop={8}>
                <icons.XCircle size={20} color={TEXT_SECONDARY} strokeWidth={1.5} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Results */}
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={{ paddingHorizontal: 24, paddingVertical: 48, alignItems: "center", justifyContent: "center" }}>
              {debouncedQuery.length >= 2 && !isSearching ? (
                <>
                  <View style={{ width: 64, height: 64, borderRadius: 0, backgroundColor: "transparent", borderWidth: 1, borderColor: SEPARATOR, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <icons.UserX size={32} color={TEXT_PRIMARY} strokeWidth={1.5} />
                  </View>
                  <Typography style={{ fontSize: 16, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold", textAlign: "center", marginBottom: 8 }}>
                    No users found
                  </Typography>
                  <Typography style={{ fontSize: 15, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium", textAlign: "center" }}>
                    No users matching "{debouncedQuery}"
                  </Typography>
                </>
              ) : debouncedQuery.length > 0 ? (
                <Typography style={{ fontSize: 15, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium", textAlign: "center" }}>
                  Keep typing to search...
                </Typography>
              ) : (
                <View style={{ alignItems: "center" }}>
                   <View style={{ width: 64, height: 64, borderRadius: 0, backgroundColor: "transparent", borderWidth: 1, borderColor: SEPARATOR, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <icons.Users size={32} color={TEXT_PRIMARY} strokeWidth={1.5} />
                  </View>
                  <Typography style={{ fontSize: 15, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium", textAlign: "center" }}>
                    Find friends by their name or email address.
                  </Typography>
                </View>
              )}
            </View>
          }
        />
      </KeyboardAvoidingView>
    </View>
  );
}
