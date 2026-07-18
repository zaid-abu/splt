import type { JSX } from "react";
import { View, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { BellOff } from "lucide-react-native";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { MoneyRow } from "@/components/coral/MoneyRow";
import { CoralButton } from "@/components/coral/CoralButton";
import { useCoralColors } from "@/components/coral/useCoral";
import { EmptyState } from "@/components/coral/EmptyState";
import { useUI } from "@/components/ui";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";

import { useNotifications } from "@/features/notifications/queries/useNotifications";
import type { AppNotification } from "@/types";
import { useAuth } from "@/context/AppContext";
import { useAcceptFriend, useRejectFriend } from "@/features/friends/queries/useFriends";
import { formatAmount } from "@/components/ui/AmountDisplay";

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationsV2Screen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();
  const { color } = useUI();
  const { currentUser } = useAuth();

  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useNotifications(currentUser?.id);

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar title="Notifications" onBack={() => router.canGoBack() && router.back()} />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<LargeTitle>Worth knowing.</LargeTitle>}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              visual={<BellOff size={48} color={coral.muted} strokeWidth={1.2} />}
              title="All caught up!"
              subtitle="You have no new notifications right now."
            />
          )
        }
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor={color.text} />
        }
        renderItem={({ item }: { item: AppNotification }) => {
          const dateLabel = formatRelativeDate(item.date);

          if (item.type === "friend_request" && item.data) {
            const friendship = item.data;
            const friendUser = friendship.friendUser;

            return (
              <MoneyRow
                avatar={friendUser ? <AppUserAvatar user={friendUser} size="md" /> : undefined}
                title={item.title}
                subtitle={item.subtitle + " · " + dateLabel}
                amount=""
                amountTone="neutral"
              />
            );
          }

          if (item.type === "friend_request") {
            return (
              <MoneyRow
                title={item.title}
                subtitle={item.subtitle + " · " + dateLabel}
                amount=""
                amountTone="neutral"
              />
            );
          }

          return (
            <MoneyRow
              title={item.title}
              subtitle={item.subtitle + " · " + dateLabel}
              amount=""
              amountTone="neutral"
            />
          );
        }}
        ListFooterComponent={
          notifications.length > 0 ? (
            <View style={{ marginTop: 18, marginBottom: 40 }}>
              <CoralButton
                label="Mark all as read"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                variant="text"
              />
            </View>
          ) : null
        }
      />
    </CoralScreen>
  );
}
