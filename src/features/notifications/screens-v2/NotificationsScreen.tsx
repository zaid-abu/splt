import type { JSX } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { BellOff } from "lucide-react-native";

import { CoralButton } from "@/components/coral/CoralButton";
import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { EmptyState } from "@/components/coral/EmptyState";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { MoneyRow } from "@/components/coral/MoneyRow";
import { useCoralColors } from "@/components/coral/useCoral";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useUI } from "@/components/ui";
import { useAuth } from "@/context/AppContext";
import { useNotifications } from "@/features/notifications/queries/useNotifications";
import type { AppNotification } from "@/types";

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
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
    isRefetching,
    isError,
    refetch,
  } = useNotifications(currentUser?.id);

  if (isError) {
    return (
      <CoralScreen scroll={false}>
        <CoralTopBar title="Notifications" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 18,
              color: color.text,
            }}
          >
            Could not load notifications.
          </Text>
          <CoralButton label="Try again" variant="secondary" onPress={() => void refetch()} />
        </View>
      </CoralScreen>
    );
  }

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar title="Notifications" onBack={() => router.back()} />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
        ListHeaderComponent={<LargeTitle>Worth knowing.</LargeTitle>}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={color.text} accessibilityLabel="Loading notifications" />
            </View>
          ) : (
            <EmptyState
              visual={<BellOff size={48} color={coral.muted} strokeWidth={1.2} />}
              title="All caught up!"
              subtitle="You have no new notifications right now."
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={color.text}
          />
        }
        renderItem={({ item }: { item: AppNotification }) => {
          const dateLabel = formatRelativeDate(item.date);
          const friendUser = item.type === "friend_request" ? item.data?.friendUser : undefined;
          return (
            <MoneyRow
              avatar={friendUser ? <AppUserAvatar user={friendUser} size="md" /> : undefined}
              title={item.title}
              subtitle={`${item.subtitle} · ${dateLabel}`}
              amount=""
              amountTone="neutral"
            />
          );
        }}
      />
    </CoralScreen>
  );
}
