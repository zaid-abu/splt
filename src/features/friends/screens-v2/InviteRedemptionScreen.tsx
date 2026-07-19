import { useState, useEffect, useCallback } from "react"
import { View, Text, ActivityIndicator } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import * as Haptics from "expo-haptics"

import { CoralScreen, CoralTopBar, CoralButton, useCoralColors } from "@/components/coral"
import { useAppToast } from "@/hooks/useAppToast"
import { invitationsApi, type InviteResolution } from "@/features/invitations/services/api"
import { clearPendingInviteToken } from "@/features/invitations/services/pendingInvite"

type ResolveState =
  | { phase: "loading" }
  | { phase: "resolved"; resolution: InviteResolution }
  | { phase: "redeeming" }
  | { phase: "redeemed"; friendshipId: string }
  | { phase: "error"; message: string }

export default function InviteRedemptionScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const router = useRouter()
  const coral = useCoralColors()
  const { toast } = useAppToast()
  const [state, setState] = useState<ResolveState>({ phase: "loading" })

  const resolve = useCallback(async () => {
    if (!token) {
      setState({ phase: "error", message: "No invite token provided." })
      return
    }
    setState({ phase: "loading" })
    try {
      const resolution = await invitationsApi.resolveFriendInvite(token)
      setState({ phase: "resolved", resolution })
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "Could not resolve invite.",
      })
    }
  }, [token])

  useEffect(() => {
    void resolve()
  }, [resolve])

  const handleAccept = async () => {
    if (state.phase !== "resolved" || !token) return
    if (state.resolution.state !== "valid") return

    setState({ phase: "redeeming" })
    try {
      const friendshipId = await invitationsApi.redeemFriendInvite(token)
      await clearPendingInviteToken()
      setState({ phase: "redeemed", friendshipId })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      toast.show({ label: "Friend Added", description: "Invite accepted successfully.", variant: "success", placement: "top" })
      router.replace(`/friend/${friendshipId}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to accept invite."
      setState({ phase: "error", message: msg })
      toast.show({ label: "Error", description: msg, variant: "danger", placement: "top" })
    }
  }

  const renderBody = () => {
    switch (state.phase) {
      case "loading":
        return (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <ActivityIndicator size="large" color={coral.accent} accessibilityLabel="Resolving invite" />
            <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted, marginTop: 16 }}>
              Resolving invite...
            </Text>
          </View>
        )

      case "resolved": {
        const { resolution } = state
        switch (resolution.state) {
          case "valid":
            return (
              <View style={{ gap: 24, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 }}>
                <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 22, color: coral.foreground, textAlign: "center" }}>
                  You have been invited!
                </Text>
                {resolution.inviterId && (
                  <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted, textAlign: "center" }}>
                    Someone wants to connect with you on Splt.
                  </Text>
                )}
                {resolution.expiresAt && (
                  <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 13, color: coral.muted, textAlign: "center" }}>
                    Invite expires {resolution.expiresAt.toLocaleDateString()}
                  </Text>
                )}
                <CoralButton label="Accept Invite" onPress={handleAccept} />
              </View>
            )

          case "expired":
            return (
              <View style={{ gap: 12, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 }}>
                <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 20, color: coral.negative, textAlign: "center" }}>
                  Invite Expired
                </Text>
                <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted, textAlign: "center" }}>
                  This invite link has expired. Ask the sender for a new one.
                </Text>
              </View>
            )

          case "revoked":
            return (
              <View style={{ gap: 12, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 }}>
                <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 20, color: coral.negative, textAlign: "center" }}>
                  Invite Revoked
                </Text>
                <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted, textAlign: "center" }}>
                  This invite has been revoked by the sender.
                </Text>
              </View>
            )

          case "redeemed":
            return (
              <View style={{ gap: 12, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 }}>
                <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 20, color: coral.positive, textAlign: "center" }}>
                  Already Redeemed
                </Text>
                <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted, textAlign: "center" }}>
                  This invite has already been used.
                </Text>
              </View>
            )

          case "self":
            return (
              <View style={{ gap: 12, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 }}>
                <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 20, color: coral.foreground, textAlign: "center" }}>
                  Your Own Invite
                </Text>
                <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted, textAlign: "center" }}>
                  You cannot accept your own invite.
                </Text>
              </View>
            )

          case "blocked":
            return (
              <View style={{ gap: 12, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 }}>
                <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 20, color: coral.negative, textAlign: "center" }}>
                  Invite Unavailable
                </Text>
                <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted, textAlign: "center" }}>
                  This invite cannot be accepted at this time.
                </Text>
              </View>
            )

          default:
            return (
              <View style={{ gap: 12, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 }}>
                <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 20, color: coral.foreground, textAlign: "center" }}>
                  Unknown Invite
                </Text>
                <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted, textAlign: "center" }}>
                  This invite could not be recognized.
                </Text>
              </View>
            )
        }
      }

      case "redeeming":
        return (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <ActivityIndicator size="large" color={coral.accent} accessibilityLabel="Accepting invite" />
            <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted, marginTop: 16 }}>
              Accepting invite...
            </Text>
          </View>
        )

      case "redeemed":
        return (
          <View style={{ gap: 12, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 }}>
            <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 20, color: coral.positive, textAlign: "center" }}>
              Friend Added!
            </Text>
          </View>
        )

      case "error":
        return (
          <View style={{ gap: 16, alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 }}>
            <Text style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 20, color: coral.negative, textAlign: "center" }}>
              Something went wrong
            </Text>
            <Text style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: coral.muted, textAlign: "center" }}>
              {state.message}
            </Text>
            <CoralButton label="Try Again" onPress={() => void resolve()} variant="secondary" />
          </View>
        )
    }
  }

  return (
    <CoralScreen>
      <CoralTopBar title="Invite" onBack={() => router.back()} />
      {renderBody()}
    </CoralScreen>
  )
}
