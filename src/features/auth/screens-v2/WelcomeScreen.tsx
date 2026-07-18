import { useRouter } from "expo-router";
import type { JSX } from "react";
import { View, Text, Pressable, Platform, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { DollarSign } from "lucide-react-native";
import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralButton } from "@/components/coral/CoralButton";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { useCoralColors } from "@/components/coral/useCoral";
import { useSignInWithGoogle, useSignInWithApple } from "@/features/auth/hooks/useAuthMutations";
import { useAuth } from "@/context/AppContext";
import { useAppToast } from "@/hooks/useAppToast";

export default function WelcomeScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();
  const { toast } = useAppToast();
  const { refreshAuth } = useAuth();
  const { mutateAsync: signInWithGoogle, isPending: isGoogleLoading } = useSignInWithGoogle();
  const { mutateAsync: signInWithApple, isPending: isAppleLoading } = useSignInWithApple();
  const isIOS = Platform.OS === "ios";

  const handleSocialSignIn = async (fn: () => Promise<unknown>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await fn();
      await refreshAuth();
      router.replace("/");
    } catch (error) {
      toast.show({
        label: "Sign in failed",
        description:
          error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "danger",
        placement: "top",
      });
    }
  };

  return (
    <CoralScreen scroll={false}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            backgroundColor: coral.accentSoft,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <DollarSign size={40} color={coral.accent} strokeWidth={2} />
        </View>

        <LargeTitle style={{ textAlign: "center", marginTop: 0 }}>
          Shared money, made lighter.
        </LargeTitle>

        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 17,
            lineHeight: 26,
            color: coral.muted,
            textAlign: "center",
            marginTop: 12,
            marginBottom: 40,
            paddingHorizontal: 8,
          }}
        >
          Split nights out, trips, rent, and recurring bills without turning friendship into
          accounting.
        </Text>

        <View style={{ width: "100%", gap: 10 }}>
          <CoralButton
            label="Create an account"
            variant="primary"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(auth)/register");
            }}
          />

          <CoralButton
            label="Sign in"
            variant="secondary"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(auth)/login");
            }}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginVertical: 12,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: coral.border }} />
            <Text
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 14,
                color: coral.muted,
              }}
            >
              or continue with
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: coral.border }} />
          </View>

          {isIOS && (
            <SocialButton
              label="Apple"
              icon=""
              onPress={() => handleSocialSignIn(signInWithApple)}
              loading={isAppleLoading}
              coral={coral}
            />
          )}

          <SocialButton
            label="Google"
            icon="G"
            onPress={() => handleSocialSignIn(signInWithGoogle)}
            loading={isGoogleLoading}
            coral={coral}
          />
        </View>

        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 13,
            color: coral.muted,
            textAlign: "center",
            marginTop: 24,
            lineHeight: 20,
            opacity: 0.7,
          }}
        >
          By continuing, you agree to Splt&rsquo;s Terms and Privacy Policy.
        </Text>
      </View>
    </CoralScreen>
  );
}

function SocialButton({
  label,
  icon,
  onPress,
  loading,
  coral,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  loading: boolean;
  coral: ReturnType<typeof useCoralColors>;
}) {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={{
            width: "100%",
            minHeight: 52,
            borderRadius: 14,
            backgroundColor: coral.surface,
            borderWidth: 1,
            borderColor: coral.border,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 10,
            opacity: pressed ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={coral.foreground} />
          ) : (
            <>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "InstrumentSans_600SemiBold",
                  color: coral.foreground,
                }}
              >
                {icon}
              </Text>
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 16,
                  letterSpacing: 0.02 * 16,
                  color: coral.foreground,
                }}
              >
                Continue with {label}
              </Text>
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}
