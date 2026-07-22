import { useState, useCallback, useRef } from "react"
import { View, Text, Pressable, ActivityIndicator, Share } from "react-native"
import { randomUUID } from "@/utils/randomUUID"
import { useRouter } from "expo-router"
import * as Haptics from "expo-haptics"
import { Mail, Share as ShareIcon, UserPlus, Check, XCircle } from "lucide-react-native"

import { CoralScreen, CoralTopBar, CoralSearchField, CoralButton, useCoralColors } from "@/components/coral"
import { AppUserAvatar } from "@/components/ui/MemberAvatar"
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
  const [showRateLimit, setShowRateLimit] = useState(false)

  const attemptsRef = useRef<number[]>([])

  const getRecentAttempts = useCallback(() => {
    const now = Date.now()
    attemptsRef.current = attemptsRef.current.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
    return attemptsRef.current.length
  }, [])

  const recordAttempt = useCallback(() => {
    attemptsRef.current.push(Date.now())
  }, [])

  const handleSearch = useCallback(async () => {
    const trimmed = email.trim()
    if (!isWellFormedEmail(trimmed)) {
      toast.show({ label: "Enter a valid email address", placement: "top" })
      return
    }

    const recent = getRecentAttempts()
    if (recent >= RATE_LIMIT_MAX) {
      setShowRateLimit(true)
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
        setSearchState({
          phase: "found", userId: result.userId, name: result.name,
          initials: result.initials, self: true,
        })
        return
      }

      setSearchState({
        phase: "found", userId: result.userId, name: result.name,
        initials: result.initials, self: false,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Search failed"
      toast.show({ label: "Error", description: msg, variant: "danger", placement: "top" })
      setSearchState({ phase: "idle" })
    }
  }, [email, getRecentAttempts, recordAttempt, searchFriends, currentUser.id, toast])

  const handleAddFriend = async () => {
    if (!searchState.userId || searchState.self) return
    if (addingUserId) return

    setAddingUserId(searchState.userId)
    try {
      await transitionFriendship({ counterpartyId: searchState.userId, action: "request" })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      toast.show({
        label: "Friend request sent",
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

  return (
    <CoralScreen>
      <CoralTopBar title="Add person" onBack={() => router.back()} />

      <View style={{ marginTop: 12, marginBottom: 8 }}>
        <CoralSearchField
          value={email}
          onChangeText={(val) => {
            setEmail(val)
            setSearchState({ phase: "idle" })
            setShowRateLimit(false)
          }}
          onClear={() => {
            setEmail("")
            setSearchState({ phase: "idle" })
            setShowRateLimit(false)
          }}
          placeholder="Email address"
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
      </View>

      <CoralButton
        label={searchState.phase === "searching" ? "Searching..." : "Search"}
        onPress={handleSearch}
        disabled={searchState.phase === "searching" || !email.trim()}
        loading={searchState.phase === "searching"}
      />

      {showRateLimit ? (
        <View
          style={{
            marginTop: 16,
            padding: 14,
            borderRadius: 14,
            backgroundColor: coral.negativeSoft,
            borderWidth: 1,
            borderColor: coral.negative,
          }}
        >
          <Text style={{ fontFamily: "InstrumentSans_500Medium", fontSize: 13, color: coral.negative, textAlign: "center" }}>
            Too many attempts. Please try again later.
          </Text>
        </View>
      ) : null}

      <View style={{ marginTop: 24 }}>
        {searchState.phase === "searching" && (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <ActivityIndicator size="small" color={coral.accent} />
          </View>
        )}

        {searchState.phase === "notFound" && (
          <View
            style={{
              padding: 22,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: coral.border,
              backgroundColor: coral.surface,
              alignItems: "center",
              gap: 8,
            }}
          >
            <XCircle size={36} color={coral.muted} strokeWidth={1.5} />
            <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: coral.foreground }}>
              No user found
            </Text>
            <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 14, color: coral.muted, textAlign: "center" }}>
              No account matches this email. Share an invite link instead.
            </Text>
          </View>
        )}

        {searchState.phase === "blocked" && (
          <View style={{
            padding: 22, borderRadius: 16, borderWidth: 1, borderColor: coral.border,
            backgroundColor: coral.surface, alignItems: "center", gap: 8,
          }}>
            <XCircle size={36} color={coral.negative} strokeWidth={1.5} />
            <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: coral.foreground }}>
              User unavailable
            </Text>
          </View>
        )}

        {searchState.self && (
          <View
            style={{
              padding: 22, borderRadius: 16, borderWidth: 1, borderColor: coral.border,
              backgroundColor: coral.surface, alignItems: "center", gap: 8,
            }}
          >
            <Mail size={36} color={coral.muted} strokeWidth={1.5} />
            <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: coral.foreground }}>
              That's you
            </Text>
            <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 14, color: coral.muted, textAlign: "center" }}>
              You entered your own email address.
            </Text>
          </View>
        )}

        {searchState.phase === "found" && !searchState.self && (
          <View
            style={{
              padding: 20,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: coral.border,
              backgroundColor: coral.surface,
              gap: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <AppUserAvatar
                user={{
                  id: searchState.userId!,
                  name: searchState.name || "",
                  initials: searchState.initials || "?",
                }}
                size="md"
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 17, color: coral.foreground }}
                >
                  {searchState.name}
                </Text>
              </View>
            </View>

            {isAccepted ? (
              <View
                style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                  paddingVertical: 14, borderRadius: 14, backgroundColor: coral.positiveSoft,
                }}
              >
                <Check size={18} color={coral.positive} strokeWidth={2.5} />
                <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15, color: coral.positive }}>
                  Already friends
                </Text>
              </View>
            ) : isRequested ? (
              <View
                style={{
                  paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: coral.border,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15, color: coral.muted }}>
                  Request pending
                </Text>
              </View>
            ) : isBlockedExisting ? (
              <View
                style={{
                  paddingVertical: 14, borderRadius: 14, backgroundColor: coral.negativeSoft, alignItems: "center",
                }}
              >
                <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 15, color: coral.negative }}>
                  Blocked
                </Text>
              </View>
            ) : (
              <CoralButton
                label={isAdding ? "Sending..." : "Send friend request"}
                onPress={handleAddFriend}
                disabled={isAdding}
                loading={isAdding}
              />
            )}
          </View>
        )}
      </View>

      <View
        style={{
          marginTop: 32,
          paddingTop: 24,
          borderTopWidth: 1,
          borderTopColor: coral.border,
          gap: 12,
        }}
      >
        <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: coral.foreground }}>
          Don't see who you're looking for?
        </Text>
        <CoralButton
          label={isCreatingInvite ? "Creating invite..." : "Share invite link"}
          onPress={handleShareInvite}
          disabled={isCreatingInvite}
          loading={isCreatingInvite}
          variant="secondary"
        />
      </View>
    </CoralScreen>
  )
}
