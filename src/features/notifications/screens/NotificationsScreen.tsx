import { View, Pressable, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { Typography } from "heroui-native";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useCallback, useState, useMemo, type JSX } from "react";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";

import { useNotifications } from "@/features/notifications/queries/useNotifications";
import type { AppNotification } from "@/types";
import { useAuth } from "@/context/AppContext";
import { useAcceptFriend, useRejectFriend } from "@/features/friends/queries/useFriends";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { ErrorState } from "@/components/ui/ErrorState";
import { UI, ScreenHeader, EmptyState, TYPO } from "@/components/ui/native-ui";

dayjs.extend(isToday);
dayjs.extend(isYesterday);

type GroupKey = "today" | "yesterday" | "this_week" | "older";

function getGroupKey(date: Date): GroupKey {
  const d = dayjs(date);
  if (d.isToday()) return "today";
  if (d.isYesterday()) return "yesterday";
  if (dayjs().diff(d, "day") <= 7) return "this_week";
  return "older";
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "friend_request":
      return { icon: icons.UserPlus, color: "#5C648F" };
    case "expense":
      return { icon: icons.Receipt, color: "#4B7772" };
    case "settlement":
      return { icon: icons.ArrowRightLeft, color: "#7B668D" };
    default:
      return { icon: icons.Bell, color: "#9A5F3E" };
  }
}

export default function NotificationsScreen(): JSX.Element {
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
  const { mutateAsync: acceptFriend, isPending: isAccepting } = useAcceptFriend();
  const { mutateAsync: rejectFriend, isPending: isRejecting } = useRejectFriend();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const activeNotifications = useMemo(
    () => notifications.filter((n) => !dismissedIds.has(n.id)),
    [notifications, dismissedIds]
  );

  const grouped = useMemo(() => {
    const map = new Map<GroupKey, AppNotification[]>();
    activeNotifications.forEach((n) => {
      const key = getGroupKey(n.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    });
    return map;
  }, [activeNotifications]);

  const groupLabels: Record<GroupKey, string> = {
    today: "Today",
    yesterday: "Yesterday",
    this_week: "This Week",
    older: "Older",
  };

  const groupOrder: GroupKey[] = ["today", "yesterday", "this_week", "older"];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch?.();
    setRefreshing(false);
  }, [refetch]);

  const handleAccept = useCallback(
    async (friendshipId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await acceptFriend({ friendshipId });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [acceptFriend]
  );

  const handleReject = useCallback(
    async (friendshipId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await rejectFriend({ friendshipId });
    },
    [rejectFriend]
  );

  const handleMarkAllRead = useCallback(() => {
    Haptics.selectionAsync();
    setDismissedIds(new Set(notifications.map((n) => n.id)));
  }, [notifications]);

  const renderNotificationCard = useCallback(
    (item: AppNotification) => {
      const { icon: Icon, color } = getNotificationIcon(item.type);
      const isWorking = isAccepting || isRejecting;

      return (
        <View
          key={item.id}
          style={{
            backgroundColor: UI.color.surface,
            borderRadius: UI.radius.lg,
            borderWidth: 1,
            borderColor: UI.color.border,
            padding: 16,
            marginBottom: 10,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            {item.type === "friend_request" && item.data ? (
              <AppUserAvatar user={item.data.friendUser!} size="md" />
            ) : (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: UI.radius.lg,
                  backgroundColor: UI.color.control,
                  borderWidth: 1,
                  borderColor: UI.color.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={20} color={color} strokeWidth={1.75} />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Typography
                style={{
                  ...TYPO.semi(16),
                  color: UI.color.text,
                  marginBottom: 2,
                }}
              >
                {item.title}
              </Typography>
              <Typography
                style={{
                  ...TYPO.medium(13),
                  color: UI.color.muted,
                  lineHeight: 18,
                }}
              >
                {item.subtitle}
              </Typography>
              <Typography
                style={{
                  ...TYPO.medium(11),
                  color: UI.color.muted,
                  marginTop: 6,
                  opacity: 0.7,
                }}
              >
                {dayjs(item.date).format("MMM D, h:mm A")}
              </Typography>
            </View>
          </View>

          {item.type === "friend_request" && item.data && (
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <Pressable
                onPress={() => handleAccept(item.data!.id)}
                disabled={isWorking}
                accessibilityRole="button"
                accessibilityLabel="Accept friend request"
                style={({ pressed }) => ({
                  flex: 1,
                  height: 46,
                  borderRadius: UI.radius.pill,
                  backgroundColor: UI.color.text,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed || (isWorking && isAccepting) ? 0.65 : 1,
                })}
              >
                {isAccepting ? (
                  <ActivityIndicator color={UI.color.textInverse} size="small" />
                ) : (
                  <Typography
                    style={{
                      ...TYPO.semi(14),
                      color: UI.color.textInverse,
                    }}
                  >
                    Accept
                  </Typography>
                )}
              </Pressable>

              <Pressable
                onPress={() => handleReject(item.data!.id)}
                disabled={isWorking}
                accessibilityRole="button"
                accessibilityLabel="Reject friend request"
                style={({ pressed }) => ({
                  flex: 1,
                  height: 46,
                  borderRadius: UI.radius.pill,
                  backgroundColor: "transparent",
                  borderWidth: 1,
                  borderColor: UI.color.border,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed || (isWorking && isRejecting) ? 0.5 : 1,
                })}
              >
                {isRejecting ? (
                  <ActivityIndicator color={UI.color.text} size="small" />
                ) : (
                  <Typography
                    style={{
                      ...TYPO.semi(14),
                      color: UI.color.text,
                    }}
                  >
                    Reject
                  </Typography>
                )}
              </Pressable>
            </View>
          )}
        </View>
      );
    },
    [handleAccept, handleReject, isAccepting, isRejecting]
  );

  const hasNotifications = activeNotifications.length > 0;

  return (
    <FocusAwareView style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <ThemedStatusBar />

      <View style={{ paddingTop: insets.top }}>
        <ScreenHeader
          title="Notifications"
          onBackPress={() => router.back()}
          rightAction={
            hasNotifications ? (
              <Pressable
                onPress={handleMarkAllRead}
                accessibilityRole="button"
                accessibilityLabel="Mark all notifications as read"
                hitSlop={8}
                style={({ pressed }) => ({
                  minHeight: 44,
                  justifyContent: "center",
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Typography
                  style={{
                    ...TYPO.semi(14),
                    color: UI.color.text,
                  }}
                >
                  Mark all read
                </Typography>
              </Pressable>
            ) : undefined
          }
        />
      </View>

      {isError ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ErrorState onRetry={() => refetch()} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: UI.space.page,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={UI.color.text}
            />
          }
        >
          {isLoading ? (
            <View style={{ paddingTop: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color={UI.color.text} />
            </View>
          ) : !hasNotifications ? (
            <View style={{ paddingTop: 60 }}>
              <EmptyState
                icon={icons.BellOff}
                title="All caught up!"
                subtitle="You have no new notifications right now."
              />
            </View>
          ) : (
            groupOrder.map((key) => {
              const items = grouped.get(key);
              if (!items || items.length === 0) return null;
              return (
                <View key={key} style={{ marginTop: 20 }}>
                  <View style={{ marginBottom: 14 }}>
                    <Typography
                      style={{
                        ...TYPO.label(),
                        color: UI.color.muted,
                      }}
                    >
                      {groupLabels[key]}
                    </Typography>
                  </View>
                  {items.map(renderNotificationCard)}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </FocusAwareView>
  );
}
