import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { View, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { PressableScale } from "@/components/ui/native-ui";
import { GoogleLogo } from "@/components/ui/GoogleLogo";
import GlassBackground from "@/components/glassmorphism/GlassBackground";
import GlassAuthMark from "@/components/glassmorphism/GlassAuthMark";
import GlassOrb from "@/components/glassmorphism/GlassOrb";
import GlassSurface from "@/components/glassmorphism/GlassSurface";
import { useUIStore } from "@/store/useUIStore";
import { useSignInWithGoogle, useSignInWithApple } from "@/features/auth/hooks/useAuthMutations";
import { useAppToast } from "@/hooks/useAppToast";
import { GLASS_LIGHT, GLASS_DARK, GLASS_RADIUS } from "@/constants/glassmorphism-tokens";

export default function WelcomeScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const tokens = isDarkMode ? GLASS_DARK : GLASS_LIGHT;
  const { mutateAsync: signInWithGoogle, isPending: isGoogleLoading } = useSignInWithGoogle();
  const { mutateAsync: signInWithApple, isPending: isAppleLoading } = useSignInWithApple();
  const { toast } = useAppToast();

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ThemedStatusBar />
      <GlassBackground />

      <View
        style={{
          flex: 1,
          paddingHorizontal: 18,
          paddingTop: insets.top + 48,
          paddingBottom: Math.max(insets.bottom + 12, 40),
        }}
      >
        <View style={{ flex: 1 }}>
          <Animated.View
            entering={FadeInDown.delay(100).duration(600).springify()}
            style={{ alignItems: "center" }}
          >
            <GlassAuthMark />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(600).springify()}
            style={{ marginBottom: 24 }}
          >
            <GlassSurface borderRadius={GLASS_RADIUS.lg} padding={24}>
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <GlassOrb icon={icons.Wallet} />
              </View>
            </GlassSurface>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).duration(600)}>
            <Typography
              style={{
                fontFamily: "Sora_600SemiBold",
                fontSize: 13,
                letterSpacing: 0.01,
                color: tokens.muted,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Split Made Simple
            </Typography>
            <Typography
              style={{
                fontFamily: "Sora_600SemiBold",
                fontSize: 38,
                lineHeight: 42,
                letterSpacing: -0.025,
                color: tokens.text,
                marginBottom: 12,
              }}
            >
              Money between friends, made clear.
            </Typography>
            <Typography
              style={{
                fontFamily: "IBMPlexSans_400Regular",
                fontSize: 16,
                lineHeight: 25,
                color: tokens.muted,
              }}
            >
              Record shared costs, see balances at a glance, and settle without awkward follow-ups.
            </Typography>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInDown.delay(400).duration(600).springify()}
          style={{ gap: 9 }}
        >
          <PressableScale
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/(auth)/register");
            }}
          >
            <View
              style={{
                width: "100%",
                minHeight: 50,
                borderRadius: GLASS_RADIUS.md,
                backgroundColor: tokens.accent,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: isDarkMode
                  ? "rgba(91, 148, 255, 0.3)"
                  : "rgba(79, 140, 255, 0.3)",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 1,
                shadowRadius: 28,
                elevation: 8,
              }}
            >
              <Typography
                style={{
                  fontSize: 16,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  letterSpacing: 0.02,
                  color: tokens.accentOn,
                }}
              >
                Get Started
              </Typography>
            </View>
          </PressableScale>

          {Platform.OS === "ios" && (
            <PressableScale
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                try {
                  await signInWithApple();
                } catch (err: any) {
                  toast.show({
                    label: "Sign In Failed",
                    description: err?.message || "Something went wrong. Please try again.",
                    variant: "danger",
                    placement: "top",
                  });
                }
              }}
            >
              <View
                style={{
                  width: "100%",
                  minHeight: 50,
                  borderRadius: GLASS_RADIUS.md,
                  backgroundColor: tokens.surface,
                  borderWidth: 1,
                  borderColor: tokens.border,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 10,
                }}
              >
                {isAppleLoading ? (
                  <ActivityIndicator color={tokens.text} />
                ) : (
                  <>
                    <Typography
                      style={{
                        fontSize: 18,
                        color: tokens.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      
                    </Typography>
                    <Typography
                      style={{
                        fontSize: 16,
                        color: tokens.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
                        letterSpacing: 0.02,
                      }}
                    >
                      Continue with Apple
                    </Typography>
                  </>
                )}
              </View>
            </PressableScale>
          )}

          <PressableScale
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              try {
                await signInWithGoogle();
              } catch (err: any) {
                toast.show({
                  label: "Sign In Failed",
                  description: err?.message || "Something went wrong. Please try again.",
                  variant: "danger",
                  placement: "top",
                });
              }
            }}
          >
            <View
              style={{
                width: "100%",
                minHeight: 50,
                borderRadius: GLASS_RADIUS.md,
                backgroundColor: tokens.surface,
                borderWidth: 1,
                borderColor: tokens.border,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 10,
              }}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={tokens.text} />
              ) : (
                <>
                  <GoogleLogo size={20} />
                  <Typography
                    style={{
                      fontSize: 16,
                      color: tokens.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                      letterSpacing: 0.02,
                    }}
                  >
                    Continue with Google
                  </Typography>
                </>
              )}
            </View>
          </PressableScale>

          <View style={{ paddingVertical: 12, alignItems: "center" }}>
            <Typography
              style={{
                fontSize: 16,
                color: tokens.muted,
                fontFamily: "IBMPlexSans_500Medium",
              }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(auth)/login");
              }}
            >
              Already have an account?{" "}
              <Typography
                style={{
                  fontSize: 16,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  color: tokens.text,
                }}
              >
                Log in
              </Typography>
            </Typography>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
