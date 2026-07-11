import { View, FlatList, Pressable, ActivityIndicator } from "react-native";
import { Typography } from "heroui-native";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { JSX } from "react";

import { useNotifications } from "@/features/notifications/queries/useNotifications";
import type { AppNotification } from "@/types";
import { useAuth } from "@/context/AppContext";
import { useAcceptFriend, useRejectFriend } from "@/features/friends/queries/useFriends";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { UI, ScreenHeader, EmptyState } from "@/components/ui/native-ui";

export default function NotificationsScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  const { data: notifications = [], isLoading } = useNotifications(currentUser?.id);
  const { mutateAsync: acceptFriend, isPending: isAccepting } = useAcceptFriend();
  const { mutateAsync: rejectFriend, isPending: isRejecting } = useRejectFriend();

  const handleAccept = async (friendshipId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await acceptFriend({ friendshipId });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleReject = async (friendshipId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await rejectFriend({ friendshipId });
  };

  const renderItem = ({ item, index }: { item: AppNotification; index: number }) => {
    if (item.type === "friend_request" && item.data) {
      const friendship = item.data;
      const isWorking = isAccepting || isRejecting;

      return (
        <View
          style={{
            padding: UI.space.page,
            borderBottomWidth: 1,
            borderBottomColor: UI.color.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <AppUserAvatar user={friendship.friendUser!} size="md" />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Typography
                style={{
                  fontSize: 16,
                  color: UI.color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {item.title}
              </Typography>
              <Typography
                style={{
                  fontSize: 14,
                  color: UI.color.muted,
                  fontFamily: "IBMPlexSans_500Medium",
                  marginTop: 4,
                }}
              >
                {item.subtitle}
              </Typography>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => handleAccept(friendship.id)}
              disabled={isWorking}
              style={({ pressed }) => ({
                flex: 1,
                height: 48,
                borderRadius: UI.radius.pill,
                backgroundColor: UI.color.text,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed || isWorking ? 0.7 : 1,
              })}
            >
              {isAccepting ? (
                <ActivityIndicator color={UI.color.textInverse} />
              ) : (
                <Typography
                  style={{
                    color: UI.color.textInverse,
                    fontSize: 14,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  Accept
                </Typography>
              )}
            </Pressable>

            <Pressable
              onPress={() => handleReject(friendship.id)}
              disabled={isWorking}
              style={({ pressed }) => ({
                flex: 1,
                height: 48,
                borderRadius: UI.radius.pill,
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: UI.color.border,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed || isWorking ? 0.5 : 1,
              })}
            >
              {isRejecting ? (
                <ActivityIndicator color={UI.color.text} />
              ) : (
                <Typography
                  style={{
                    color: UI.color.text,
                    fontSize: 14,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  Reject
                </Typography>
              )}
            </Pressable>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <FocusAwareView style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <ThemedStatusBar />

      {/* Safe-area-aware header */}
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="Notifications" onBackPress={() => router.back()} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: "center", justifyContent: "center" }}>
            {isLoading ? (
              <ActivityIndicator size="large" color={UI.color.text} />
            ) : (
              <EmptyState
                icon={icons.BellOff}
                title="All caught up!"
                subtitle="You have no new notifications right now."
              />
            )}
          </View>
        }
      />
    </FocusAwareView>
  );
}
