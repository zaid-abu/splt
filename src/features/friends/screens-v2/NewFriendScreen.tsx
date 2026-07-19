import { useState, useCallback, useRef } from "react"
import { View, Text, Pressable, ActivityIndicator } from "react-native"
import { randomUUID } from "@/utils/randomUUID"
import { useRouter } from "expo-router"
import { Share } from "react-native"
import * as Haptics from "expo-haptics"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { CoralScreen, CoralTopBar, CoralSearchField, CoralButton, useCoralColors } from "@/components/coral"
import { useSearchFriends, useTransitionFriendship, useAllFriendships } from "@/features/friends/queries/useFriends"
import { useAuth } from "@/context/AppContext"
import { useAppToast } from "@/hooks/useAppToast"
import { invitationsApi } from "@/features/invitations/services/api"

const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

function isWellFormedEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export default function NewFriendScreen() {
  const router = useRouter()
  const coral = useCoralColors()
  const insets = useSafeAreaInsets()
  const { currentUser } = useAuth()
  const { toast } = useAppToast()
  const { mutateAsync: searchFriends } = useSearchFriends()
  const { mutateAsync: transitionFriendship } = useTransitionFriendship()
  const { data: allFriendships = [] } = useAllFriendships(currentUser.id)

  const [email, setEmail] = useState("")
  const [searchState, setSearchState] = useState<{
    phase: "idle" | "searching" | "found" | "notFound" | "blocked"
    userId?: string
    name?: string
    initials?: string
    self?: boolean
  }>({ phase: "idle" })
  const [addingUserId, setAddingUserId] = useState<string | null>(null)
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)

  const attemptsRef = useRef<number[]>([])
  const isRateLimited = useRef(false)

  const getRecentAttempts = useCallback(() => {
    const now = Date.now()
    attemptsRef.current = attemptsRef.current.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
    return attemptsRef.current.length
  }, [])

  const checkRateLimit = useCallback(() => {
    const recent = getRecentAttempts()
    return recent >= RATE_LIMIT_MAX
  }, [getRecentAttempts])

  const recordAttempt = useCallback(() => {
    attemptsRef.current.push(Date.now())
  }, [])

  const handleSearch = useCallback(async () => {
    const trimmed = email.trim()
    if (!isWellFormedEmail(trimmed)) {
      toast.show({ label: "Enter a valid email address", placement: "top" })
      return
    }

    if (checkRateLimit()) {
      isRateLimited.current = true
      setSearchState({ phase: "idle" })
      toast.show({
        label: "Too many attempts",
        description: "Please try again later.",
        variant: "danger",
        placement: "top",
      })
      return
    }

    recordAttempt()
    setSearchState({ phase: "searching" })

    try {
      const result = await searchFriends(trimmed)

      if (result.state === "not_found") {
        setSearchState({ phase: "notFound" })
        return
      }

      if (result.state === "blocked") {
        setSearchState({ phase: "blocked" })
        return
      }

      if (result.userId === currentUser.id) {
        setSearchState({ phase: "found", userId: result.userId, name: result.name, initials: result.initials, self: true })
        return
      }

      setSearchState({
        phase: "found",
        userId: result.userId,
        name: result.name,
        initials: result.initials,
        self: false,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Search failed"
      toast.show({ label: "Error", description: msg, variant: "danger", placement: "top" })
      setSearchState({ phase: "idle" })
    }
  }, [email, checkRateLimit, recordAttempt, searchFriends, currentUser.id, toast])

  const handleAddFriend = async () => {
    if (!searchState.userId || searchState.self) return
    if (addingUserId) return

    setAddingUserId(searchState.userId)
    try {
      await transitionFriendship({ counterpartyId: searchState.userId, action: "request" })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      toast.show({
        label: "Friend Request Sent",
        description: `Request sent to ${searchState.name}.`,
        variant: "success",
        placement: "top",
      })
      if (router.canGoBack()) {
        router.back()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send request"
      toast.show({ label: "Error", description: msg, variant: "danger", placement: "top" })
    } finally {
      setAddingUserId(null)
    }
  }

  const handleShareInvite = async () => {
    setIsCreatingInvite(true)
    try {
      const opId = randomUUID()
      const link = await invitationsApi.createFriendInvite(opId)
      await Share.share({
        message: `Join me on Splt! Use this invite link: ${link.rawToken}`,
        title: "Invite to Splt",
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create invite"
      toast.show({ label: "Error", description: msg, variant: "danger", placement: "top" })
    } finally {
      setIsCreatingInvite(false)
    }
  }

  const existingFriendship = searchState.userId
    ? allFriendships.find((f) => f.friendUser?.id === searchState.userId)
    : undefined

  const friendshipStatus = existingFriendship?.status
  const isRequested = friendshipStatus === "pending"
  const isAccepted = friendshipStatus === "accepted"
  const isBlockedExisting = friendshipStatus === "blocked"
  const isAdding = addingUserId !== null

  const showActions = searchState.phase === "found" && !searchState.self

  return (
    <CoralScreen>
      <CoralTopBar title="Add Friend" onBack={() => router.back()} />

      <View style={{ marginTop: 12, marginBottom: 8, paddingHorizontal: 16 }}>
        <CoralSearchField
          value={email}
          onChangeText={(val) => {
            setEmail(val)
            if (searchState.phase !== "idle") {
              setSearchState({ phase: "idle" })
            }
            if (isRateLimited.current && getRecentAttempts() < RATE_LIMIT_MAX) {
              isRateLimited.current = false
            }
          }}
          onClear={() => {
            setEmail("")
            setSearchState({ phase: "idle" })
          }}
          placeholder="Search by exact email..."
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <CoralButton
          label={searchState.phase === "searching" ? "Searching..." : "Search"}
          onPress={handleSearch}
          disabled={searchState.phase === "searching" || !email.trim() || isRateLimited.current || getRecentAttempts() >= RATE_LIMIT_MAX}
          loading={searchState.phase === "searching"}
        />
      </View>

      <View style={{ paddingTop: 24, paddingHorizontal: 16 }}>
        {searchState.phase === "searching" && (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <ActivityIndicator size="small" color={coral.accent} accessibilityLabel="Searching" />
          </View>
        )}

        {searchState.phase === "notFound" && (
          <View style={{ gap: 16, alignItems: "center", paddingVertical: 16 }}>
            <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted, textAlign: "center" }}>
              No user with that email was found.
            </Text>
          </View>
        )}

        {searchState.phase === "blocked" && (
          <View style={{ gap: 16, alignItems: "center", paddingVertical: 16 }}>
            <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted, textAlign: "center" }}>
              This user is unavailable.
            </Text>
          </View>
        )}

        {searchState.self && (
          <View style={{ gap: 16, alignItems: "center", paddingVertical: 16 }}>
            <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted, textAlign: "center" }}>
              That is your own email address.
            </Text>
          </View>
        )}

        {showActions && (
          <View style={{ gap: 16 }}>
            <View style={{ gap: 8, alignItems: "center" }}>
              <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 18, color: coral.foreground }}>
                {searchState.name}
              </Text>
            </View>

            {isAccepted ? (
              <View
                style={{
                  borderRadius: 14,
                  backgroundColor: coral.positiveSoft,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 14,
                }}
              >
                <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15, color: coral.positive }}>
                  Already friends
                </Text>
              </View>
            ) : isRequested ? (
              <View
                style={{
                  borderRadius: 14,
                  backgroundColor: coral.surface,
                  borderWidth: 1,
                  borderColor: coral.border,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 14,
                }}
              >
                <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15, color: coral.muted }}>
                  Request pending
                </Text>
              </View>
            ) : isBlockedExisting ? (
              <View
                style={{
                  borderRadius: 14,
                  backgroundColor: coral.negativeSoft,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 14,
                }}
              >
                <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15, color: coral.negative }}>
                  Blocked
                </Text>
              </View>
            ) : (
              <CoralButton
                label={isAdding ? "Sending request..." : "Send Friend Request"}
                onPress={handleAddFriend}
                disabled={isAdding}
                loading={isAdding}
              />
            )}
          </View>
        )}

        <View style={{ borderTopWidth: 1, borderTopColor: coral.border, marginTop: 32, paddingTop: 24, gap: 12 }}>
          <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: coral.foreground }}>
            Don&apos;t see who you&apos;re looking for?
          </Text>
          <CoralButton
            label={isCreatingInvite ? "Creating invite..." : "Share Invite Link"}
            onPress={handleShareInvite}
            disabled={isCreatingInvite}
            loading={isCreatingInvite}
            variant="secondary"
          />
        </View>

        {isRateLimited.current || getRecentAttempts() >= RATE_LIMIT_MAX ? (
          <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 13, color: coral.negative, textAlign: "center", marginTop: 16 }}>
            Too many attempts. Please try again later.
          </Text>
        ) : null}
      </View>
    </CoralScreen>
  )
}
