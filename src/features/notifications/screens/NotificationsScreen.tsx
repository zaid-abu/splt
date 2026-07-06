import { View, FlatList, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { JSX } from "react";

import {
  useNotifications,
  AppNotification,
} from "@/features/notifications/queries/useNotifications";
import { useAuth } from "@/context/AppContext";
import { useAcceptFriend, useRejectFriend } from "@/features/friends/queries/useFriends";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotificationsScreen(): JSX.Element {
  const router = useRouter();
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
        <Animated.View
          layout={LinearTransition}
          entering={FadeInDown.duration(400).delay(index * 50)}
        >
          <View className="p-6 border-b border-border">
            <View className="flex-row items-center mb-4">
              <AppUserAvatar user={friendship.friendUser!} size="md" />
              <View className="flex-1 ml-4">
                <Text variant="body" weight="bold">
                  {item.title}
                </Text>
                <Text variant="body-sm" color="muted" className="mt-1">
                  {item.subtitle}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                loading={isAccepting}
                disabled={isWorking}
                onPress={() => handleAccept(friendship.id)}
              >
                Accept
              </Button>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                loading={isRejecting}
                disabled={isWorking}
                onPress={() => handleReject(friendship.id)}
              >
                Reject
              </Button>
            </View>
          </View>
        </Animated.View>
      );
    }

    return null;
  };

  return (
    <FocusAwareView className="flex-1 bg-background">
      <StatusBar style="light" />

      <View
        className="flex-row items-center px-6 pb-4 border-b border-border"
        style={{ paddingTop: 60 }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="w-11 h-11 p-0 mr-4"
          onPress={() => router.back()}
        >
          <icons.ArrowLeft size={20} color="#FAFAFA" />
        </Button>
        <Text variant="h2">Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="p-10 items-center justify-center">
            {isLoading ? (
              <Spinner />
            ) : (
              <EmptyState
                icon="BellOff"
                title="All caught up!"
                description="You have no new notifications right now."
              />
            )}
          </View>
        }
      />
    </FocusAwareView>
  );
}
