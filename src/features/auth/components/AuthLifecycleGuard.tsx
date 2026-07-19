import type { Href } from "expo-router";
import { useRootNavigationState, useRouter, useSegments } from "expo-router";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { CoralButton } from "@/components/coral/CoralButton";
import { useCoralColors } from "@/components/coral/useCoral";
import { useAuth } from "@/context/AppContext";
import { classifyLifecycleRoute, decideLifecycleRoute } from "@/features/auth/lifecycle";
import { consumePendingInviteToken } from "@/features/invitations/services/pendingInvite";

export function AuthLifecycleGuard({ children }: { children: ReactNode }) {
  const { activationDestination, authPhase, clearActivationDestination, refreshAuth } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootState = useRootNavigationState();
  const coral = useCoralColors();
  const activationNavigationStarted = useRef(false);
  const routeKind = classifyLifecycleRoute(segments);
  const decision = decideLifecycleRoute(authPhase, segments);

  useEffect(() => {
    if (!rootState?.key) return;
    if (activationDestination) {
      if (routeKind === "firstAction") {
        if (!activationNavigationStarted.current) {
          activationNavigationStarted.current = true;
          router.replace(activationDestination as Href);
        }
        return;
      }
      activationNavigationStarted.current = false;
      clearActivationDestination();
      return;
    }
    activationNavigationStarted.current = false;
    if (decision) router.replace(decision as Href);
  }, [
    activationDestination,
    clearActivationDestination,
    decision,
    rootState?.key,
    routeKind,
    router,
  ]);

  useEffect(() => {
    if (!rootState?.key) return;
    if (authPhase.status !== "ready") return;
    if (routeKind !== "readyApp") return;
    if (segments[0] === "invite") return;

    consumePendingInviteToken().then((token) => {
      if (token) {
        router.replace(`/invite/${token}` as Href);
      }
    })
  }, [authPhase.status, routeKind, rootState?.key, segments, router]);

  if (routeKind === "authCallback") return children;

  if (authPhase.status === "error") {
    return (
      <View
        style={{
          flex: 1,
          padding: 24,
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          backgroundColor: coral.bg,
        }}
      >
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 20,
            color: coral.foreground,
            textAlign: "center",
          }}
        >
          We could not load your account.
        </Text>
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 15,
            color: coral.muted,
            textAlign: "center",
          }}
        >
          {authPhase.message}
        </Text>
        <CoralButton label="Try again" onPress={() => void refreshAuth()} />
      </View>
    );
  }

  if (authPhase.status === "loading" || activationDestination || decision) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: coral.bg,
        }}
      >
        <ActivityIndicator color={coral.accent} accessibilityLabel="Loading account" />
      </View>
    );
  }

  return children;
}
