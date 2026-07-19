import { View, FlatList, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { Typography } from "heroui-native";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useCallback, useState, type JSX } from "react";

import { useNotifications } from "@/features/notifications/queries/useNotifications";
import type { AppNotification } from "@/types";
import { useAuth } from "@/context/AppContext";
import { useTransitionFriendship } from "@/features/friends/queries/useFriends";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { ErrorState } from "@/components/ui/ErrorState";
import { useUI, ScreenHeader, EmptyState } from "@/components/ui";

export default function NotificationsScreen(): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();

  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useNotifications(currentUser?.id);
  const [refreshing, setRefreshing] = useState(false);
  const { mutateAsync: transitionFriendship, isPending: isTransitioning } = useTransitionFriendship();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch?.();
    setRefreshing(false);
  }, [refetch]);

  const handleAccept = async (counterpartyId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await transitionFriendship({ counterpartyId, action: "accept" });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleReject = async (counterpartyId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await transitionFriendship({ counterpartyId, action: "decline" });
  };

  const renderItem = ({ item, index }: { item: AppNotification; index: number }) => {
    if (item.kind === "friend_request" && item.data) {
      const notificationData = item.data as Record<string, unknown> | undefined;
      const actorId = notificationData?.actor_id as string | undefined;
      const isWorking = isTransitioning;

      return (
        <View
          style={{
            padding: space.page,
            borderBottomWidth: 1,
            borderBottomColor: color.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <AppUserAvatar
                user={
                  {
                    id: actorId ?? "unknown",
                    name: item.subtitle.replace(" wants to be your friend.", ""),
                    email: "",
                    initials: item.subtitle.charAt(0) ?? "?",
                    defaultCurrency: "USD",
                    setupState: "complete",
                  } as {
                    id: string;
                    name: string;
                    email: string;
                    initials: string;
                    defaultCurrency: string;
                    setupState: "profile_pending" | "activation_pending" | "complete";
                  }
                }
                size="md"
              />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Typography
                style={{
                  fontSize: 16,
                  color: color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {item.title}
              </Typography>
              <Typography
                style={{
                  fontSize: 14,
                  color: color.muted,
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
                  onPress={() => handleAccept(actorId ?? "")}
                  disabled={isWorking}
                  style={({ pressed }) => ({
                    flex: 1,
                    height: 48,
                    borderRadius: radius.pill,
                    backgroundColor: color.text,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed || isWorking ? 0.7 : 1,
                  })}
                >
                  {isTransitioning ? (
                <ActivityIndicator color={color.textInverse} />
              ) : (
                <Typography
                  style={{
                    color: color.textInverse,
                    fontSize: 14,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  Accept
                </Typography>
              )}
            </Pressable>

              <Pressable
                  onPress={() => handleReject(actorId ?? "")}
                  disabled={isWorking}
                  style={({ pressed }) => ({
                    flex: 1,
                    height: 48,
                    borderRadius: radius.pill,
                    backgroundColor: "transparent",
                    borderWidth: 1,
                    borderColor: color.border,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed || isWorking ? 0.5 : 1,
                  })}
                >
                  {isTransitioning ? (
                <ActivityIndicator color={color.text} />
              ) : (
                <Typography
                  style={{
                    color: color.text,
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
    <FocusAwareView style={{ flex: 1, backgroundColor: color.bg }}>
      <ThemedStatusBar />

      {/* Safe-area-aware header */}
      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader title="Notifications" onBackPress={() => router.back()} />
      </View>

      {isError ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ErrorState onRetry={() => refetch()} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.text} />
          }
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: "center", justifyContent: "center" }}>
              {isLoading ? (
                <ActivityIndicator size="large" color={color.text} />
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
      )}
    </FocusAwareView>
  );
}
