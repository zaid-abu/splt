import { useState, useCallback } from "react"
import type { JSX } from "react"
import { ActivityIndicator, FlatList, RefreshControl, Text, View, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { BellOff } from "lucide-react-native"
import * as Haptics from "expo-haptics"

import { CoralButton } from "@/components/coral/CoralButton"
import { CoralScreen } from "@/components/coral/CoralScreen"
import { CoralTopBar } from "@/components/coral/CoralTopBar"
import { EmptyState } from "@/components/coral/EmptyState"
import { LargeTitle } from "@/components/coral/LargeTitle"
import { MoneyRow } from "@/components/coral/MoneyRow"
import { useCoralColors } from "@/components/coral/useCoral"
import { useUI } from "@/components/ui"
import { useAuth } from "@/context/AppContext"
import { useNotifications } from "@/features/notifications/queries/useNotifications"
import { useTransitionFriendship } from "@/features/friends/queries/useFriends"
import { useRespondToInvitation } from "@/features/groups/queries/useGroups"
import type { AppNotification } from "@/types"

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function NotificationActions({
  kind,
  onAccept,
  onDecline,
  working,
}: {
  kind: "friend_request" | "group_invite"
  onAccept: () => void
  onDecline: () => void
  working: boolean
}) {
  const { color, radius } = useUI()

  return (
    <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
      <Pressable
        onPress={onAccept}
        disabled={working}
        style={({ pressed }) => ({
          flex: 1,
          height: 44,
          borderRadius: radius.pill,
          backgroundColor: color.text,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed || working ? 0.7 : 1,
        })}
      >
        {working ? (
          <ActivityIndicator color={color.textInverse} size="small" />
        ) : (
          <Text
            style={{
              color: color.textInverse,
              fontSize: 14,
              fontFamily: "InstrumentSans_600SemiBold",
            }}
          >
            Accept
          </Text>
        )}
      </Pressable>
      <Pressable
        onPress={onDecline}
        disabled={working}
        style={({ pressed }) => ({
          flex: 1,
          height: 44,
          borderRadius: radius.pill,
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: color.border,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed || working ? 0.5 : 1,
        })}
      >
        <Text
          style={{
            color: color.text,
            fontSize: 14,
            fontFamily: "InstrumentSans_600SemiBold",
          }}
        >
          Decline
        </Text>
      </Pressable>
    </View>
  )
}

export default function NotificationsV2Screen(): JSX.Element {
  const router = useRouter()
  const coral = useCoralColors()
  const { color } = useUI()
  const { currentUser } = useAuth()
  const {
    data: notifications = [],
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = useNotifications(currentUser?.id)

  const { mutateAsync: transitionFriendship } = useTransitionFriendship()
  const { mutateAsync: respondToInvitation } = useRespondToInvitation()

  const [workingId, setWorkingId] = useState<string | null>(null)

  const handleAcceptFriend = useCallback(
    async (notification: AppNotification) => {
      if (!notification.actorId) return
      setWorkingId(notification.id)
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        await transitionFriendship({ counterpartyId: notification.actorId, action: "accept" })
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        await refetch()
      } finally {
        setWorkingId(null)
      }
    },
    [transitionFriendship, refetch]
  )

  const handleDeclineFriend = useCallback(
    async (notification: AppNotification) => {
      if (!notification.actorId) return
      setWorkingId(notification.id)
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        await transitionFriendship({ counterpartyId: notification.actorId, action: "decline" })
        await refetch()
      } finally {
        setWorkingId(null)
      }
    },
    [transitionFriendship, refetch]
  )

  function resolveInvitationId(notification: AppNotification): string {
    const fromData = (notification.data as Record<string, unknown> | undefined)
    return (fromData?.invitation_id as string) ?? (fromData?.invitationId as string) ?? notification.id
  }

  const handleAcceptInvite = useCallback(
    async (notification: AppNotification) => {
      setWorkingId(notification.id)
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        await respondToInvitation({ id: resolveInvitationId(notification), decision: "accept" })
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        await refetch()
      } finally {
        setWorkingId(null)
      }
    },
    [respondToInvitation, refetch]
  )

  const handleDeclineInvite = useCallback(
    async (notification: AppNotification) => {
      setWorkingId(notification.id)
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        await respondToInvitation({ id: resolveInvitationId(notification), decision: "decline" })
        await refetch()
      } finally {
        setWorkingId(null)
      }
    },
    [respondToInvitation, refetch]
  )

  const handleNavPerson = useCallback(
    (actorId?: string) => {
      if (actorId) {
        router.push(`/friend/${actorId}`)
      }
    },
    [router]
  )

  const handleNavExpense = useCallback(
    (expenseId?: string) => {
      if (expenseId) {
        router.push(`/expense/${expenseId}`)
      }
    },
    [router]
  )

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
    )
  }

  const pendingNotifications = notifications.filter(
    (n) => n.kind === "friend_request" || n.kind === "group_invite",
  )
  const earlierNotifications = notifications.filter(
    (n) => n.kind !== "friend_request" && n.kind !== "group_invite",
  )

  function renderNotificationRow(item: AppNotification) {
    const dateLabel = formatRelativeDate(item.date)
    const isWorking = workingId === item.id

    if (item.kind === "friend_request") {
      return (
        <View style={{ paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 0 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 14,
              color: coral.foreground,
            }}
          >
            {item.title}
          </Text>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 12,
              color: coral.muted,
              marginTop: 3,
            }}
          >
            {item.subtitle} · {dateLabel}
          </Text>
          <NotificationActions
            kind="friend_request"
            onAccept={() => void handleAcceptFriend(item)}
            onDecline={() => void handleDeclineFriend(item)}
            working={isWorking}
          />
        </View>
      )
    }

    if (item.kind === "group_invite") {
      return (
        <View style={{ paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 0 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 14,
              color: coral.foreground,
            }}
          >
            {item.title}
          </Text>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 12,
              color: coral.muted,
              marginTop: 3,
            }}
          >
            {item.subtitle} · {dateLabel}
          </Text>
          <NotificationActions
            kind="group_invite"
            onAccept={() => void handleAcceptInvite(item)}
            onDecline={() => void handleDeclineInvite(item)}
            working={isWorking}
          />
        </View>
      )
    }

    const onPress = item.kind === "balance_reminder"
      ? () => handleNavPerson(item.actorId)
      : item.kind === "expense_added"
        ? () => handleNavExpense(item.expenseId)
        : undefined

    return (
      <MoneyRow
        title={item.title}
        subtitle={`${item.subtitle} · ${dateLabel}`}
        amount=""
        amountTone="neutral"
        onPress={onPress}
      />
    )
  }

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={color.text} accessibilityLabel="Loading notifications" />
        </View>
      )
    }
    return (
      <EmptyState
        visual={<BellOff size={48} color={coral.muted} strokeWidth={1.2} />}
        title="All caught up!"
        subtitle="You have no new notifications right now."
      />
    )
  }

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar title="Notifications" onBack={() => router.back()} />
      <FlatList<AppNotification>
        data={[]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        ListHeaderComponent={
          <>
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 30,
                color: coral.foreground,
                letterSpacing: -0.035 * 30,
                lineHeight: 30 * 1.08,
                marginBottom: 2,
              }}
            >
              Notifications
            </Text>
            <Text
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 14,
                color: coral.muted,
                lineHeight: 20,
                marginBottom: 16,
              }}
            >
              Requests, scheduled reviews, and important account events that need action.
            </Text>
            {pendingNotifications.length > 0 && (
              <>
                <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8, paddingHorizontal: 2 }}>
                  <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15, color: coral.foreground }}>
                    Needs a response
                  </Text>
                  <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 12, color: coral.muted }}>
                    {pendingNotifications.length} new
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: coral.surface,
                    borderWidth: 1,
                    borderColor: coral.border,
                    borderRadius: 16,
                    overflow: "hidden",
                    marginBottom: 12,
                  }}
                >
                  {pendingNotifications.map((item) => (
                    <View key={item.id}>{renderNotificationRow(item)}</View>
                  ))}
                </View>
              </>
            )}
            {earlierNotifications.length > 0 && (
              <>
                <Text
                  style={{
                    fontFamily: "InstrumentSans_600SemiBold",
                    fontSize: 15,
                    color: coral.foreground,
                    marginBottom: 8,
                    paddingHorizontal: 2,
                  }}
                >
                  Earlier
                </Text>
                <View
                  style={{
                    backgroundColor: coral.surface,
                    borderWidth: 1,
                    borderColor: coral.border,
                    borderRadius: 16,
                    overflow: "hidden",
                    marginBottom: 12,
                  }}
                >
                  {earlierNotifications.map((item, idx) => (
                    <View
                      key={item.id}
                      style={{
                        borderBottomWidth: idx < earlierNotifications.length - 1 ? 1 : 0,
                        borderBottomColor: coral.border,
                      }}
                    >
                      {renderNotificationRow(item)}
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        }
        ListEmptyComponent={notifications.length === 0 ? renderEmpty : null}
        renderItem={() => null}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={color.text}
          />
        }
      />
    </CoralScreen>
  )
}
