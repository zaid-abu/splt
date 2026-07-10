import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { UI, PressableScale } from "@/components/ui/native-ui";

const FEATURES = ["Record expenses in seconds", "See balances at a glance", "Settle up with ease"];

export default function WelcomeScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <StatusBar style="dark" />

      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: insets.top + 60 }}>
        <Animated.View entering={FadeIn.delay(100).duration(800)}>
          <Typography
            style={{
              color: UI.color.textStrong,
              fontSize: 22,
              fontFamily: "Sora_600SemiBold",
              letterSpacing: 4,
              marginBottom: 80,
            }}
          >
            SPLT.
          </Typography>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600).springify()} style={{ marginBottom: 56 }}>
          <Typography
            style={{
              fontFamily: "Sora_600SemiBold",
              fontSize: 52,
              color: UI.color.textStrong,
              lineHeight: 58,
              letterSpacing: -0.02,
              marginBottom: 24,
            }}
          >
            Welcome{"\n"}to SPLT
          </Typography>

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
          <BlurView intensity={Platform.OS === "ios" ? 80 : 90} tint="light" style={{
            padding: 20,
            gap: 14,
            backgroundColor: Platform.OS === "android" ? UI.color.control : "transparent",
          }}>
            <PressableScale onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(auth)/register"); }}>
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
                <Typography style={{ fontSize: 16, color: "#FFFFFF", fontFamily: "IBMPlexSans_600SemiBold" }}>
                  Get Started
                </Typography>
              </View>
            </PressableScale>

            <PressableScale onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(auth)/login"); }}>
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
                <Typography style={{ fontSize: 16, color: UI.color.text, fontFamily: "IBMPlexSans_600SemiBold" }}>
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
