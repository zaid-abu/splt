import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { UI } from "@/components/ui/native-ui";

const FEATURES = ["Record expenses in seconds", "See balances at a glance", "Settle up with ease"];

export default function WelcomeScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <StatusBar style="dark" />

      {/* Brand wordmark */}
      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: insets.top + 60 }}>
        <Animated.View entering={FadeIn.delay(100).duration(800)}>
          <Typography
            style={{
              color: UI.color.textStrong,
              fontSize: 22,
              fontFamily: "Sora_600SemiBold",
              letterSpacing: 3,
              marginBottom: 80,
            }}
          >
            SPLT.
          </Typography>
        </Animated.View>

        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={{ marginBottom: 56 }}>
          <Typography
            style={{
              fontFamily: "Sora_600SemiBold",
              fontSize: 52,
              color: UI.color.textStrong,
              lineHeight: 58,
              letterSpacing: -0.02,
              marginBottom: 20,
            }}
          >
            Welcome{"\n"}to SPLT
          </Typography>

          {/* Feature hints */}
          <View style={{ gap: 10 }}>
            {FEATURES.map((feature, index) => (
              <View key={feature} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
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
              </View>
            ))}
          </View>
        </Animated.View>
      </View>

      {/* Bottom actions */}
      <Animated.View
        entering={FadeInDown.delay(500).duration(600)}
        style={{
          paddingHorizontal: 32,
          paddingBottom: Math.max(insets.bottom + 16, 48),
          gap: 14,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Get started with SPLT"
          style={({ pressed }) => ({
            width: "100%",
            height: 56,
            borderRadius: UI.radius.pill,
            backgroundColor: UI.color.text,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.75 : 1,
          })}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/(auth)/register");
          }}
        >
          <Typography
            style={{ fontSize: 16, color: "#FFFFFF", fontFamily: "IBMPlexSans_600SemiBold" }}
          >
            Get Started
          </Typography>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log in to your account"
          style={({ pressed }) => ({
            width: "100%",
            height: 56,
            borderRadius: UI.radius.pill,
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: UI.color.border,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.65 : 1,
          })}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(auth)/login");
          }}
        >
          <Typography
            style={{ fontSize: 16, color: UI.color.text, fontFamily: "IBMPlexSans_600SemiBold" }}
          >
            Log in
          </Typography>
        </Pressable>
      </Animated.View>
    </View>
  );
}
