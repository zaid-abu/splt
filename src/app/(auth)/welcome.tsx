import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { useEffect } from "react";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { View, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { UI, PressableScale } from "@/components/ui/native-ui";
import { GoogleLogo } from "@/components/ui/GoogleLogo";
import { useUIStore } from "@/store/useUIStore";
import { useSignInWithGoogle, useSignInWithApple } from "@/features/auth/hooks/useAuthMutations";
import { useAppToast } from "@/hooks/useAppToast";

const FEATURES = ["Record expenses in seconds", "See balances at a glance", "Settle up with ease"];

function HeroAnimation(): JSX.Element {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 3000,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  const dotOpacity = useSharedValue(0.3);
  useEffect(() => {
    dotOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  return (
    <View style={{ alignItems: "center" }}>
      <Animated.View
        style={[
          {
            width: 48,
            height: 48,
            borderWidth: 1.5,
            borderColor: UI.color.brand,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          },
          boxStyle,
        ]}
      >
        <Typography
          style={{
            fontFamily: "Sora_600SemiBold",
            fontSize: 11,
            color: UI.color.brand,
            letterSpacing: 1.5,
          }}
        >
          S
        </Typography>
      </Animated.View>

      <Typography
        style={{
          fontFamily: "Sora_600SemiBold",
          fontSize: 16,
          color: UI.color.brand,
          letterSpacing: 3,
          marginBottom: 24,
          textTransform: "uppercase",
        }}
      >
        Splt
      </Typography>

      <Typography
        style={{
          fontFamily: "Sora_600SemiBold",
          fontSize: 14,
          color: UI.color.muted,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Split Made Simple
      </Typography>

      <Animated.View
        style={[
          {
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: UI.color.muted,
          },
          dotStyle,
        ]}
      />
    </View>
  );
}

export default function WelcomeScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const { mutateAsync: signInWithGoogle, isPending: isGoogleLoading } = useSignInWithGoogle();
  const { mutateAsync: signInWithApple, isPending: isAppleLoading } = useSignInWithApple();
  const { toast } = useAppToast();

  return (
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <ThemedStatusBar />

      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: insets.top + 80 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Animated.View entering={FadeIn.delay(100).duration(800)}>
            <HeroAnimation />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(300).duration(600).springify()}
            style={{ marginTop: 48, width: "100%" }}
          >
            <View style={{ gap: 12 }}>
              {FEATURES.map((feature, index) => (
                <Animated.View
                  key={feature}
                  entering={FadeInDown.delay(350 + index * 80).duration(400)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: UI.color.muted,
                    }}
                  />
                  <Typography
                    style={{
                      fontFamily: "IBMPlexSans_400Regular",
                      fontSize: 16,
                      color: UI.color.muted,
                      lineHeight: 22,
                    }}
                  >
                    {feature}
                  </Typography>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(600).duration(600).springify()}
        style={{
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom + 12, 40),
        }}
      >
        <View
          style={{
            borderRadius: UI.radius.lg,
            overflow: "hidden",
          }}
        >
          <BlurView
            intensity={Platform.OS === "ios" ? 60 : 90}
            tint={isDarkMode ? "dark" : "light"}
            style={{
              padding: 20,
              gap: 14,
              backgroundColor: Platform.OS === "android" ? UI.color.control : "transparent",
            }}
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
                  height: 56,
                  borderRadius: UI.radius.pill,
                  backgroundColor: UI.color.text,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  style={{
                    fontSize: 16,
                    color: UI.color.textInverse,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  Get Started
                </Typography>
              </View>
            </PressableScale>

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
                  height: 56,
                  borderRadius: UI.radius.pill,
                  borderWidth: 1,
                  borderColor: UI.color.border,
                  backgroundColor: UI.color.control,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 10,
                }}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator color={UI.color.text} />
                ) : (
                  <>
                    <GoogleLogo size={20} />
                    <Typography
                      style={{
                        fontSize: 16,
                        color: UI.color.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      Continue with Google
                    </Typography>
                  </>
                )}
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
                    height: 56,
                    borderRadius: UI.radius.pill,
                    borderWidth: 1,
                    borderColor: UI.color.border,
                    backgroundColor: UI.color.control,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 10,
                  }}
                >
                  {isAppleLoading ? (
                    <ActivityIndicator color={UI.color.text} />
                  ) : (
                    <>
                      <Typography
                        style={{
                          fontSize: 16,
                          color: UI.color.text,
                          fontFamily: "IBMPlexSans_600SemiBold",
                        }}
                      >
                        
                      </Typography>
                      <Typography
                        style={{
                          fontSize: 16,
                          color: UI.color.text,
                          fontFamily: "IBMPlexSans_600SemiBold",
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
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(auth)/login");
              }}
            >
              <View
                style={{
                  width: "100%",
                  height: 56,
                  borderRadius: UI.radius.pill,
                  borderWidth: 1,
                  borderColor: UI.color.border,
                  backgroundColor: UI.color.control,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  style={{
                    fontSize: 16,
                    color: UI.color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  Log in
                </Typography>
              </View>
            </PressableScale>
          </BlurView>
        </View>
      </Animated.View>
    </View>
  );
}
