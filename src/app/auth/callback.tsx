import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { useCoralColors } from "@/components/coral/useCoral";
import { useAuth } from "@/context/AppContext";
import { AuthCallbackError, AuthService, type AuthCallbackFlow } from "@/services/api/auth";

function one(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string | string[];
    flow?: string | string[];
    error?: string | string[];
    error_code?: string | string[];
    error_description?: string | string[];
  }>();
  const router = useRouter();
  const coral = useCoralColors();
  const { beginRecovery, refreshAuth } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const flowValue = one(params.flow);
    const flow: AuthCallbackFlow =
      flowValue === "recovery" || flowValue === "verification" ? flowValue : "oauth";

    void AuthService.completeAuthCallback({
      code: one(params.code),
      flow,
      error: one(params.error) ?? one(params.error_code),
      errorDescription: one(params.error_description),
    })
      .then(async (result) => {
        if (result.kind === "recovery") {
          beginRecovery(result.email);
          router.replace({
            pathname: "/(auth)/reset-password",
            params: { email: result.email },
          });
          return;
        }
        await refreshAuth();
        router.replace("/");
      })
      .catch((error: unknown) => {
        const callbackError =
          error instanceof AuthCallbackError
            ? error
            : new AuthCallbackError("This authentication link is invalid or expired.", flow);
        const pathname =
          callbackError.flow === "recovery" ? "/(auth)/forgot-password" : "/(auth)/login";
        router.replace({ pathname, params: { authError: callbackError.message } });
      });
  }, [beginRecovery, params, refreshAuth, router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        backgroundColor: coral.bg,
      }}
    >
      <ActivityIndicator color={coral.accent} accessibilityLabel="Completing authentication" />
      <Text style={{ fontFamily: "InstrumentSans_500Medium", color: coral.muted }}>
        Securing your account...
      </Text>
    </View>
  );
}
