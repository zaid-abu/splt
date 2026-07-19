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
          const dateLabel = formatRelativeDate(item.date)
          const isWorking = workingId === item.id

          if (item.kind === "friend_request") {
            return (
              <View style={{ paddingHorizontal: 2, paddingVertical: 12 }}>
                <MoneyRow
                  title={item.title}
                  subtitle={`${item.subtitle} \u00B7 ${dateLabel}`}
                  amount=""
                  amountTone="neutral"
                />
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
              <View style={{ paddingHorizontal: 2, paddingVertical: 12 }}>
                <MoneyRow
                  title={item.title}
                  subtitle={`${item.subtitle} \u00B7 ${dateLabel}`}
                  amount=""
                  amountTone="neutral"
                />
                <NotificationActions
                  kind="group_invite"
                  onAccept={() => void handleAcceptInvite(item)}
                  onDecline={() => void handleDeclineInvite(item)}
                  working={isWorking}
                />
              </View>
            )
          }

          if (item.kind === "balance_reminder") {
            return (
              <MoneyRow
                title={item.title}
                subtitle={`${item.subtitle} \u00B7 ${dateLabel}`}
                amount=""
                amountTone="neutral"
                onPress={() => handleNavPerson(item.actorId)}
              />
            )
          }

          if (item.kind === "expense_added") {
            return (
              <MoneyRow
                title={item.title}
                subtitle={`${item.subtitle} \u00B7 ${dateLabel}`}
                amount=""
                amountTone="neutral"
                onPress={() => handleNavExpense(item.expenseId)}
              />
            )
          }

          return (
            <MoneyRow
              title={item.title}
              subtitle={`${item.subtitle} \u00B7 ${dateLabel}`}
              amount=""
              amountTone="neutral"
            />
          )
        }}
      />
    </CoralScreen>
  )
}
