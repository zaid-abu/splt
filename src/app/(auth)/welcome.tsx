import { Button, Typography, PressableFeedback } from "heroui-native";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const SEPARATOR = "#E8E4DF";

export default function WelcomeScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      {/* Top Content (Wordmark + Typography) */}
      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: insets.top + 60 }}>
        <Animated.View entering={FadeIn.delay(100).duration(800)}>
          <Typography
            style={{
              color: TEXT_PRIMARY,
              fontSize: 28,
              fontFamily: "UnicaOne_400Regular",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 64,
            }}
          >
            SPLT.
          </Typography>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Typography
            style={{
              fontFamily: "UnicaOne_400Regular",
              fontSize: 64,
              color: TEXT_PRIMARY,
              lineHeight: 72,
              letterSpacing: -0.5,
              marginBottom: 16,
            }}
          >
            Welcome{"\n"}to SPLT
          </Typography>
          <Typography
            style={{
              fontFamily: "CrimsonText_400Regular",
              fontSize: 20,
              color: TEXT_SECONDARY,
              lineHeight: 28,
              maxWidth: 280,
            }}
          >
            The elegant way to split bills, track expenses, and settle up with friends.
          </Typography>
        </Animated.View>
      </View>

      {/* Bottom Actions */}
      <Animated.View
        entering={FadeInDown.delay(500).duration(600)}
        style={{
          paddingHorizontal: 32,
          paddingBottom: Math.max(insets.bottom + 16, 48),
          gap: 16,
        }}
      >
        <PressableFeedback
          accessibilityRole="button"
          style={{
            width: "100%",
            height: 56,
            borderRadius: 0,
            backgroundColor: TEXT_PRIMARY,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/(auth)/register");
          }}
        >
          <Typography style={{ fontSize: 16, color: "#FFFFFF", fontFamily: "CrimsonText_700Bold" }}>
            Get Started
          </Typography>
        </PressableFeedback>

        <PressableFeedback
          accessibilityRole="button"
          style={{
            width: "100%",
            height: 56,
            borderRadius: 0,
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: SEPARATOR,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(auth)/login");
          }}
        >
          <Typography
            style={{ fontSize: 16, color: TEXT_PRIMARY, fontFamily: "CrimsonText_700Bold" }}
          >
            Log in to existing account
          </Typography>
        </PressableFeedback>
      </Animated.View>
    </View>
  );
}
