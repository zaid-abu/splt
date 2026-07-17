import type { JSX } from "react";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useUIStore } from "@/store/useUIStore";

function getTokens(isDark: boolean) {
  return {
    accent: isDark ? "rgba(91, 148, 255, 0.22)" : "rgba(79, 140, 255, 0.22)",
    success: isDark ? "rgba(74, 222, 128, 0.18)" : "rgba(34, 197, 94, 0.12)",
  };
}

export default function GlassBackground(): JSX.Element {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const tokens = getTokens(isDarkMode);

  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false,
    );
    scale.value = withRepeat(
      withTiming(1.08, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [rotation, scale]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          orbStyle,
          {
            position: "absolute",
            width: "58%",
            aspectRatio: 1,
            left: "-18%",
            top: "-20%",
            borderRadius: 9999,
            backgroundColor: tokens.accent,
            opacity: 0.85,
          },
        ]}
      />
      <Animated.View
        style={[
          orbStyle,
          {
            position: "absolute",
            width: "58%",
            aspectRatio: 1,
            right: "-20%",
            bottom: "-24%",
            borderRadius: 9999,
            backgroundColor: tokens.success,
            opacity: 0.85,
          },
        ]}
      />
    </Animated.View>
  );
}
